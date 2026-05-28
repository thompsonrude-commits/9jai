# Vocabulary Gap Analysis - Quick Reference Guide

## At a Glance

- **Total Languages:** 127
- **With Vocabularies:** 24 (19%)
- **Missing Vocabularies:** 103 (81%)

---

## Languages WITH Vocabularies (24)

### In languageVocabularies.ts (14)
1. pidgin
2. yoruba
3. igbo
4. hausa
5. efik
6. ibibio
7. ijaw
8. urhobo
9. isoko
10. fulfulde
11. kanuri
12. tiv
13. nupe
14. idoma

### In additionalLanguageVocabularies.ts (10)
1. esan
2. afemai
3. igala
4. ebira
5. itsekiri
6. ogoni
7. kalabari
8. nembe
9. ogbia
10. jukun

---

## Top 20 Languages MISSING Vocabularies (by speaker count)

| Rank | Language ID | Language Name | Speakers | Region | State |
|------|-------------|---------------|----------|--------|-------|
| 1 | katsina-hausa | Katsina Hausa | 6 million+ | North-West | Katsina |
| 2 | hausa | Hausa (main) | 70 million+ | North-West | Kano |
| 3 | jigawa-hausa | Jigawa Hausa | 4 million+ | North-West | Jigawa |
| 4 | hausa-sokoto | Hausa (Sokoto) | 5 million+ | North-West | Sokoto |
| 5 | zamfara-hausa | Zamfara Hausa | 3 million+ | North-West | Zamfara |
| 6 | kebbi-hausa | Kebbi Hausa | 2 million+ | North-West | Kebbi |
| 7 | hausa-niger | Hausa (Niger) | 2 million+ | North-Central | Niger |
| 8 | oyo-yoruba | Oyo Yoruba | 3 million+ | South-West | Oyo |
| 9 | enugu-igbo | Enugu Igbo | 2 million+ | South-East | Enugu |
| 10 | owerri-igbo | Owerri Igbo | 2 million+ | South-East | Imo |
| 11 | ngwa-igbo | Ngwa Igbo | 1 million+ | South-East | Abia |
| 12 | ondo-yoruba | Ondo Yoruba | 1 million+ | South-West | Ondo |
| 13 | ekiti-yoruba | Ekiti Yoruba | 1 million+ | South-West | Ekiti |
| 14 | shuwa-arabic | Shuwa Arabic | 1 million+ | North-East | Borno |
| 15 | annang | Annang | 1 million+ | South-South | Akwa Ibom |
| 16 | gbagyi | Gbagyi | 1 million+ | North-Central | Niger |
| 17 | egba | Egba | 500,000+ | South-West | Ogun |
| 18 | ijesa | Ijesa | 500,000+ | South-West | Osun |
| 19 | berom | Berom | 500,000+ | North-Central | Plateau |
| 20 | bachama | Bachama | 500,000+ | North-East | Adamawa |

---

## Missing Vocabularies by Region

### South-South (11 missing)
- owan, ukwuani, ejagham, bekwarra, annang, oron, ikwerre

### South-West (8 missing)
- egun, awori, egba, oyo-yoruba, ondo-yoruba, ikale, ekiti-yoruba, ijesa

### South-East (8 missing)
- ngwa-igbo, aro, enugu-igbo, igede, owerri-igbo, oguta, izii, ezza

### North-Central (10 missing)
- baruten, gbagyi, hausa-niger, berom, angas, tyap, eggon, alago

### North-West (8 missing)
- gbagyi-kaduna, kataf, hausa-sokoto, kambari, kebbi-hausa, dendi, zamfara-hausa, katsina-hausa, jigawa-hausa

### North-East (10 missing)
- shuwa-arabic, bura, marghi, bade, ngizim, bachama, chamba, mumuye, tangale, tera, gerawa, warji, kuteb

---

## Priority Action Items

### CRITICAL (1M+ speakers, no vocabulary)
- [ ] Hausa dialects (6 variants, 11M+ combined)
- [ ] Yoruba dialects (3 variants, 5M+ combined)
- [ ] Igbo dialects (3 variants, 5M+ combined)
- [ ] Shuwa Arabic (1M+)
- [ ] Annang (1M+)
- [ ] Gbagyi (1M+)

### HIGH (500K-1M speakers, no vocabulary)
- [ ] Ikwerre (500K+)
- [ ] Berom (500K+)
- [ ] Bachama (500K+)
- [ ] Ijesa (500K+)
- [ ] Awori (300K+)
- [ ] Egba (500K+)
- [ ] Ikale (300K+)
- [ ] Bura (300K+)
- [ ] Chamba (300K+)
- [ ] Mumuye (400K+)
- [ ] Ezza (400K+)
- [ ] Baruten (300K+)
- [ ] Angas (300K+)
- [ ] Eggon (300K+)

### MEDIUM (100K-500K speakers, no vocabulary)
- [ ] Owan, Ukwuani, Ejagham, Bekwarra, Oron
- [ ] Egun, Aro, Oguta, Izii
- [ ] Igede, Tyap, Kataf, Alago
- [ ] Kambari, Dendi, Marghi, Bade, Ngizim
- [ ] Tangale, Tera, Gerawa, Warji, Kuteb

---

## Implementation Notes

### File Structure
- **languageVocabularies.ts** - Main vocabulary file (14 languages)
- **additionalLanguageVocabularies.ts** - Additional vocabularies (10 languages)
- **nigerianLanguages.ts** - Language definitions (127 languages)

### Adding New Vocabularies

1. **For major languages (1M+ speakers):** Add to `languageVocabularies.ts`
2. **For regional/dialect languages:** Add to `additionalLanguageVocabularies.ts`
3. **Follow the LanguageVocabulary interface:**
   ```typescript
   export interface LanguageVocabulary {
     languageId: string;
     categories: VocabCategory[];
     grammarNotes: string;
     culturalNote: string;
     audioArchive?: string;
   }
   ```

### Recommended Categories for Each Language
- Greetings & Courtesy
- Family & People
- Numbers
- Body Parts
- Food & Drinks
- Action Verbs
- Everyday Phrases
- Culture & Religion

---

## Special Cases

### Edo Language
- **Status:** Not in vocabulary files
- **Speakers:** 4 million+
- **Note:** Uses separate repository system (repository.ts)
- **Action:** Determine integration strategy

### Duplicate Language IDs
Some languages appear in multiple regions with different IDs:
- **Igala:** igala (appears in both South-East and North-Central)
- **Igede:** igede (appears in both South-East and North-Central)
- **Gbagyi:** gbagyi, gbagyi-kaduna (Niger vs Kaduna)
- **Tyap/Kataf:** tyap, kataf (Plateau vs Kaduna)
- **Hausa variants:** hausa, hausa-sokoto, hausa-niger, kebbi-hausa, katsina-hausa, zamfara-hausa, jigawa-hausa

---

## Coverage by Region

| Region | Coverage | Status |
|--------|----------|--------|
| Pidgin English | 100% | ✅ Complete |
| South-South | 45% | ⚠️ Needs work |
| South-West | 11% | ❌ Critical gap |
| South-East | 20% | ❌ Critical gap |
| North-Central | 33% | ⚠️ Needs work |
| North-West | 27% | ⚠️ Needs work |
| North-East | 20% | ❌ Critical gap |

---

## Next Steps

1. **Week 1:** Add Hausa dialect vocabularies
2. **Week 2:** Add Yoruba and Igbo dialect vocabularies
3. **Week 3:** Add remaining 1M+ speaker languages
4. **Week 4:** Add 500K-1M speaker languages
5. **Ongoing:** Add remaining languages by priority

