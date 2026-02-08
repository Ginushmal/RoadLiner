import { Link, Outlet, useLoaderData, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";

export async function loader({ request }: { request: Request }) {
  const userId = await requireUser(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user?.role !== "VAN_DRIVER" && user?.role !== "ADMIN") {
       if (user?.role === "SENDER_RECEIVER") throw redirect("/dashboard");
       if (user?.role === "CROWD_DRIVER") throw redirect("/driver");
  }
  return { user };
}

export default function VanLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col">
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-gray-900 text-white px-6 shadow-sm">
        <Link to="/van" className="flex items-center gap-2 font-semibold">
          RoadLiner <span className="text-yellow-400">Van Operator</span>
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
