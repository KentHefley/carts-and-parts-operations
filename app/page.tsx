import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  await auth.protect();

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
        <h2 className="text-xl font-semibold">Authentication setup</h2>
        <p className="mt-3 max-w-2xl">
          You are signed in. Sales order creation, saving and reopening are the
          next implementation milestone. Employee approval and permissions must
          be verified before company data is available here.
        </p>
      </section>
    </main>
  );
}
