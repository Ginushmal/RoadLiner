import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";
import { ProximityButton } from "~/components/ui/proximity-button";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["CROWD_DRIVER", "ADMIN"]);

  // My Active Jobs
  const myJobs = await prisma.driverJob.findMany({
    where: {
        driverId: user.id,
        status: { not: "COMPLETED" }
    },
    include: { 
        parcel: {
            include: { originStation: true, destinationStation: true }
        } 
    }
  });

  return { myJobs };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireRole(request, ["CROWD_DRIVER"]);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const parcelId = formData.get("parcelId") as string;
  const jobId = formData.get("jobId") as string;

  if (intent === "complete_pickup") {
      // Driver picked up from home and dropped at station
      await prisma.driverJob.update({
          where: { id: jobId },
          data: { status: "COMPLETED", completedAt: new Date() }
      });
      await prisma.parcel.update({
          where: { id: parcelId },
          data: { status: "AT_STATION_ORIGIN" }
      });
  }

  if (intent === "complete_delivery") {
      // Driver Delivered to home
       await prisma.driverJob.update({
          where: { id: jobId },
          data: { status: "COMPLETED", completedAt: new Date() }
      });
      await prisma.parcel.update({
          where: { id: parcelId },
          data: { status: "DELIVERED" }
      });
  }

  return null;
}

export default function DriverDashboard() {
  const { myJobs } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Active Tasks</h1>
        <p className="text-gray-500">Manage your current pickups and deliveries.</p>
      </div>

      {/* Active Jobs */}
       <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>Current Tasks</CardTitle>
        </CardHeader>
        <CardContent>
            {myJobs.length === 0 ? (
                <p className="text-sm text-gray-500">No active jobs. Go to "Find New Jobs" to accept work!</p>
            ) : (
                <div className="space-y-4">
                    {myJobs.map(job => {
                        const isFirstMile = job.type === 'FIRST_MILE';
                        // For first mile (Pickup), target is either the home (pickupLat) or the station (to drop off).
                        // Requirement: "only let the driver drop off or pick up when actually came near to the actual locations"
                        // So for FIRST_MILE pickup confirm, they should be at the Station.
                        // Actually, FIRST_MILE has two steps usually: Pickup from Home, then Drop at Station.
                        // In our simplified flow, "Confirm Drop-off at Station" is the completion.
                        // So target is the Station.
                        
                        const targetLat = isFirstMile ? job.parcel.originStation?.latitude : job.parcel.dropoffLat;
                        const targetLng = isFirstMile ? job.parcel.originStation?.longitude : job.parcel.dropoffLng;

                        return (
                            <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <p className="font-bold">{isFirstMile ? "Pickup Task" : "Delivery Task"}</p>
                                    <p className="text-sm text-gray-600">Parcel: {job.parcel.trackingId}</p>
                                    <p className="text-xs text-gray-500">
                                        {isFirstMile ? `From: ${job.parcel.pickupAddress} -> To: ${job.parcel.originStation?.name}` : `From: ${job.parcel.destinationStation?.name} -> To: ${job.parcel.dropoffAddress}`}
                                    </p>
                                    <p className="mt-2 text-sm font-medium text-blue-600">
                                        {isFirstMile ? "Action: Drop-off at Station" : "Action: Deliver to House"}
                                    </p>
                                </div>
                                <ProximityButton 
                                    targetLat={targetLat || null}
                                    targetLng={targetLng || null}
                                    size="sm"
                                    onVerified={() => {
                                        const formData = new FormData();
                                        formData.append("intent", isFirstMile ? "complete_pickup" : "complete_delivery");
                                        formData.append("parcelId", job.parcelId);
                                        formData.append("jobId", job.id);
                                        submit(formData, { method: "post" });
                                    }}
                                    disabled={isSubmitting}
                                >
                                    {isFirstMile ? "Confirm Drop-off at Station" : "Confirm Delivery"}
                                </ProximityButton>
                            </div>
                        );
                    })}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}