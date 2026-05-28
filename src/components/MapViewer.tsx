import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's broken default icon paths when bundled with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapViewerProps {
  place: string;
}

const PLACE_COORDS: Record<string, { lat: number; lon: number; zoom: number; label: string }> = {
  nigeria:          { lat: 9.082,    lon: 8.6753,   zoom: 5,  label: 'Nigeria' },
  lagos:            { lat: 6.5244,   lon: 3.3792,   zoom: 11, label: 'Lagos, Nigeria' },
  abuja:            { lat: 9.0765,   lon: 7.3986,   zoom: 11, label: 'Abuja, Nigeria' },
  'port harcourt':  { lat: 4.8156,   lon: 7.0498,   zoom: 11, label: 'Port Harcourt, Nigeria' },
  kano:             { lat: 12.0022,  lon: 8.5920,   zoom: 11, label: 'Kano, Nigeria' },
  benin:            { lat: 6.3350,   lon: 5.6037,   zoom: 11, label: 'Benin City, Nigeria' },
  ibadan:           { lat: 7.3775,   lon: 3.9470,   zoom: 11, label: 'Ibadan, Nigeria' },
  enugu:            { lat: 6.4584,   lon: 7.5464,   zoom: 11, label: 'Enugu, Nigeria' },
  kaduna:           { lat: 10.5264,  lon: 7.4382,   zoom: 11, label: 'Kaduna, Nigeria' },
  africa:           { lat: 1.6508,   lon: 10.2679,  zoom: 3,  label: 'Africa' },
  ghana:            { lat: 7.9465,   lon: -1.0232,  zoom: 6,  label: 'Ghana' },
  kenya:            { lat: -0.0236,  lon: 37.9062,  zoom: 6,  label: 'Kenya' },
  'south africa':   { lat: -30.5595, lon: 22.9375,  zoom: 5,  label: 'South Africa' },
  cameroon:         { lat: 3.848,    lon: 11.5021,  zoom: 6,  label: 'Cameroon' },
  egypt:            { lat: 26.8206,  lon: 30.8025,  zoom: 6,  label: 'Egypt' },
  ethiopia:         { lat: 9.145,    lon: 40.4897,  zoom: 6,  label: 'Ethiopia' },
  senegal:          { lat: 14.4974,  lon: -14.4524, zoom: 6,  label: 'Senegal' },
  world:            { lat: 20,       lon: 0,        zoom: 2,  label: 'World' },
};

function getCoords(place: string) {
  const lower = place.toLowerCase();
  const key = Object.keys(PLACE_COORDS).find(k => lower.includes(k));
  return key ? PLACE_COORDS[key] : PLACE_COORDS['nigeria'];
}

export default function MapViewer({ place }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);
  const coords = getCoords(place);

  useEffect(() => {
    // Small delay to ensure the container is in the DOM and has dimensions
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (mapInstance.current) {
      // Update existing map
      mapInstance.current.setView([coords.lat, coords.lon], coords.zoom);
      return;
    }

    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lon],
      zoom: coords.zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.marker([coords.lat, coords.lon])
      .addTo(map)
      .bindPopup(`<b>${coords.label}</b>`)
      .openPopup();

    // Force tile refresh after mount
    setTimeout(() => map.invalidateSize(), 200);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [ready, coords.lat, coords.lon, coords.zoom, coords.label]);

  return (
    <div className="w-full max-w-[95%] rounded-2xl overflow-hidden border border-[#008751]/20 shadow-sm bg-white">
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center gap-2">
        <span className="text-base">🗺️</span>
        <span className="text-sm font-bold text-[#008751]">{coords.label}</span>
      </div>
      <div ref={mapRef} style={{ height: '300px', width: '100%' }} />
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-[10px] text-gray-400 font-medium">© OpenStreetMap • Pinch to zoom</p>
        <a
          href={`https://www.openstreetmap.org/#map=${coords.zoom}/${coords.lat}/${coords.lon}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-[#008751] font-bold hover:underline"
        >
          Open full map →
        </a>
      </div>
    </div>
  );
}
