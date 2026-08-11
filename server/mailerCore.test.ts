import { describe, expect, it } from "vitest";
import { buildRawMimeEmail, canConfirmSend, normalizeAndValidateRecipients, renderPersonalizedBody } from "./mailerCore";

describe("resume mailer safety rules", () => {
  it("rejects invalid or duplicate recipients", () => {
    expect(() => normalizeAndValidateRecipients([{ email: "person@example.com" }, { email: "PERSON@example.com" }])).toThrow("only once");
    expect(() => normalizeAndValidateRecipients([{ email: "not-an-email" }])).toThrow("valid email");
  });

  it("renders recipient-specific placeholders", () => {
    expect(renderPersonalizedBody("Hi {{firstName}} at {{company}} — {{email}}", { email: "person@example.com", firstName: "Sam", company: "Acme" }))
      .toBe("Hi Sam at Acme — person@example.com");
  });

  it("permits confirmation only after review with an attachment", () => {
    expect(canConfirmSend({ status: "review", reviewedAt: new Date(), reviewOpenedAt: new Date(), attachmentName: "resume.pdf" })).toBe(true);
    expect(canConfirmSend({ status: "review", reviewedAt: null, reviewOpenedAt: new Date(), attachmentName: "resume.pdf" })).toBe(false);
    expect(canConfirmSend({ status: "review", reviewedAt: new Date(), reviewOpenedAt: null, attachmentName: "resume.pdf" })).toBe(false);
    expect(canConfirmSend({ status: "sending", reviewedAt: new Date(), reviewOpenedAt: new Date(), attachmentName: "resume.pdf" })).toBe(false);
    expect(canConfirmSend({ status: "review", reviewedAt: new Date(), reviewOpenedAt: new Date(), attachmentName: null })).toBe(false);
  });

  it("embeds the required resume attachment in the outgoing MIME message", () => {
    const raw = buildRawMimeEmail({
      to: "person@example.com",
      subject: "Application",
      body: "Hello",
      resume: Buffer.from("resume-bytes"),
      resumeFileName: "resume.pdf",
      resumeMimeType: "application/pdf",
    });
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    expect(decoded).toContain("Content-Disposition: attachment; filename=\"resume.pdf\"");
    expect(decoded).toContain(Buffer.from("resume-bytes").toString("base64"));
  });
});
