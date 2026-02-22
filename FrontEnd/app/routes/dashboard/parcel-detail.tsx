import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation, Link } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";
import QRCode from "react-qr-code";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUser(request);
  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
    include: { originStation: true, destinationStation: true, sender: true, receiver: true }
  });

  if (!parcel) throw new Response("Not Found", { status: 404 });

  // Determine base URL dynamically
  const url = new URL(request.url);
  const host = request.headers.get("X-Forwarded-Host") || url.host;
  const proto = request.headers.get("X-Forwarded-Proto") || (url.protocol.replace(":", ""));
  const baseUrl = process.env.BASE_URL || `${proto}://${host}`;

  return { parcel, userId, baseUrl };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "pay") {
    // Mock Payment
    await new Promise(r => setTimeout(r, 1000));
    await prisma.parcel.update({
        where: { id: params.id },
        data: { isPaid: true, status: "ACCEPTED" } // Assume accepted after payment for now
    });
  }

  if (intent === "confirm_dropoff") {
      await prisma.parcel.update({
          where: { id: params.id },
          data: { status: "AT_STATION_ORIGIN" }
      });
  }

  return null;
}

export default function ParcelDetail() {
  const { parcel, userId, baseUrl } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isPaying = navigation.state === "submitting" && navigation.formData?.get("intent") === "pay";
  const [copied, setCopied] = useState(false);

  const isReceiver = parcel.receiverId === userId;

  const trackingUrl = `${baseUrl}/track/${parcel.trackingId}`;

  const copyToClipboard = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold break-all">Shipment {parcel.trackingId}</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {isReceiver && parcel.status !== 'DELIVERED' && (
                <Link to={`/track/${parcel.trackingId}`} className="w-full sm:w-auto">
                    <Button variant="secondary" size="sm" className="w-full">Track & Confirm Receipt</Button>
                </Link>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-center ${
                parcel.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                parcel.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
            }`}>
                {parcel.status}
            </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Description</span>
                        <span>{parcel.description}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Size / Weight</span>
                        <span>{parcel.size} / {parcel.weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Price</span>
                        <span className="font-bold">LKR {parcel.price}</span>
                    </div>
                     <div className="flex flex-col gap-4 mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Logistics Status</span>
                            <span className="text-sm font-medium">{parcel.status}</span>
                        </div>
                        
                        {parcel.isPaid && parcel.pickupMethod === "STATION" && parcel.status === "ACCEPTED" && (
                             <Form method="post" className="w-full">
                                <Button name="intent" value="confirm_dropoff" size="sm" variant="outline" className="w-full h-auto py-3 whitespace-normal text-left sm:text-center">
                                    I've Dropped it off at Station
                                </Button>
                            </Form>
                        )}
                    </div>
                     <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="text-gray-500">Payment Status</span>
                        {parcel.isPaid ? (
                            <span className="text-green-600 font-bold">PAID</span>
                        ) : (
                            <Form method="post" className="w-full sm:w-auto">
                                <Button name="intent" value="pay" size="sm" disabled={isPaying} className="w-full sm:w-auto">
                                    {isPaying ? "Processing..." : "Pay Now"}
                                </Button>
                            </Form>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Route</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <p className="text-xs text-gray-500 uppercase">From ({parcel.pickupMethod})</p>
                        <p className="font-medium">
                            {parcel.originStation?.name || parcel.pickupAddress || "N/A"}
                        </p>
                     </div>
                     <div className="border-l-2 border-dashed border-gray-300 ml-1 h-6"></div>
                     <div>
                        <p className="text-xs text-gray-500 uppercase">To ({parcel.dropoffMethod})</p>
                        <p className="font-medium">
                             {parcel.destinationStation?.name || parcel.dropoffAddress || "N/A"}
                        </p>
                     </div>
                </CardContent>
            </Card>

            {!parcel.receiverId && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Share with Guest Receiver</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-blue-700">
                    The receiver does not have an account. Share this tracking link with them so they can track the parcel and confirm receipt.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      readOnly 
                      value={trackingUrl} 
                      className="flex-1 bg-white border border-blue-200 rounded-md px-3 py-2 text-xs font-mono w-full"
                    />
                    <Button size="sm" onClick={copyToClipboard} className="w-full sm:w-auto">
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>QR Code (Label)</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <div className="bg-white p-4 border rounded">
                        <QRCode value={parcel.trackingId} size={150} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`} />
                    </div>
                    <p className="text-sm text-center text-gray-500">
                        Print and attach this to the parcel.
                        <br/>
                        Tracking ID: <span className="font-mono font-bold break-all">{parcel.trackingId}</span>
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Receiver Info</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="font-medium">{parcel.receiver?.name || parcel.guestReceiverName}</p>
                    <p className="text-sm text-gray-500 break-all">{parcel.receiver?.email || parcel.guestReceiverEmail}</p>
                    {!parcel.receiverId && (
                      <span className="mt-2 inline-block px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600 uppercase">
                        Guest User
                      </span>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}