// Pidgin grammar normalization utilities

export function normalizePidginGrammar(text: string): string {
  if (!text) return text;
  let out = text;

  // Preserve leading/trailing whitespace
  const leading = out.match(/^\s*/)?.[0] || '';
  const trailing = out.match(/\s*$/)?.[0] || '';
  out = out.trim();

  // Rule: Sentence-start "me" -> "I"
  out = out.replace(/^me(\b)/i, (m) => m[0] === m[0].toLowerCase() ? 'I' : 'I');

  // Common incorrect patterns where "I" appears as object after verbs — convert to "me"
  out = out.replace(/\b(Tell|tell|Give|give|Show|show|Help|help|Ask|ask|Bring|bring|Send|send)\s+I\b/g, (m) => {
    return m.replace(/\bI\b/, 'me');
  });

  // Convert patterns like "Tell I wetin" -> "Tell me wetin"
  out = out.replace(/\b([Tt]ell|[Gg]ive|[Ss]how|[Hh]elp)\s+I\s+/g, (m, p1) => `${p1} me `);

  // If phrase starts with "Me go" or "Me dey" (subject) -> "I go" / "I dey"
  out = out.replace(/^me\s+(go|dey|wan|go\sto|go\sdo|fit|going)\b/i, (m) => m.replace(/^me/i, 'I'));
  out = out.replace(/\bme\s+(go|dey|wan|fit|going)\b/gi, (m) => m.replace(/\bme\b/i, 'I'));

  // Fix "Me and" -> "Me and ..." keep as-is but ensure capitalization
  out = out.replace(/^me\s+and\b/i, (m) => 'I and');

  // Common wrong: "I tell me" -> "I tell you"
  out = out.replace(/\bI\s+tell\s+me\b/gi, 'I tell you');

  // Ensure object pronouns after verbs are "me"
  out = out.replace(/\b(I)\s+(give|tell|show|help|ask|bring|send)\s+me\b/gi, (m) => m); // keep valid
  out = out.replace(/\b(I)\s+(give|tell|show|help|ask|bring|send)\s+I\b/gi, (m) => m.replace(/\bI\b$/i, 'me'));

  // Protect contractions and valid english words — do not convert lower-case 'me' inside words

  // Some polite patterns: "Me and am go there" -> "I and am go there" (rudimentary)
  out = out.replace(/\bme\s+and\s+(am|go|go\sto|go\sdo)\b/gi, (m) => m.replace(/\bme\b/i, 'I'));

  // Simple cleanup spacing
  out = out.replace(/\s{2,}/g, ' ');

  // Restore capitalization for sentence start
  out = out.replace(/^i\b/, 'I');

  return leading + out + trailing;
}

export function isLikelyPidgin(text: string): boolean {
  if (!text) return false;
  const pcmKeywords = ['abi','abeg','i dey','dey','how far','wetin','na','omo','oga','wey','no be','wetin'];
  const lc = text.toLowerCase();
  let hits = 0;
  for (const k of pcmKeywords) if (lc.includes(k)) hits++;
  return hits >= 1;
}
