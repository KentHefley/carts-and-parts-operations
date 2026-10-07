import { clerkMiddleware } from "@clerk/nextjs/server";

// Authenticate requests here; protect each page/action/API at its resource.
export default clerkMiddleware({ signInUrl: "/sign-in" });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
