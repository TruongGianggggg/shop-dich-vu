export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

const UPPERCASE_PATTERN = /\p{Lu}/u;
const SPECIAL_CHARACTER_PATTERN = /[\p{P}\p{S}]/u;

export function getPasswordPolicyError(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return "Mật khẩu phải có ít nhất 10 ký tự.";
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return "Mật khẩu không được vượt quá 72 ký tự.";
  }
  if (!UPPERCASE_PATTERN.test(password)) {
    return "Mật khẩu phải có ít nhất một chữ hoa.";
  }
  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "Mật khẩu phải có ít nhất một ký tự đặc biệt.";
  }
  return null;
}
