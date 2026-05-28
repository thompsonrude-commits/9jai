/**
 * South-South Nigerian Languages Vocabularies
 * Enhanced with cultural and historical information from web research
 * Includes: Esan, Owan, Annang, Ikwerre, and other South-South languages
 */

import { LanguageVocabulary, VocabCategory } from './languageVocabularies';

// ─────────────────────────────────────────────────────────────────────────────
// ESAN (Edo State) - Enhanced with cultural and historical data
// ─────────────────────────────────────────────────────────────────────────────
export const ESAN_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'esan',
  grammarNotes: `## Esan Grammar

**Classification:** Edoid language, closely related to Edo (Bini)
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Dialects:** 12+ dialects including Ogwa, Ẹkpoma (Ekuma), Ebhossa, Ewohimi, Ewu, Ewatto, Ebelle, Igueben, Irrua, Ohordua, Uromi, Uzea, Ubiaja, Ugboha
**Negation:** Negation particles used before or after verbs
**Pronouns:** Mẹ (I), Wẹ (You), Ọre (He/She), Ma (We), Wa (You pl.), Iran (They)`,
  culturalNote: `Esan is spoken by 500,000+ people on the Esan plateau in Edo State, approximately 136 meters above sea level. The Esan people traditionally organized themselves into a loose confederation of 35 independent kingdoms, each governed by its own Onojie (king). Unlike centralized kingdoms, this decentralized system reflects Esan democratic traditions. The name "Esan" is believed to derive from an Edo expression meaning "those who fled" or "those who jumped away." The Esan are primarily agriculturalists, hunters, and practitioners of traditional medicine. Staple crops include yams, cassava, cocoyam, maize, rice, beans, and groundnuts. The Esan have strong historical ties to the Benin Empire, with cultural bonds renewed in the 15th century when indigenes from the Great Benin Empire moved to Esanland. The Esan cultural festival celebrates their heritage annually.`,
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kọyo', translation: 'Hello', phonetic: 'Kaw-yaw' },
        { term: 'Obokhian', translation: 'Welcome', phonetic: 'O-bo-khian' },
        { term: 'Obokhe', translation: 'Response to welcome', phonetic: 'O-bo-khay' },
        { term: 'Vbẹe oye hẹ?', translation: 'How are you?', phonetic: 'Veh-eh oy-yeh heh' },
        { term: 'Ọyese', translation: 'I am fine / It is well', phonetic: 'Oh-yeh-seh' },
        { term: 'Uru ese', translation: 'Thank you', phonetic: 'Oo-roo ay-say' },
        { term: 'Lahọ', translation: 'Please', phonetic: 'La-haw' },
        { term: 'Ọkhíen Azẹkpẹrẹ', translation: 'See you later', phonetic: 'Ar-ze p-re' },
        { term: 'À khi dẹ̀', translation: 'Goodbye', phonetic: 'Ah khi deh' },
        { term: 'Dombọ', translation: 'Safe journey', phonetic: 'Dom-baw' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Erha', translation: 'Father', phonetic: 'Ay-ra' },
        { term: 'Iye', translation: 'Mother', phonetic: 'Ee-yay' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'Or-mor' },
        { term: 'Okpia', translation: 'Man', phonetic: 'Ok-pya' },
        { term: 'Okhuo', translation: 'Woman', phonetic: 'O-khwo' },
        { term: 'Ọtẹn', translation: 'Sibling/Relative', phonetic: 'Or-tayn' },
        { term: 'Ẹdion', translation: 'Elders', phonetic: 'Ay-dyon' },
        { term: 'Ọvbokhuo', translation: 'Wife', phonetic: 'Or-vor-khwo' },
        { term: 'Ọdọ', translation: 'Husband', phonetic: 'Or-daw' },
        { term: 'Ẹgbẹe', translation: 'Family', phonetic: 'Ay-gbay-ay' },
      ]
    },
    {
      category: 'Kingdoms & Governance',
      items: [
        { term: 'Onojie', translation: 'King / Ruler of an Esan kingdom', phonetic: 'O-no-jee' },
        { term: 'Ẹdion', translation: 'Council of elders', phonetic: 'Ay-dyon' },
        { term: 'Owa', translation: 'Palace / Royal residence', phonetic: 'O-wa' },
        { term: 'Ẹki', translation: 'Market / Trading center', phonetic: 'Ay-kee' },
        { term: 'Ẹkhaigbe', translation: 'Community gathering place', phonetic: 'Ay-khai-gbay' },
      ]
    },
    {
      category: 'Agriculture & Farming',
      items: [
        { term: 'Iyan', translation: 'Yam', phonetic: 'Ee-yan' },
        { term: 'Ẹkọ', translation: 'Cassava', phonetic: 'Ay-kaw' },
        { term: 'Ẹde', translation: 'Cocoyam', phonetic: 'Ay-day' },
        { term: 'Ẹkpọ', translation: 'Maize / Corn', phonetic: 'Ay-kpaw' },
        { term: 'Ẹkọ rẹ', translation: 'Rice', phonetic: 'Ay-kaw reh' },
        { term: 'Ẹbẹ', translation: 'Bean', phonetic: 'Ay-bay' },
        { term: 'Ọgiọgi', translation: 'Groundnut / Peanut', phonetic: 'Or-gyo-gee' },
        { term: 'Ẹviẹ', translation: 'Palm oil', phonetic: 'Ay-vyeh' },
      ]
    },
    {
      category: 'Cultural Practices',
      items: [
        { term: 'Ẹkhaigbe', translation: 'Community festival', phonetic: 'Ay-khai-gbay' },
        { term: 'Ọkpẹ', translation: 'Traditional dance', phonetic: 'Or-kpay' },
        { term: 'Ẹrinmwin', translation: 'Ancestral spirits / Veneration', phonetic: 'Ay-reen-mween' },
        { term: 'Ọba', translation: 'Royalty / Noble status', phonetic: 'Or-ba' },
        { term: 'Iha', translation: 'Destiny / Fate', phonetic: 'Ee-ha' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// OWAN (Edo State) - Combines Afemai and Igala influences
// ─────────────────────────────────────────────────────────────────────────────
export const OWAN_VOCAB: LanguageVocabulary = {
  languageId: 'owan',
  grammarNotes: `## Owan Grammar

**Classification:** Edoid language with Afemai and Igala influences
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Location:** Owan East and Owan West local government areas of Edo State
**Linguistic Ties:** Related to both Afemai (Yekhee/Etsako) and Igala languages
**Negation:** Negation particles used in verb phrases
**Pronouns:** Similar to neighboring Edoid languages`,
  culturalNote: `Owan is spoken by 200,000+ people in Owan East and Owan West local government areas of Edo State. The Owan people are an Edoid ethnic group with close ties to the Afemai and Igala peoples. The language reflects the cultural and linguistic diversity of northern Edo State. The Owan are primarily agriculturalists and traders. The Owan cultural festival celebrates their heritage and traditions. The language has been influenced by both Afemai (Yekhee/Etsako) and Igala, reflecting the region's linguistic complexity.`,
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kọyo', translation: 'Hello', phonetic: 'Kaw-yaw' },
        { term: 'Vbẹe oye hẹ?', translation: 'How are you?', phonetic: 'Veh-eh oy-yeh heh' },
        { term: 'Ọyese', translation: 'I am fine', phonetic: 'Oh-yeh-seh' },
        { term: 'Uru ese', translation: 'Thank you', phonetic: 'Oo-roo ay-say' },
        { term: 'Lahọ', translation: 'Please', phonetic: 'La-haw' },
        { term: 'À khi dẹ̀', translation: 'Goodbye', phonetic: 'Ah khi deh' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Erha', translation: 'Father', phonetic: 'Ay-ra' },
        { term: 'Iye', translation: 'Mother', phonetic: 'Ee-yay' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'Or-mor' },
        { term: 'Okpia', translation: 'Man', phonetic: 'Ok-pya' },
        { term: 'Okhuo', translation: 'Woman', phonetic: 'O-khwo' },
        { term: 'Ọse', translation: 'Friend', phonetic: 'Or-say' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Okpa', translation: 'One', phonetic: 'Ok-pa' },
        { term: 'Eva', translation: 'Two', phonetic: 'Ay-va' },
        { term: 'Eha', translation: 'Three', phonetic: 'Ay-ha' },
        { term: 'Ene', translation: 'Four', phonetic: 'Ay-nay' },
        { term: 'Isẹ', translation: 'Five', phonetic: 'Ee-seh' },
        { term: 'Igbe', translation: 'Ten', phonetic: 'Ig-bay' },
      ]
    },
    {
      category: 'Trade & Commerce',
      items: [
        { term: 'Ẹki', translation: 'Market', phonetic: 'Ay-kee' },
        { term: 'Dẹ', translation: 'Buy', phonetic: 'Day' },
        { term: 'Khiẹn', translation: 'Sell', phonetic: 'Khyen' },
        { term: 'Igho', translation: 'Money', phonetic: 'Ee-gho' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNANG (Akwa Ibom State) - South-South major language
// ─────────────────────────────────────────────────────────────────────────────
export const ANNANG_VOCAB: LanguageVocabulary = {
  languageId: 'annang',
  grammarNotes: `## Annang Grammar

**Classification:** Cross River language, closely related to Ibibio
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Location:** Akwa Ibom State, primarily in Abak, Ikot Ekpene, and Essien Udim
**Linguistic Ties:** Closely related to Ibibio and Efik
**Negation:** Negation particles used in verb phrases`,
  culturalNote: `Annang is spoken by 1+ million people in Akwa Ibom State. The Annang are closely related to the Ibibio people and share many cultural traditions. The Annang are known for their farming traditions, skilled craftsmanship, and the Annang cultural festival. The language is spoken in eight local government areas including Abak, Ikot Ekpene, and Essien Udim. The Annang have a rich oral tradition and cultural heritage.`,
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Akwaaba', translation: 'Welcome', phonetic: 'Ak-wah-bah' },
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'Keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine', phonetic: 'Aw di m-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'Dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'Bi-ko' },
        { term: 'Ka ọ dị', translation: 'Goodbye', phonetic: 'Kah aw di' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Nna', translation: 'Father', phonetic: 'N-nah' },
        { term: 'Nne', translation: 'Mother', phonetic: 'N-neh' },
        { term: 'Nwa', translation: 'Child', phonetic: 'N-wah' },
        { term: 'Nwoke', translation: 'Man', phonetic: 'N-wo-keh' },
        { term: 'Nwanyị', translation: 'Woman', phonetic: 'N-wan-yi' },
        { term: 'Enyi', translation: 'Friend', phonetic: 'En-yi' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Otu', translation: 'One', phonetic: 'O-tu' },
        { term: 'Abụọ', translation: 'Two', phonetic: 'Ah-bwaw' },
        { term: 'Atọ', translation: 'Three', phonetic: 'Ah-taw' },
        { term: 'Anọ', translation: 'Four', phonetic: 'Ah-naw' },
        { term: 'Ise', translation: 'Five', phonetic: 'Ee-seh' },
        { term: 'Iri', translation: 'Ten', phonetic: 'Ee-ri' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// IKWERRE (Rivers State) - South-South Igboid language
// ─────────────────────────────────────────────────────────────────────────────
export const IKWERRE_VOCAB: LanguageVocabulary = {
  languageId: 'ikwerre',
  grammarNotes: `## Ikwerre Grammar

**Classification:** Igboid language, closely related to Igbo
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Location:** Rivers State, particularly around Port Harcourt
**Linguistic Ties:** Related to Igbo but maintains distinct cultural identity
**Negation:** Negation particles used in verb phrases`,
  culturalNote: `Ikwerre is spoken by 500,000+ people in Rivers State, particularly around Port Harcourt. Despite linguistic similarities to Igbo, the Ikwerre maintain a distinct cultural identity. The Ikwerre are known for their trading traditions and cultural practices. The language reflects the linguistic diversity of the Niger Delta region.`,
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'Keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine', phonetic: 'Aw di m-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'Dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'Bi-ko' },
        { term: 'Ka ọ dị', translation: 'Goodbye', phonetic: 'Kah aw di' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Nna', translation: 'Father', phonetic: 'N-nah' },
        { term: 'Nne', translation: 'Mother', phonetic: 'N-neh' },
        { term: 'Nwa', translation: 'Child', phonetic: 'N-wah' },
        { term: 'Nwoke', translation: 'Man', phonetic: 'N-wo-keh' },
        { term: 'Nwanyị', translation: 'Woman', phonetic: 'N-wan-yi' },
      ]
    },
  ]
};

export const SOUTH_SOUTH_VOCABULARIES: Record<string, LanguageVocabulary> = {
  esan: ESAN_ENHANCED_VOCAB,
  owan: OWAN_VOCAB,
  annang: ANNANG_VOCAB,
  ikwerre: IKWERRE_VOCAB,
};
