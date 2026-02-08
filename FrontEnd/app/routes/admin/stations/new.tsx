import { type ActionFunctionArgs, type LoaderFunctionArgs, Form, useLoaderData, useNavigation, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";
import { ClientOnly } from "remix-utils/client-only";
import { lazy, Suspense, useState } from "react";

const MapPicker = lazy(() => import("~/components/map/MapPicker"));

export async function loader({ request }: LoaderFunctionArgs) {
  await requireRole(request, ["ADMIN"]);
  const stations = await prisma.station.findMany();
  return { stations };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireRole(request, ["ADMIN"]);
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const city = formData.get("city") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);

  await prisma.station.create({
      data: { name, city, latitude, longitude }
  });

  return redirect("/admin");
}

export default function NewStation() {
  const { stations } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create New Station</h1>
      
      <Form method="post" className="space-y-6">
        <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Pin Station on Map</label>
                    <ClientOnly fallback={<div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md" />}>
                        {() => (
                            <Suspense fallback={<div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md" />}>
                                <MapPicker 
                                    stations={stations}
                                    onLocationSelect={(lat, lng) => setCoords({lat, lng})} 
                                />
                            </Suspense>
                        )}
                    </ClientOnly>
                    <input type="hidden" name="latitude" value={coords?.lat || ""} />
                    <input type="hidden" name="longitude" value={coords?.lng || ""} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Station Name</label>
                        <Input name="name" placeholder="e.g. Colombo Central Hub" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">City</label>
                        <Input name="city" placeholder="e.g. Colombo" required />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting || !coords}>
                {isSubmitting ? "Creating..." : "Create Station"}
            </Button>
        </div>
      </Form>
    </div>
  );
}
