import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/db.server";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ClientOnly } from "remix-utils/client-only";

const LiveMap = lazy(() => import("~/components/map/LiveMap"));

export async function loader({ params }: LoaderFunctionArgs) {
  const [parcel, stations] = await Promise.all([
    prisma.parcel.findUnique({
      where: { trackingId: params.trackingId },
      include: { originStation: true, destinationStation: true }
    }),
    prisma.station.findMany()
  ]);

  if (!parcel) throw new Response("Not Found", { status: 404 });
  
  // Prepare map points
  const points = [];
  if (parcel.originStation) {
      points.push({ lat: parcel.originStation.latitude, lng: parcel.originStation.longitude, name: parcel.originStation.name, type: "STATION" as const });
  } else if (parcel.pickupLat && parcel.pickupLng) {
      points.push({ lat: parcel.pickupLat, lng: parcel.pickupLng, name: "Pickup Location", type: "HOME" as const });
  }

  if (parcel.destinationStation) {
      points.push({ lat: parcel.destinationStation.latitude, lng: parcel.destinationStation.longitude, name: parcel.destinationStation.name, type: "STATION" as const });
  } else if (parcel.dropoffLat && parcel.dropoffLng) {
      points.push({ lat: parcel.dropoffLat, lng: parcel.dropoffLng, name: "Drop-off Location", type: "HOME" as const });
  }

  return { parcel, points, stations };
}

// Haversine distance utility
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const scannedCode = formData.get("scannedCode") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);

  if (intent === "verify_receipt") {
      const parcel = await prisma.parcel.findUnique({
          where: { trackingId: params.trackingId },
          include: { destinationStation: true }
      });
      
      if (!parcel) return { error: "Parcel not found" };

      // 1. Verify Proximity
      const targetLat = parcel.status === "READY_FOR_PICKUP" ? parcel.destinationStation?.latitude : parcel.dropoffLat;
      const targetLng = parcel.status === "READY_FOR_PICKUP" ? parcel.destinationStation?.longitude : parcel.dropoffLng;

      if (targetLat && targetLng && !isNaN(lat) && !isNaN(lng)) {
          const dist = getDistance(lat, lng, targetLat, targetLng);
          if (dist > 0.5) { // 500m
              return { error: `Too far! You must be at the handover point to confirm. (You are ${dist.toFixed(2)}km away)` };
          }
      } else if (targetLat && targetLng && (isNaN(lat) || isNaN(lng))) {
          return { error: "Location data required to confirm receipt." };
      }
      
      // 2. Verify Code
      if (scannedCode === parcel.trackingId) {
          await prisma.parcel.update({
              where: { id: parcel.id },
              data: { status: "DELIVERED" }
          });
          return { success: true };
      } else {
          return { error: "Invalid QR Code. Please scan the label on the parcel." };
      }
  }
  return null;
}

export default function TrackParcel() {
  const { parcel, points, stations } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string, success?: boolean }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showScanner, setShowScanner] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const captureLocationAndSubmit = (code: string) => {
      setLocalError(null);
      
      const submitWithLocation = (lat: number, lng: number) => {
          if (codeInputRef.current && latRef.current && lngRef.current && formRef.current) {
              codeInputRef.current.value = code;
              latRef.current.value = lat.toString();
              lngRef.current.value = lng.toString();
              formRef.current.requestSubmit();
          }
      };

      // Check for mock location first
      const mockLoc = localStorage.getItem("dev_location");
      if (mockLoc) {
          const { lat, lng } = JSON.parse(mockLoc);
          submitWithLocation(lat, lng);
          return;
      }

      if (!navigator.geolocation) {
          setLocalError("Geolocation not supported. Cannot verify proximity.");
          return;
      }

      navigator.geolocation.getCurrentPosition(
          (pos) => submitWithLocation(pos.coords.latitude, pos.coords.longitude),
          (err) => setLocalError("Location access denied. Please enable GPS to confirm receipt."),
          { enableHighAccuracy: true }
      );
  };

  useEffect(() => {
    if (showScanner && parcel.status !== "DELIVERED") {
        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode("reader");
                scannerRef.current = scanner;
                
                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        scanner.stop().then(() => {
                             scannerRef.current = null;
                             setShowScanner(false);
                             captureLocationAndSubmit(decodedText);
                        });
                    },
                    (errorMessage) => {}
                );
            } catch (err) {
                setLocalError("Could not access camera. Please ensure permissions are granted.");
                setShowScanner(false);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current = null;
            }
        };
    }
  }, [showScanner, parcel.status]);

  const steps = [
      { status: "PENDING", label: "Order Created" },
      { status: "ACCEPTED", label: "Accepted / Paid" },
      { status: "PICKED_UP", label: "Picked Up" },
      { status: "AT_STATION_ORIGIN", label: "At Origin Station" },
      { status: "IN_TRANSIT", label: "In Transit" },
      { status: "AT_STATION_DEST", label: "At Dest. Station" },
      { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
      { status: "DELIVERED", label: "Delivered" },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === parcel.status);
  const canConfirm = parcel.status === "OUT_FOR_DELIVERY" || 
                     parcel.status === "READY_FOR_PICKUP" ||
                     (parcel.status === "IN_TRANSIT" && parcel.dropoffMethod === "ON_ROUTE");

  // Mock "live" location of van if in transit
  const currentPosition = parcel.status === "IN_TRANSIT" && points.length >= 2 
    ? { 
        lat: (points[0].lat + points[1].lat) / 2, 
        lng: (points[0].lng + points[1].lng) / 2, 
        name: "RoadLiner Van", 
        type: "VAN" as const 
      } 
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-all">Tracking {parcel.trackingId}</h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 mt-2">
                <p className="text-gray-500">Current Status: <span className="font-bold text-blue-600">{parcel.status}</span></p>
                <div className="flex gap-2">
                    <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600 uppercase font-mono">DB: {parcel.status}</span>
                    <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600 uppercase font-mono">Method: {parcel.dropoffMethod}</span>
                </div>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Live Status Map</CardTitle>
            </CardHeader>
            <CardContent>
                <ClientOnly fallback={<div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center">Loading Map...</div>}>
                    {() => (
                        <Suspense fallback={<div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-md" />}>
                            <LiveMap points={points} currentPosition={currentPosition} stations={stations} />
                        </Suspense>
                    )}
                </ClientOnly>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Shipment Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative border-l-2 border-gray-200 ml-4 space-y-6 pb-2">
                    {steps.map((step, index) => {
                         const isCompleted = index <= currentStepIndex;
                         const isCurrent = index === currentStepIndex;
                         return (
                            <div key={step.status} className="mb-8 ml-6 relative">
                                <span className={`absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${
                                    isCompleted ? "bg-blue-600" : "bg-gray-200"
                                }`}>
                                   {isCompleted && (
                                       <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                       </svg>
                                   )}
                                </span>
                                <h3 className={`font-medium leading-tight text-sm md:text-base ${isCurrent ? "text-blue-600 font-bold" : isCompleted ? "text-gray-900" : "text-gray-400"}`}>{step.label}</h3>
                                {isCurrent && <p className="text-xs md:text-sm text-gray-500">Processing...</p>}
                            </div>
                         );
                    })}
                </div>
            </CardContent>
        </Card>

        {canConfirm && (
             <Card className="border-green-200 bg-green-50">
                <CardHeader>
                    <CardTitle>Confirm Receipt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please scan the QR code on the parcel to verify you have received it.
                    </p>
                    
                    {showScanner ? (
                        <div className="space-y-4">
                            <div id="reader" className="w-full bg-black rounded-lg overflow-hidden min-h-[300px]"></div>
                            <Button variant="secondary" onClick={() => setShowScanner(false)} className="w-full">
                                Stop Camera
                            </Button>
                        </div>
                    ) : (
                         <Button onClick={() => setShowScanner(true)} className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                             Scan QR Code
                         </Button>
                    )}

                    {/* Hidden form to submit the scanned code + location */}
                    <Form method="post" ref={formRef} className="hidden">
                        <input type="hidden" name="intent" value="verify_receipt" />
                        <input type="hidden" name="scannedCode" ref={codeInputRef} />
                        <input type="hidden" name="lat" ref={latRef} />
                        <input type="hidden" name="lng" ref={lngRef} />
                    </Form>

                    {(localError || actionData?.error) && (
                        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{localError || actionData?.error}</span>
                        </div>
                    )}
                    
                    {/* Fallback for testing without camera */}
                    <div className="pt-4 border-t border-green-200">
                        <p className="text-xs text-gray-500 mb-2">Camera issues? Enter manually:</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Input id="manualCode" placeholder="Enter Tracking ID manually" className="bg-white" />
                             <Button 
                                onClick={() => {
                                    const input = document.getElementById('manualCode') as HTMLInputElement;
                                    if (input.value) captureLocationAndSubmit(input.value);
                                }}
                                size="sm" 
                                variant="secondary" 
                                className="w-full sm:w-auto"
                                disabled={isSubmitting}
                             >
                                 {isSubmitting ? "Verifying..." : "Verify ID"}
                             </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
