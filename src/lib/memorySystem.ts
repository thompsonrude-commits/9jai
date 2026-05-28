/**
 * Memory System — Long-term, semantic, and contextual AI memory
 * Stores user preferences, conversation summaries, and learning progress
 * Uses Firestore for persistence + localStorage for fast access
 */

import { db } from './firebase';
import {
  doc, setDoc, getDoc, updateDoc, collection,
  query, orderBy, limit, getDocs, serverTimestamp, arrayUnion
} from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserMemory {
  userId: string;
  preferences: {
    language: string;           // preferred response language
    responseStyle: 'concise' | 'detailed' | 'conversational';
    topics: string[];           // topics user frequently asks about
    nativeLanguage?: string;    // user's native language
    learningLanguages: string[];
  };
  facts: MemoryFact[];          // things the AI has learned about the user
  conversationSummaries: ConversationSummary[];
  learningProgress: Record<string, LearningProgress>;
  feedbackHistory: FeedbackEntry[];
  lastSeen: number;
  totalMessages: number;
  createdAt: number;
}

export interface MemoryFact {
  id: string;
  fact: string;                 // e.g. "User is a software engineer"
  confidence: number;           // 0-1
  source: 'explicit' | 'inferred';
  timestamp: number;
  category: 'personal' | 'professional' | 'preference' | 'language' | 'interest';
}

export interface ConversationSummary {
  id: string;
  summary: string;
  topics: string[];
  timestamp: number;
  messageCount: number;
}

export interface LearningProgress {
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  wordsLearned: string[];
  lessonsCompleted: number;
  lastPracticed: number;
  score: number;
}

export interface FeedbackEntry {
  messageId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  correction?: string;
  timestamp: number;
}

// ── Local cache ────────────────────────────────────────────────────────────

const MEMORY_CACHE_KEY = 'ai_memory_cache';
const MEMORY_TTL = 5 * 60 * 1000; // 5 minutes

let memoryCache: { data: UserMemory; ts: number } | null = null;

function getLocalMemory(userId: string): UserMemory | null {
  try {
    const raw = localStorage.getItem(`${MEMORY_CACHE_KEY}_${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > MEMORY_TTL) return null;
    return parsed.data;
  } catch { return null; }
}

function setLocalMemory(userId: string, memory: UserMemory): void {
  try {
    localStorage.setItem(`${MEMORY_CACHE_KEY}_${userId}`, JSON.stringify({ data: memory, ts: Date.now() }));
  } catch { /* ignore storage errors */ }
}

// ── Default memory ─────────────────────────────────────────────────────────

function createDefaultMemory(userId: string): UserMemory {
  return {
    userId,
    preferences: {
      language: 'en',
      responseStyle: 'conversational',
      topics: [],
      learningLanguages: [],
    },
    facts: [],
    conversationSummaries: [],
    learningProgress: {},
    feedbackHistory: [],
    lastSeen: Date.now(),
    totalMessages: 0,
    createdAt: Date.now(),
  };
}

// ── Firestore operations ───────────────────────────────────────────────────

export async function loadUserMemory(userId: string): Promise<UserMemory> {
  // Check local cache first
  const cached = getLocalMemory(userId);
  if (cached) return cached;

  try {
    const ref = doc(db, 'user_memory', userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const memory = snap.data() as UserMemory;
      setLocalMemory(userId, memory);
      return memory;
    }
  } catch (err) {
    console.warn('[Memory] Firestore load failed, using default:', err);
  }

  return createDefaultMemory(userId);
}

export async function saveUserMemory(userId: string, memory: UserMemory): Promise<void> {
  setLocalMemory(userId, memory);
  try {
    const ref = doc(db, 'user_memory', userId);
    await setDoc(ref, { ...memory, lastSeen: Date.now() }, { merge: true });
  } catch (err) {
    console.warn('[Memory] Firestore save failed:', err);
  }
}

export async function updateMemoryFact(userId: string, fact: Omit<MemoryFact, 'id' | 'timestamp'>): Promise<void> {
  const memory = await loadUserMemory(userId);
  const newFact: MemoryFact = {
    ...fact,
    id: `fact_${Date.now()}`,
    timestamp: Date.now(),
  };
  // Avoid duplicates
  const exists = memory.facts.some(f => f.fact.toLowerCase() === fact.fact.toLowerCase());
  if (!exists) {
    memory.facts = [...memory.facts.slice(-49), newFact]; // keep last 50
    await saveUserMemory(userId, memory);
  }
}

export async function addConversationSummary(
  userId: string,
  summary: string,
  topics: string[],
  messageCount: number
): Promise<void> {
  const memory = await loadUserMemory(userId);
  const entry: ConversationSummary = {
    id: `summary_${Date.now()}`,
    summary,
    topics,
    timestamp: Date.now(),
    messageCount,
  };
  memory.conversationSummaries = [...memory.conversationSummaries.slice(-19), entry]; // keep last 20
  memory.totalMessages += messageCount;
  await saveUserMemory(userId, memory);
}

export async function recordFeedback(userId: string, feedback: Omit<FeedbackEntry, 'timestamp'>): Promise<void> {
  const memory = await loadUserMemory(userId);
  memory.feedbackHistory = [...memory.feedbackHistory.slice(-99), { ...feedback, timestamp: Date.now() }];
  await saveUserMemory(userId, memory);
}

export async function updateLearningProgress(
  userId: string,
  language: string,
  update: Partial<LearningProgress>
): Promise<void> {
  const memory = await loadUserMemory(userId);
  const existing = memory.learningProgress[language] || {
    language,
    level: 'beginner' as const,
    wordsLearned: [],
    lessonsCompleted: 0,
    lastPracticed: Date.now(),
    score: 0,
  };
  memory.learningProgress[language] = { ...existing, ...update, lastPracticed: Date.now() };
  await saveUserMemory(userId, memory);
}

// ── Memory context builder ─────────────────────────────────────────────────
// Builds a compact memory context string to inject into AI system prompts

export function buildMemoryContext(memory: UserMemory): string {
  const parts: string[] = [];

  if (memory.facts.length > 0) {
    const topFacts = memory.facts
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8)
      .map(f => `- ${f.fact}`)
      .join('\n');
    parts.push(`## What I know about this user:\n${topFacts}`);
  }

  if (memory.preferences.topics.length > 0) {
    parts.push(`## User's frequent topics: ${memory.preferences.topics.slice(0, 5).join(', ')}`);
  }

  if (memory.preferences.learningLanguages.length > 0) {
    parts.push(`## User is learning: ${memory.preferences.learningLanguages.join(', ')}`);
  }

  if (memory.conversationSummaries.length > 0) {
    const recent = memory.conversationSummaries.slice(-3);
    const summaryText = recent.map(s => `- ${s.summary}`).join('\n');
    parts.push(`## Recent conversation context:\n${summaryText}`);
  }

  if (memory.preferences.responseStyle) {
    parts.push(`## Preferred response style: ${memory.preferences.responseStyle}`);
  }

  return parts.length > 0
    ? `\n\n## PERSONALIZED MEMORY (use this to personalize responses):\n${parts.join('\n\n')}`
    : '';
}

// ── Fact extractor — infers facts from conversation ────────────────────────

export function extractFactsFromMessage(message: string): Omit<MemoryFact, 'id' | 'timestamp'>[] {
  const facts: Omit<MemoryFact, 'id' | 'timestamp'>[] = [];
  const lower = message.toLowerCase();

  // Personal facts
  if (lower.includes('my name is') || lower.includes("i'm called")) {
    const match = message.match(/(?:my name is|i'm called)\s+([A-Z][a-z]+)/i);
    if (match) facts.push({ fact: `User's name is ${match[1]}`, confidence: 0.95, source: 'explicit', category: 'personal' });
  }

  if (lower.includes('i am a') || lower.includes("i'm a")) {
    const match = message.match(/(?:i am a|i'm a)\s+([a-z\s]+?)(?:\.|,|$)/i);
    if (match) facts.push({ fact: `User is a ${match[1].trim()}`, confidence: 0.85, source: 'explicit', category: 'professional' });
  }

  if (lower.includes('i live in') || lower.includes('i am from') || lower.includes("i'm from")) {
    const match = message.match(/(?:i live in|i am from|i'm from)\s+([A-Z][a-z\s]+?)(?:\.|,|$)/i);
    if (match) facts.push({ fact: `User is from ${match[1].trim()}`, confidence: 0.9, source: 'explicit', category: 'personal' });
  }

  if (lower.includes('i speak') || lower.includes('i know')) {
    const match = message.match(/(?:i speak|i know)\s+([A-Z][a-z]+)/i);
    if (match) facts.push({ fact: `User speaks ${match[1]}`, confidence: 0.85, source: 'explicit', category: 'language' });
  }

  if (lower.includes('i want to learn') || lower.includes('i am learning')) {
    const match = message.match(/(?:i want to learn|i am learning)\s+([A-Z][a-z]+)/i);
    if (match) facts.push({ fact: `User is learning ${match[1]}`, confidence: 0.9, source: 'explicit', category: 'language' });
  }

  return facts;
}

// ── Topic extractor ────────────────────────────────────────────────────────

export function extractTopics(message: string): string[] {
  const topicMap: Record<string, string[]> = {
    'technology': ['code', 'programming', 'software', 'app', 'website', 'computer', 'tech', 'ai', 'machine learning'],
    'language': ['translate', 'language', 'word', 'grammar', 'speak', 'learn', 'edo', 'yoruba', 'igbo', 'hausa'],
    'finance': ['money', 'naira', 'dollar', 'invest', 'bank', 'price', 'cost', 'budget', 'salary'],
    'education': ['study', 'school', 'university', 'exam', 'learn', 'teach', 'course', 'degree'],
    'health': ['health', 'doctor', 'medicine', 'sick', 'hospital', 'symptom', 'treatment'],
    'news': ['news', 'current', 'latest', 'today', 'happening', 'event', 'politics'],
    'creative': ['write', 'poem', 'story', 'song', 'lyrics', 'creative', 'art', 'music'],
    'science': ['science', 'physics', 'chemistry', 'biology', 'math', 'formula', 'equation'],
  };

  const lower = message.toLowerCase();
  const found: string[] = [];

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(k => lower.includes(k))) {
      found.push(topic);
    }
  }

  return found;
}
