import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { CartDrawer } from "@/components/cart-drawer";
import { AuthProvider } from "@/lib/auth";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-button transition-all hover:brightness-110"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Voltzo — Soft Corporate Electronics Marketplace" },
      {
        name: "description",
        content:
          "Inverters, batteries, CCTV, solar and appliances. Retail and B2B bulk pricing with installation across India.",
      },
      { name: "author", content: "Voltzo" },
      { property: "og:title", content: "Voltzo — Soft Corporate Electronics Marketplace" },
      {
        property: "og:description",
        content:
          "Hybrid retail + bulk inquiry marketplace for power, security and appliances.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Voltzo — Soft Corporate Electronics Marketplace" },
      { name: "description", content: "An e-commerce application for electronics marketplaces, featuring hybrid product cards and a premium checkout flow." },
      { property: "og:description", content: "An e-commerce application for electronics marketplaces, featuring hybrid product cards and a premium checkout flow." },
      { name: "twitter:description", content: "An e-commerce application for electronics marketplaces, featuring hybrid product cards and a premium checkout flow." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6b691664-0a91-415e-ba2f-255f64bd13a3/id-preview-2631bb5a--6eca481d-757c-480d-a583-05691538837a.lovable.app-1776667815879.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6b691664-0a91-415e-ba2f-255f64bd13a3/id-preview-2631bb5a--6eca481d-757c-480d-a583-05691538837a.lovable.app-1776667815879.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-dvh bg-background text-foreground">
          <SiteHeader />
          <Outlet />
          <CartDrawer />
          <Toaster richColors position="top-right" closeButton />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
