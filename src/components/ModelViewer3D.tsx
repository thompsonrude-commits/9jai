import React, { useRef, useState } from 'react';

interface Organelle {
  id: string;
  name: string;
  description: string;
}

export default function ModelViewer3D({
  modelUrl = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/BrainStem/glTF-Binary/BrainStem.glb',
  title = 'Interactive 3D Model',
  onClose = () => {},
}: {
  modelUrl?: string;
  title?: string;
  onClose?: () => void;
}) {
  const viewerRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exposure, setExposure] = useState(1);

  // Simple educational list (static). Replace or extend with model-specific labels if a labeled glTF is provided.
  const organelles: Organelle[] = [
    { id: 'brain', name: 'Brain', description: 'Central organ for cognition, located in the skull.' },
    { id: 'heart', name: 'Heart', description: 'Pumps blood through the circulatory system.' },
    { id: 'lungs', name: 'Lungs', description: 'Organs that exchange oxygen and carbon dioxide.' },
    { id: 'liver', name: 'Liver', description: 'Processes nutrients and detoxifies chemicals.' },
    { id: 'stomach', name: 'Stomach', description: 'Digests food by gastric juices.' },
  ];

  const rotate = (deltaX = 0, deltaY = 0) => {
    try {
      const el = viewerRef.current;
      if (!el) return;
      // model-viewer supports cameraOrbit; update by parsing current value
      const orbit = el.getCameraOrbit ? el.getCameraOrbit() : null;
      if (!orbit) {
        // fallback: dispatch a rotate action
        el.cameraOrbit = el.cameraOrbit; // noop
        return;
      }
      // orbit is an object like {theta, phi, radius}
      const theta = orbit.theta + deltaX;
      const phi = Math.max(0.1, Math.min(Math.PI - 0.1, orbit.phi + deltaY));
      const radius = orbit.radius;
      el.cameraOrbit = `${theta}rad ${phi}rad ${radius}m`;
    } catch (e) {
      // ignore if getCameraOrbit isn't available
    }
  };

  const zoom = (delta = 0.1) => {
    try {
      const el = viewerRef.current;
      if (!el) return;
      const orbit = el.getCameraOrbit ? el.getCameraOrbit() : null;
      if (!orbit) return;
      const radius = Math.max(0.2, orbit.radius - delta);
      el.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
    } catch (e) {}
  };

  const ModelViewerElement = 'model-viewer' as any;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex">
        <div className="w-2/3 bg-gray-900 p-2 flex flex-col">
          <div className="flex items-center justify-between text-white p-2">
            <h3 className="font-bold">{title}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoRotate(v => !v)} className="px-3 py-1 bg-white/10 rounded">{autoRotate ? 'AutoRotate ON' : 'AutoRotate OFF'}</button>
              <button onClick={() => { onClose(); }} className="px-3 py-1 bg-red-600 rounded text-white">Close</button>
            </div>
          </div>

          <div className="flex-1 flex items-stretch p-2">
            <ModelViewerElement
              ref={(el: any) => { viewerRef.current = el; }}
              src={modelUrl}
              alt="3D Model"
              ar
              auto-rotate={autoRotate}
              camera-controls
              exposure={exposure}
              style={{ width: '100%', height: '100%', backgroundColor: '#111' }}
            ></ModelViewerElement>
          </div>

          <div className="p-2 flex gap-2 items-center">
            <button onClick={() => rotate(-0.2, 0)} className="px-3 py-1 bg-white/10 text-white rounded">Rotate Left</button>
            <button onClick={() => rotate(0.2, 0)} className="px-3 py-1 bg-white/10 text-white rounded">Rotate Right</button>
            <button onClick={() => rotate(0, -0.1)} className="px-3 py-1 bg-white/10 text-white rounded">Tilt Up</button>
            <button onClick={() => rotate(0, 0.1)} className="px-3 py-1 bg-white/10 text-white rounded">Tilt Down</button>
            <button onClick={() => zoom(-0.4)} className="px-3 py-1 bg-white/10 text-white rounded">Zoom In</button>
            <button onClick={() => zoom(0.4)} className="px-3 py-1 bg-white/10 text-white rounded">Zoom Out</button>
            <div className="ml-auto text-sm text-gray-200">Tip: drag to rotate, pinch to zoom</div>
          </div>
        </div>

        <div className="w-1/3 bg-white p-4 overflow-y-auto">
          <h4 className="font-bold mb-2">Educational Info</h4>
          <p className="text-sm text-gray-700 mb-3">This viewer can load any public glTF/GLB model URL. To show anatomical labels anchored to the model you need a model with named nodes for those organs. Use the input below to load a custom model URL (GLTF/GLB).</p>

          <div className="space-y-3">
            {organelles.map(o => (
              <div key={o.id} className="p-2 border border-gray-200 rounded">
                <div className="font-semibold">{o.name}</div>
                <div className="text-xs text-gray-600">{o.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Model URL (GLB/GLTF)</label>
            <input
              type="text"
              defaultValue={modelUrl}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && viewerRef.current) viewerRef.current.src = val;
                }
              }}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <p className="text-xs text-gray-500 mt-2">Press Enter to load a new model URL. Example: a public GLB with anatomy data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
