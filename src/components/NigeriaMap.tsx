/**
 * NigeriaMap — Full SVG map of Nigeria with all 36 states + FCT
 * Rendered using D3.js with real GeoJSON state boundaries.
 * Matches the style in the reference image: green fill, state labels, city dots.
 * Download as PNG or JPG.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Loader2, Download, ZoomIn, ZoomOut } from 'lucide-react';

const NIGERIA_STATES_GEOJSON_URL =
  'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json';

// Fallback: use the countries GeoJSON and filter to Nigeria
const FALLBACK_URL =
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

// State capitals
const STATE_CAPITALS: Record<string, { name: string; coords: [number, number] }> = {
  'Abia':          { name: 'Umuahia',      coords: [7.4833, 5.5167] },
  'Adamawa':       { name: 'Yola',         coords: [12.4667, 9.2333] },
  'Akwa Ibom':     { name: 'Uyo',          coords: [7.9333, 5.0333] },
  'Anambra':       { name: 'Awka',         coords: [7.0667, 6.2167] },
  'Bauchi':        { name: 'Bauchi',       coords: [9.8333, 10.3167] },
  'Bayelsa':       { name: 'Yenagoa',      coords: [6.2667, 4.9167] },
  'Benue':         { name: 'Makurdi',      coords: [8.5333, 7.7333] },
  'Borno':         { name: 'Maiduguri',    coords: [13.1500, 11.8333] },
  'Cross River':   { name: 'Calabar',      coords: [8.3167, 4.9500] },
  'Delta':         { name: 'Asaba',        coords: [6.7500, 6.2000] },
  'Ebonyi':        { name: 'Abakaliki',    coords: [8.1000, 6.3333] },
  'Edo':           { name: 'Benin City',   coords: [5.6167, 6.3333] },
  'Ekiti':         { name: 'Ado Ekiti',    coords: [5.2167, 7.6333] },
  'Enugu':         { name: 'Enugu',        coords: [7.5000, 6.4500] },
  'FCT':           { name: 'Abuja',        coords: [7.3986, 9.0765] },
  'Gombe':         { name: 'Gombe',        coords: [11.1667, 10.2833] },
  'Imo':           { name: 'Owerri',       coords: [7.0333, 5.4833] },
  'Jigawa':        { name: 'Dutse',        coords: [9.3333, 11.7667] },
  'Kaduna':        { name: 'Kaduna',       coords: [7.4333, 10.5167] },
  'Kano':          { name: 'Kano',         coords: [8.5167, 12.0000] },
  'Katsina':       { name: 'Katsina',      coords: [7.6000, 12.9833] },
  'Kebbi':         { name: 'Birnin Kebbi', coords: [4.1833, 12.4500] },
  'Kogi':          { name: 'Lokoja',       coords: [6.7333, 7.8000] },
  'Kwara':         { name: 'Ilorin',       coords: [4.5500, 8.5000] },
  'Lagos':         { name: 'Lagos',        coords: [3.3792, 6.5244] },
  'Nasarawa':      { name: 'Lafia',        coords: [8.5167, 8.4833] },
  'Niger':         { name: 'Minna',        coords: [6.5500, 9.6167] },
  'Ogun':          { name: 'Abeokuta',     coords: [3.3500, 7.1500] },
  'Ondo':          { name: 'Akure',        coords: [5.1833, 7.2500] },
  'Osun':          { name: 'Oshogbo',      coords: [4.5667, 7.7667] },
  'Oyo':           { name: 'Ibadan',       coords: [3.9000, 7.3833] },
  'Plateau':       { name: 'Jos',          coords: [8.8833, 9.9167] },
  'Rivers':        { name: 'Port Harcourt',coords: [7.0167, 4.8167] },
  'Sokoto':        { name: 'Sokoto',       coords: [5.2333, 13.0667] },
  'Taraba':        { name: 'Jalingo',      coords: [11.3667, 8.8833] },
  'Yobe':          { name: 'Damaturu',     coords: [11.9667, 11.7500] },
  'Zamfara':       { name: 'Gusau',        coords: [6.6667, 12.1667] },
};

interface NigeriaMapProps {
  place?: string;
}

export default function NigeriaMap({ place = 'Nigeria' }: NigeriaMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [zoom, setZoom] = useState(1);

  const drawMap = useCallback(async () => {
    if (!svgRef.current || !containerRef.current) return;
    setStatus('loading');

    const width = containerRef.current.clientWidth || 500;
    const height = Math.round(width * 0.75);

    try {
      // Try Nigeria states TopoJSON first
      let geoData: any = null;

      try {
        const res = await fetch(NIGERIA_STATES_GEOJSON_URL);
        if (res.ok) {
          const topo = await res.json();
          // Convert TopoJSON to GeoJSON
          const { feature } = await import('topojson-client');
          const key = Object.keys(topo.objects)[0];
          geoData = feature(topo, topo.objects[key]);
        }
      } catch {
        // fallback
      }

      // Fallback: use world GeoJSON filtered to Nigeria
      if (!geoData) {
        const res = await fetch(FALLBACK_URL);
        const world = await res.json();
        const nga = world.features.find(
          (f: any) => (f.properties?.ISO_A3 || f.properties?.iso_a3) === 'NGA'
        );
        geoData = nga ? { type: 'FeatureCollection', features: [nga] } : null;
      }

      if (!geoData || !svgRef.current) { setStatus('error'); return; }

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

      // Ocean background
      svg.append('rect').attr('width', width).attr('height', height).attr('fill', '#c8e6f5');

      // Projection
      const projection = d3.geoMercator().fitSize([width - 20, height - 20], geoData).translate([
        width / 2, height / 2,
      ]);
      const path = d3.geoPath().projection(projection);

      // Color scale — green gradient like the reference image
      const colorScale = d3.scaleSequential(d3.interpolateGreens).domain([0, 1]);

      // Draw states
      const stateGroup = svg.append('g');
      stateGroup.selectAll('path')
        .data(geoData.features)
        .enter()
        .append('path')
        .attr('d', path as any)
        .attr('fill', (_: any, i: number) => colorScale(0.3 + (i % 5) * 0.12))
        .attr('stroke', '#2d6a2d')
        .attr('stroke-width', 0.8);

      // State name labels
      stateGroup.selectAll('text.state-label')
        .data(geoData.features)
        .enter()
        .append('text')
        .attr('class', 'state-label')
        .attr('transform', (d: any) => {
          const c = path.centroid(d);
          return `translate(${c[0]},${c[1]})`;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', `${Math.max(5, width / 90)}px`)
        .attr('font-weight', 'bold')
        .attr('fill', '#1a3d1a')
        .attr('font-family', 'Inter, Arial, sans-serif')
        .text((d: any) => {
          const name: string = d.properties?.name || d.properties?.NAME || d.properties?.admin || '';
          return name.toUpperCase();
        });

      // City dots + capital labels
      const labelsGroup = svg.append('g');
      Object.entries(STATE_CAPITALS).forEach(([, capital]) => {
        const [x, y] = projection(capital.coords) || [0, 0];
        if (x < 0 || y < 0 || x > width || y > height) return;

        labelsGroup.append('circle')
          .attr('cx', x).attr('cy', y).attr('r', Math.max(2, width / 200))
          .attr('fill', '#1a1a1a').attr('stroke', 'white').attr('stroke-width', 0.8);

        labelsGroup.append('text')
          .attr('x', x + 4).attr('y', y + 3)
          .attr('font-size', `${Math.max(4, width / 110)}px`)
          .attr('fill', '#1a1a1a')
          .attr('font-family', 'Inter, Arial, sans-serif')
          .text(capital.name);
      });

      // Nigeria title in center
      svg.append('text')
        .attr('x', width / 2).attr('y', height / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', `${Math.max(18, width / 22)}px`)
        .attr('font-weight', '900')
        .attr('fill', '#1a5c2a')
        .attr('fill-opacity', 0.25)
        .attr('font-family', 'Inter, Arial, sans-serif')
        .text('NIGERIA');

      // Gulf of Guinea label
      svg.append('text')
        .attr('x', width * 0.25).attr('y', height - 15)
        .attr('font-size', `${Math.max(8, width / 60)}px`)
        .attr('font-style', 'italic')
        .attr('fill', '#2980b9')
        .attr('font-family', 'Inter, Arial, sans-serif')
        .text('Gulf of Guinea');

      setStatus('done');
    } catch (err) {
      console.error('Map error:', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => { drawMap(); }, [drawMap]);

  // Download as PNG or JPG
  const downloadMap = useCallback((format: 'png' | 'jpg') => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const w = svgEl.clientWidth || 800;
    const h = svgEl.clientHeight || 600;
    canvas.width = w * 2; // 2x for retina
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);

    if (format === 'jpg') {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, w, h);
    }

    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.download = `nigeria-map.${format}`;
      link.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
      link.click();
    };
    img.src = url;
  }, []);

  const downloadSVG = useCallback(() => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'nigeria-map.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
  }, []);

  return (
    <div className="w-full max-w-full rounded-2xl overflow-hidden border border-[#008751]/20 shadow-md bg-white">
      {/* Header */}
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <span className="text-sm font-bold text-[#008751]">Map of Nigeria — All 36 States</span>
        </div>
        {status === 'done' && (
          <div className="flex items-center gap-1">
            <button onClick={() => downloadMap('png')} title="Download PNG"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
              <Download size={10} /> PNG
            </button>
            <button onClick={() => downloadMap('jpg')} title="Download JPG"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
              <Download size={10} /> JPG
            </button>
            <button onClick={downloadSVG} title="Download SVG"
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
              <Download size={10} /> SVG
            </button>
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={containerRef} className="relative w-full bg-[#c8e6f5]" style={{ minHeight: 300 }}>
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#c8e6f5] z-10">
            <Loader2 size={28} className="text-[#008751] animate-spin" />
            <p className="text-sm font-bold text-gray-600">Drawing Nigeria map...</p>
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} className="w-2 h-2 bg-[#008751] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#c8e6f5]">
            <p className="text-sm text-red-500 font-bold px-4 text-center">
              Map no load. Check internet connection and try again.
            </p>
          </div>
        )}
        <svg ref={svgRef} className="w-full" style={{ display: status === 'done' ? 'block' : 'none' }} />
      </div>

      {/* Footer */}
      {status === 'done' && (
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-green-400 border border-green-700" />
              <span className="text-[10px] text-gray-500">State</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-900 border border-white" />
              <span className="text-[10px] text-gray-500">Capital</span>
            </div>
          </div>
          <span className="text-[10px] text-gray-400">D3.js + GeoJSON</span>
        </div>
      )}
    </div>
  );
}
