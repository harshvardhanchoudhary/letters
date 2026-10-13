export function isAllowedEmail(email: string | undefined | null) {
  const allowed = [process.env.ALLOWED_EMAIL_1, process.env.ALLOWED_EMAIL_2]
    .filter(Boolean)
    .map((x) => x!.trim().toLowerCase());
  return (
    !!email &&
    allowed.length === 2 &&
    allowed.includes(email.trim().toLowerCase())
  );
}
export function displayName(email?: string | null, name?: string | null) {
  if (name) return name;
  if (
    email?.toLowerCase() === process.env.ALLOWED_EMAIL_1?.trim().toLowerCase()
  )
    return process.env.DISPLAY_NAME_1 || "You";
  if (
    email?.toLowerCase() === process.env.ALLOWED_EMAIL_2?.trim().toLowerCase()
  )
    return process.env.DISPLAY_NAME_2 || "Your person";
  return "Your person";
}
