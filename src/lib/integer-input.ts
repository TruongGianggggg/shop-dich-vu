export function normalizeIntegerInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^0+(?=\d)/, "");
}

export function formatIntegerInput(value: string | number) {
  const digits = normalizeIntegerInput(String(value));
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function isPositiveIntegerInput(value: string) {
  const amount = Number(value);
  return /^\d+$/.test(value) && amount > 0 && Number.isSafeInteger(amount);
}

export function isNonNegativeIntegerInput(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
}
