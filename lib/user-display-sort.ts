type NamedUser = { id: string; displayName: string | null; email: string };
const names = new Intl.Collator("en-US", { sensitivity: "base", numeric: true });
// The stored display name joins Clerk's first/last names; no separate surname is stored.
function nameKey(user: NamedUser) {
  const name = user.displayName?.trim().replace(/\s+/g, " ");
  return name ? name.split(" ").at(-1)! : user.email;
}
export function compareUserNames(left: NamedUser, right: NamedUser) {
  return names.compare(nameKey(left), nameKey(right)) ||
    names.compare(left.displayName?.trim() || left.email, right.displayName?.trim() || right.email) ||
    names.compare(left.email, right.email) || left.id.localeCompare(right.id);
}
