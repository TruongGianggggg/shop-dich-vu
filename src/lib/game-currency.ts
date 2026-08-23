import type { GameCurrencyType } from "@/lib/shop-api";

export const GOLD_PER_BAR = 37_000_000;

export function goldBarCount(goldAmount: number) {
  return Math.floor(Math.max(0, goldAmount) / GOLD_PER_BAR);
}

export function formatReceivedCurrency(amount: number, type: GameCurrencyType) {
  if (type === "GOLD") {
    return `${goldBarCount(amount).toLocaleString("vi-VN")} thỏi vàng`;
  }

  return `${amount.toLocaleString("vi-VN")} Ngọc`;
}
