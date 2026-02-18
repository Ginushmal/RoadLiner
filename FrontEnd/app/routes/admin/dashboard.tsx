import { type LoaderFunctionArgs, type ActionFunctionArgs, Link, useLoaderData, Form, useActionData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["ADMIN"]);
  
  const routes = await prisma.route.findMany({
      include: { 
          stops: { 
              orderBy: { sequenceOrder: 'asc' },
              include: { station: true }
          },
          vanDriver: true
      }
  });

  const stations = await prisma.station.findMany({
    orderBy: { name: 'asc' }
  });

  return { routes, stations };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["ADMIN"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = formData.get("id") as string;

  if (intent === "delete_route") {
    // Delete stops first (cascade manually just in case, though schema might handle it)
    await prisma.routeStop.deleteMany({ where: { routeId: id } });
    // Delete trips history
    await prisma.trip.deleteMany({ where: { routeId: id } });
    // Delete route
    await prisma.route.delete({ where: { id } });
    return { success: true, message: "Route deleted successfully." };
  }

  if (intent === "delete_station") {
    // Check dependencies
    const stopsCount = await prisma.routeStop.count({ where: { stationId: id } });
    const parcelsOrigin = await prisma.parcel.count({ where: { originStationId: id } });
    const parcelsDest = await prisma.parcel.count({ where: { destinationStationId: id } });

    if (stopsCount > 0) {
      return { error: "Cannot delete station: It is part of one or more routes." };
    }
    if (parcelsOrigin > 0 || parcelsDest > 0) {
      return { error: "Cannot delete station: There are parcels associated with it." };
    }

    await prisma.station.delete({ where: { id } });
    return { success: true, message: "Station deleted successfully." };
  }

  return null;
}

export default function AdminDashboard() {
  const { routes, stations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            {actionData?.error && (
                <p className="text-red-600 text-sm mt-1">{actionData.error}</p>
            )}
             {actionData?.message && (
                <p className="text-green-600 text-sm mt-1">{actionData.message}</p>
            )}
        </div>
        
        <div className="space-x-2">
            <Button variant="secondary" asChild>
                <Link to="/admin/stations/new">Add Station</Link>
            </Button>
            <Button asChild>
                <Link to="/admin/routes/new">Create New Route</Link>
            </Button>
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
                              <div key={route.id} className="border p-4 rounded-md space-y-3">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <h3 className="font-bold">{route.name}</h3>
                                          <span className={`text-xs px-2 py-1 rounded ${route.vanDriver ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                              {route.vanDriver ? `Driver: ${route.vanDriver.name}` : "No Driver Assigned"}
                                          </span>
                                      </div>
                                      <div className="flex gap-2">
                                          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                              <Link to={`/admin/routes/${route.id}/edit`}>Edit</Link>
                                          </Button>
                                          <Form method="post" onSubmit={(e) => {
                                              if (!confirm("Are you sure you want to delete this route?")) e.preventDefault();
                                          }}>
                                              <input type="hidden" name="id" value={route.id} />
                                              <Button name="intent" value="delete_route" variant="destructive" size="sm" className="h-7 text-xs">Delete</Button>
                                          </Form>
                                      </div>
                                  </div>
                                  <div className="text-sm text-gray-600">
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
                  {stations.length === 0 ? <p className="text-sm text-gray-500">No stations defined.</p> : (
                      <div className="space-y-2">
                          {stations.map(station => (
                              <div key={station.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                                  <div>
                                      <span className="font-medium">{station.name}</span>
                                      <span className="text-gray-500 text-sm ml-2">({station.city})</span>
                                  </div>
                                  <Form method="post" onSubmit={(e) => {
                                      if (!confirm("Are you sure you want to delete this station?")) e.preventDefault();
                                  }}>
                                      <input type="hidden" name="id" value={station.id} />
                                      <Button name="intent" value="delete_station" variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                                          <span className="sr-only">Delete</span>
                                          🗑️
                                      </Button>
                                  </Form>
                              </div>
                          ))}
                      </div>
                  )}
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
