import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Check,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/notifications";
import { useLocation } from "wouter";

type Recipient = { email: string; firstName: string; company: string };
const blankRecipient = (): Recipient => ({
  email: "",
  firstName: "",
  company: "",
});

function Compose() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const overview = trpc.mailer.overview.useQuery();
  const hydrated = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([blankRecipient()]);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [subject, setSubject] = useState(
    "Application for {{company}} — [Your role]"
  );
  const [messageTemplate, setMessageTemplate] = useState(
    "Hi {{firstName}},\n\nI hope you’re doing well. I’m reaching out to express my interest in opportunities with {{company}}. I’ve attached my resume for your consideration.\n\nThank you for your time.\n\nBest regards,\n[Your name]"
  );

  useEffect(() => {
    if (!overview.data || hydrated.current) return;
    const saved = overview.data.recipients.map(item => ({
      email: item.email,
      firstName: item.firstName ?? "",
      company: item.company ?? "",
    }));
    if (saved.length) setRecipients(saved);
    if (overview.data.resumes[0]) setResumeId(overview.data.resumes[0].id);
    hydrated.current = true;
  }, [overview.data]);

  const upload = trpc.mailer.resumes.upload.useMutation({
    onSuccess: async result => {
      setResumeId(result.id);
      await utils.mailer.overview.invalidate();
      toast.success("Resume uploaded and selected");
    },
    onError: error => toast.error(error.message),
  });
  const preview = trpc.mailer.preview.useMutation({
    onSuccess: result => navigate(`/review/${result.sessionId}`),
    onError: error => toast.error(error.message),
  });

  if (overview.isLoading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#b35e45]" />
      </div>
    );
  if (overview.error)
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-[#efd0c4] bg-[#fff5f1] p-7 text-center">
        <h1 className="text-xl font-semibold text-[#3a2a23]">
          Your workspace could not load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please refresh the page and try again.
        </p>
        <Button className="mt-5" onClick={() => overview.refetch()}>
          Try again
        </Button>
      </div>
    );

  const update = (index: number, key: keyof Recipient, value: string) =>
    setRecipients(list =>
      list.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      )
    );
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const accepted = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!accepted.includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast.error("Choose a PDF or DOCX resume up to 8 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" &&
      upload.mutate({
        fileName: file.name,
        mimeType: file.type,
        dataUrl: reader.result,
      });
    reader.readAsDataURL(file);
  };
  const review = () => {
    if (!resumeId) {
      toast.error("Select a resume before reviewing");
      return;
    }
    preview.mutate({ recipients, subject, messageTemplate, resumeId });
  };
  const resume = overview.data?.resumes.find(item => item.id === resumeId);

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-[#aa5d46]">
            Application outreach
          </p>
          <h1 className="font-serif text-4xl tracking-[-.04em] text-[#2d251f] sm:text-5xl">
            Compose with confidence.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            One thoughtful draft. Individual, personalized emails. A deliberate
            final review.
          </p>
        </div>
        <div className="rounded-full border border-[#eadbd1] bg-[#fffaf6] px-3 py-2 text-xs text-[#654e43] shadow-sm">
          <span
            className={`mr-2 inline-block h-2 w-2 rounded-full ${overview.data?.gmailAddress ? "bg-emerald-500" : "bg-[#cf8a69]"}`}
          />
          {overview.data?.gmailAddress
            ? `Connected as ${overview.data.gmailAddress}`
            : "Gmail needs to be connected"}
        </div>
      </header>
      <div className="grid gap-5 lg:grid-cols-[1.45fr_.85fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#eadbd1] bg-[#fffdfb] p-5 shadow-[0_18px_50px_-30px_rgba(69,42,30,.45)]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[#342922]">
                  <Mail className="h-4 w-4 text-[#b5634a]" />
                  Gmail connection
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Authorization is retained server-side and never exposed here.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#9d563f] underline-offset-2 hover:underline"
                  >
                    Google Cloud credentials
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://console.cloud.google.com/apis/library/gmail.googleapis.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#9d563f] underline-offset-2 hover:underline"
                  >
                    Enable Gmail API
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#9d563f] underline-offset-2 hover:underline"
                  >
                    Manage Gemini keys
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <Button
                className="bg-[#b35e45] text-white hover:bg-[#994c37]"
                onClick={() => {
                  window.location.href = "/api/gmail/oauth/start";
                }}
              >
                {overview.data?.gmailAddress
                  ? "Reconnect Gmail"
                  : "Connect Gmail"}
              </Button>
            </div>
          </section>
          <section className="rounded-2xl border border-[#eadbd1] bg-[#fffdfb] p-5 shadow-[0_18px_50px_-30px_rgba(69,42,30,.45)]">
            <h2 className="text-lg font-semibold text-[#342922]">Recipients</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add each person once. First name and company personalize the
              message.
            </p>
            <div className="mt-4 space-y-2">
              {recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-[#f0e5de] bg-[#fffaf7] p-3 sm:grid-cols-[.75fr_1.25fr_.9fr_auto]"
                >
                  <Input
                    aria-label={`First name for recipient ${index + 1}`}
                    value={recipient.firstName}
                    onChange={event =>
                      update(index, "firstName", event.target.value)
                    }
                    placeholder="First name"
                  />
                  <Input
                    aria-label={`Email address for recipient ${index + 1}`}
                    value={recipient.email}
                    onChange={event =>
                      update(index, "email", event.target.value)
                    }
                    placeholder="name@company.com"
                    type="email"
                  />
                  <Input
                    aria-label={`Company for recipient ${index + 1}`}
                    value={recipient.company}
                    onChange={event =>
                      update(index, "company", event.target.value)
                    }
                    placeholder="Company"
                  />
                  <Button
                    aria-label={`Remove recipient ${index + 1}`}
                    variant="ghost"
                    size="icon"
                    disabled={recipients.length === 1}
                    onClick={() =>
                      setRecipients(list =>
                        list.filter((_, current) => current !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-[#b6533c]" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="mt-3 border-dashed border-[#d7aa96] text-[#a85c46] hover:bg-[#fff1ea]"
              onClick={() => setRecipients(list => [...list, blankRecipient()])}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add recipient
            </Button>
          </section>
          <section className="rounded-2xl border border-[#eadbd1] bg-[#fffdfb] p-5 shadow-[0_18px_50px_-30px_rgba(69,42,30,.45)]">
            <h2 className="text-lg font-semibold text-[#342922]">
              Email draft
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use {"{{firstName}}"}, {"{{company}}"}, or {"{{email}}"} to
              personalize each email.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="subject">Subject line</Label>
                <Input
                  id="subject"
                  className="mt-2"
                  value={subject}
                  onChange={event => setSubject(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  className="mt-2 min-h-64 leading-6"
                  value={messageTemplate}
                  onChange={event => setMessageTemplate(event.target.value)}
                />
              </div>
            </div>
          </section>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-[#ddc2b4] bg-[#3a2a23] p-5 text-[#fff9f5] shadow-[0_22px_60px_-30px_rgba(43,25,16,.75)]">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-4 w-4 text-[#edb9a1]" />
              Resume attachment
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#dbc6bd]">
              This attachment is required and included in every email sent from
              this session.
            </p>
            <div className="mt-4 space-y-2">
              {overview.data?.resumes.map(item => (
                <button
                  key={item.id}
                  onClick={() => setResumeId(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${item.id === resumeId ? "border-[#edb9a1] bg-white/10" : "border-white/10 bg-white/5"}`}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[#edb9a1]">
                    {item.id === resumeId ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {item.originalName}
                    </span>
                    <span className="text-xs text-[#cdb8af]">
                      {Math.ceil(item.sizeBytes / 1024)} KB
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <input
              className="hidden"
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
              onChange={handleFile}
            />
            <Button
              variant="outline"
              disabled={upload.isPending}
              className="mt-3 w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => fileInput.current?.click()}
            >
              {upload.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {upload.isPending ? "Uploading…" : "Upload PDF or DOCX"}
            </Button>
          </section>
          <section className="rounded-2xl border border-[#eadbd1] bg-[#fff7f1] p-5 shadow-[0_18px_50px_-30px_rgba(69,42,30,.35)]">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a85c46]">
              Ready when you are
            </p>
            <p className="mt-2 text-sm leading-6 text-[#63483c]">
              The next screen shows the exact recipients, message, and
              attachment before sending is unlocked.
            </p>
            <div className="mt-5 flex justify-between text-sm">
              <span className="text-muted-foreground">Recipients</span>
              <strong>
                {recipients.filter(item => item.email.trim()).length}
              </strong>
            </div>
            <div className="mt-3 flex justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Attachment</span>
              <strong className="truncate">
                {resume?.originalName ?? "Not selected"}
              </strong>
            </div>
            <Button
              className="mt-5 w-full bg-[#b35e45] text-white hover:bg-[#994c37]"
              disabled={preview.isPending}
              onClick={review}
            >
              {preview.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {preview.isPending ? "Preparing review…" : "Review email"}
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DashboardLayout>
      <Compose />
    </DashboardLayout>
  );
}
