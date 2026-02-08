import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const stationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function MapPicker({ 
    initialLat = 6.9271, 
    initialLng = 79.8612, 
    stations = [],
    onLocationSelect 
}: { 
    initialLat?: number, 
    initialLng?: number, 
    stations?: any[],
    onLocationSelect: (lat: number, lng: number) => void 
}) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
      if (position) {
          onLocationSelect(position[0], position[1]);
      }
  }, [position]);

  return (
    <div className="h-[300px] w-full rounded-md overflow-hidden border border-gray-300">
      <MapContainer center={[initialLat, initialLng]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} />
        {stations.map(s => (
            <Marker 
                key={s.id} 
                position={[s.latitude, s.longitude]} 
                icon={stationIcon} 
                title={s.name}
            />
        ))}
      </MapContainer>
      <div className="mt-2 text-xs text-gray-500">
          {position ? `Selected: ${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : "Click on the map to pin location"}
      </div>
    </div>
  );
}
