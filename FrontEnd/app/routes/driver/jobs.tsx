import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";
import { lazy, Suspense } from "react";
import { ClientOnly } from "remix-utils/client-only";

const LiveMap = lazy(() => import("~/components/map/LiveMap"));

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["CROWD_DRIVER", "ADMIN"]);
  
  const [availablePickups, availableDeliveries, stations] = await Promise.all([
    prisma.parcel.findMany({
        where: {
            pickupMethod: "HOME",
            status: "ACCEPTED",
            driverJobs: { none: { type: "FIRST_MILE", status: { not: "CANCELLED" } } }
        },
        include: { originStation: true }
    }),
    prisma.parcel.findMany({
        where: {
            dropoffMethod: "HOME",
            status: "AT_STATION_DEST",
            driverJobs: { none: { type: "LAST_MILE", status: { not: "CANCELLED" } } }
        },
        include: { destinationStation: true }
    }),
    prisma.station.findMany()
  ]);

  return { availablePickups, availableDeliveries, stations };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["CROWD_DRIVER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const parcelId = formData.get("parcelId") as string;

  if (intent === "accept_pickup") {
      await prisma.driverJob.create({
          data: {
              driverId: user.id,
              parcelId,
              type: "FIRST_MILE",
              status: "ACCEPTED",
              acceptedAt: new Date()
          }
      });
  }
  
  if (intent === "accept_delivery") {
      await prisma.driverJob.create({
          data: {
              driverId: user.id,
              parcelId,
              type: "LAST_MILE",
              status: "ACCEPTED",
              acceptedAt: new Date()
          }
      });
       await prisma.parcel.update({
          where: { id: parcelId },
          data: { status: "OUT_FOR_DELIVERY" }
      });
  }

  return null;
}

export default function DriverJobs() {
  const { availablePickups, availableDeliveries, stations } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const points = [
      ...availablePickups.map(p => ({
          lat: p.pickupLat || 0,
          lng: p.pickupLng || 0,
          name: `Pickup: ${p.trackingId}`,
          type: "HOME" as const
      })),
      ...availableDeliveries.map(p => ({
          lat: p.dropoffLat || 0,
          lng: p.dropoffLng || 0,
          name: `Delivery: ${p.trackingId}`,
          type: "HOME" as const
      }))
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Job Board</h1>
        <p className="text-gray-500">Accept new gigs near you.</p>
      </div>

      <Card>
          <CardHeader><CardTitle>Jobs Map</CardTitle></CardHeader>
          <CardContent>
              <ClientOnly fallback={<div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center text-gray-400">Loading Map...</div>}>
                  {() => (
                      <Suspense fallback={<div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md" />}>
                          <LiveMap points={points} stations={stations} />
                      </Suspense>
                  )}
              </ClientOnly>
          </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pickups */}
        <Card>
            <CardHeader>
                <CardTitle>Available Pickups (Home {"->"} Station)</CardTitle>
            </CardHeader>
            <CardContent>
                 {availablePickups.length === 0 ? (
                    <p className="text-sm text-gray-500">No pickups available.</p>
                ) : (
                    <div className="space-y-4">
                        {availablePickups.map(p => (
                             <div key={p.id} className="border p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{p.pickupAddress}</p>
                                    <p className="text-xs text-gray-500">To: {p.originStation?.name}</p>
                                    <p className="text-xs text-blue-600 font-bold">LKR 300 Earn</p>
                                </div>
                                <Form method="post">
                                    <input type="hidden" name="parcelId" value={p.id} />
                                    <Button name="intent" value="accept_pickup" size="sm" variant="secondary" disabled={isSubmitting}>
                                        Accept
                                    </Button>
                                </Form>
                             </div>
                        ))}
                    </div>
                 )}
            </CardContent>
        </Card>

        {/* Deliveries */}
         <Card>
            <CardHeader>
                <CardTitle>Available Deliveries (Station {"->"} Home)</CardTitle>
            </CardHeader>
            <CardContent>
                  {availableDeliveries.length === 0 ? (
                    <p className="text-sm text-gray-500">No deliveries available.</p>
                ) : (
                    <div className="space-y-4">
                        {availableDeliveries.map(p => (
                             <div key={p.id} className="border p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-medium">From: {p.destinationStation?.name}</p>
                                    <p className="text-xs text-gray-500">To: {p.dropoffAddress}</p>
                                    <p className="text-xs text-blue-600 font-bold">LKR 300 Earn</p>
                                </div>
                                <Form method="post">
                                    <input type="hidden" name="parcelId" value={p.id} />
                                    <Button name="intent" value="accept_delivery" size="sm" variant="secondary" disabled={isSubmitting}>
                                        Accept
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