import { Link, Outlet, useLoaderData, useLocation, redirect } from "react-router";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";
import { Button } from "~/components/ui/button";

export async function loader({ request }: { request: Request }) {
  const userId = await requireUser(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.role !== "CROWD_DRIVER" && user?.role !== "ADMIN") {
      if (user?.role === "SENDER_RECEIVER") throw redirect("/dashboard");
      if (user?.role === "VAN_DRIVER") throw redirect("/van");
  }

  return { user };
}

export default function DriverLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navItems = [
    { name: "My Active Jobs", href: "/driver" },
    { name: "Find New Jobs", href: "/driver/jobs" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm dark:bg-gray-950">
        <Link to="/driver" className="flex items-center gap-2 font-semibold text-blue-600">
          RoadLiner <span className="text-gray-900 dark:text-gray-50">Crowd Driver</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium ml-6">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    to={item.href}
                    className={`transition-colors hover:text-gray-900 dark:hover:text-gray-50 ${
                        location.pathname === item.href ? "text-gray-900 dark:text-gray-50" : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                    {item.name}
                </Link>
            ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
             <Link to="/logout">
                <Button variant="outline" size="sm">Logout</Button>
            </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
