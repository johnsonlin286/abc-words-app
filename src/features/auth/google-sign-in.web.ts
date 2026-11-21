// Web build (only used for quick layout previews): the native Google Sign-In module doesn't exist
// there, and importing it breaks Metro's web render. The Android app uses google-sign-in.ts.

export async function getGoogleIdToken(): Promise<string | null> {
  throw new Error("Login Google hanya tersedia di aplikasi Android.");
}

export async function signOutOfGoogle(): Promise<void> {}

export function googleSignInErrorMessage(_error: unknown): string | null {
  return null;
}
