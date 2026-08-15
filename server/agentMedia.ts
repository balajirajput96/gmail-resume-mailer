export function normalizeImagePrompt(value: string) {
  const prompt = value.trim();
  if (prompt.length < 12) throw new Error("Describe the image in at least 12 characters");
  if (prompt.length > 2_000) throw new Error("Image prompts must be 2,000 characters or fewer");
  return prompt;
}
