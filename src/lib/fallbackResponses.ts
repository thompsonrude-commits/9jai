import { isLikelyPidgin, normalizePidginGrammar } from './pidginNormalizer';

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

  if (/\b(photosynthesis|water cycle|heart|pulley|computer|cell|atom|ecosystem|battery|machine|kidney|brain|photosystem)\b/i.test(lower)) {
    const educational = {
      en: /photosynthesis/i.test(lower)
        ? 'Photosynthesis is the process plants use to turn sunlight, water, and carbon dioxide into glucose and oxygen. In simple terms: sunlight powers the plant, water is absorbed by the roots, carbon dioxide enters through the leaves, and the plant makes food while releasing oxygen.'
        : /water cycle/i.test(lower)
          ? 'The water cycle has four main steps: evaporation, condensation, precipitation, and collection. Heat from the sun turns water into vapor, the vapor cools into clouds, rain falls, and water gathers back in rivers, lakes, and oceans.'
          : /heart/i.test(lower)
            ? 'The heart is a muscular pump that pushes blood around the body. It sends oxygen-rich blood to the body and oxygen-poor blood back to the lungs to pick up oxygen again.'
            : /pulley/i.test(lower)
              ? 'A pulley is a simple machine that changes the direction of a force and can reduce the effort needed to lift a heavy load. It works by looping a rope around a wheel and using a downward pull to lift an object upward.'
              : /computer/i.test(lower)
                ? 'A computer has input, processing, storage, and output parts. The CPU processes information, memory stores data temporarily, storage keeps files, and the screen or printer shows the result.'
                : 'Here is the simple idea: the system starts with an input, the core part processes it, and the result is produced for the user or next step.',
      pcm: /photosynthesis/i.test(lower)
        ? 'Photosynthesis na the process wey plants use to turn sunlight, water, and carbon dioxide into glucose and oxygen. In simple terms: sunlight power the plant, water enter through the roots, carbon dioxide enter through the leaf, and the plant make food while oxygen comot.'
        : /water cycle/i.test(lower)
          ? 'Water cycle get four main steps: evaporation, condensation, precipitation, and collection. Sun heat turn water to vapor, the vapor cool and form cloud, rain fall, and water gather back for river, lake, and ocean.'
          : /heart/i.test(lower)
            ? 'Heart na one muscle wey pump blood around the body. E send oxygen-rich blood go body and oxygen-poor blood go back to lungs to collect oxygen again.'
            : /pulley/i.test(lower)
              ? 'Pulley na simple machine wey change direction of force and fit reduce effort for lifting heavy load. E work by putting rope around wheel and pulling down to lift something up.'
              : /computer/i.test(lower)
                ? 'Computer get input, processing, storage, and output. CPU dey process information, memory store data temporary, storage keep files, and screen or printer show result.'
                : 'The main idea be: input enter, core process am, and result come out for the user or next step.'
    } as const;

    if (code === 'pcm' && isLikelyPidgin(educational.pcm)) {
      return normalizePidginGrammar(educational.pcm);
    }

    return educational[code as keyof typeof educational] || educational.en;
  }

  const genericLockedResponse = {
    en: 'I am 9JA AI. The live provider is temporarily unavailable, but I can still help you with your question as soon as the connection is restored.',
    pcm: 'I be 9JA AI. The live provider no dey available for now, but I still fit help you as soon as the connection come back.',
    yo: 'Mo jẹ́ 9JA AI. Olùsèso alààyè ko sí lójúko ni bayi, ṣùgbọ́n mo lè ràn ọ́ lọ́wọ́ lẹ́ẹ̀kan náà nígbà tí ìsopọ̀ bá dé.',
    ig: 'Abụ m 9JA AI. Ngwá ọrụ dị n’ịntanet adịghị a, mana m ga-enyere gị aka ka njikọ dị n’ọnụ.',
    ha: 'Ni ne 9JA AI. Mai bada sabis na ainihin bai samu ba a yanzu, amma zan iya taimaka maka da zarar haɗin ya dawo.',
    edo: 'I be 9JA AI. Aza kevbe no gha rre nẹ, ma vbe khian muẹre ne, ma vbe rre ghọ gbera ma.',
    esan: 'I be 9JA AI. Aza kevbe no gha rre nẹ, ma vbe khian muẹre ne, ma vbe rre ghọ gbera ma.',
  } as const;

  const finalText = genericLockedResponse[code as keyof typeof genericLockedResponse] || genericLockedResponse.en;

  if (code === 'pcm' && isLikelyPidgin(finalText)) {
    return normalizePidginGrammar(finalText);
  }

  return finalText;
}
