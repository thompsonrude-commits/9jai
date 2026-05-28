/**
 * InteractiveMap — Full-featured map powered by OpenStreetMap + Leaflet + Nominatim
 * Features:
 * - Search any location worldwide
 * - Show directions between two points
 * - Display nearby places
 * - Geocode addresses to coordinates
 * - Reverse geocode coordinates to addresses
 * No API key needed — 100% free
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Navigation, MapPin, Loader2, ExternalLink, X } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Nominatim geocoding (free, no key) ────────────────────────────────────
async function geocode(query: string): Promise<{ lat: number; lon: number; display_name: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': '9jai-app' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name };
  } catch { return null; }
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': '9jai-app' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch { return `${lat.toFixed(4)}, ${lon.toFixed(4)}`; }
}

// ── Known Nigerian places ─────────────────────────────────────────────────
const KNOWN_PLACES: Record<string, { lat: number; lon: number; zoom: number; label: string }> = {
  nigeria:           { lat: 9.082,    lon: 8.6753,   zoom: 6,  label: 'Nigeria' },
  lagos:             { lat: 6.5244,   lon: 3.3792,   zoom: 12, label: 'Lagos' },
  abuja:             { lat: 9.0765,   lon: 7.3986,   zoom: 12, label: 'Abuja (FCT)' },
  'port harcourt':   { lat: 4.8156,   lon: 7.0498,   zoom: 12, label: 'Port Harcourt' },
  kano:              { lat: 12.0022,  lon: 8.5920,   zoom: 12, label: 'Kano' },
  'benin city':      { lat: 6.3350,   lon: 5.6037,   zoom: 12, label: 'Benin City' },
  benin:             { lat: 6.3350,   lon: 5.6037,   zoom: 12, label: 'Benin City' },
  ibadan:            { lat: 7.3775,   lon: 3.9470,   zoom: 12, label: 'Ibadan' },
  enugu:             { lat: 6.4584,   lon: 7.5464,   zoom: 12, label: 'Enugu' },
  kaduna:            { lat: 10.5264,  lon: 7.4382,   zoom: 12, label: 'Kaduna' },
  owerri:            { lat: 5.4836,   lon: 7.0333,   zoom: 12, label: 'Owerri' },
  calabar:           { lat: 4.9500,   lon: 8.3167,   zoom: 12, label: 'Calabar' },
  warri:             { lat: 5.5167,   lon: 5.7500,   zoom: 12, label: 'Warri' },
  maiduguri:         { lat: 11.8333,  lon: 13.1500,  zoom: 12, label: 'Maiduguri' },
  sokoto:            { lat: 13.0667,  lon: 5.2333,   zoom: 12, label: 'Sokoto' },
  jos:               { lat: 9.9167,   lon: 8.8833,   zoom: 12, label: 'Jos' },
  ilorin:            { lat: 8.5000,   lon: 4.5500,   zoom: 12, label: 'Ilorin' },
  abeokuta:          { lat: 7.1500,   lon: 3.3500,   zoom: 12, label: 'Abeokuta' },
  akure:             { lat: 7.2500,   lon: 5.1833,   zoom: 12, label: 'Akure' },
  africa:            { lat: 1.6508,   lon: 10.2679,  zoom: 3,  label: 'Africa' },
  ghana:             { lat: 7.9465,   lon: -1.0232,  zoom: 7,  label: 'Ghana' },
  kenya:             { lat: -0.0236,  lon: 37.9062,  zoom: 7,  label: 'Kenya' },
  'south africa':    { lat: -30.5595, lon: 22.9375,  zoom: 6,  label: 'South Africa' },
  cameroon:          { lat: 3.848,    lon: 11.5021,  zoom: 7,  label: 'Cameroon' },
  egypt:             { lat: 26.8206,  lon: 30.8025,  zoom: 7,  label: 'Egypt' },
  world:             { lat: 20,       lon: 0,        zoom: 2,  label: 'World' },
};

function getKnownPlace(query: string) {
  const lower = query.toLowerCase().trim();
  return Object.entries(KNOWN_PLACES).find(([k]) => lower.includes(k))?.[1] || null;
}

interface InteractiveMapProps {
  initialQuery?: string;
  mode?: 'search' | 'directions';
  from?: string;
  to?: string;
}

export default function InteractiveMap({ initialQuery = 'Nigeria', mode = 'search', from, to }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [fromQuery, setFromQuery] = useState(from || '');
  const [toQuery, setToQuery] = useState(to || '');
  const [status, setStatus] = useState<'loading' | 'ready' | 'searching' | 'error'>('loading');
  const [locationInfo, setLocationInfo] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'search' | 'directions'>(mode);

  // ── Initialize map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [9.082, 8.6753],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Click to get location info
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      const name = await reverseGeocode(lat, lng);
      setLocationInfo(name);
      clearMarkers();
      const marker = L.marker([lat, lng]).addTo(map).bindPopup(name.split(',').slice(0, 3).join(',')).openPopup();
      markersRef.current.push(marker);
    });

    setTimeout(() => { map.invalidateSize(); setStatus('ready'); }, 200);
    mapInstance.current = map;

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (routeRef.current) { routeRef.current.remove(); routeRef.current = null; }
  }, []);

  // ── Search a location ─────────────────────────────────────────────────────
  const searchLocation = useCallback(async (query: string) => {
    if (!mapInstance.current || !query.trim()) return;
    setStatus('searching');
    clearMarkers();

    // Try known places first (instant)
    const known = getKnownPlace(query);
    if (known) {
      mapInstance.current.setView([known.lat, known.lon], known.zoom);
      const marker = L.marker([known.lat, known.lon])
        .addTo(mapInstance.current)
        .bindPopup(`<b>${known.label}</b>`)
        .openPopup();
      markersRef.current.push(marker);
      setLocationInfo(known.label);
      setStatus('ready');
      return;
    }

    // Geocode via Nominatim
    const result = await geocode(query);
    if (!result) {
      setStatus('error');
      setLocationInfo(`Location "${query}" not found`);
      return;
    }

    mapInstance.current.setView([result.lat, result.lon], 13);
    const marker = L.marker([result.lat, result.lon])
      .addTo(mapInstance.current)
      .bindPopup(`<b>${result.display_name.split(',').slice(0, 3).join(',')}</b>`)
      .openPopup();
    markersRef.current.push(marker);
    setLocationInfo(result.display_name);
    setStatus('ready');
  }, [clearMarkers]);

  // ── Show directions between two points ────────────────────────────────────
  const showDirections = useCallback(async (fromPlace: string, toPlace: string) => {
    if (!mapInstance.current || !fromPlace.trim() || !toPlace.trim()) return;
    setStatus('searching');
    clearMarkers();

    const [fromResult, toResult] = await Promise.all([
      getKnownPlace(fromPlace) ? Promise.resolve({ lat: getKnownPlace(fromPlace)!.lat, lon: getKnownPlace(fromPlace)!.lon, display_name: getKnownPlace(fromPlace)!.label }) : geocode(fromPlace),
      getKnownPlace(toPlace) ? Promise.resolve({ lat: getKnownPlace(toPlace)!.lat, lon: getKnownPlace(toPlace)!.lon, display_name: getKnownPlace(toPlace)!.label }) : geocode(toPlace),
    ]);

    if (!fromResult || !toResult) {
      setStatus('error');
      setLocationInfo('Could not find one or both locations');
      return;
    }

    // Draw markers
    const fromMarker = L.marker([fromResult.lat, fromResult.lon], {
      icon: L.divIcon({ className: '', html: '<div style="background:#008751;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">FROM</div>' })
    }).addTo(mapInstance.current).bindPopup(`<b>From:</b> ${fromResult.display_name.split(',')[0]}`).openPopup();

    const toMarker = L.marker([toResult.lat, toResult.lon], {
      icon: L.divIcon({ className: '', html: '<div style="background:#c0392b;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">TO</div>' })
    }).addTo(mapInstance.current).bindPopup(`<b>To:</b> ${toResult.display_name.split(',')[0]}`);

    markersRef.current.push(fromMarker, toMarker);

    // Draw route line
    const route = L.polyline(
      [[fromResult.lat, fromResult.lon], [toResult.lat, toResult.lon]],
      { color: '#008751', weight: 4, opacity: 0.8, dashArray: '10, 5' }
    ).addTo(mapInstance.current);
    routeRef.current = route;

    // Fit both points in view
    mapInstance.current.fitBounds([[fromResult.lat, fromResult.lon], [toResult.lat, toResult.lon]], { padding: [40, 40] });

    // Calculate approximate distance
    const R = 6371;
    const dLat = (toResult.lat - fromResult.lat) * Math.PI / 180;
    const dLon = (toResult.lon - fromResult.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(fromResult.lat * Math.PI/180) * Math.cos(toResult.lat * Math.PI/180) * Math.sin(dLon/2)**2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    setLocationInfo(`${fromResult.display_name.split(',')[0]} → ${toResult.display_name.split(',')[0]} • ~${Math.round(dist)} km`);
    setStatus('ready');
  }, [clearMarkers]);

  // Auto-search on mount
  useEffect(() => {
    if (status === 'ready') {
      if (activeMode === 'directions' && from && to) {
        showDirections(from, to);
      } else {
        searchLocation(initialQuery);
      }
    }
  }, [status]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchLocation(searchQuery);
  };

  const handleDirections = (e: React.FormEvent) => {
    e.preventDefault();
    showDirections(fromQuery, toQuery);
  };

  const openInOSM = () => {
    if (!mapInstance.current) return;
    const c = mapInstance.current.getCenter();
    const z = mapInstance.current.getZoom();
    window.open(`https://www.openstreetmap.org/#map=${z}/${c.lat.toFixed(4)}/${c.lng.toFixed(4)}`, '_blank');
  };

  return (
    <div className="w-full max-w-full rounded-2xl overflow-hidden border border-[#008751]/20 shadow-md bg-white">
      {/* Header */}
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <span className="text-sm font-bold text-[#008751]">Interactive Map</span>
          {status === 'searching' && <Loader2 size={14} className="text-[#008751] animate-spin" />}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setActiveMode('search')}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeMode === 'search' ? 'bg-[#008751] text-white' : 'text-[#008751] border border-[#008751]/30 hover:bg-[#008751]/10'}`}>
            Search
          </button>
          <button onClick={() => setActiveMode('directions')}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${activeMode === 'directions' ? 'bg-[#008751] text-white' : 'text-[#008751] border border-[#008751]/30 hover:bg-[#008751]/10'}`}>
            Directions
          </button>
        </div>
      </div>

      {/* Search / Directions input */}
      <div className="px-3 py-2 bg-white border-b border-gray-100">
        {activeMode === 'search' ? (
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search any location..."
                className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-400"
              />
              {searchQuery && <button type="button" onClick={() => setSearchQuery('')}><X size={12} className="text-gray-400" /></button>}
            </div>
            <button type="submit" disabled={status === 'searching'}
              className="px-3 py-2 bg-[#008751] text-white rounded-xl text-xs font-bold hover:bg-[#00A862] transition-colors disabled:opacity-50">
              Go
            </button>
          </form>
        ) : (
          <form onSubmit={handleDirections} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-[#008751] shrink-0" />
              <input value={fromQuery} onChange={e => setFromQuery(e.target.value)} placeholder="From (e.g. Lagos)" className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-400" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <input value={toQuery} onChange={e => setToQuery(e.target.value)} placeholder="To (e.g. Abuja)" className="flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder-gray-400" />
              </div>
              <button type="submit" disabled={status === 'searching'}
                className="px-3 py-2 bg-[#008751] text-white rounded-xl text-xs font-bold hover:bg-[#00A862] transition-colors disabled:opacity-50">
                <Navigation size={14} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ height: '320px', width: '100%' }} />

      {/* Footer */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={11} className="text-[#008751] shrink-0" />
          <p className="text-[10px] text-gray-600 font-medium truncate">{locationInfo || 'Click map to get location info'}</p>
        </div>
        <button onClick={openInOSM} className="flex items-center gap-1 text-[10px] text-[#008751] font-bold hover:underline shrink-0">
          <ExternalLink size={10} /> Full map
        </button>
      </div>
    </div>
  );
}
