import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bot, CheckCircle2, ChevronRight, CircleDashed, Clock3, FileSearch, Github, ImagePlus, Loader2, Plus, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Repository = { id: number; fullName: string; url: string; defaultBranch: string; visibility: string; description: string | null };

function evidenceLabel(raw: string | null) {
  if (!raw) return null;
  try {
    const evidence = JSON.parse(raw) as { rootFiles?: string[]; readmeAvailable?: boolean; manifestAvailable?: boolean };
    const parts = [evidence.rootFiles?.length ? `${evidence.rootFiles.length} root items` : null, evidence.readmeAvailable ? "README" : null, evidence.manifestAvailable ? "manifest" : null].filter(Boolean);
    return parts.length ? `Evidence: ${parts.join(" · ")}` : null;
  } catch {
    return null;
  }
}

function statusStyle(status: string) {
  if (status === "awaiting_approval") return "border-amber-300 bg-amber-50 text-amber-800";
  if (status === "approved") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status === "rejected" || status === "failed") return "border-rose-300 bg-rose-50 text-rose-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function Workspace() {
  const utils = trpc.useUtils();
  const overview = trpc.agent.overview.useQuery();
  const [owner, setOwner] = useState("balajirajput96");
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("Repository architecture review");
  const [goal, setGoal] = useState("Review the repository context and prepare a safe, testable implementation plan. Do not write code or create external changes.");
  const [imagePrompt, setImagePrompt] = useState("An editorial product illustration for a secure AI agent workspace, deep indigo, soft lilac accents, no text");
  const [manualRepository, setManualRepository] = useState({ fullName: "", url: "", defaultBranch: "main", visibility: "private", description: "" });

  const repositories = (overview.data?.repositories ?? []) as Repository[];
  const jobs = overview.data?.jobs ?? [];
  const media = trpc.agent.media.list.useQuery();

  useEffect(() => {
    if (!selectedRepositoryId && repositories[0]) setSelectedRepositoryId(repositories[0].id);
  }, [repositories, selectedRepositoryId]);

  const refresh = async () => {
    await Promise.all([utils.agent.overview.invalidate(), utils.agent.repositories.list.invalidate(), utils.agent.jobs.list.invalidate()]);
  };

  const importPublic = trpc.agent.github.importPublic.useMutation({
    onSuccess: async result => { await refresh(); toast.success(`${result.imported} public repositories are ready for planning`); },
    onError: error => toast.error(error.message),
  });
  const addRepository = trpc.agent.repositories.add.useMutation({
    onSuccess: async repository => {
      await refresh();
      setSelectedRepositoryId(repository.id);
      setManualRepository({ fullName: "", url: "", defaultBranch: "main", visibility: "private", description: "" });
      toast.success("Repository added to this workspace");
    },
    onError: error => toast.error(error.message),
  });
  const createPlan = trpc.agent.jobs.createPlan.useMutation({
    onSuccess: async () => { await refresh(); toast.success("AI plan prepared for review"); },
    onError: error => toast.error(error.message),
  });
  const approve = trpc.agent.jobs.approve.useMutation({ onSuccess: async () => { await refresh(); toast.success("Plan approved. No external action was run."); }, onError: error => toast.error(error.message) });
  const reject = trpc.agent.jobs.reject.useMutation({ onSuccess: async () => { await refresh(); toast.success("Plan rejected."); }, onError: error => toast.error(error.message) });
  const generateImage = trpc.agent.media.generateImage.useMutation({ onSuccess: async () => { await media.refetch(); toast.success("Creative asset generated"); }, onError: error => toast.error(error.message) });

  const submitPlan = () => {
    if (!selectedRepositoryId) { toast.error("Choose a repository first"); return; }
    createPlan.mutate({ repositoryId: selectedRepositoryId, title, goal, kind: "implementation_plan" });
  };

  if (overview.isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#5264c7]" /></div>;
  if (overview.error) return <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center"><h1 className="text-xl font-semibold">Workspace unavailable</h1><p className="mt-2 text-sm text-muted-foreground">The agent workspace could not load. Please retry.</p><Button className="mt-5" onClick={() => overview.refetch()}>Retry</Button></div>;

  return <div className="mx-auto max-w-7xl pb-12">
    <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#596bd4]"><span className="h-2 w-2 rounded-full bg-[#596bd4]" />Agent command center</div>
        <h1 className="max-w-3xl font-serif text-4xl tracking-[-.05em] text-[#20233a] sm:text-5xl">Plan deliberately. Ship responsibly.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A controlled workspace for repository inventory, AI-assisted planning and explicit approvals. Plans never create branches, pull requests or deployments on their own.</p>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-[#dfe4ff] bg-[#f7f8ff] px-4 py-3 text-xs text-[#48569f]"><ShieldCheck className="h-4 w-4" />Read-only planning by default</div>
    </header>

    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-[#dce1f5] bg-[#22263f] p-6 text-white shadow-[0_24px_70px_-38px_rgba(31,35,64,.9)]">
          <div className="flex items-start justify-between gap-4"><div><div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><Github className="h-5 w-5 text-[#bfc9ff]" /></div><h2 className="mt-5 text-xl font-semibold">Import public repositories</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#c7cce8]">Bring public repository metadata into your private workspace. Your terminal and GitHub credentials are never copied into this app.</p></div><Badge className="border-white/15 bg-white/10 text-[#dfe4ff] hover:bg-white/10">Public API</Badge></div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Input value={owner} onChange={event => setOwner(event.target.value)} aria-label="GitHub owner to import" className="border-white/15 bg-white/10 text-white placeholder:text-[#aeb6d9]" placeholder="GitHub owner" /><Button disabled={importPublic.isPending} onClick={() => importPublic.mutate({ owner })} className="bg-[#90a0ff] text-[#1e2443] hover:bg-[#acb7ff]">{importPublic.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Github className="mr-2 h-4 w-4" />}{importPublic.isPending ? "Importing…" : "Import inventory"}</Button></div>
        </section>

        <section className="rounded-3xl border border-[#e3e6ef] bg-white p-6 shadow-[0_20px_55px_-38px_rgba(30,37,65,.45)]">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold text-[#25293e]">Repositories</h2><p className="mt-1 text-sm text-muted-foreground">Select a scoped repository for a planning job.</p></div><Badge variant="outline" className="border-[#d8def7] text-[#596bd4]">{repositories.length} available</Badge></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {repositories.length === 0 ? <div className="col-span-full rounded-2xl border border-dashed border-[#d7dcef] bg-[#fafbff] p-6 text-sm text-muted-foreground">Import public repositories or add one manually below.</div> : repositories.map(repository => <button key={repository.id} type="button" onClick={() => setSelectedRepositoryId(repository.id)} className={`rounded-2xl border p-4 text-left transition-all ${selectedRepositoryId === repository.id ? "border-[#6979db] bg-[#f3f5ff] shadow-sm" : "border-[#e5e7ee] bg-white hover:border-[#c9d0ee]"}`}><div className="flex items-center justify-between gap-3"><span className="truncate font-medium text-[#30354d]">{repository.fullName}</span><span className={`h-2 w-2 shrink-0 rounded-full ${selectedRepositoryId === repository.id ? "bg-[#6979db]" : "bg-[#d7dbe8]"}`} /></div><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{repository.description || "No description provided"}</p><div className="mt-3 flex items-center gap-2 text-[11px] text-[#69718c]"><span>{repository.visibility}</span><span>•</span><span>{repository.defaultBranch}</span></div></button>)}</div>
          <details className="mt-5 rounded-2xl border border-[#edf0f6] bg-[#fcfcfe] p-4"><summary className="cursor-pointer text-sm font-medium text-[#42475e]">Add a repository manually</summary><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input value={manualRepository.fullName} onChange={event => setManualRepository(value => ({ ...value, fullName: event.target.value }))} placeholder="owner/repository" aria-label="Manual repository name" /><Input value={manualRepository.url} onChange={event => setManualRepository(value => ({ ...value, url: event.target.value }))} placeholder="https://github.com/owner/repository" aria-label="Manual repository URL" /><Input value={manualRepository.defaultBranch} onChange={event => setManualRepository(value => ({ ...value, defaultBranch: event.target.value }))} placeholder="Default branch" aria-label="Default branch" /><Input value={manualRepository.visibility} onChange={event => setManualRepository(value => ({ ...value, visibility: event.target.value }))} placeholder="private, public, or internal" aria-label="Repository visibility" /><Textarea className="sm:col-span-2" value={manualRepository.description} onChange={event => setManualRepository(value => ({ ...value, description: event.target.value }))} placeholder="Short repository context (optional)" aria-label="Repository description" /><Button className="w-fit bg-[#343a61] hover:bg-[#242944]" disabled={addRepository.isPending} onClick={() => addRepository.mutate({ ...manualRepository, description: manualRepository.description || null, visibility: manualRepository.visibility as "public" | "private" | "internal" })}>{addRepository.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add repository</Button></div></details>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-3xl border border-[#e3e6ef] bg-white p-6 shadow-[0_20px_55px_-38px_rgba(30,37,65,.45)]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef0ff] text-[#596bd4]"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold text-[#25293e]">Draft an agent plan</h2><p className="text-sm text-muted-foreground">Uses gpt-5-mini only when you run this job.</p></div></div><div className="mt-5 space-y-4"><Input value={title} onChange={event => setTitle(event.target.value)} aria-label="Agent job title" placeholder="Job title" /><Textarea value={goal} onChange={event => setGoal(event.target.value)} className="min-h-36 leading-6" aria-label="Agent planning goal" placeholder="What should the agent plan?" /><div className="rounded-2xl border border-[#e7eaf7] bg-[#fafbff] p-3 text-xs leading-5 text-[#5d6685]"><FileSearch className="mr-1 inline h-3.5 w-3.5" />Public README context can inform plans. The planner cannot write code or contact external services.</div><Button className="w-full bg-[#596bd4] hover:bg-[#4658be]" disabled={createPlan.isPending || !selectedRepositoryId} onClick={submitPlan}>{createPlan.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}{createPlan.isPending ? "Planning…" : "Generate safe plan"}</Button></div></section>

        <section className="rounded-3xl border border-[#e3e6ef] bg-white p-6 shadow-[0_20px_55px_-38px_rgba(30,37,65,.45)]"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-[#25293e]">Job history</h2><p className="mt-1 text-sm text-muted-foreground">Plans retain their approval record.</p></div><Clock3 className="h-5 w-5 text-[#8c95bc]" /></div><div className="mt-5 space-y-3">{jobs.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d7dcef] bg-[#fafbff] p-5 text-sm text-muted-foreground">No jobs yet. Select a repository and draft a plan.</div> : jobs.map(job => <article key={job.id} className="rounded-2xl border border-[#ebedf3] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-medium text-[#30354d]">{job.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{job.request}</p></div><Badge className={`shrink-0 ${statusStyle(job.status)}`}>{job.status.replaceAll("_", " ")}</Badge></div>{evidenceLabel(job.evidence) ? <p className="mt-3 text-xs font-medium text-[#6470aa]">{evidenceLabel(job.evidence)}</p> : null}{job.plan ? <div className="mt-3 rounded-xl bg-[#f8f9ff] p-3 text-xs leading-5 text-[#525a78] whitespace-pre-wrap line-clamp-6">{job.plan}</div> : null}{job.status === "awaiting_approval" ? <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => approve.mutate({ jobId: job.id })} disabled={approve.isPending || reject.isPending} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Approve plan</Button><Button size="sm" variant="outline" onClick={() => reject.mutate({ jobId: job.id })} disabled={approve.isPending || reject.isPending}><XCircle className="mr-1.5 h-3.5 w-3.5" />Reject</Button></div> : <div className="mt-3 flex items-center gap-1.5 text-xs text-[#78809e]"><CircleDashed className="h-3.5 w-3.5" />{job.status === "approved" ? "Approved; external work remains disabled until a dedicated action is added." : "Recorded in audit history"}</div>}</article>)}</div><Button variant="ghost" className="mt-3 w-full text-[#596bd4] hover:bg-[#f3f5ff]" onClick={() => utils.agent.jobs.list.invalidate()}><ChevronRight className="mr-1 h-4 w-4" />Refresh jobs</Button></section>
        <section className="rounded-3xl border border-[#e3e6ef] bg-white p-6 shadow-[0_20px_55px_-38px_rgba(30,37,65,.45)]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff0e9] text-[#bf6547]"><ImagePlus className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold text-[#25293e]">Creative asset</h2><p className="text-sm text-muted-foreground">GPT Image 2, medium quality, generated on demand.</p></div></div><Textarea className="mt-5 min-h-24" value={imagePrompt} onChange={event => setImagePrompt(event.target.value)} aria-label="Creative asset prompt" /><Button className="mt-3 w-full bg-[#bf6547] hover:bg-[#a9533a]" disabled={generateImage.isPending} onClick={() => generateImage.mutate({ prompt: imagePrompt })}>{generateImage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}{generateImage.isPending ? "Generating…" : "Generate image"}</Button>{media.data?.length ? <div className="mt-5 grid grid-cols-3 gap-2">{media.data.slice(0, 6).map((asset: { id: number; assetUrl: string; prompt: string }) => <a key={asset.id} href={asset.assetUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-[#ece6e2] bg-[#faf7f5]"><img src={asset.assetUrl} alt={asset.prompt} className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105" /></a>)}</div> : null}</section>
      </div>
    </div>
  </div>;
}

export default function AgentWorkspace() { return <DashboardLayout><Workspace /></DashboardLayout>; }
