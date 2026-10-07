export function isJobSelectionButtonText(buttonText: string): boolean {
  const normalized = buttonText.toLowerCase();
  return normalized.includes('open job') || normalized.includes('job open');
}
