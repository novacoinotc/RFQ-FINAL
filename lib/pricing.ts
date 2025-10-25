export function applyCommission(priceSpot: number, side: "BUY"|"SELL", commissionBps: number) {
  const factor = commissionBps / 10000;
  return side === "BUY" ? priceSpot * (1 + factor) : priceSpot * (1 - factor);
}
