import type { GameCurrencyType, GoldSaleType } from "@/lib/shop-api";

export const GOLD_PER_BAR = 37_000_000;

export function goldBarCount(goldAmount: number) {
  return Math.floor(Math.max(0, goldAmount) / GOLD_PER_BAR);
}

export function formatReceivedCurrency(
  amount: number,
  type: GameCurrencyType,
  goldSaleType: GoldSaleType = "BAR",
) {
  if (type === "GOLD") {
    if (goldSaleType === "FRESH") {
      return `${Math.max(0, amount).toLocaleString("vi-VN")} vàng tươi`;
    }
    return `${goldBarCount(amount).toLocaleString("vi-VN")} thỏi vàng`;
  }

  return `${amount.toLocaleString("vi-VN")} Ngọc`;
}

export function goldSaleTypeLabel(type: GoldSaleType) {
  return type === "FRESH" ? "Vàng tươi" : "Thỏi vàng";
}
