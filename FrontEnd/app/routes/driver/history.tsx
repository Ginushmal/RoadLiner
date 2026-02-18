import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";
import { Button } from "~/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["CROWD_DRIVER", "ADMIN"]);

  const completedJobs = await prisma.driverJob.findMany({
    where: {
      driverId: user.id,
      status: "COMPLETED",
    },
    include: {
      parcel: {
        include: {
          originStation: true,
          destinationStation: true,
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  return { completedJobs };
}

export default function DriverHistory() {
  const { completedJobs } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Delivery History</h1>
          <p className="text-sm text-gray-500">
            View your completed pickups and deliveries.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/driver">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {completedJobs.length === 0 ? (
          <p className="text-gray-500">No completed jobs yet.</p>
        ) : (
          completedJobs.map((job) => {
            const isFirstMile = job.type === "FIRST_MILE";
            return (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">
                      {isFirstMile ? "Pickup Task" : "Delivery Task"}
                    </CardTitle>
                    <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">
                      Completed
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Completed:{" "}
                    {job.completedAt
                      ? new Date(job.completedAt).toLocaleString()
                      : "Unknown"}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="font-semibold">Parcel:</span>{" "}
                      {job.parcel.trackingId}
                    </p>
                    <p className="text-gray-600">
                      {isFirstMile
                        ? `From: ${job.parcel.pickupAddress} -> To: ${job.parcel.originStation?.name}`
                        : `From: ${job.parcel.destinationStation?.name} -> To: ${job.parcel.dropoffAddress}`}
                    </p>
                    <p className="text-xs text-gray-400">Job ID: {job.id}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
