import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/main")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
});
