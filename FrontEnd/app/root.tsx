import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { lazy, Suspense } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { prisma } from "~/db.server";

import type { Route } from "./+types/root";
import "./app.css";

const DevLocationPanel = lazy(() => import("./components/ui/dev-location-panel"));

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader() {
  const stations = await prisma.station.findMany({
    select: { id: true, name: true, latitude: true, longitude: true }
  });
  return { stations };
}

import { useLoaderData } from "react-router";

// ... existing imports ...

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();
  const stations = data?.stations || [];

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ClientOnly fallback={null}>
            {() => (
                <Suspense fallback={null}>
                    <DevLocationPanel stations={stations} />
                </Suspense>
            )}
        </ClientOnly>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
