import { useState } from "react";

import { signInWithIdToken, useAuthStore } from "@/features/auth/auth-store";
import { getGoogleIdToken, googleSignInErrorMessage } from "@/features/auth/google-sign-in";
import { LoginScreen } from "@/features/auth/login-screen";
import { ApiError } from "@/lib/api";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notice = useAuthStore((s) => s.notice);

  async function signIn() {
    setLoading(true);
    setError(null);
    try {
      const idToken = await getGoogleIdToken();
      // Closing Google's sheet is a choice, not an error.
      if (idToken) await signInWithIdToken(idToken);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : (googleSignInErrorMessage(e) ?? "Gagal masuk dengan Google. Coba lagi, ya."),
      );
    } finally {
      // On success the auth gate swaps this screen out; the state update is harmless either way.
      setLoading(false);
    }
  }

  return <LoginScreen onGooglePress={signIn} loading={loading} error={error} notice={notice} />;
}
