// Only a failed read of Clerk identity is eligible for this single retry.
export async function recoverIdentity<T>(lookup: () => Promise<T>, freshLookup: () => Promise<T>): Promise<T> {
  try {
    return await lookup();
  } catch (error) {
    if (!error || typeof error !== "object" || !("clerkError" in error) || error.clerkError !== true
      || !("status" in error) || ![500, 502, 503, 504].includes(Number(error.status))) throw error;
    await new Promise(resolve => setTimeout(resolve, 250));
    return freshLookup();
  }
}
