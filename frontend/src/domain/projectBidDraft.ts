export type ProjectBidDraftLine = {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceDescription?: string;
  quantity: string;
  unitPriceDollars: string;
  note: string;
};

export function bidDollarsToCents(value: string): number | null {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function projectBidDraftTotalCents(lines: ProjectBidDraftLine[]): number {
  return lines.reduce((total, line) => {
    const quantity = Number(line.quantity);
    const unitPriceCents = bidDollarsToCents(line.unitPriceDollars);
    if (!Number.isInteger(quantity) || quantity <= 0 || unitPriceCents === null) {
      return total;
    }

    return total + quantity * unitPriceCents;
  }, 0);
}

export function projectBidDraftIsValid(lines: ProjectBidDraftLine[]): boolean {
  return lines.length > 0 && lines.every((line) => {
    const quantity = Number(line.quantity);
    return line.serviceName.trim().length > 0
      && Number.isInteger(quantity)
      && quantity > 0
      && bidDollarsToCents(line.unitPriceDollars) !== null;
  });
}
