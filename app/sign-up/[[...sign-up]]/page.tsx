import { SignOutButton, SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { invitationSignupReturn } from "../../../lib/invitation-policy";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { userId } = await auth();
  const returnUrl = invitationSignupReturn(await searchParams);
  return <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
    <h1 className="text-2xl font-semibold">Carts and Parts Operations</h1><p>Development · Invited employee signup</p>
    {userId ? <section className="content-panel max-w-lg" aria-labelledby="signed-in-heading">
      <h2 id="signed-in-heading">You’re already signed in</h2>
      <p>Sign out to accept this invitation with another account. Your current account and its permissions will stay unchanged.</p>
      <div className="confirmation-actions"><Link href="/">Return to App</Link><SignOutButton redirectUrl={returnUrl}><button type="button">Sign Out and Continue</button></SignOutButton></div>
    </section> : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/" />}
  </main>;
}
