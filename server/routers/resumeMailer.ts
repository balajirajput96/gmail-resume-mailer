import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getGmailAccessToken, sendRawGmailMessage } from "../gmailSender";
import { buildRawMimeEmail, canConfirmSend, normalizeAndValidateRecipients, renderPersonalizedBody } from "../mailerCore";
import {
  completeSession,
  createRecipient,
  createResume,
  createReviewSession,
  deleteRecipient,
  getGmailConnection,
  getResume,
  getSessionDetail,
  listHistory,
  listRecipients,
  listResumes,
  markRecipientFailed,
  markRecipientSent,
  markSessionReviewOpened,
  markSessionSending,
  updateRecipient,
} from "../resumeMailerDb";
import { storageGetSignedUrl, storagePut } from "../storage";

const recipientSchema = z.object({
  email: z.string().trim().email().max(320),
  firstName: z.string().trim().max(120).optional().nullable(),
  company: z.string().trim().max(180).optional().nullable(),
});

const allowedResumeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function userMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export const resumeMailerRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const [connection, resumes, recipients, history] = await Promise.all([
      getGmailConnection(ctx.user.id),
      listResumes(ctx.user.id),
      listRecipients(ctx.user.id),
      listHistory(ctx.user.id),
    ]);
    return { gmailAddress: connection?.gmailAddress ?? null, resumes, recipients, history: history.slice(0, 5) };
  }),

  connection: protectedProcedure.query(async ({ ctx }) => {
    const connection = await getGmailConnection(ctx.user.id);
    return { connected: Boolean(connection), gmailAddress: connection?.gmailAddress ?? null };
  }),

  recipients: router({
    list: protectedProcedure.query(({ ctx }) => listRecipients(ctx.user.id)),
    create: protectedProcedure.input(recipientSchema).mutation(async ({ ctx, input }) => {
      try {
        const recipient = normalizeAndValidateRecipients([input])[0];
        return { id: await createRecipient({ userId: ctx.user.id, ...recipient }) };
      } catch {
        throw new TRPCError({ code: "CONFLICT", message: "That email is already in your recipient list" });
      }
    }),
    update: protectedProcedure.input(recipientSchema.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      try {
        const recipient = normalizeAndValidateRecipients([input])[0];
        const updated = await updateRecipient({ userId: ctx.user.id, id: input.id, ...recipient });
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({ code: "CONFLICT", message: "That email is already in your recipient list" });
      }
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const removed = await deleteRecipient(ctx.user.id, input.id);
      if (!removed) throw new TRPCError({ code: "NOT_FOUND", message: "Recipient not found" });
      return { success: true };
    }),
  }),

  resumes: router({
    list: protectedProcedure.query(({ ctx }) => listResumes(ctx.user.id)),
    upload: protectedProcedure.input(z.object({ fileName: z.string().trim().min(1).max(255), mimeType: z.string().max(120), dataUrl: z.string().max(14_000_000) })).mutation(async ({ ctx, input }) => {
      if (!allowedResumeTypes.has(input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a PDF or DOCX resume" });
      const match = input.dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/);
      if (!match || match[1] !== input.mimeType) throw new TRPCError({ code: "BAD_REQUEST", message: "The upload data is invalid" });
      const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
      if (bytes.length === 0 || bytes.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Resume files must be between 1 byte and 8 MB" });
      const safeName = input.fileName.replace(/[\\/\r\n]/g, "_");
      const stored = await storagePut(`resumes/${ctx.user.id}/${safeName}`, bytes, input.mimeType);
      const id = await createResume({ userId: ctx.user.id, originalName: safeName, storageKey: stored.key, mimeType: input.mimeType, sizeBytes: bytes.length });
      return { id, originalName: safeName, mimeType: input.mimeType, sizeBytes: bytes.length, createdAt: new Date() };
    }),
  }),

  preview: protectedProcedure.input(z.object({
    recipients: z.array(recipientSchema).min(1).max(100),
    subject: z.string().trim().min(1).max(255),
    messageTemplate: z.string().trim().min(1).max(20_000),
    resumeId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    const resume = await getResume(ctx.user.id, input.resumeId);
    if (!resume || !allowedResumeTypes.has(resume.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a valid PDF or DOCX resume" });
    try {
      const recipients = normalizeAndValidateRecipients(input.recipients).map(recipient => ({ ...recipient, renderedBody: renderPersonalizedBody(input.messageTemplate, recipient) }));
      const sessionId = nanoid(24);
      await createReviewSession({
        id: sessionId,
        userId: ctx.user.id,
        subject: input.subject,
        messageTemplate: input.messageTemplate,
        resumeId: resume.id,
        attachmentName: resume.originalName,
        recipients,
      });
      return { sessionId, subject: input.subject, attachmentName: resume.originalName, recipients };
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: userMessage(error, "The email could not be prepared for review") });
    }
  }),

  review: protectedProcedure.input(z.object({ sessionId: z.string().min(12).max(36) })).query(async ({ ctx, input }) => {
    await markSessionReviewOpened(ctx.user.id, input.sessionId);
    const detail = await getSessionDetail(ctx.user.id, input.sessionId);
    if (!detail) throw new TRPCError({ code: "NOT_FOUND", message: "Review session not found" });
    return detail;
  }),

  confirmSend: protectedProcedure.input(z.object({ sessionId: z.string().min(12).max(36), acknowledged: z.literal(true) })).mutation(async ({ ctx, input }) => {
    const detail = await getSessionDetail(ctx.user.id, input.sessionId);
    if (!detail || !canConfirmSend(detail.session)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Open the review screen before confirming this send" });
    }
    const [resume, connection] = await Promise.all([
      getResume(ctx.user.id, detail.session.resumeId),
      getGmailConnection(ctx.user.id),
    ]);
    if (!resume || !allowedResumeTypes.has(resume.mimeType)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The required resume attachment is unavailable" });
    }
    if (!connection) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect Gmail before sending" });
    if (!await markSessionSending(ctx.user.id, input.sessionId)) {
      throw new TRPCError({ code: "CONFLICT", message: "This send has already been started or completed" });
    }

    let accessToken: string;
    let resumeBytes: Buffer;
    try {
      accessToken = await getGmailAccessToken(connection);
      const attachmentResponse = await fetch(await storageGetSignedUrl(resume.storageKey));
      if (!attachmentResponse.ok) throw new Error("attachment_fetch_failed");
      resumeBytes = Buffer.from(await attachmentResponse.arrayBuffer());
      if (resumeBytes.length === 0) throw new Error("attachment_empty");
    } catch {
      await completeSession(ctx.user.id, input.sessionId, "failed");
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Gmail authorization or the resume attachment needs attention before sending" });
    }

    let sent = 0;
    let failed = 0;
    for (const recipient of detail.recipients) {
      const raw = buildRawMimeEmail({
        to: recipient.email,
        subject: detail.session.subject,
        body: recipient.renderedBody,
        resume: resumeBytes,
        resumeFileName: resume.originalName,
        resumeMimeType: resume.mimeType,
      });
      const result = await sendRawGmailMessage(accessToken, raw);
      if (result.ok) {
        sent += 1;
        await markRecipientSent(recipient.id, result.messageId);
      } else {
        failed += 1;
        await markRecipientFailed(recipient.id, result.failureCode);
      }
    }
    await completeSession(ctx.user.id, input.sessionId, failed === 0 ? "completed" : sent === 0 ? "failed" : "completed_with_errors");
    return { sent, failed };
  }),

  history: protectedProcedure.query(({ ctx }) => listHistory(ctx.user.id)),
});
