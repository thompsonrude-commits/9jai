import React, { useState, useRef } from 'react';
import { proxyVideo } from '../lib/aiProxy';

interface VideoPlayerProps {
  prompt: string;
  onClose?: () => void;
}

type Status = 'idle' | 'generating' | 'playing' | 'error';

export default function VideoPlayer({ prompt, onClose }: VideoPlayerProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const generate = async () => {
    setStatus('generating');
    setProgress(0);
    setErrorMsg('');

    // Animate progress bar while waiting
    let prog = 0;
    const ticker = setInterval(() => {
      prog = Math.min(prog + 0.8, 85);
      setProgress(prog);
    }, 400);

    try {
      const result = await proxyVideo(prompt);
      clearInterval(ticker);
      setProgress(100);

      if (result.videoUrl) {
        setVideoUrl(result.videoUrl);
        setStatus('playing');
      } else {
        throw new Error('No video URL returned');
      }
    } catch (err: any) {
      clearInterval(ticker);
      setProgress(0);
      setStatus('error');
      // Show the actual error message from backend
      setErrorMsg(err?.message ?? 'Video generation failed. Please try again.');
    }
  };

  if (status === 'playing' && videoUrl) {
    return (
      <div className="max-w-[92%] rounded-2xl overflow-hidden border border-gray-700 shadow-xl bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-auto max-h-[360px]"
          onError={() => {
            setStatus('error');
            setErrorMsg('Video could not be played. The URL may have expired.');
          }}
        />
        <div className="px-3 py-2 bg-gray-900 flex items-center gap-2">
          <span className="text-[10px] text-gray-400 flex-1 truncate">🎬 {prompt.slice(0, 50)}</span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#008751] border border-[#008751]/30 px-2 py-1 rounded"
          >
            ⬇ Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[92%] rounded-2xl overflow-hidden border border-gray-700 shadow-xl bg-gray-900 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">🎬</span>
        <div>
          <p className="text-sm font-bold text-white">Video Generation</p>
          <p className="text-xs text-gray-400 truncate max-w-[220px]">{prompt.slice(0, 60)}</p>
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={generate}
          className="w-full py-2.5 bg-[#008751] text-white text-sm font-bold rounded-xl hover:bg-[#006b40] transition-colors"
        >
          ▶ Generate Video
        </button>
      )}

      {status === 'generating' && (
        <div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#008751] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">Generating video… {Math.round(progress)}%</p>
          <p className="text-[10px] text-gray-500 text-center mt-1">This may take 30–120 seconds</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <p className="text-xs text-red-400 mb-3">{errorMsg}</p>
          <button
            onClick={generate}
            className="px-4 py-2 bg-[#008751] text-white text-xs font-bold rounded-xl hover:bg-[#006b40] transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      )}
    </div>
  );
}
