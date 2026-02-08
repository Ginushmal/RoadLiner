import { useState } from "react";
import { type ActionFunctionArgs, type LoaderFunctionArgs, Form, useLoaderData, useNavigation, useActionData, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireUser } from "~/auth.server";
import { prisma } from "~/db.server";
import type { ParcelSize, DeliveryMethod } from "@prisma/client";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);
  const stations = await prisma.station.findMany();
  return { stations };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUser(request);
  const formData = await request.formData();
  
  const size = formData.get("size") as ParcelSize;
  const weight = parseFloat(formData.get("weight") as string);
  const description = formData.get("description") as string;
  
  const pickupMethod = formData.get("pickupMethod") as DeliveryMethod;
  const originStationId = formData.get("originStationId") as string;
  const pickupAddress = formData.get("pickupAddress") as string;

  const dropoffMethod = formData.get("dropoffMethod") as DeliveryMethod;
  const destinationStationId = formData.get("destinationStationId") as string;
  const dropoffAddress = formData.get("dropoffAddress") as string;
  
  const receiverEmail = formData.get("receiverEmail") as string;
  const receiverName = formData.get("receiverName") as string;

  // Calculate Price (Mock)
  let price = 200; // Base
  if (size === "MEDIUM") price += 100;
  if (size === "LARGE") price += 200;
  price += weight * 50;
  
  // Add distance logic here if we had coordinates from address
  // For now, flat rate for delivery type
  if (pickupMethod === "HOME") price += 300;
  if (dropoffMethod === "HOME") price += 300;
  if (pickupMethod === "ON_ROUTE") price += 150;
  
  // Create Parcel
  // Check if receiver exists
  let receiverId = null;
  if (receiverEmail) {
      const receiver = await prisma.user.findUnique({ where: { email: receiverEmail } });
      if (receiver) receiverId = receiver.id;
  }

  const trackingId = "RL-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  const parcel = await prisma.parcel.create({
    data: {
        trackingId,
        size,
        weight,
        description,
        senderId: userId,
        receiverId,
        guestReceiverName: !receiverId ? receiverName : undefined,
        guestReceiverEmail: !receiverId ? receiverEmail : undefined,
        
        pickupMethod,
        originStationId: originStationId || null,
        pickupAddress: pickupAddress || null,
        
        dropoffMethod,
        destinationStationId: destinationStationId || null,
        dropoffAddress: dropoffAddress || null,
        
        price,
        status: "PENDING"
    }
  });

  return redirect(`/parcels/${parcel.id}`);
}

export default function SendParcel() {
  const { stations } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [pickupMethod, setPickupMethod] = useState<DeliveryMethod>("STATION");
  const [dropoffMethod, setDropoffMethod] = useState<DeliveryMethod>("STATION");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Send a Parcel</h1>
        <p className="text-gray-500">Fill in the details to schedule your shipment.</p>
      </div>
      
      <Form method="post" className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Parcel Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Size</label>
                        <select name="size" className="w-full flex h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm">
                            <option value="SMALL">Small (Shoebox)</option>
                            <option value="MEDIUM">Medium (Microwave)</option>
                            <option value="LARGE">Large (Suitcase)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <Input name="weight" type="number" step="0.1" required placeholder="1.5" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input name="description" placeholder="Books, Clothes, etc." />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Pickup (Origin)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Pickup Method</label>
                     <select 
                        name="pickupMethod" 
                        value={pickupMethod}
                        onChange={(e) => setPickupMethod(e.target.value as any)}
                        className="w-full flex h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                        <option value="STATION">Drop off at Station</option>
                        <option value="HOME">Home Pickup (+ LKR 300)</option>
                        <option value="ON_ROUTE">On-Route Handover (+ LKR 150)</option>
                    </select>
                </div>
                
                {pickupMethod === "STATION" && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Origin Station</label>
                        <select name="originStationId" className="w-full flex h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm">
                            {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                        </select>
                    </div>
                )}
                
                {(pickupMethod === "HOME" || pickupMethod === "ON_ROUTE") && (
                    <div className="space-y-2">
                         <label className="text-sm font-medium">Address / Location</label>
                         <Input name="pickupAddress" placeholder="123 Main St, Colombo" required />
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Delivery (Destination)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Dropoff Method</label>
                     <select 
                        name="dropoffMethod" 
                        value={dropoffMethod}
                        onChange={(e) => setDropoffMethod(e.target.value as any)}
                        className="w-full flex h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                        <option value="STATION">Collect from Station</option>
                        <option value="HOME">Home Delivery (+ LKR 300)</option>
                        <option value="ON_ROUTE">On-Route Collect (+ LKR 150)</option>
                    </select>
                </div>
                
                 {dropoffMethod === "STATION" && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Destination Station</label>
                        <select name="destinationStationId" className="w-full flex h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm">
                            {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                        </select>
                    </div>
                )}

                 {(dropoffMethod === "HOME" || dropoffMethod === "ON_ROUTE") && (
                    <div className="space-y-2">
                         <label className="text-sm font-medium">Address / Location</label>
                         <Input name="dropoffAddress" placeholder="456 Beach Rd, Galle" required />
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Receiver Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input name="receiverName" placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email (Optional)</label>
                        <Input name="receiverEmail" type="email" placeholder="jane@example.com" />
                        <p className="text-xs text-gray-500">If registered, we'll link it to their account.</p>
                    </div>
                 </div>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Shipment"}
            </Button>
        </div>
      </Form>
    </div>
  );
}
