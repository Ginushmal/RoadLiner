import { type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, Form, useNavigation } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { prisma } from "~/db.server";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export async function loader({ params }: LoaderFunctionArgs) {
  const parcel = await prisma.parcel.findUnique({
    where: { trackingId: params.trackingId },
    include: { originStation: true, destinationStation: true }
  });

  if (!parcel) throw new Response("Not Found", { status: 404 });
  return { parcel };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const scannedCode = formData.get("scannedCode") as string;

  if (intent === "verify_receipt") {
      const parcel = await prisma.parcel.findUnique({
          where: { trackingId: params.trackingId }
      });
      
      if (!parcel) return { error: "Parcel not found" };
      
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
  const { parcel } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
                        // Success
                        scanner.stop().then(() => {
                             scannerRef.current = null;
                             setShowScanner(false);
                             if (codeInputRef.current && formRef.current) {
                                 codeInputRef.current.value = decodedText;
                                 formRef.current.requestSubmit();
                             }
                        });
                    },
                    (errorMessage) => {
                        // Ignore frame errors
                    }
                );
            } catch (err) {
                console.error("Error starting scanner", err);
                setScanError("Could not access camera. Please ensure permissions are granted.");
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

                    {/* Hidden form to submit the scanned code */}
                    <Form method="post" ref={formRef} className="hidden">
                        <input type="hidden" name="intent" value="verify_receipt" />
                        <input type="hidden" name="scannedCode" ref={codeInputRef} />
                    </Form>

                    {scanError && (
                        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{scanError}</span>
                        </div>
                    )}
                    
                    {/* Fallback for testing without camera */}
                    <div className="pt-4 border-t border-green-200">
                        <p className="text-xs text-gray-500 mb-2">Camera issues? Enter manually:</p>
                        <Form method="post" className="flex flex-col sm:flex-row gap-2">
                             <Input name="scannedCode" placeholder="Enter Tracking ID manually" required className="bg-white" />
                             <Button name="intent" value="verify_receipt" size="sm" variant="secondary" className="w-full sm:w-auto">Verify ID</Button>
                        </Form>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
