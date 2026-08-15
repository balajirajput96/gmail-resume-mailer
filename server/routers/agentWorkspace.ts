import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { generateAgentPlan } from "../agentPlanner";
import { buildEvidenceSummary } from "../agentEvidence";
import { normalizeImagePrompt } from "../agentMedia";
import { fetchPublicRepositoryEvidence, fetchPublicRepositoryInventory, validateGitHubOwner } from "../githubPublic";
import {
  approveAgentJob,
  completeAgentJobPlan,
  createAgentJob,
  createAgentMediaAsset,
  failAgentJob,
  getAgentJob,
  getAgentRepository,
  listAgentJobEvents,
  listAgentJobs,
  listAgentMediaAssets,
  listAgentRepositories,
  markAgentJobPlanning,
  rejectAgentJob,
  upsertAgentRepository,
} from "../agentWorkspaceDb";
import { protectedProcedure, router } from "../_core/trpc";
import { generateImage } from "../_core/imageGeneration";

const repositoryInput = z.object({
  fullName: z.string().trim().regex(/^[\w.-]+\/[\w.-]+$/, "Use owner/repository format").max(255),
  url: z.string().trim().url().max(2048),
  defaultBranch: z.string().trim().min(1).max(255).default("main"),
  visibility: z.enum(["public", "private", "internal"]).default("private"),
  description: z.string().trim().max(4000).optional().nullable(),
});

export const agentWorkspaceRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [repositories, jobs] = await Promise.all([listAgentRepositories(ctx.user.id), listAgentJobs(ctx.user.id)]);
    return { repositories, jobs: jobs.slice(0, 10) };
  }),

  repositories: router({
    list: protectedProcedure.query(({ ctx }) => listAgentRepositories(ctx.user.id)),
    add: protectedProcedure.input(repositoryInput).mutation(async ({ ctx, input }) => {
      const repository = await upsertAgentRepository({ userId: ctx.user.id, ...input });
      if (!repository) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Repository could not be saved" });
      return repository;
    }),
  }),

  github: router({
    importPublic: protectedProcedure.input(z.object({ owner: z.string().trim().min(1).max(39) })).mutation(async ({ ctx, input }) => {
      let repositories;
      try {
        repositories = await fetchPublicRepositoryInventory(validateGitHubOwner(input.owner));
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "GitHub inventory could not be loaded" });
      }
      const saved = await Promise.all(repositories.map(repository => upsertAgentRepository({ userId: ctx.user.id, ...repository })));
      return { imported: saved.filter(Boolean).length, repositories: saved.filter(Boolean) };
    }),
  }),

  media: router({
    list: protectedProcedure.query(({ ctx }) => listAgentMediaAssets(ctx.user.id)),
    generateImage: protectedProcedure.input(z.object({ prompt: z.string().max(2_000) })).mutation(async ({ ctx, input }) => {
      let prompt: string;
      try {
        prompt = normalizeImagePrompt(input.prompt);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Image prompt is invalid" });
      }
      try {
        const generated = await generateImage({ prompt, model: "MODEL_GPT_IMAGE_2", quality: "medium" });
        if (!generated.url) throw new Error("Image service returned no asset URL");
        const id = await createAgentMediaAsset({ userId: ctx.user.id, prompt, model: "gpt-image-2", assetUrl: generated.url });
        return { id, url: generated.url, prompt, model: "gpt-image-2" };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The image could not be generated. Please try again." });
      }
    }),
  }),

  jobs: router({
    list: protectedProcedure.query(({ ctx }) => listAgentJobs(ctx.user.id)),
    detail: protectedProcedure.input(z.object({ jobId: z.string().min(12).max(36) })).query(async ({ ctx, input }) => {
      const job = await getAgentJob(ctx.user.id, input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Agent job not found" });
      return { job, events: await listAgentJobEvents(job.id) };
    }),
    createPlan: protectedProcedure.input(z.object({
      repositoryId: z.number().int().positive(),
      title: z.string().trim().min(3).max(255),
      goal: z.string().trim().min(10).max(4000),
      kind: z.enum(["repository_analysis", "implementation_plan"]).default("implementation_plan"),
    })).mutation(async ({ ctx, input }) => {
      const repository = await getAgentRepository(ctx.user.id, input.repositoryId);
      if (!repository) throw new TRPCError({ code: "NOT_FOUND", message: "Choose a repository you added to this workspace" });

      const jobId = nanoid(24);
      await createAgentJob({ id: jobId, userId: ctx.user.id, repositoryId: repository.id, title: input.title, request: input.goal, kind: input.kind, model: "gpt-5-mini" });
      await markAgentJobPlanning(ctx.user.id, jobId);

      try {
        let evidence: { fileInventory: string[]; readmeExcerpt: string | null; manifestExcerpt: string | null } = { fileInventory: [], readmeExcerpt: null, manifestExcerpt: null };
        if (repository.visibility === "public") {
          try {
            evidence = await fetchPublicRepositoryEvidence(repository.fullName);
          } catch {
            evidence = { fileInventory: [], readmeExcerpt: null, manifestExcerpt: null };
          }
        }
        const plan = await generateAgentPlan({ ...repository, ...evidence }, input.goal);
        const evidenceSummary = buildEvidenceSummary(evidence);
        await completeAgentJobPlan(ctx.user.id, jobId, plan, evidenceSummary);
        return { jobId, plan, status: "awaiting_approval" as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Planning failed";
        await failAgentJob(ctx.user.id, jobId, message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The AI plan could not be generated. Try again." });
      }
    }),
    approve: protectedProcedure.input(z.object({ jobId: z.string().min(12).max(36), note: z.string().trim().max(2000).optional().nullable() })).mutation(async ({ ctx, input }) => {
      const job = await getAgentJob(ctx.user.id, input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Agent job not found" });
      if (job.status !== "awaiting_approval") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only a prepared plan can be approved" });
      await approveAgentJob(ctx.user.id, input.jobId, input.note);
      return { success: true };
    }),
    reject: protectedProcedure.input(z.object({ jobId: z.string().min(12).max(36), note: z.string().trim().max(2000).optional().nullable() })).mutation(async ({ ctx, input }) => {
      const job = await getAgentJob(ctx.user.id, input.jobId);
      if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Agent job not found" });
      if (job.status !== "awaiting_approval") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only a prepared plan can be rejected" });
      await rejectAgentJob(ctx.user.id, input.jobId, input.note);
      return { success: true };
    }),
  }),
});
