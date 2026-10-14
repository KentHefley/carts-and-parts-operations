import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApprovedUser } from "../../lib/access";

export default async function AccessDenied({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const user = await getApprovedUser();
  const { reason } = await searchParams;
  // Recover old approval screens after signup/role changes without granting
  // access to the administrator-only route that originally rejected the user.
  if (user && (user.role === "ADMIN" || reason !== "admin")) redirect("/");
  return (
    <main className="mx-auto max-w-xl p-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{user ? "Administrator access required" : "Access needs approval"}</h1>
        <UserButton />
      </div>
      {user ? <><p className="mt-4">Your employee account is approved. This page is available only to administrators.</p><p className="mt-4"><Link href="/">Go to Dashboard</Link></p></> : <p className="mt-4">Contact an administrator to confirm your employee access. You can sign out using your profile button.</p>}
    </main>
  );
}
