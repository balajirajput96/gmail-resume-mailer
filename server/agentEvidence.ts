export type AgentEvidence = {
  fileInventory: string[];
  readmeExcerpt: string | null;
  manifestExcerpt: string | null;
};

export function buildEvidenceSummary(evidence: AgentEvidence) {
  return JSON.stringify({
    rootFiles: evidence.fileInventory,
    readmeAvailable: Boolean(evidence.readmeExcerpt),
    manifestAvailable: Boolean(evidence.manifestExcerpt),
  });
}
