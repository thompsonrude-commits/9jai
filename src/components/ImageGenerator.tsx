import React, { useState, useEffect } from 'react';
import { Image, X, Download, Share2, Loader, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateImage as generateImageCanonical } from '../lib/imageClient';
import { downloadImage, shareImage, getImageHistory, saveImageToHistory } from '../lib/imageService';
import useProviders from '../lib/useProviders';

interface ImageGeneratorProps {
  onClose: () => void;
  initialPrompt?: string;
  onImageGenerated?: (imageUrl: string) => void;
}

export default function ImageGenerator({ onClose, initialPrompt = '', onImageGenerated }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [stylePreset, setStylePreset] = useState('Cinematic');
  const [resolutionPreset, setResolutionPreset] = useState('8K');
  const [upscale, setUpscale] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<any>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(getImageHistory());
  const [showHistory, setShowHistory] = useState(false);

  const { providers, loading: providersLoading } = useProviders();
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [allowFallback, setAllowFallback] = useState<boolean>(true);

  // Auto-generate if initial prompt is provided
  useEffect(() => {
    if (initialPrompt && !generatedImage && !isGenerating) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const enhancedPrompt = `${stylePreset} style, ${prompt.trim()}, ${resolutionPreset}, ${upscale ? 'upscale to maximum visual fidelity' : 'standard resolution'}, cinematic lighting, high detail, realistic textures`;
      const opts: any = {};
      if (selectedProvider && selectedProvider !== 'auto') opts.preferredProviders = [selectedProvider];
      opts.allowFallback = allowFallback;
      const image = await generateImageCanonical(enhancedPrompt, opts);
      setGeneratedImage(image);
      saveImageToHistory(image);
      setHistory(getImageHistory());
      onImageGenerated?.(image.imageUrl);
    } catch (err) {
      setError('Failed to generate image. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      downloadImage(generatedImage.imageUrl, `generated-${Date.now()}.png`);
    }
  };

  const handleShare = async () => {
    if (generatedImage) {
      try {
        await shareImage(generatedImage.imageUrl, generatedImage.prompt);
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#008751] to-[#00A862]">
          <div className="flex items-center gap-3">
            <Image size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">Image Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showHistory ? (
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Describe the image you want to generate
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A beautiful sunset over Lagos skyline in cinematic 8K..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008751] resize-none"
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-gray-900">Style</span>
                  <select
                    value={stylePreset}
                    onChange={(e) => setStylePreset(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008751]"
                    disabled={isGenerating}
                  >
                    <option>Cinematic</option>
                    <option>Photorealistic</option>
                    <option>Afrofuturism</option>
                    <option>Portrait</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-gray-900">Resolution</span>
                  <select
                    value={resolutionPreset}
                    onChange={(e) => setResolutionPreset(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008751]"
                    disabled={isGenerating}
                  >
                    <option>4K</option>
                    <option>8K</option>
                    <option>Ultra HD</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 px-3 py-4 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={upscale}
                    onChange={(e) => setUpscale(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 text-[#008751] border-gray-300 rounded"
                  />
                  Enable upscale refinement
                </label>
              </div>

              {/* Provider selector */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-2 text-sm">
                  <span className="font-semibold text-gray-900">Provider</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008751]"
                    disabled={isGenerating || providersLoading}
                  >
                    <option value="auto">Auto</option>
                    {providers.map((p: any) => (
                      <option key={p.providerId} value={p.providerId}>{p.displayName} — {p.implementationState}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 px-3 py-4 border border-gray-300 rounded-lg bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={allowFallback}
                    onChange={(e) => setAllowFallback(e.target.checked)}
                    disabled={isGenerating}
                    className="h-4 w-4 text-[#008751] border-gray-300 rounded"
                  />
                  Allow fallback providers
                </label>
              </div>
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <AlertCircle size={20} className="text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* Generated image provider metadata */}
              {generatedImage?.provider && (
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700">
                  <div><strong>Requested provider:</strong> {selectedProvider === 'auto' ? 'Auto' : selectedProvider}</div>
                  <div><strong>Actual provider:</strong> {generatedImage.provider}</div>
                  <div><strong>Model:</strong> {generatedImage.model || generatedImage.metadata?.model || 'unknown'}</div>
                  {generatedImage.metadata?.fallbackFrom && (
                    <div><strong>Fallback from:</strong> {generatedImage.metadata.fallbackFrom} — <em>{generatedImage.metadata.fallbackReason}</em></div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full px-6 py-3 bg-[#008751] text-white rounded-lg font-semibold hover:bg-[#00A862] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Image size={18} />
                      Generate Image
                    </>
                  )}
                </button>

                {/* Open 3D Viewer Button */}
                <button
                  onClick={() => {
                    // open a minimal 3D viewer modal by dispatching a custom event so the host can show it
                    const ev = new CustomEvent('open-3d-viewer', { detail: { prompt } });
                    window.dispatchEvent(ev);
                  }}
                  className="w-full px-6 py-3 bg-[#0b6eab] text-white rounded-lg font-semibold hover:bg-[#0e8bd0] transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-box">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  Open 3D Viewer
                </button>
              </div>

              {/* Generated Image */}
              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={generatedImage.imageUrl}
                      alt={generatedImage.prompt}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Prompt:</span> {generatedImage.prompt}
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated: {new Date(generatedImage.generatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                    >
                      <Download size={18} />
                      Download
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold"
                    >
                      <Share2 size={18} />
                      Share
                    </button>
                  </div>
                </motion.div>
              )}

              {/* History Button */}
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  View History ({history.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ← Back to Generator
              </button>

              <h3 className="text-lg font-bold text-gray-900">Generation History</h3>

              {history.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No images generated yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {history.map((image) => (
                    <motion.div
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      className="cursor-pointer group"
                      onClick={() => {
                        setGeneratedImage(image);
                        setShowHistory(false);
                      }}
                    >
                      <div className="border border-gray-200 rounded-lg overflow-hidden mb-2 group-hover:border-[#008751] transition-colors">
                        <img
                          src={image.imageUrl}
                          alt={image.prompt}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{image.prompt}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
