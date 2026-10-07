import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Carts and Parts Operations</h1>
        <p className="mt-2 text-sm">Development · Employee sign-in</p>
      </div>
      <SignIn routing="path" path="/sign-in" />
    </main>
  );
}
