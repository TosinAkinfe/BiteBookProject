export const PASSWORD_POLICY_MESSAGE =
  "Password must be 8-72 chars with uppercase, lowercase, and a number";

export function isStrongPassword(value: string) {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 72 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}
