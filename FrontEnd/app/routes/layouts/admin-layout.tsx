import { Link, Outlet, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { requireRole } from "~/auth.server";

export async function loader({ request }: { request: Request }) {
  const user = await requireRole(request, ["ADMIN"]);
  return { user };
}

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col">
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-gray-900 text-white px-6 shadow-sm">
        <Link to="/admin" className="flex items-center gap-2 font-semibold">
          RoadLiner <span className="text-red-400">Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-300">{user?.name}</span>
            <Link to="/logout">
                <Button variant="secondary" size="sm">Logout</Button>
            </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
