import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";
import { Button } from "~/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireRole(request, ["VAN_DRIVER", "ADMIN"]);

  const trips = await prisma.trip.findMany({
    where: { driverId: user.id },
    include: {
      route: {
        include: {
          stops: {
            orderBy: { sequenceOrder: "asc" },
            include: { station: true },
          },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return { trips };
}

export default function VanHistory() {
  const { trips } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">My Trip History</h1>
          <p className="text-sm text-gray-500">
            View your past routes and completion times.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/van">Back to Dashboard</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {trips.length === 0 ? (
          <p className="text-gray-500">No trips recorded yet.</p>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{trip.route.name}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-bold ${
                      trip.endedAt
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {trip.endedAt ? "Completed" : "In Progress"}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Started: {new Date(trip.startedAt).toLocaleString()}
                  {trip.endedAt && (
                    <> • Ended: {new Date(trip.endedAt).toLocaleString()}</>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-semibold mb-2">Stops:</p>
                  <div className="flex flex-wrap gap-2">
                    {trip.route.stops.map((stop, idx) => (
                      <div
                        key={stop.id}
                        className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border"
                      >
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span>{stop.station?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
