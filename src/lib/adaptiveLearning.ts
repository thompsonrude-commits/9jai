/**
 * Adaptive Learning Engine — Self-improving AI system
 * The AI learns from user corrections, preferences, and interactions
 * Stores validated knowledge in Firestore + localStorage
 */

import { db } from './firebase';
import {
  collection, doc, setDoc, getDoc, getDocs,
  query, orderBy, limit, where, serverTimestamp, addDoc
} from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface LearnedCorrection {
  id: string;
  originalResponse: string;
  correctedResponse: string;
  topic: string;
  language: string;
  confidence: number;       // 0-1, increases with multi-user validation
  validatedBy: number;      // how many users confirmed this correction
  rejectedBy: number;       // how many users rejected this correction
  source: 'user' | 'admin';
  status: 'pending' | 'validated' | 'rejected';
  createdAt: number;
  updatedAt: number;
}

export interface LanguageLearning {
  language: string;
  phrases: Record<string, string>;      // learned phrase → correct translation
  grammar: string[];                     // learned grammar rules
  slang: Record<string, string>;        // slang → meaning
  corrections: number;                  // total corrections made
  lastUpdated: number;
}

export interface UserBehaviorPattern {
  userId: string;
  preferredLanguage: string;
  preferredTone: 'formal' | 'casual' | 'pidgin';
  technicalLevel: 'beginner' | 'intermediate' | 'expert';
  topicsOfInterest: string[];
  avgMessageLength: number;
  sessionCount: number;
  lastSeen: number;
}

export interface CorrectionIntent {
  detected: boolean;
  type: 'factual' | 'language' | 'tone' | 'format' | 'unknown';
  originalText: string;
  correctedText: string;
  confidence: number;
}

// ── Correction detection ───────────────────────────────────────────────────

export function detectCorrectionIntent(
  userMessage: string,
  previousAIResponse: string
): CorrectionIntent {
  const lower = userMessage.toLowerCase();

  // Strong correction signals
  const correctionPhrases = [
    'that is wrong', "that's wrong", 'you are wrong', "you're wrong",
    'incorrect', 'not correct', 'that is not right', "that's not right",
    'actually', 'no, it is', 'no, the correct', 'the right answer is',
    'you made a mistake', 'wrong answer', 'fix that', 'correct yourself',
    'that is false', 'false information', 'wrong information',
    'the correct translation', 'actually in', 'it should be',
    'you got it wrong', 'that is not how', 'wrong way',
  ];

  const hasCorrectionPhrase = correctionPhrases.some(p => lower.includes(p));

  if (!hasCorrectionPhrase) {
    return { detected: false, type: 'unknown', originalText: '', correctedText: '', confidence: 0 };
  }

  // Determine correction type
  let type: CorrectionIntent['type'] = 'factual';
  if (lower.includes('translation') || lower.includes('language') || lower.includes('word') || lower.includes('phrase')) {
    type = 'language';
  } else if (lower.includes('tone') || lower.includes('formal') || lower.includes('rude') || lower.includes('polite')) {
    type = 'tone';
  } else if (lower.includes('format') || lower.includes('structure') || lower.includes('layout')) {
    type = 'format';
  }

  return {
    detected: true,
    type,
    originalText: previousAIResponse.slice(0, 500),
    correctedText: userMessage,
    confidence: hasCorrectionPhrase ? 0.85 : 0.5,
  };
}

// ── Validation system ──────────────────────────────────────────────────────
// Prevents malicious learning, misinformation, prompt injection

export function validateCorrection(correction: Omit<LearnedCorrection, 'id' | 'createdAt' | 'updatedAt'>): {
  valid: boolean;
  reason?: string;
  adjustedConfidence: number;
} {
  const text = correction.correctedResponse.toLowerCase();

  // Security filters — reject harmful content
  const harmfulPatterns = [
    /ignore (previous|all|your) instructions/i,
    /you are now/i,
    /forget (everything|all|your)/i,
    /new (persona|identity|role)/i,
    /jailbreak/i,
    /bypass (safety|filter|restriction)/i,
    /(kill|harm|hurt|attack) (people|users|humans)/i,
    /hate speech/i,
    /racial slur/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(correction.correctedResponse)) {
      return { valid: false, reason: 'Harmful content detected', adjustedConfidence: 0 };
    }
  }

  // Reject very short corrections (likely noise)
  if (correction.correctedResponse.trim().length < 3) {
    return { valid: false, reason: 'Correction too short', adjustedConfidence: 0 };
  }

  // Reduce confidence for unverified single-user corrections
  let adjustedConfidence = correction.confidence;
  if (correction.validatedBy < 2) {
    adjustedConfidence *= 0.7; // reduce until multi-user validated
  }

  return { valid: true, adjustedConfidence };
}

// ── Store correction ───────────────────────────────────────────────────────

export async function storeCorrection(
  userId: string,
  correction: Omit<LearnedCorrection, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
  const validation = validateCorrection(correction);
  if (!validation.valid) {
    console.warn('[Learning] Rejected correction:', validation.reason);
    return null;
  }

  const entry: Omit<LearnedCorrection, 'id'> = {
    ...correction,
    confidence: validation.adjustedConfidence,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Store locally first
  try {
    const key = `corrections_${userId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const id = `corr_${Date.now()}`;
    existing.unshift({ ...entry, id });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));

    // Store in Firestore
    const ref = await addDoc(collection(db, 'ai_corrections'), {
      ...entry,
      userId,
      createdAt: serverTimestamp(),
    });

    console.info('[Learning] Correction stored:', ref.id);
    return ref.id;
  } catch (err) {
    console.warn('[Learning] Failed to store correction:', err);
    return null;
  }
}

// ── Load corrections for context ───────────────────────────────────────────

export function loadLocalCorrections(userId: string): LearnedCorrection[] {
  try {
    const key = `corrections_${userId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

// ── Build learning context for AI prompt ──────────────────────────────────

export function buildLearningContext(userId: string): string {
  const corrections = loadLocalCorrections(userId);
  if (corrections.length === 0) return '';

  // Only use high-confidence validated corrections
  const validated = corrections
    .filter(c => c.confidence >= 0.6 && c.status !== 'rejected')
    .slice(0, 10);

  if (validated.length === 0) return '';

  const lines = validated.map(c =>
    `- Previously corrected: "${c.originalResponse.slice(0, 80)}..." → User said: "${c.correctedText.slice(0, 80)}..."`
  ).join('\n');

  return `\n\n## LEARNED CORRECTIONS (apply these improvements):\n${lines}`;
}

// ── Language learning ──────────────────────────────────────────────────────

export function learnLanguagePhrase(
  language: string,
  phrase: string,
  translation: string,
  userId: string
): void {
  try {
    const key = `lang_learning_${language}`;
    const existing: LanguageLearning = JSON.parse(localStorage.getItem(key) || JSON.stringify({
      language,
      phrases: {},
      grammar: [],
      slang: {},
      corrections: 0,
      lastUpdated: Date.now(),
    }));

    existing.phrases[phrase.toLowerCase()] = translation;
    existing.corrections++;
    existing.lastUpdated = Date.now();

    localStorage.setItem(key, JSON.stringify(existing));
    console.info(`[Learning] Learned ${language} phrase: "${phrase}" = "${translation}"`);
  } catch (err) {
    console.warn('[Learning] Failed to store language phrase:', err);
  }
}

export function getLearnedPhrases(language: string): Record<string, string> {
  try {
    const key = `lang_learning_${language}`;
    const data: LanguageLearning = JSON.parse(localStorage.getItem(key) || '{}');
    return data.phrases ?? {};
  } catch { return {}; }
}

// ── User behavior tracking ─────────────────────────────────────────────────

export function updateUserBehavior(
  userId: string,
  update: Partial<UserBehaviorPattern>
): void {
  try {
    const key = `behavior_${userId}`;
    const existing: UserBehaviorPattern = JSON.parse(localStorage.getItem(key) || JSON.stringify({
      userId,
      preferredLanguage: 'en',
      preferredTone: 'casual',
      technicalLevel: 'intermediate',
      topicsOfInterest: [],
      avgMessageLength: 50,
      sessionCount: 0,
      lastSeen: Date.now(),
    }));

    const updated = { ...existing, ...update, lastSeen: Date.now() };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function getUserBehavior(userId: string): UserBehaviorPattern | null {
  try {
    const key = `behavior_${userId}`;
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch { return null; }
}

// ── Build personalization context ──────────────────────────────────────────

export function buildPersonalizationContext(userId: string): string {
  const behavior = getUserBehavior(userId);
  if (!behavior) return '';

  const parts: string[] = [];

  if (behavior.preferredTone === 'formal') {
    parts.push('User prefers formal, professional responses.');
  } else if (behavior.preferredTone === 'pidgin') {
    parts.push('User prefers Nigerian Pidgin English responses.');
  }

  if (behavior.technicalLevel === 'expert') {
    parts.push('User is technically advanced — use technical terms freely.');
  } else if (behavior.technicalLevel === 'beginner') {
    parts.push('User is a beginner — explain things simply, avoid jargon.');
  }

  if (behavior.topicsOfInterest.length > 0) {
    parts.push(`User frequently asks about: ${behavior.topicsOfInterest.slice(0, 3).join(', ')}.`);
  }

  return parts.length > 0 ? `\n\n## USER PERSONALIZATION:\n${parts.join('\n')}` : '';
}

// ── Multi-user consensus ───────────────────────────────────────────────────
// When multiple users make the same correction, increase confidence

export async function checkConsensus(
  correctedText: string,
  topic: string
): Promise<number> {
  try {
    const q = query(
      collection(db, 'ai_corrections'),
      where('topic', '==', topic),
      where('status', '==', 'pending'),
      limit(10)
    );
    const snap = await getDocs(q);

    // Count similar corrections
    let similarCount = 0;
    snap.forEach(doc => {
      const data = doc.data() as LearnedCorrection;
      if (data.correctedText && correctedText &&
          data.correctedText.toLowerCase().includes(correctedText.toLowerCase().slice(0, 20))) {
        similarCount++;
      }
    });

    // More users = higher confidence
    if (similarCount >= 5) return 0.95;
    if (similarCount >= 3) return 0.85;
    if (similarCount >= 2) return 0.75;
    return 0.6;
  } catch {
    return 0.6;
  }
}

// ── Admin: get all pending corrections ────────────────────────────────────

export async function getPendingCorrections(): Promise<LearnedCorrection[]> {
  try {
    const q = query(
      collection(db, 'ai_corrections'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LearnedCorrection));
  } catch {
    return [];
  }
}

// ── Admin: approve/reject correction ──────────────────────────────────────

export async function reviewCorrection(
  correctionId: string,
  action: 'approve' | 'reject'
): Promise<void> {
  try {
    const ref = doc(db, 'ai_corrections', correctionId);
    await setDoc(ref, {
      status: action === 'approve' ? 'validated' : 'rejected',
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[Learning] Failed to review correction:', err);
  }
}
