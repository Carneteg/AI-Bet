export function getValueLabel(score: number): string {
  if (score >= 85) return "Utmärkt";
  if (score >= 70) return "Bra";
  if (score >= 55) return "OK";
  return "Svagt";
}

export function getValueColor(score: number): string {
  if (score >= 85) return "text-accent-green";
  if (score >= 70) return "text-brand";
  if (score >= 55) return "text-accent-yellow";
  return "text-accent-red";
}
