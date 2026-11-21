import { useState } from "react";

import { setDisplayName, signOut } from "@/features/auth/auth-store";
import { ChooseNameScreen } from "@/features/auth/choose-name-screen";
import { signOutOfGoogle } from "@/features/auth/google-sign-in";
import { ApiError } from "@/lib/api";

export default function ChooseName() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(name: string) {
    setLoading(true);
    setError(null);
    try {
      await setDisplayName(name);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal menyimpan nama panggilan. Coba lagi, ya.");
    } finally {
      setLoading(false);
    }
  }

  async function leave() {
    await signOutOfGoogle();
    await signOut();
  }

  return <ChooseNameScreen onSubmit={submit} onSignOut={leave} loading={loading} error={error} />;
}
