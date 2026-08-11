import crypto from "crypto";

export type MailRecipient = {
  email: string;
  firstName?: string | null;
  company?: string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAndValidateRecipients(recipients: MailRecipient[]) {
  if (recipients.length === 0) throw new Error("Add at least one recipient before reviewing the email");
  if (recipients.length > 100) throw new Error("A send session can include up to 100 recipients");

  const seen = new Set<string>();
  return recipients.map(recipient => {
    const email = recipient.email.trim().toLowerCase();
    if (!emailPattern.test(email)) throw new Error("Every recipient must have a valid email address");
    if (seen.has(email)) throw new Error("Each recipient email address can appear only once");
    seen.add(email);
    return {
      email,
      firstName: recipient.firstName?.trim() || null,
      company: recipient.company?.trim() || null,
    };
  });
}

export function renderPersonalizedBody(template: string, recipient: MailRecipient) {
  const replacements: Record<string, string> = {
    firstName: recipient.firstName?.trim() || "there",
    company: recipient.company?.trim() || "your team",
    email: recipient.email,
  };
  return template.replace(/{{\s*(firstName|company|email)\s*}}/g, (_, key: keyof typeof replacements) => replacements[key]);
}

function quotedHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "resume";
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join("\r\n") ?? "";
}

export function buildRawMimeEmail(input: {
  to: string;
  subject: string;
  body: string;
  resume: Buffer;
  resumeFileName: string;
  resumeMimeType: string;
}) {
  if (input.resume.length === 0) throw new Error("A non-empty resume attachment is required");
  const boundary = `resume-mailer-${crypto.randomUUID()}`;
  const fileName = safeFileName(input.resumeFileName);
  const email = [
    `To: ${input.to}`,
    `Subject: ${quotedHeader(input.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary=\"${boundary}\"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.body.replace(/\r?\n/g, "\r\n"),
    "",
    `--${boundary}`,
    `Content-Type: ${input.resumeMimeType}; name=\"${fileName}\"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename=\"${fileName}\"`,
    "",
    wrapBase64(input.resume.toString("base64")),
    `--${boundary}--`,
    "",
  ].join("\r\n");
  return Buffer.from(email, "utf8").toString("base64url");
}

export function canConfirmSend(session: { status: string; reviewedAt: Date | null; reviewOpenedAt: Date | null; attachmentName: string | null }) {
  return session.status === "review" && session.reviewedAt instanceof Date && session.reviewOpenedAt instanceof Date && Boolean(session.attachmentName);
}
