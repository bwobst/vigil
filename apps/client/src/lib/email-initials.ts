export function initialsFromEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  const local = (at === -1 ? trimmed : trimmed.slice(0, at)).replace(
    /[^a-zA-Z0-9]/g,
    "",
  );
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local.length === 1) return local.toUpperCase();
  return "?";
}

export function avatarHueFromEmail(email: string): number {
  const s = email.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
