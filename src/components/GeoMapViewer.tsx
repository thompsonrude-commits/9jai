/**
 * GeoMapViewer — renders country/region maps using D3.js + GeoJSON
 * This is the JavaScript equivalent of Python's geopandas + matplotlib.
 * No API key needed. Runs entirely in the browser.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Loader2 } from 'lucide-react';

interface GeoMapViewerProps {
  place: string;
}

// Country ISO codes for fetching GeoJSON boundaries
const PLACE_CONFIG: Record<string, {
  label: string;
  iso: string;          // ISO 3166-1 alpha-3 for country GeoJSON
  center: [number, number];
  scale: number;
  cities?: { name: string; coords: [number, number] }[];
}> = {
  nigeria: {
    label: 'Nigeria',
    iso: 'NGA',
    center: [8.6753, 9.082],
    scale: 1800,
    cities: [
      { name: 'Abuja', coords: [7.3986, 9.0765] },
      { name: 'Lagos', coords: [3.3792, 6.5244] },
      { name: 'Kano', coords: [8.5920, 12.0022] },
      { name: 'Port Harcourt', coords: [7.0498, 4.8156] },
      { name: 'Ibadan', coords: [3.9470, 7.3775] },
      { name: 'Benin City', coords: [5.6037, 6.3350] },
    ],
  },
  lagos: {
    label: 'Lagos, Nigeria',
    iso: 'NGA',
    center: [3.3792, 6.5244],
    scale: 8000,
    cities: [{ name: 'Lagos', coords: [3.3792, 6.5244] }],
  },
  abuja: {
    label: 'Abuja, Nigeria',
    iso: 'NGA',
    center: [7.3986, 9.0765],
    scale: 8000,
    cities: [{ name: 'Abuja (FCT)', coords: [7.3986, 9.0765] }],
  },
  africa: {
    label: 'Africa',
    iso: 'AFRICA',
    center: [20, 5],
    scale: 380,
    cities: [
      { name: 'Lagos', coords: [3.3792, 6.5244] },
      { name: 'Cairo', coords: [31.2357, 30.0444] },
      { name: 'Nairobi', coords: [36.8219, -1.2921] },
      { name: 'Johannesburg', coords: [28.0473, -26.2041] },
    ],
  },
  ghana: {
    label: 'Ghana',
    iso: 'GHA',
    center: [-1.0232, 7.9465],
    scale: 3500,
    cities: [{ name: 'Accra', coords: [-0.1870, 5.6037] }],
  },
  kenya: {
    label: 'Kenya',
    iso: 'KEN',
    center: [37.9062, -0.0236],
    scale: 2200,
    cities: [{ name: 'Nairobi', coords: [36.8219, -1.2921] }],
  },
  'south africa': {
    label: 'South Africa',
    iso: 'ZAF',
    center: [22.9375, -30.5595],
    scale: 1200,
    cities: [
      { name: 'Cape Town', coords: [18.4241, -33.9249] },
      { name: 'Johannesburg', coords: [28.0473, -26.2041] },
    ],
  },
  cameroon: {
    label: 'Cameroon',
    iso: 'CMR',
    center: [11.5021, 3.848],
    scale: 2500,
    cities: [{ name: 'Yaoundé', coords: [11.5021, 3.848] }],
  },
  egypt: {
    label: 'Egypt',
    iso: 'EGY',
    center: [30.8025, 26.8206],
    scale: 1200,
    cities: [{ name: 'Cairo', coords: [31.2357, 30.0444] }],
  },
};

function getConfig(place: string) {
  const lower = place.toLowerCase();
  const key = Object.keys(PLACE_CONFIG).find(k => lower.includes(k));
  return key ? PLACE_CONFIG[key] : PLACE_CONFIG['nigeria'];
}

// Fetch GeoJSON from a free public source
async function fetchGeoJSON(iso: string): Promise<any> {
  if (iso === 'AFRICA') {
    // Fetch world GeoJSON and filter to Africa
    const res = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
    const data = await res.json();
    // African country ISO codes
    const africaISO = new Set([
      'DZA','AGO','BEN','BWA','BFA','BDI','CPV','CMR','CAF','TCD',
      'COM','COD','COG','CIV','DJI','EGY','GNQ','ERI','SWZ','ETH',
      'GAB','GMB','GHA','GIN','GNB','KEN','LSO','LBR','LBY','MDG',
      'MWI','MLI','MRT','MUS','MAR','MOZ','NAM','NER','NGA','RWA',
      'STP','SEN','SLE','SOM','ZAF','SSD','SDN','TZA','TGO','TUN',
      'UGA','ZMB','ZWE','LCA','SYC',
    ]);
    return {
      ...data,
      features: data.features.filter((f: any) =>
        africaISO.has(f.properties?.ISO_A3 || f.properties?.iso_a3)
      ),
    };
  }
  // Single country
  const res = await fetch(
    `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`
  );
  const data = await res.json();
  const feature = data.features.find(
    (f: any) => (f.properties?.ISO_A3 || f.properties?.iso_a3)?.toUpperCase() === iso.toUpperCase()
  );
  return feature ? { type: 'FeatureCollection', features: [feature] } : data;
}

export default function GeoMapViewer({ place }: GeoMapViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const config = getConfig(place);

  useEffect(() => {
    if (!svgRef.current) return;
    setStatus('loading');

    const width = svgRef.current.clientWidth || 400;
    const height = 320;

    fetchGeoJSON(config.iso)
      .then(geoData => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.attr('width', width).attr('height', height);

        // Background
        svg.append('rect')
          .attr('width', width)
          .attr('height', height)
          .attr('fill', '#e8f4f8');

        // Projection — center on the place
        const projection = d3.geoMercator()
          .center(config.center)
          .scale(config.scale)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Draw country/region shapes
        svg.selectAll('path')
          .data(geoData.features)
          .enter()
          .append('path')
          .attr('d', path as any)
          .attr('fill', '#4CAF50')
          .attr('fill-opacity', 0.6)
          .attr('stroke', '#1a5c2a')
          .attr('stroke-width', 0.8);

        // Draw city markers
        if (config.cities) {
          config.cities.forEach(city => {
            const [x, y] = projection(city.coords) || [0, 0];

            // Dot
            svg.append('circle')
              .attr('cx', x)
              .attr('cy', y)
              .attr('r', 4)
              .attr('fill', '#c0392b')
              .attr('stroke', 'white')
              .attr('stroke-width', 1.5);

            // Label
            svg.append('text')
              .attr('x', x + 6)
              .attr('y', y + 4)
              .attr('font-size', '10px')
              .attr('font-weight', 'bold')
              .attr('fill', '#1a1a1a')
              .attr('font-family', 'Inter, sans-serif')
              .text(city.name);
          });
        }

        // Title
        svg.append('text')
          .attr('x', 10)
          .attr('y', 20)
          .attr('font-size', '13px')
          .attr('font-weight', 'bold')
          .attr('fill', '#1a5c2a')
          .attr('font-family', 'Inter, sans-serif')
          .text(config.label);

        setStatus('done');
      })
      .catch(err => {
        console.error('Map error:', err);
        setStatus('error');
      });
  }, [config]);

  return (
    <div className="w-full max-w-[95%] rounded-2xl overflow-hidden border border-[#008751]/20 shadow-sm bg-white">
      {/* Header */}
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center gap-2">
        <span className="text-base">🗺️</span>
        <span className="text-sm font-bold text-[#008751]">{config.label}</span>
      </div>

      {/* Map SVG */}
      <div className="relative bg-[#e8f4f8]" style={{ minHeight: 320 }}>
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#e8f4f8]">
            <Loader2 size={28} className="text-[#008751] animate-spin" />
            <p className="text-sm font-bold text-gray-600">Loading map of {config.label}...</p>
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} className="w-2 h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-red-500 font-bold">Map no load. Check internet connection.</p>
          </div>
        )}
        <svg
          ref={svgRef}
          className="w-full"
          style={{ height: 320, display: status === 'done' ? 'block' : 'none' }}
        />
      </div>

      {/* Legend */}
      {status === 'done' && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#4CAF50] opacity-60 border border-[#1a5c2a]" />
            <span className="text-[10px] text-gray-500 font-medium">Territory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#c0392b] border border-white" />
            <span className="text-[10px] text-gray-500 font-medium">City</span>
          </div>
          <span className="text-[10px] text-gray-400 ml-auto">GeoJSON + D3.js</span>
        </div>
      )}
    </div>
  );
}
