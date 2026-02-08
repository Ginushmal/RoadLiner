import { type LoaderFunctionArgs, Link, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const sentParcels = await prisma.parcel.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    include: { originStation: true, destinationStation: true },
  });

  const receivedParcels = await prisma.parcel.findMany({
    where: { receiverId: userId },
    orderBy: { createdAt: "desc" },
    include: { originStation: true, destinationStation: true },
  });

  return { user, sentParcels, receivedParcels };
}

export default function DashboardOverview() {
  const { user, sentParcels, receivedParcels } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link to="/send">
            <Button>Send New Parcel</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentParcels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{receivedParcels.length}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Active Shipments</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">
                 {sentParcels.filter(p => p.status !== 'DELIVERED' && p.status !== 'CANCELLED').length}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Sent Parcels</CardTitle>
            </CardHeader>
            <CardContent>
                {sentParcels.length === 0 ? (
                    <p className="text-sm text-gray-500">No parcels sent yet.</p>
                ) : (
                    <div className="space-y-4">
                        {sentParcels.map(parcel => (
                            <div key={parcel.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-sm">{parcel.trackingId}</p>
                                    <p className="text-xs text-gray-500">{new Date(parcel.createdAt).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-500">To: {parcel.dropoffMethod}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{parcel.status}</p>
                                    <Link to={`/parcels/${parcel.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Incoming Parcels</CardTitle>
            </CardHeader>
            <CardContent>
                 {receivedParcels.length === 0 ? (
                    <p className="text-sm text-gray-500">No parcels received yet.</p>
                ) : (
                    <div className="space-y-4">
                        {receivedParcels.map(parcel => (
                            <div key={parcel.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                 <div>
                                    <p className="font-medium text-sm">{parcel.trackingId}</p>
                                    <p className="text-xs text-gray-500">{new Date(parcel.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{parcel.status}</p>
                                    <div className="flex flex-col sm:flex-row gap-2 justify-end mt-1">
                                        <Link to={`/track/${parcel.trackingId}`} className="text-xs text-blue-600 font-bold hover:underline py-1 sm:py-0">Track & Confirm</Link>
                                        <Link to={`/parcels/${parcel.id}`} className="text-xs text-gray-500 hover:underline py-1 sm:py-0">Details</Link>
                                    </div>
                                </div>
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
