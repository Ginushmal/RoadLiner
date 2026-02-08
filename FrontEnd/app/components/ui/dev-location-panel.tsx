import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ClientOnly } from "remix-utils/client-only";

const MapPicker = lazy(() => import("../map/MapPicker"));

export default function DevLocationPanel({ stations = [] }: { stations?: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showMap, setShowScanner] = useState(false);
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");

    // Load initial values from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("dev_location");
        if (saved) {
            const { lat, lng } = JSON.parse(saved);
            setLat(lat.toString());
            setLng(lng.toString());
        }
    }, []);

    const handleSave = () => {
        if (lat && lng) {
            localStorage.setItem("dev_location", JSON.stringify({ lat: parseFloat(lat), lng: parseFloat(lng) }));
            alert("Mock location updated!");
            // Optional: trigger a page reload to ensure all components see the change immediately
            window.location.reload();
        } else {
            localStorage.removeItem("dev_location");
            alert("Mock location cleared.");
            window.location.reload();
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 text-xs font-bold border-2 border-white"
            >
                DEV GPS
            </button>
        );
    }

    return (
        <div className={`fixed bottom-4 right-4 z-[9999] transition-all duration-300 ${showMap ? 'w-[350px] md:w-[500px]' : 'w-64'}`}>
            <Card className="shadow-2xl border-red-200">
                <CardHeader className="p-3 bg-red-50 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold text-red-800 uppercase tracking-wider">Mock GPS Console</CardTitle>
                    <button onClick={() => { setIsOpen(false); setShowScanner(false); }} className="text-red-800 font-bold hover:bg-red-100 px-2 rounded">&times;</button>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                    
                    {showMap ? (
                        <div className="space-y-3">
                            <ClientOnly fallback={<div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md" />}>
                                {() => (
                                    <Suspense fallback={<div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-md" />}>
                                        <MapPicker 
                                            initialLat={parseFloat(lat) || 6.9271} 
                                            initialLng={parseFloat(lng) || 79.8612}
                                            stations={stations}
                                            onLocationSelect={(lt, ln) => {
                                                setLat(lt.toFixed(6));
                                                setLng(ln.toFixed(6));
                                            }} 
                                        />
                                    </Suspense>
                                )}
                            </ClientOnly>
                            <Button variant="secondary" size="sm" onClick={() => setShowScanner(false)} className="w-full h-7 text-[10px]">
                                Back to Coordinates
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Latitude</label>
                                    <Input 
                                        value={lat} 
                                        onChange={(e) => setLat(e.target.value)} 
                                        placeholder="6.9271" 
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-gray-400">Longitude</label>
                                    <Input 
                                        value={lng} 
                                        onChange={(e) => setLng(e.target.value)} 
                                        placeholder="79.8612" 
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setShowScanner(true)} 
                                className="w-full h-8 text-[10px] border-dashed border-red-200 text-red-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Pick on Map
                            </Button>
                        </>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-red-50">
                        <Button onClick={handleSave} size="sm" className="flex-1 bg-red-600 hover:bg-red-700 h-8 text-xs">Set GPS</Button>
                        <Button onClick={() => { setLat(""); setLng(""); handleSave(); }} size="sm" variant="outline" className="flex-1 h-8 text-xs">Clear</Button>
                    </div>
                    
                    <div className="bg-red-50 p-2 rounded text-[9px] text-red-700 leading-tight border border-red-100">
                        <strong>Live Sync:</strong> All components using GPS will immediately update after clicking "Set".
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}