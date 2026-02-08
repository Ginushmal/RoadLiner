import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Icons
const stationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const homeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const vanIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

type Point = {
    lat: number;
    lng: number;
    name: string;
    type: "STATION" | "HOME" | "VAN";
};

export default function LiveMap({ points, currentPosition, stations = [] }: { points: Point[], currentPosition?: Point, stations?: any[] }) {
  const [mockUserPos, setMockUserPos] = useState<[number, number] | null>(null);

  useEffect(() => {
      const saved = localStorage.getItem("dev_location");
      if (saved) {
          const { lat, lng } = JSON.parse(saved);
          setMockUserPos([lat, lng]);
      }
  }, []);

  // Calculate center
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);
  const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length || 6.9271;
  const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length || 79.8612;

  const polylinePositions = points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="h-[400px] w-full rounded-md overflow-hidden border border-gray-300">
      <MapContainer center={[centerLat, centerLng]} zoom={8} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {stations.map(s => {
            // Don't render if already in points (to avoid double markers/popups)
            if (points.some(p => p.type === 'STATION' && p.lat === s.latitude && p.lng === s.longitude)) return null;
            
            return (
                <Marker 
                    key={`station-${s.id}`} 
                    position={[s.latitude, s.longitude]} 
                    icon={stationIcon} 
                    opacity={0.6} // Make background stations slightly faded
                >
                    <Popup>{s.name} (Hub)</Popup>
                </Marker>
            );
        })}
        
        {points.map((p, idx) => (
            <Marker 
                key={idx} 
                position={[p.lat, p.lng]} 
                icon={p.type === "STATION" ? stationIcon : homeIcon}
            >
                <Popup>{p.name}</Popup>
            </Marker>
        ))}

        {currentPosition && (
             <Marker 
                position={[currentPosition.lat, currentPosition.lng]} 
                icon={vanIcon}
            >
                <Popup>Current Location: {currentPosition.name}</Popup>
            </Marker>
        )}

        {mockUserPos && (
             <Marker 
                position={mockUserPos} 
                icon={userIcon}
            >
                <Popup>Your Mocked Location (Dev)</Popup>
            </Marker>
        )}

        <Polyline positions={polylinePositions} color="blue" />
      </MapContainer>
    </div>
  );
}
