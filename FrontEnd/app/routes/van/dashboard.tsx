import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["VAN_DRIVER", "ADMIN"]);
  
  const activeRoute = await prisma.route.findFirst({
      where: { vanDriverId: user.id },
      include: { 
          stops: {
              orderBy: { sequenceOrder: 'asc' },
              include: { station: true }
          }
      }
  });

  if (!activeRoute) {
      const availableRoutes = await prisma.route.findMany({
          where: { vanDriverId: null },
          include: { stops: { include: { station: true } } }
      });
      return { activeRoute: null, availableRoutes };
  }

  const stationIds = activeRoute.stops.map(s => s.stationId).filter(Boolean) as string[];

  // Parcels waiting at ANY station in this route to be loaded
  const toLoad = await prisma.parcel.findMany({
      where: {
          status: "AT_STATION_ORIGIN",
          originStationId: { in: stationIds }
      },
      include: { destinationStation: true, originStation: true }
  });

  // Parcels currently on this van
  const onVan = await prisma.parcel.findMany({
      where: { status: "IN_TRANSIT" },
      include: { destinationStation: true, originStation: true }
  });

  // Global On-Route tasks (Simplified for prototype)
  const onRoutePickups = await prisma.parcel.findMany({
      where: { pickupMethod: "ON_ROUTE", status: "ACCEPTED" }
  });

  const onRouteDropoffs = await prisma.parcel.findMany({
      where: { dropoffMethod: "ON_ROUTE", status: "IN_TRANSIT" }
  });

  return { activeRoute, toLoad, onVan, onRoutePickups, onRouteDropoffs };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["VAN_DRIVER", "ADMIN"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const parcelId = formData.get("parcelId") as string;
  const routeId = formData.get("routeId") as string;

  if (intent === "select_route") {
      await prisma.route.update({ where: { id: routeId }, data: { vanDriverId: user.id } });
  }

  if (intent === "end_route") {
       await prisma.route.update({ where: { id: routeId }, data: { vanDriverId: null } });
  }

  if (intent === "load") {
      await prisma.parcel.update({
          where: { id: parcelId },
          data: { status: "IN_TRANSIT" }
      });
  }

  if (intent === "unload") {
      const parcel = await prisma.parcel.findUnique({ where: { id: parcelId } });
      // If it's a Home Delivery, it needs a Crowd Driver (AT_STATION_DEST)
      // If it's a Station Pickup, it's ready for Receiver (READY_FOR_PICKUP)
      const nextStatus = parcel?.dropoffMethod === "HOME" ? "AT_STATION_DEST" : "READY_FOR_PICKUP";
      
      await prisma.parcel.update({
          where: { id: parcelId },
          data: { status: nextStatus }
      });
  }
  
  if (intent === "pickup_on_route") {
      await prisma.parcel.update({ where: { id: parcelId }, data: { status: "IN_TRANSIT" } });
  }
  
  if (intent === "dropoff_on_route") {
      await prisma.parcel.update({ where: { id: parcelId }, data: { status: "DELIVERED" } });
  }

  return null;
}

export default function VanDashboard() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (!data.activeRoute) {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-3xl font-bold">Select Your Route</h1>
              <div className="grid gap-4 md:grid-cols-2">
                  {data.availableRoutes?.map(route => (
                      <Card key={route.id}>
                          <CardHeader><CardTitle>{route.name}</CardTitle></CardHeader>
                          <CardContent className="space-y-4">
                              <div className="text-sm space-y-1">
                                  {route.stops.map((stop, idx) => (
                                      <div key={stop.id} className="flex items-center gap-2">
                                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                                          <span>{stop.station?.name}</span>
                                      </div>
                                  ))}
                              </div>
                              <Form method="post">
                                  <input type="hidden" name="routeId" value={route.id} />
                                  <Button name="intent" value="select_route" className="w-full" disabled={isSubmitting}>Start Route</Button>
                              </Form>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>
      );
  }

  const { activeRoute, toLoad, onVan, onRoutePickups, onRouteDropoffs } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-bold">{activeRoute.name}</h1>
            <p className="text-sm text-gray-500">Van Status: Running</p>
         </div>
         <Form method="post">
            <input type="hidden" name="routeId" value={activeRoute.id} />
            <Button name="intent" value="end_route" variant="outline" size="sm">End Shift</Button>
         </Form>
      </div>

      <div className="space-y-4">
          {activeRoute.stops.map((stop) => {
              const parcelsAtStation = toLoad.filter(p => p.originStationId === stop.stationId);
              const parcelsToUnload = onVan.filter(p => p.destinationStationId === stop.stationId);

              return (
                  <Card key={stop.id} className="border-l-4 border-l-blue-600">
                      <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex justify-between">
                              {stop.station?.name}
                              <span className="text-xs font-normal text-gray-500">Stop #{stop.sequenceOrder}</span>
                          </CardTitle>
                      </CardHeader>
                      <CardContent>
                          <div className="grid md:grid-cols-2 gap-4">
                              {/* Load Section */}
                              <div className="bg-gray-50 p-3 rounded-lg">
                                  <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">To Load ({parcelsAtStation.length})</h4>
                                  {parcelsAtStation.length === 0 ? <p className="text-xs text-gray-400">No parcels here.</p> : (
                                      <div className="space-y-2">
                                          {parcelsAtStation.map(p => (
                                              <div key={p.id} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm">
                                                  <span>{p.trackingId} &rarr; {p.destinationStation?.city}</span>
                                                  <Form method="post">
                                                      <input type="hidden" name="parcelId" value={p.id} />
                                                      <Button name="intent" value="load" size="sm" variant="outline">Load</Button>
                                                  </Form>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                              {/* Unload Section */}
                              <div className="bg-blue-50 p-3 rounded-lg">
                                  <h4 className="text-xs font-bold uppercase text-blue-400 mb-2">To Unload ({parcelsToUnload.length})</h4>
                                  {parcelsToUnload.length === 0 ? <p className="text-xs text-gray-400">None for this stop.</p> : (
                                      <div className="space-y-2">
                                          {parcelsToUnload.map(p => (
                                              <div key={p.id} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm">
                                                  <span>{p.trackingId}</span>
                                                  <Form method="post">
                                                      <input type="hidden" name="parcelId" value={p.id} />
                                                      <Button name="intent" value="unload" size="sm">Unload</Button>
                                                  </Form>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              );
          })}
      </div>

      {/* On-Route Section (Floating Tasks) */}
      {(onRoutePickups.length > 0 || onRouteDropoffs.length > 0) && (
          <Card className="border-yellow-400 bg-yellow-50">
              <CardHeader><CardTitle className="text-yellow-800">Dynamic On-Route Tasks</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                      <h4 className="text-xs font-bold uppercase text-yellow-600 mb-2">Pickups</h4>
                      {onRoutePickups.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded mb-2 shadow-sm text-sm">
                              <span>{p.trackingId} at {p.pickupAddress}</span>
                              <Form method="post">
                                  <input type="hidden" name="parcelId" value={p.id} /><Button name="intent" value="pickup_on_route" size="sm" variant="outline">Done</Button>
                              </Form>
                          </div>
                      ))}
                  </div>
                  <div>
                      <h4 className="text-xs font-bold uppercase text-green-600 mb-2">Drop-offs</h4>
                      {onRouteDropoffs.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded mb-2 shadow-sm text-sm">
                              <span>{p.trackingId} at {p.dropoffAddress}</span>
                              <Form method="post">
                                  <input type="hidden" name="parcelId" value={p.id} /><Button name="intent" value="dropoff_on_route" size="sm" variant="outline">Done</Button>
                              </Form>
                          </div>
                      ))}
                  </div>
              </CardContent>
          </Card>
      )}
    </div>
  );
}