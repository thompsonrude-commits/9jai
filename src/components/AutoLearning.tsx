import { useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Auto-learning system that monitors user messages for corrections
 * and automatically saves them to the training database
 */

export function useAutoLearning(
  messages: any[],
  detectedLanguage: string,
  userId?: string
) {
  useEffect(() => {
    if (messages.length < 2) return;

    const lastMessage = messages[messages.length - 1];
    const previousMessage = messages[messages.length - 2];

    // Only process user messages
    if (lastMessage.role !== 'user') return;

    const text = lastMessage.content.toLowerCase().trim();

    // Detect correction keywords
    const isCorrectionMessage =
      text.startsWith('correction:') ||
      text.startsWith('correct:') ||
      text.includes('the correct') ||
      text.includes('should be') ||
      text.includes('not correct') ||
      text.includes('wrong answer') ||
      text.includes('that is wrong') ||
      text.includes('this is wrong');

    if (isCorrectionMessage && previousMessage.role === 'assistant') {
      // Extract correction details
      const aiResponse = previousMessage.content;
      const userCorrection = lastMessage.content;

      // Save to training database automatically
      saveCorrection(aiResponse, userCorrection, detectedLanguage, userId);
    }

    // Also learn from conversational flow
    if (lastMessage.role === 'user' && previousMessage.role === 'assistant') {
      learnConversationPattern(previousMessage.content, lastMessage.content, detectedLanguage);
    }
  }, [messages, detectedLanguage, userId]);
}

async function saveCorrection(
  aiResponse: string,
  userCorrection: string,
  language: string,
  userId?: string
) {
  try {
    // Parse the correction
    const correctionText = userCorrection
      .replace(/^correction:?\s*/i, '')
      .replace(/^correct:?\s*/i, '')
      .trim();

    await addDoc(collection(db, 'aiTraining'), {
      type: 'correction',
      language: language || 'pcm',
      correction: `AI said: "${aiResponse.substring(0, 200)}..." | User correction: "${correctionText}"`,
      aiResponse: aiResponse,
      userCorrection: correctionText,
      edoText: correctionText,
      englishText: `Correction for: ${aiResponse.substring(0, 100)}`,
      autoLearned: true,
      userId: userId || 'anonymous',
      createdAt: serverTimestamp(),
    });

    console.log('✅ Auto-learned correction saved to training database');
  } catch (error) {
    console.error('❌ Failed to save correction:', error);
  }
}

async function learnConversationPattern(
  aiMessage: string,
  userMessage: string,
  language: string
) {
  try {
    // Skip if messages are too short or in English
    if (aiMessage.length < 10 || userMessage.length < 10) return;
    if (language === 'en') return;

    // Learn natural conversation flow
    await addDoc(collection(db, 'conversationPatterns'), {
      language: language || 'pcm',
      aiMessage: aiMessage,
      userResponse: userMessage,
      pattern: `Q: ${aiMessage} | A: ${userMessage}`,
      autoLearned: true,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Conversation pattern learned');
  } catch (error) {
    console.error('❌ Failed to learn conversation pattern:', error);
  }
}
