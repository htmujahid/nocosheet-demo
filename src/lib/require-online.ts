import { redirect } from "@tanstack/react-router";

export function requireOnline(location: { href: string }) {
  if (!navigator.onLine) throw redirect({ to: "/offline", search: { redirect: location.href } });
}
