import { type ActionFunctionArgs, type LoaderFunctionArgs, Form, useLoaderData, useNavigation, redirect, useSubmit } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireRole } from "~/auth.server";
import { prisma } from "~/db.server";
import { useState } from "react";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireRole(request, ["ADMIN"]);
  const stations = await prisma.station.findMany();
  return { stations };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireRole(request, ["ADMIN"]);
  const formData = await request.formData();
  
  const name = formData.get("name") as string;
  const stopsJson = formData.get("stops") as string;
  const stops = JSON.parse(stopsJson) as string[];

  if (stops.length < 2) return { error: "Route must have at least 2 stops" };

  await prisma.route.create({
      data: {
          name,
          stops: {
              create: stops.map((stationId, index) => ({
                  stationId,
                  sequenceOrder: index + 1
              }))
          }
      }
  });

  return redirect("/admin");
}

function SortableStop({ id, index, stationName, onRemove }: { id: string, index: number, stationName: string, onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border mb-2 touch-none">
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 p-1 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
        </div>
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{index + 1}</span>
        <span>{stationName}</span>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-500 hover:text-red-700">
        Remove
      </Button>
    </div>
  );
}

export default function NewRoute() {
  const { stations } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const [selectedStops, setSelectedStops] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setSelectedStops((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addStop = (stationId: string) => {
      if (stationId && !selectedStops.includes(stationId)) {
          setSelectedStops([...selectedStops, stationId]);
      }
  };

  const removeStop = (stationId: string) => {
      setSelectedStops(selectedStops.filter(id => id !== stationId));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      formData.set("stops", JSON.stringify(selectedStops));
      submit(formData, { method: "post" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Create New Route</h1>
      
      <Form method="post" onSubmit={handleSubmit} className="space-y-6">
        <Card>
            <CardHeader><CardTitle>Route Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Route Name</label>
                    <Input name="name" placeholder="e.g. Southern Expressway (Colombo - Matara)" required />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Stops Sequence (Drag to Reorder)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <select 
                        id="stationSelect" 
                        className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm"
                    >
                        <option value="">Select a Station...</option>
                        {stations.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
                    </select>
                    <Button type="button" onClick={() => {
                        const select = document.getElementById("stationSelect") as HTMLSelectElement;
                        addStop(select.value);
                        select.value = "";
                    }}>Add Stop</Button>
                </div>

                <div className="border rounded-md p-4 bg-gray-50 min-h-[100px]">
                    {selectedStops.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center italic mt-4">No stops added yet.</p>
                    ) : (
                        <DndContext 
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext 
                                items={selectedStops}
                                strategy={verticalListSortingStrategy}
                            >
                                {selectedStops.map((stopId, index) => {
                                    const station = stations.find(s => s.id === stopId);
                                    return (
                                        <SortableStop 
                                            key={stopId}
                                            id={stopId}
                                            index={index}
                                            stationName={station?.name || "Unknown Station"}
                                            onRemove={() => removeStop(stopId)}
                                        />
                                    );
                                })}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting || selectedStops.length < 2}>
                {isSubmitting ? "Creating..." : "Save Route"}
            </Button>
        </div>
      </Form>
    </div>
  );
}