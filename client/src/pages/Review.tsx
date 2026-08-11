import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Loader2, Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

function ReviewContent() {
  const [, navigate] = useLocation();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId ?? "";
  const [acknowledged, setAcknowledged] = useState(false);
  const review = trpc.mailer.review.useQuery({ sessionId }, { enabled: Boolean(sessionId) });
  const confirm = trpc.mailer.confirmSend.useMutation({
    onSuccess: result => { toast.success(`${result.sent} email${result.sent === 1 ? "" : "s"} sent${result.failed ? `; ${result.failed} need attention` : ""}`); navigate("/history"); },
    onError: error => toast.error(error.message),
  });

  if (review.isLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#b35e45]" /></div>;
  if (review.error || !review.data) return <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-[#efd0c4] bg-[#fff5f1] p-7 text-center"><AlertTriangle className="mx-auto h-7 w-7 text-[#b6533c]" /><h1 className="mt-3 text-xl font-semibold">This review is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Start a new compose flow to prepare a fresh review.</p><Button className="mt-5" onClick={() => navigate("/")}>Back to compose</Button></div>;

  const { session, recipients } = review.data;
  return <div className="mx-auto max-w-4xl pb-12">
    <button onClick={() => navigate("/")} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#9a563f] hover:text-[#7e3f2d]"><ArrowLeft className="h-4 w-4" />Back to compose</button>
    <div className="rounded-2xl border border-[#eadbd1] bg-[#fffdfb] shadow-[0_24px_65px_-35px_rgba(63,37,26,.5)]">
      <div className="border-b border-[#f0e5de] bg-[linear-gradient(135deg,#fff8f3,#fffdfb)] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#aa5d46]">Required review</p><h1 className="mt-2 font-serif text-4xl tracking-[-.04em] text-[#2d251f]">One final look.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Confirm the audience, exact content, and mandatory attachment. Sending is not available until you acknowledge this review.</p></div><div className="rounded-full bg-[#fff1e9] px-3 py-2 text-xs font-semibold text-[#a85c46]">{recipients.length} recipient{recipients.length === 1 ? "" : "s"}</div></div></div>
      <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><section><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#3b2c25]"><Mail className="h-4 w-4 text-[#b5634a]" />Subject</div><div className="rounded-xl border border-[#eee1d9] bg-[#fffaf7] px-4 py-3 text-sm font-medium">{session.subject}</div></section><section><div className="mb-2 text-sm font-semibold text-[#3b2c25]">Message preview</div><div className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-[#eee1d9] bg-[#fffaf7] p-4 text-sm leading-6 text-[#57463d]">{recipients[0]?.renderedBody}</div><p className="mt-2 text-xs text-muted-foreground">Preview shown for {recipients[0]?.email}; placeholders are already rendered for each recipient.</p></section></div>
      <div className="space-y-5"><section className="rounded-xl border border-[#eadbd1] bg-[#fffaf7] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#3b2c25]"><FileText className="h-4 w-4 text-[#b5634a]" />Required attachment</div><div className="mt-3 flex items-center gap-3 rounded-lg bg-white p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fae7dc] text-[#a85c46]"><FileText className="h-4 w-4" /></span><span className="truncate text-sm font-medium">{session.attachmentName}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">The server attaches this same resume to every message in this send session.</p></section><section><div className="mb-2 text-sm font-semibold text-[#3b2c25]">Recipients</div><div className="max-h-[230px] overflow-auto rounded-xl border border-[#eee1d9] bg-[#fffaf7]">{recipients.map((recipient, index) => <div key={recipient.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="min-w-0"><span className="block truncate font-medium">{recipient.firstName || "Recipient"}</span><span className="block truncate text-xs text-muted-foreground">{recipient.email}</span></span><span className="text-xs text-muted-foreground">{index + 1}</span></div>)}</div></section></div></div>
      <Separator className="bg-[#f0e5de]" /><div className="p-6 sm:p-8"><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#eadbd1] bg-[#fff8f4] p-4"><Checkbox checked={acknowledged} onCheckedChange={value => setAcknowledged(value === true)} className="mt-0.5 border-[#c78368] data-[state=checked]:bg-[#b35e45]" /><span><span className="block text-sm font-medium text-[#3b2c25]">I have reviewed the recipients, subject, message, and resume attachment.</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">This confirmation sends individual emails through my connected Gmail account.</span></span></label><Button disabled={!acknowledged || confirm.isPending} onClick={() => confirm.mutate({ sessionId, acknowledged: true })} className="mt-5 w-full bg-[#b35e45] text-white hover:bg-[#994c37] sm:w-auto">{confirm.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{confirm.isPending ? "Sending…" : "Confirm and send"}</Button></div>
    </div>
  </div>;
}

export default function Review() { return <DashboardLayout><ReviewContent /></DashboardLayout>; }
