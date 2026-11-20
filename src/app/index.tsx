import { Redirect } from "expo-router";

// Until the auth gate exists, every launch opens the sign-in screen.
export default function Index() {
  return <Redirect href="/login" />;
}
