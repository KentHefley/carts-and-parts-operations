// This designation protects the existing approved account; it never grants login
// approval or changes its stored User/Admin role. Email changes are not exposed
// by User Management. Transfer requires a deliberate maintainer change.
export function isSuperAdminAccount(email: string): boolean {
  return email.trim().toLowerCase() === "kent@cartsandparts.com";
}
