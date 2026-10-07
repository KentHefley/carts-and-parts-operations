import { UserButton } from "@clerk/nextjs";
import { requireApprovedUser } from "../lib/access";

export default async function Home() {
  const user = await requireApprovedUser();

  return (
    <main className="mx-auto w-full max-w-5xl p-6 sm:p-10">
      <header className="flex items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">Development</p>
          <h1 className="mt-1 text-2xl font-semibold">Carts and Parts Operations</h1>
        </div>
        <UserButton />
      </header>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Employee access verified</h2>
        <p className="mt-3 max-w-2xl">
          You are signed in with approved {user.role === "ADMIN" ? "administrator" : "employee"} access.
          Sales order creation, saving and reopening are the next implementation milestone.
        </p>
      </section>
    </main>
  );
}
