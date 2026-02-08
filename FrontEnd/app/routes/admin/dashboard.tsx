import { type LoaderFunctionArgs, Link, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireRole(request, ["ADMIN"]);
  
  const routes = await prisma.route.findMany({
      include: { 
          stops: { 
              orderBy: { sequenceOrder: 'asc' },
              include: { station: true }
          },
          vanDriver: true
      }
  });

  const stations = await prisma.station.findMany();

  return { routes, stations };
}

export default function AdminDashboard() {
  const { routes, stations } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
            <Link to="/admin/stations/new">
                <Button variant="secondary">Add Station</Button>
            </Link>
            <Link to="/admin/routes/new">
                <Button>Create New Route</Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          {/* Routes List */}
          <Card>
              <CardHeader>
                  <CardTitle>Managed Routes</CardTitle>
              </CardHeader>
              <CardContent>
                  {routes.length === 0 ? <p className="text-sm text-gray-500">No routes defined.</p> : (
                      <div className="space-y-4">
                          {routes.map(route => (
                              <div key={route.id} className="border p-4 rounded-md">
                                  <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-bold">{route.name}</h3>
                                      <div className="flex flex-col items-end gap-2">
                                          <span className={`text-xs px-2 py-1 rounded ${route.vanDriver ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                              {route.vanDriver ? `Driver: ${route.vanDriver.name}` : "No Driver Assigned"}
                                          </span>
                                          <Link to={`/admin/routes/${route.id}/edit`}>
                                              <Button variant="ghost" size="sm" className="h-7 text-xs">Edit Route</Button>
                                          </Link>
                                      </div>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">
                                      {route.stops.map((s, i) => (
                                          <span key={s.id}>
                                              {s.station?.name}
                                              {i < route.stops.length - 1 && " → "}
                                          </span>
                                      ))}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>

          {/* Stations List */}
          <Card>
              <CardHeader>
                  <CardTitle>Stations</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                      {stations.map(station => (
                          <div key={station.id} className="flex justify-between border-b pb-2 last:border-0">
                              <span>{station.name}</span>
                              <span className="text-gray-500 text-sm">{station.city}</span>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}