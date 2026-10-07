import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function AccessDenied() {
  await auth.protect();
  return (
    <main className="mx-auto max-w-xl p-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Access needs approval</h1>
        <UserButton />
      </div>
      <p className="mt-4">Contact an administrator to confirm your employee access. You can sign out using your profile button.</p>
    </main>
  );
}
