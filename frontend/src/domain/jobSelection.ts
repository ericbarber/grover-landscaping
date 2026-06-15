export function isJobSelectionButtonText(buttonText: string): boolean {
  return buttonText.includes('Open Job') || buttonText.includes('Selected Job');
}
