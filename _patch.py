from pathlib import Path
root = Path(r'C:\Users\Caterpilla\Downloads\africa language\Edo Language Ai')

# 1. language.ts
p = root/'src/lib/language.ts'
text = p.read_text(encoding='utf-8')
if "esan" not in text:
    text = text.replace("   edo: ['k?yo', 'koyo', 'obokhian', 'obokhe', 'ob\\'awie', 'uru ese', 'ma rrie', 'ob\\'avan'],\\n};", "   edo: ['k?yo', 'koyo', 'obokhian', 'obokhe', 'ob\\'awie', 'uru ese', 'ma rrie', 'ob\\'avan'],\\n   esan: ['vb?e oye h?', '?yese', 'uru ese', 'ob?wie', 'obavan', 'obota', 'lah?', 'esan'],\\n};")
    text = text.replace("      pcm: 'Nigerian Pidgin', yo: 'Yoruba', ig: 'Igbo', ha: 'Hausa', edo: 'Edo', efk: 'Efik', tiv: 'Tiv', fuv: 'Fulfulde', kan: 'Kanuri', sw: 'Swahili'", "      pcm: 'Nigerian Pidgin', yo: 'Yoruba', ig: 'Igbo', ha: 'Hausa', edo: 'Edo', esan: 'Esan', efk: 'Efik', tiv: 'Tiv', fuv: 'Fulfulde', kan: 'Kanuri', sw: 'Swahili'")
p.write_text(text, encoding='utf-8')

# 2. fallbackResponses.ts
p = root/'src/lib/fallbackResponses.ts'
text = p.read_text(encoding='utf-8')
if "vb?e oye h?" not in text:
    text = text.replace("  if (/(\\bkoyo\\b|\\bobi\\w*\\b|\\bobi\\w*\\b|\\bbebi\\b|\\bedo\\b|\\bbini\\b)/i.test(normalized)) return 'edo';\n", "  if (/(\\bvb?e oye h?\\b|\\bvb?e\\b|\\b?yese\\b|\\buru ese\\b|\\bob'?wie\\b|\\bob'avan\\b|\\bob'ota\\b|\\blah?\\b|\\besan\\b|\\b?san\\b)/i.test(normalized)) return 'esan';\n  if (/(\\bkoyo\\b|\\bobi\\w*\\b|\\bobi\\w*\\b|\\bbebi\\b|\\bedo\\b|\\bbini\\b|\\b?do\\b)/i.test(normalized)) return 'edo';\n")
    if "    esan:" not in text:
        text = text.replace("    edo: 'K?y?! I be 9JA AI. I vbe khian mu?re ne, ma vbe rre gh? gbera ma.',\n  } as const;\n", "    edo: 'K?y?! I be 9JA AI. I vbe khian mu?re ne, ma vbe rre gh? gbera ma.',\n    esan: 'K?y?! I be 9JA AI. I vbe khian mu?re ne, ma vbe rre gh? gbera ma.',\n  } as const;\n")
    if "     esan:" not in text:
        text = text.replace("     edo: '?gh? AI ? rre khin n?, ma vbe khian mue. T? vbe kpa rre ?gh? rre.',\n  } as const;\n", "     edo: '?gh? AI ? rre khin n?, ma vbe khian mue. T? vbe kpa rre ?gh? rre.',\n     esan: '?gh? AI ? rre khin n?, ma vbe khian mue. T? vbe kpa rre ?gh? rre.',\n  } as const;\n")
if "      esan:" not in text:
    text = text.replace("      edo: '2 + 2 = 4.',\n    }[code] || '2 + 2 = 4.';\n", "      edo: '2 + 2 = 4.',\n      esan: '2 + 2 = 4.',\n    }[code] || '2 + 2 = 4.';\n")
if "      esan:" not in text:
    text = text.replace("      edo: 'Ami?nwegh? uvbi ? ta rre n?, ita n?re vá; ma vbe khian mu?re ne, ma gbe rre gae ya.',\n    }[code] || 'I cannot fetch live weather right now because the connection is unavailable.';\n", "      edo: 'Ami?nwegh? uvbi ? ta rre n?, ita n?re vá; ma vbe khian mu?re ne, ma gbe rre gae ya.',\n      esan: 'Ami?nwegh? uvbi ? ta rre n?, ita n?re vá; ma vbe khian mu?re ne, ma gbe rre gae ya.',\n    }[code] || 'I cannot fetch live weather right now because the connection is unavailable.';\n")
if "      esan:" not in text:
    text = text.replace("      edo: 'I vbe khian mu?re n? ma vbe w?re agbonu ni, ka a vbe re gho ai ha. R?vbe, a ma gha mi?n w?re na ya bini n?.',\n    }[code] || 'I can help with the search once live web access is available.';\n", "      edo: 'I vbe khian mu?re n? ma vbe w?re agbonu ni, ka a vbe re gho ai ha. R?vbe, a ma gha mi?n w?re na ya bini n?.',\n      esan: 'I vbe khian mu?re n? ma vbe w?re agbonu ni, ka a vbe re gho ai ha. R?vbe, a ma gha mi?n w?re na ya bini n?.',\n    }[code] || 'I can help with the search once live web access is available.';\n")
if "     esan:" not in text:
    text = text.replace("     edo: `I am 9JA AI. I can still help with: \u201c${normalized}\u201d. The live provider is temporarily unavailable, but the local fallback is ready to assist.',\n   }[code] || `I am 9JA AI. I can still help with: “${normalized}”.`;\n", "     edo: `I am 9JA AI. I can still help with: \u201c${normalized}\u201d. The live provider is temporarily unavailable, but the local fallback is ready to assist.',\n     esan: `I am 9JA AI. I can still help with: \u201c${normalized}\u201d. The live provider is temporarily unavailable, but the local fallback is ready to assist.',\n   }[code] || `I am 9JA AI. I can still help with: “${normalized}”.`;\n")
p.write_text(text, encoding='utf-8')

# 3. homepageLanguageRouter.ts
p = root/'src/lib/homepageLanguageRouter.ts'
text = p.read_text(encoding='utf-8')
if "esan" not in text:
    anchor = "  edo: {\n    code: 'edo',\n    name: 'Edo',\n    folder: 'edo',\n    keywords: ['k?y?', 'k??', 'vbèè', 'obiluu', '?bowi?', '?bavan', '?bota', 'obo kia', 'òkhíen', '?dó'],\n    greetings: ['k?y?', 'k??', '?bowi?', '?bavan', '?bota', 'obo kia', 'òkhíen òwie', 'vbèè óye hé'],\n    slang: ['obiluu', 'uzébu', 'iyoba', 'oba', 'omwan', 'i horen', '?`dó', 'bini'],\n  },\n  efk: {\n"
    insert = "  esan: {\n    code: 'esan',\n    name: 'Esan',\n    folder: 'esan',\n    keywords: ['k?yo', '?yese', 'uru ese', 'vb?e oye h?', 'lah?', 'ob?wie', 'obavan', 'obota', 'esan'],\n    greetings: ['k?yo', 'vb?e oye h?', '?yese', 'uru ese', 'ob?wie', 'obavan', 'obota'],\n    slang: ['esan', '?dion', 'omon', 'iya', 'oba'],\n  },\n"
    text = text.replace(anchor, insert + anchor)
    text = text.replace("    efk: `You are 9JAI. You ONLY speak Efik. Greet: \"Abasi yaimo! Mi ye 9JAI.\"`", "    esan: `You are 9JAI. You ONLY speak Esan. NEVER mix Edo, Yoruba, Igbo, Hausa or Pidgin. Use K?yo, Vb?e oye h?, ?yese, Uru ese, Lah?, Ob?wie, Obavan, Obota. Greet: \"K?yo! I be 9JAI. Vb?e oye h??\"`,\n\n    efk: `You are 9JAI. You ONLY speak Efik. Greet: \"Abasi yaimo! Mi ye 9JAI.\"`")
p.write_text(text, encoding='utf-8')

# 4. systemPrompts.ts
p = root/'src/lib/systemPrompts.ts'
text = p.read_text(encoding='utf-8')
if "esan:" not in text:
    text = text.replace("  ha: `You are 9JAI — Hausa language AI.\nREPLY ONLY IN HAUSA. Zero Pidgin, English, Yoruba, Igbo, Edo.\nSHORT answers.\nKey words: Sannu=Hello | Barka da safe=Good morning | Na gode=Thank you | Don Allah=Please | A'a=No | Lafiya lau=I'm fine`,\n\n  edo: `You are 9JAI — Edo (Bini) language AI.", "  ha: `You are 9JAI — Hausa language AI.\nREPLY ONLY IN HAUSA. Zero Pidgin, English, Yoruba, Igbo, Edo.\nSHORT answers.\nKey words: Sannu=Hello | Barka da safe=Good morning | Na gode=Thank you | Don Allah=Please | A'a=No | Lafiya lau=I'm fine`,\n\n  esan: `You are 9JAI — Esan language AI.\nREPLY ONLY IN ESAN. Zero Edo, Yoruba, Igbo, Hausa, or Pidgin. Keep the response natural and respectful.\nKey words: K?yo=Hello | Vb?e oye h??=How are you? | ?yese=I am fine | Uru ese=Thank you | Lah?=Please | Ob?wie=Good morning`,\n\n  edo: `You are 9JAI — Edo (Bini) language AI.")
p.write_text(text, encoding='utf-8')

# 5. GeneralAssistant.tsx
p = root/'src/components/GeneralAssistant.tsx'
text = p.read_text(encoding='utf-8')
if "{ code: 'esan', label: 'Esan' }" not in text:
    text = text.replace("const LANGUAGE_OPTIONS = [\n  { code: 'en', label: 'English' },\n  { code: 'edo', label: 'Edo' },\n  { code: 'yo', label: 'Yoruba' },\n  { code: 'ig', label: 'Igbo' },\n  { code: 'ha', label: 'Hausa' },\n  { code: 'pcm', label: 'Nigerian Pidgin' },\n];", "const LANGUAGE_OPTIONS = [\n  { code: 'en', label: 'English' },\n  { code: 'edo', label: 'Edo' },\n  { code: 'esan', label: 'Esan' },\n  { code: 'yo', label: 'Yoruba' },\n  { code: 'ig', label: 'Igbo' },\n  { code: 'ha', label: 'Hausa' },\n  { code: 'pcm', label: 'Nigerian Pidgin' },\n];")
if "    esan: `K?yo" not in text:
    text = text.replace("    ha: `Sannu ${name}, me zan iya taimaka maka?`,\n    edo: `K?y? ${name}, ?ri? gbe mu?re n??`,\n  };", "    ha: `Sannu ${name}, me zan iya taimaka maka?`,\n    edo: `K?y? ${name}, ?ri? gbe mu?re n??`,\n    esan: `K?yo ${name}, vb?e oye h??`,\n  };\n")
p.write_text(text, encoding='utf-8')

print('patched')
