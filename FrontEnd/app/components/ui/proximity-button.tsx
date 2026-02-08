import { useState } from "react";
import { Button, type ButtonProps } from "../ui/button";

interface ProximityButtonProps extends ButtonProps {
    targetLat: number | null;
    targetLng: number | null;
    onVerified: () => void;
    thresholdKm?: number;
}

export function ProximityButton({ 
    targetLat, 
    targetLng, 
    onVerified, 
    thresholdKm = 0.5, // 500 meters
    children,
    ...props 
}: ProximityButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkProximity = () => {
        if (!targetLat || !targetLng) {
            onVerified();
            return;
        }

        setLoading(true);
        setError(null);

        // Check for mock location first
        const mockLoc = localStorage.getItem("dev_location");
        if (mockLoc) {
            const { lat, lng } = JSON.parse(mockLoc);
            const dist = getDistance(lat, lng, targetLat, targetLng);
            if (dist <= thresholdKm) {
                onVerified();
            } else {
                setError(`(MOCK) Too far! You are ${(dist).toFixed(2)}km away. Need to be within ${thresholdKm * 1000}m.`);
            }
            setLoading(false);
            return;
        }

        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const dist = getDistance(
                    pos.coords.latitude, 
                    pos.coords.longitude, 
                    targetLat, 
                    targetLng
                );

                if (dist <= thresholdKm) {
                    onVerified();
                } else {
                    setError(`Too far! You are ${(dist).toFixed(2)}km away. Need to be within ${thresholdKm * 1000}m.`);
                }
                setLoading(false);
            },
            (err) => {
                setError("Location access denied.");
                setLoading(false);
            }
        );
    };

    function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    return (
        <div className="flex flex-col gap-1 items-end">
            <Button 
                {...props} 
                onClick={(e) => {
                    e.preventDefault();
                    checkProximity();
                }}
                disabled={loading || props.disabled}
            >
                {loading ? "Checking Location..." : children}
            </Button>
            {error && <p className="text-[10px] text-red-500 font-medium max-w-[200px] text-right">{error}</p>}
            <p className="text-[9px] text-gray-400 italic">Proximity check required (500m)</p>
        </div>
    );
}
