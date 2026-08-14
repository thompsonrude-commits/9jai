export function detectFallbackLanguageCode(input: string): string {
  const text = (input || '').trim();
  if (!text) return 'pcm';

  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/(\bhow you dey\b|\bhow far\b|\bwetin\b|\babeg\b|\bno wahala\b|\boya\b|\bnaija\b|\bdey\b)/i.test(normalized)) return 'pcm';
  if (/(\bbawo\b|\bẹ kaaro\b|\be se\b|\bbẹẹni\b|\bkinni\b|\byoruba\b)/i.test(normalized)) return 'yo';
  if (/(\bkedu\b|\bdaalu\b|\bị dị mma\b|\bo dị mma\b|\bbiko\b|\bgini\b|\bigbo\b|\bnno\b)/i.test(normalized)) return 'ig';
  if (/(\bsannu\b|\byaya\b|\blafiya\b|\bna gode\b|\bdon allah\b|\bhausa\b)/i.test(normalized)) return 'ha';
  if (/(vbee\s+oye\s+he|vbee|oyese|uru\s+ese|ob[oa]?wie|obavan|obota|laho|esan)/i.test(normalized)) return 'esan';
  if (/(\bkoyo\b|\bobi\w*\b|\bbebi\b|\bedo\b|\bbini\b|\bẹdo\b)/i.test(normalized)) return 'edo';
  if (/(\bhello\b|\bhi\b|\bhey\b|\bwhat\b|\bhow\b|\bplease\b|\bthank\b)/i.test(normalized)) return 'en';
  return 'pcm';
}

export function getLocalFallbackResponse(input: string, languageCode?: string): string {
  const normalized = (input || '').trim();
  const code = languageCode || detectFallbackLanguageCode(normalized);

  const generic = {
    en: 'The AI service is temporarily unavailable right now, but I can still help you. Please try again in a moment.',
    pcm: 'AI service no dey available for now, but I still fit help you. Try again small small.',
    yo: 'Iṣẹ́ AI ko sí lójúko ni bayi, ṣùgbọ́n mo lè ràn ọ́ lọ́wọ́. Jọ̀ ṣe ìgbà díẹ̀.',
    ig: 'Ndị AI anaghị ahu ugbu a, mana m ga-enyere gị aka. Biko nwaa ntakịrị.',
    ha: 'Aikin AI ba a samu a yanzu, amma ina iya taimaka maka. Ka sake gwadawa cikin ɗan lokaci.',
    edo: 'Ẹghẹ AI ọ rre khin nẹ, ma vbe khian mue. Tẹ vbe kpa rre ẹghẹ rre.',
    esan: 'Ẹghẹ AI ọ rre khin nẹ, ma vbe khian mue. Tẹ vbe kpa rre ẹghẹ rre.',
  } as const;

  const short = {
    en: 'Hello! I am 9JA AI. I can still help with your question while the cloud provider reconnects.',
    pcm: 'How far! I be 9JA AI. I still fit help you while the cloud network come back.',
    yo: 'Ẹ káàbọ̀! Mo jẹ́ 9JA AI. Mo lè ṣe iranlọwọ fun ọ nígbà tí ìsopọ̀ ìrànwọ́ cloud bá dé.',
    ig: 'Nnọọ! Abụ m 9JA AI. M ga-enyere gị aka ka netwọk cloud bọnọgharịa.',
    ha: 'Sannu! Ni ne 9JA AI. Zan iya taimaka maka yayin da sabis ɗin cloud ya sake haɗawa.',
    edo: 'Kọyọ! I be 9JA AI. I vbe khian muẹre ne, ma vbe rre ghọ gbera ma.',
    esan: 'Kọyo! I be 9JA AI. I vbe khian muẹre ne, ma vbe rre ghọ gbera ma.',
  } as const;

  if (!normalized) {
    return generic[code as keyof typeof generic] || generic.pcm;
  }

  const lower = normalized.toLowerCase();
  if (/\b(hello|hi|hey|good morning|good evening|how are you)\b/i.test(lower)) {
    return short[code as keyof typeof short] || short.pcm;
  }

  if (/\b(what is 2 \+ 2|2 \+ 2|calculate|sum)/i.test(lower)) {
    return {
      en: '2 + 2 = 4.',
      pcm: '2 + 2 = 4.',
      yo: '2 + 2 = 4.',
      ig: '2 + 2 = 4.',
      ha: '2 + 2 = 4.',
      edo: '2 + 2 = 4.',
      esan: '2 + 2 = 4.',
    }[code] || '2 + 2 = 4.';
  }

  if (/\b(weather|forecast|temperature|rain|sunny|cloudy|storm|hot|cold)\b/i.test(lower)) {
    return {
      en: 'I cannot fetch live weather right now because the connection is unavailable, but I can help you check the weather once the provider is back online.',
      pcm: 'I no fit check live weather now because the connection no dey, but I fit help you as soon as the provider come back.',
      yo: 'Mo ko le ṣe àkàwé oju ojo lójúko ni bayi nitori asopọ́ ko sí, ṣùgbọ́n mo lè ràn ọ́ lọ́wọ́ nígbà tí olùsèso bá wá padà.',
      ig: 'Enweghachahụ mmiri adịghị apụta ugbu a ni ihi na netwọk adịghị, mana m ga-enyere gị mgbe ngwá ọrụ ahụ bidoro.',
      ha: 'Ba zan iya samun yanayin yanayi na ainihin a yanzu saboda haɗin ba ya da, amma zan iya taimaka maka da zarar mai bada sabis ya dawo.',
      edo: 'Amiẹnweghẹ uvbi ọ ta rre nẹ, ita nọre vá; ma vbe khian muẹre ne, ma gbe rre gae ya.',
      esan: 'Amiẹnweghẹ uvbi ọ ta rre nẹ, ita nọre vá; ma vbe khian muẹre ne, ma gbe rre gae ya.',
    }[code] || 'I cannot fetch live weather right now because the connection is unavailable.';
  }

  if (/\b(what happened in nigeria today|latest news|today.*nigeria|news.*nigeria|current.*nigeria|search)\b/i.test(lower)) {
    return {
      en: 'I can help with the search once live web access is available. For now, I cannot verify current news without a working search provider.',
      pcm: 'I fit help with search when live web access come back. For now, I no fit verify current news without working search provider.',
      yo: 'Mo lè ṣe iranlọwọ ìṣàwárí nígbà tí ìṣàwárí wẹẹbu bá dé. Lọwọlọwọ, mo ko le fi ẹri ìròyìn ode oni.',
      ig: 'M ga-enyere gị na nchọgharị mgbe ọ bụ́ na ịntanet na-arụ ọrụ. Ugbu a, m enweghị ike ijide ozi dị ugbu a na-enweghị nleba koodu nchọgharị.',
      ha: 'Zan iya taimaka da bincike da zarar samun damar yanar gizo ya dawo. Yanzu, ba zan iya tabbatar da labaran yau ba ba tare da ingantaccen mai bincike ba.',
      edo: 'I vbe khian muẹre nẹ ma vbe wẹre agbonu ni, ka a vbe re gho ai ha. Rẹvbe, a ma gha miẹn wẹre na ya bini nẹ.',
      esan: 'I vbe khian muẹre nẹ ma vbe wẹre agbonu ni, ka a vbe re gho ai ha. Rẹvbe, a ma gha miẹn wẹre na ya bini nẹ.',
    }[code] || 'I can help with the search once live web access is available.';
  }

  return {
    en: `I am 9JA AI. I can still help with: “${normalized}”. The live provider is temporarily unavailable, but the local fallback is ready to assist.`,
    pcm: `I be 9JA AI. I still fit help with: “${normalized}”. The live provider no dey available for now, but I dey ready to assist.`,
    yo: `Mo jẹ́ 9JA AI. Mo lè ràn ọ́ lọ́wọ́ fún: “${normalized}”. Olùsèso alààyè ko sí lójúko ni bayi, ṣùgbọ́n mo ti ṣetán láti ràn ọ́ lọ́wọ́.`,
    ig: `Abụ m 9JA AI. M ga-enyere gị gbasara: “${normalized}”. Ngwá ọrụ dị n’ịntanet adịghị a, mana m dị njikere ịnye aka.`,
    ha: `Ni ne 9JA AI. Zan iya taimaka da: “${normalized}”. Mai bada sabis na ainihin bai samu ba a yanzu, amma ina shirye don taimakawa.`,
    edo: `I be 9JA AI. I vbe khian muẹre ne: “${normalized}”. Aza kevbe no gha rre nẹ, ma vbe tie ya.`,
    esan: `I be 9JA AI. I vbe khian muẹre ne: “${normalized}”. Aza kevbe no gha rre nẹ, ma vbe tie ya.`,
  }[code] || `I am 9JA AI. I can still help with: “${normalized}”.`;
}
