import type { ProviderId } from '../types';

export interface AILayerOutput {
  optimizedPrompt: string;
  preferredProviders: ProviderId[];
  capability: string;
}

export const aiIntelligenceLayer = {
  async processRequest(input: Record<string, unknown>): Promise<AILayerOutput> {
    const rawPrompt = (input.prompt as string | undefined) ?? '';
    const preferredProviders = (input.preferredProviders as ProviderId[] | undefined) ?? [];

    // Language-aware adjustments: if the user requests Edo, include lexicon guidance
    try {
      const targetLang = (input.targetLanguage as string | undefined) || ((rawPrompt || '').toLowerCase().includes('to edo') ? 'edo' : undefined);
      if (targetLang === 'edo') {
        const { listApproved, listRecent } = await import('../lexicon/edoLexiconStore');
        const approved = listApproved(10).slice(0, 10).map(e => e.word).filter(Boolean);
        const recent = listRecent(20).slice(0, 10).map(e => e.word).filter(Boolean);
        const glossaryTerms = [...new Set([...approved, ...recent])].slice(0, 10);
        const glossary = glossaryTerms.length
          ? ` EDO_GLOSSARY_PRIORITY: ${glossaryTerms.join(', ')}. Use these words first when they fit; if a term is uncertain, mark it as [uncertain Edo term] rather than inventing a translation.`
          : ' EDO_GLOSSARY_PRIORITY: Use simple, neutral Edo phrasing first and mark any uncertain term as [uncertain Edo term] instead of inventing a literal translation.';

        return {
          optimizedPrompt: `${rawPrompt.trim()} Please translate/compose with Edo-first wording. Prefer verified meaning and avoid mixing unrelated languages.${glossary}`,
          preferredProviders: preferredProviders,
          capability: 'language-edo',
        };
      }
    } catch (err) {
      // ignore lexicon errors and fall back to general behavior
      console.warn('[aiIntelligenceLayer] lexicon integration failed', err);
    }

    return {
      optimizedPrompt: rawPrompt,
      preferredProviders,
      capability: 'general',
    };
  },
  async learnFromGeneration(_input: Record<string, unknown>): Promise<void> {
    return;
  },

  getLearningSnapshot(): Record<string, unknown> {
    return {};
  },
  getCharacterMemory(): Record<string, unknown> {
    return {};
  },
};
