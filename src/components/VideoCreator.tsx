import React from 'react';

interface VideoCreatorProps {
  initialPrompt: string;
  onClose: () => void;
  onResult: (result: { imageUrl: string; prompt: string }) => void;
}

export default function VideoCreator({ initialPrompt, onClose, onResult }: VideoCreatorProps) {
  React.useEffect(() => {
    onResult({ imageUrl: '', prompt: initialPrompt });
  }, [initialPrompt, onResult]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
      <div className="font-medium">Video preview unavailable</div>
      <button className="mt-3 rounded bg-[#008751] px-3 py-2 text-white" onClick={onClose}>Close</button>
    </div>
  );
}
