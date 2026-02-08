import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["CROWD_DRIVER", "ADMIN"]);

  // My Active Jobs
  const myJobs = await prisma.driverJob.findMany({
    where: {
        driverId: user.id,
        status: { not: "COMPLETED" }
    },
    include: { parcel: true }
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
                    {myJobs.map(job => (
                        <div key={job.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                            <div>
                                <p className="font-bold">{job.type === 'FIRST_MILE' ? "Pickup (Sender -> Station)" : "Delivery (Station -> Receiver)"}</p>
                                <p className="text-sm text-gray-600">Parcel: {job.parcel.trackingId}</p>
                                <p className="text-xs text-gray-500">{job.parcel.pickupAddress || job.parcel.dropoffAddress}</p>
                                <p className="mt-2 text-sm font-medium text-blue-600">
                                    {job.type === 'FIRST_MILE' ? "Deliver to Station" : "Deliver to Home"}
                                </p>
                            </div>
                            <Form method="post">
                                <input type="hidden" name="parcelId" value={job.parcelId} />
                                <input type="hidden" name="jobId" value={job.id} />
                                {job.type === 'FIRST_MILE' ? (
                                    <Button name="intent" value="complete_pickup" size="sm" disabled={isSubmitting}>
                                        Confirm Drop-off at Station
                                    </Button>
                                ) : (
                                    <Button name="intent" value="complete_delivery" size="sm" disabled={isSubmitting}>
                                        Confirm Delivery
                                    </Button>
                                )}
                            </Form>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}