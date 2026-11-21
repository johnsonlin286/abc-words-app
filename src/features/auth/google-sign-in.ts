import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from "react-native-nitro-google-signin";

// The one place that knows the Google Sign-In library (Android Credential Manager via Nitro).
// Swapping libraries means changing only this file.

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!WEB_CLIENT_ID) throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID belum diisi.");
  GoogleOneTapSignIn.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

/**
 * Show Google's account picker and return an ID token for the backend, or null when the player
 * closes the sheet. A previously used account signs in with one tap; otherwise the full
 * "Sign in with Google" sheet lists every account on the phone.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  ensureConfigured();
  await GoogleOneTapSignIn.checkPlayServices();

  let response = await GoogleOneTapSignIn.signIn();
  if (isNoSavedCredentialFoundResponse(response)) response = await GoogleOneTapSignIn.presentExplicitSignIn();
  if (isCancelledResponse(response)) return null;
  if (isSuccessResponse(response)) return response.data.idToken;
  return null;
}

/** Forget the chosen Google account so the next sign-in shows the picker again. */
export async function signOutOfGoogle(): Promise<void> {
  ensureConfigured();
  await GoogleOneTapSignIn.signOut().catch(() => {});
}

/** A player-facing message for a failed Google sign-in, or null when nothing needs saying. */
export function googleSignInErrorMessage(error: unknown): string | null {
  if (!isErrorWithCode(error)) return null;
  switch (error.code) {
    case statusCodes.SIGN_IN_CANCELLED:
    case statusCodes.IN_PROGRESS:
      return null;
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return "Google Play Services tidak tersedia atau perlu diperbarui di HP ini.";
    case statusCodes.DEVELOPER_ERROR:
      return "Login Google belum diatur dengan benar. Coba lagi nanti.";
    default:
      return null;
  }
}
