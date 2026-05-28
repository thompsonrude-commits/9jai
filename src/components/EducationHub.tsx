import React, { useState } from 'react';
import { Book, Search, ChevronRight, Clock, Zap, Award, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getEducationMaterials,
  getMaterialsByLevel,
  searchMaterials,
  getCodeExamples,
  getCodeExamplesByLanguage,
  EducationMaterial,
  CodeExample,
} from '../lib/educationService';

interface EducationHubProps {
  onClose: () => void;
}

export default function EducationHub({ onClose }: EducationHubProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<EducationMaterial | null>(null);
  const [selectedCodeExample, setSelectedCodeExample] = useState<CodeExample | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'code'>('materials');

  const allMaterials = getEducationMaterials();
  const filteredMaterials = searchQuery
    ? searchMaterials(searchQuery)
    : selectedLevel === 'all'
    ? allMaterials
    : getMaterialsByLevel(selectedLevel);

  const allCodeExamples = getCodeExamples();

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700';
      case 'advanced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'beginner':
        return <Zap size={14} />;
      case 'intermediate':
        return <Award size={14} />;
      case 'advanced':
        return <Award size={14} />;
      default:
        return <Book size={14} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#008751] to-[#00A862]">
          <div className="flex items-center gap-3">
            <Book size={24} className="text-white" />
            <h2 className="text-xl font-bold text-white">Education Hub</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'materials'
                ? 'bg-[#008751] text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Learning Materials
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-[#008751] text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Code Examples
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'materials' ? (
              <motion.div
                key="materials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {!selectedMaterial ? (
                  <>
                    {/* Search and Filter */}
                    <div className="mb-6 space-y-4">
                      <div className="relative">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search materials..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008751]"
                        />
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level as any)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                              selectedLevel === level
                                ? 'bg-[#008751] text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Materials List */}
                    <div className="grid gap-4">
                      {filteredMaterials.map((material) => (
                        <motion.button
                          key={material.id}
                          onClick={() => setSelectedMaterial(material)}
                          whileHover={{ scale: 1.02 }}
                          className="p-4 border border-gray-200 rounded-lg hover:border-[#008751] hover:shadow-lg transition-all text-left"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-900">{material.title}</h3>
                            <ChevronRight size={18} className="text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getLevelColor(material.level)}`}>
                              {getLevelIcon(material.level)}
                              {material.level.charAt(0).toUpperCase() + material.level.slice(1)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock size={14} />
                              {material.duration} min
                            </span>
                            <span className="text-xs text-gray-500">{material.category}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Material Detail */}
                    <button
                      onClick={() => setSelectedMaterial(null)}
                      className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ← Back to Materials
                    </button>
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMaterial.title}</h2>
                        <div className="flex items-center gap-3 flex-wrap mb-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getLevelColor(selectedMaterial.level)}`}>
                            {getLevelIcon(selectedMaterial.level)}
                            {selectedMaterial.level.charAt(0).toUpperCase() + selectedMaterial.level.slice(1)}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock size={16} />
                            {selectedMaterial.duration} minutes
                          </span>
                          <span className="text-sm text-gray-600">{selectedMaterial.category}</span>
                        </div>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedMaterial.content}
                        </ReactMarkdown>
                      </div>

                      {selectedMaterial.resources.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h3 className="font-bold text-gray-900 mb-2">Resources</h3>
                          <ul className="space-y-2">
                            {selectedMaterial.resources.map((resource, idx) => (
                              <li key={idx}>
                                <a
                                  href={resource}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#008751] hover:underline text-sm break-all"
                                >
                                  {resource}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6"
              >
                {!selectedCodeExample ? (
                  <div className="grid gap-4">
                    {allCodeExamples.map((example) => (
                      <motion.button
                        key={example.id}
                        onClick={() => setSelectedCodeExample(example)}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border border-gray-200 rounded-lg hover:border-[#008751] hover:shadow-lg transition-all text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-900">{example.title}</h3>
                          <ChevronRight size={18} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{example.explanation}</p>
                        <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono font-semibold">
                          {example.language}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedCodeExample(null)}
                      className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      ← Back to Examples
                    </button>
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCodeExample.title}</h2>
                        <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-mono font-semibold">
                          {selectedCodeExample.language}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Explanation</h3>
                        <p className="text-gray-700">{selectedCodeExample.explanation}</p>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">Code</h3>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{selectedCodeExample.code}</code>
                        </pre>
                      </div>

                      {selectedCodeExample.output && (
                        <div>
                          <h3 className="font-bold text-gray-900 mb-2">Output</h3>
                          <pre className="bg-gray-100 text-gray-900 p-4 rounded-lg overflow-x-auto text-sm border border-gray-300">
                            <code>{selectedCodeExample.output}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
