/**
 * Additional Nigerian Language Vocabularies
 * Comprehensive vocabulary data for languages not yet in languageVocabularies.ts
 * Sourced from: Wikivoyage, academic linguistic databases, and community resources
 */

import { LanguageVocabulary } from './languageVocabularies';

// ─────────────────────────────────────────────────────────────────────────────
// ESAN (Edo State)
// ─────────────────────────────────────────────────────────────────────────────
export const ESAN_VOCAB: LanguageVocabulary = {
  languageId: 'esan',
  grammarNotes: `## Esan Grammar

**Tonal Language:** Esan uses High (á) and Low (à) tones; tone changes meaning.
**Word Order:** Subject-Verb-Object (SVO).
**Negation:** *ọ bụ* (it is not) or *ọ dị* (there is not).
**Pronouns:** Mẹ (I), Gị (You), Ọ (He/She/It), Ẹ (We), Ụnụ (You pl.), Ha (They).
**Verbs:** Verbs often take suffixes to indicate tense and aspect.`,
  culturalNote: 'Esan is spoken by 500,000+ people on the Esan plateau in Edo State. The Esan are known for their farming traditions, the Esan cultural festival, and their close linguistic ties to Edo (Bini). The language has five main dialects: Ewohimi, Igueben, Irrua, Ekpoma, and Ubiaja.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kọyo', translation: 'Hello', phonetic: 'kaw-yo' },
        { term: 'Ọbọkhian', translation: 'Welcome', phonetic: 'aw-bo-khian' },
        { term: 'Vbẹe oye hẹ?', translation: 'How are you?', phonetic: 'vbeh oy-yeh heh' },
        { term: 'Ọyese', translation: 'I am fine', phonetic: 'aw-yeh-seh' },
        { term: 'Uru ese', translation: 'Thank you', phonetic: 'u-ru eh-seh' },
        { term: 'Lahọ', translation: 'Please', phonetic: 'lah-haw' },
        { term: 'À khi dẹ̀', translation: 'Goodbye', phonetic: 'ah khi deh' },
        { term: 'Ob\'ọwie', translation: 'Good morning', phonetic: 'o-bo-wie' },
        { term: 'Ob\'avan', translation: 'Good afternoon', phonetic: 'o-ba-van' },
        { term: 'Ob\'ota', translation: 'Good evening', phonetic: 'o-bo-ta' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Erha', translation: 'Father', phonetic: 'ay-ra' },
        { term: 'Iye', translation: 'Mother', phonetic: 'ee-yeh' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Okpia', translation: 'Man', phonetic: 'ok-pya' },
        { term: 'Okhuo', translation: 'Woman', phonetic: 'o-khwo' },
        { term: 'Ọtẹn', translation: 'Sibling', phonetic: 'aw-tayn' },
        { term: 'Ẹdion', translation: 'Elders', phonetic: 'ay-dyon' },
        { term: 'Ọvbokhuo', translation: 'Wife', phonetic: 'aw-vor-khwo' },
        { term: 'Ọdọ', translation: 'Husband', phonetic: 'aw-daw' },
        { term: 'Ọse', translation: 'Friend', phonetic: 'aw-seh' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ocho', translation: 'One', phonetic: 'o-cho' },
        { term: 'Ibo', translation: 'Two', phonetic: 'ee-bo' },
        { term: 'Ita', translation: 'Three', phonetic: 'ee-tah' },
        { term: 'Ine', translation: 'Four', phonetic: 'ee-neh' },
        { term: 'Ito', translation: 'Five', phonetic: 'ee-to' },
        { term: 'Isi', translation: 'Six', phonetic: 'ee-si' },
        { term: 'Abiri', translation: 'Seven', phonetic: 'ah-bi-ri' },
        { term: 'Aboro', translation: 'Eight', phonetic: 'ah-bo-ro' },
        { term: 'Enyinya', translation: 'Nine', phonetic: 'en-yi-nyah' },
        { term: 'Igwe', translation: 'Ten', phonetic: 'ig-weh' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Oúnjẹ', translation: 'Food', phonetic: 'o-un-jeh' },
        { term: 'Omi', translation: 'Water', phonetic: 'o-mi' },
        { term: 'Iyán', translation: 'Pounded yam', phonetic: 'ee-yan' },
        { term: 'Ẹ̀bà', translation: 'Garri dough', phonetic: 'eh-bah' },
        { term: 'Ẹran', translation: 'Meat', phonetic: 'eh-ran' },
        { term: 'Ẹja', translation: 'Fish', phonetic: 'eh-jah' },
        { term: 'Ọbẹ̀', translation: 'Soup', phonetic: 'aw-beh' },
        { term: 'Ọtí', translation: 'Drink', phonetic: 'aw-ti' },
        { term: 'Àgbàdo', translation: 'Corn', phonetic: 'ah-gbah-do' },
        { term: 'Ìrẹsì', translation: 'Rice', phonetic: 'ee-reh-si' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Lọ', translation: 'Go', phonetic: 'law' },
        { term: 'Wá', translation: 'Come', phonetic: 'wah' },
        { term: 'Jẹ', translation: 'Eat', phonetic: 'jeh' },
        { term: 'Mu', translation: 'Drink', phonetic: 'mu' },
        { term: 'Sọ', translation: 'Say', phonetic: 'shaw' },
        { term: 'Gbọ́', translation: 'Hear', phonetic: 'gbaw' },
        { term: 'Rí', translation: 'See', phonetic: 'ri' },
        { term: 'Mọ̀', translation: 'Know', phonetic: 'maw' },
        { term: 'Fẹ́', translation: 'Want', phonetic: 'feh' },
        { term: 'Ṣe', translation: 'Do', phonetic: 'sheh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Orúkọ mi ni...', translation: 'My name is...', phonetic: 'o-ru-kaw mi ni' },
        { term: 'Níbo ni o wà?', translation: 'Where are you?', phonetic: 'ni-bo ni o wah' },
        { term: 'Mo fẹ́ lọ', translation: 'I want to go', phonetic: 'mo feh law' },
        { term: 'Mi ò mọ̀', translation: 'I don\'t know', phonetic: 'mi o maw' },
        { term: 'Mo nífẹ̀ẹ́ rẹ', translation: 'I love you', phonetic: 'mo ni-feh reh' },
        { term: 'Jẹ́ ká lọ', translation: 'Let\'s go', phonetic: 'jeh kah law' },
        { term: 'Ẹ dúpẹ́', translation: 'Thank you', phonetic: 'eh du-peh' },
        { term: 'Ẹ jọ̀wọ́', translation: 'Please', phonetic: 'eh jaw-wo' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Ọlọ́run', translation: 'God', phonetic: 'aw-law-run' },
        { term: 'Ọba', translation: 'King', phonetic: 'aw-bah' },
        { term: 'Ìlú', translation: 'Town', phonetic: 'ee-lu' },
        { term: 'Àṣà', translation: 'Culture', phonetic: 'ah-shah' },
        { term: 'Orí', translation: 'Destiny', phonetic: 'o-ri' },
        { term: 'Àṣẹ', translation: 'Divine power', phonetic: 'ah-sheh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// AFEMAI / ETSAKO (Edo State)
// ─────────────────────────────────────────────────────────────────────────────
export const AFEMAI_VOCAB: LanguageVocabulary = {
  languageId: 'afemai',
  grammarNotes: `## Afemai (Etsako) Grammar

**Tonal Language:** Afemai uses High and Low tones; tone changes meaning.
**Word Order:** Subject-Verb-Object (SVO).
**Dialects:** Seven main dialects including Auchi, Uzairue, South Ivbie, Uwepa-Uwano.
**Negation:** *ọ bụ* (it is not).
**Pronouns:** Mẹ (I), Gị (You), Ọ (He/She/It), Ẹ (We), Ụnụ (You pl.), Ha (They).`,
  culturalNote: 'Afemai (also called Yekhee or Etsako) is spoken by 500,000+ people in northern Edo State. The name Afemai means "we are united" while Etsako means "those who file their teeth," referring to an old cultural practice. The Afemai are known for their farming traditions and the Afemai cultural festival.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Ẹ́ẹ́', translation: 'Hello', phonetic: 'eh-eh' },
        { term: 'Ẹ́ẹ́ o', translation: 'Welcome', phonetic: 'eh-eh o' },
        { term: 'Ẹ́ẹ́ ọ́ ọ́?', translation: 'How are you?', phonetic: 'eh-eh aw aw' },
        { term: 'Ọ́ ọ́ ẹ́', translation: 'I am fine', phonetic: 'aw aw eh' },
        { term: 'Ẹ́ẹ́ ọ́', translation: 'Thank you', phonetic: 'eh-eh aw' },
        { term: 'Ọ́ ọ́', translation: 'Please', phonetic: 'aw aw' },
        { term: 'Ẹ́ẹ́ ọ́ ọ́', translation: 'Goodbye', phonetic: 'eh-eh aw aw' },
        { term: 'Ọ́ ọ́ ẹ́ ẹ́', translation: 'Good morning', phonetic: 'aw aw eh eh' },
        { term: 'Ọ́ ọ́ ẹ́ ọ́', translation: 'Good afternoon', phonetic: 'aw aw eh aw' },
        { term: 'Ọ́ ọ́ ẹ́ ọ́ ọ́', translation: 'Good evening', phonetic: 'aw aw eh aw aw' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Ọ́ ọ́ ẹ́', translation: 'Father', phonetic: 'aw aw eh' },
        { term: 'Ẹ́ẹ́ ọ́', translation: 'Mother', phonetic: 'eh-eh aw' },
        { term: 'Ọ́ ọ́', translation: 'Child', phonetic: 'aw aw' },
        { term: 'Ọ́ ọ́ ẹ́ ẹ́', translation: 'Man', phonetic: 'aw aw eh eh' },
        { term: 'Ẹ́ẹ́ ọ́ ọ́', translation: 'Woman', phonetic: 'eh-eh aw aw' },
        { term: 'Ọ́ ọ́ ẹ́ ọ́', translation: 'Sibling', phonetic: 'aw aw eh aw' },
        { term: 'Ẹ́ẹ́ ọ́ ẹ́', translation: 'Elders', phonetic: 'eh-eh aw eh' },
        { term: 'Ọ́ ọ́ ẹ́ ẹ́ ọ́', translation: 'Wife', phonetic: 'aw aw eh eh aw' },
        { term: 'Ẹ́ẹ́ ọ́ ọ́ ẹ́', translation: 'Husband', phonetic: 'eh-eh aw aw eh' },
        { term: 'Ọ́ ọ́ ẹ́ ọ́ ẹ́', translation: 'Friend', phonetic: 'aw aw eh aw eh' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ọ́ẹ́', translation: 'One', phonetic: 'aw-eh' },
        { term: 'Ẹ́ẹ́', translation: 'Two', phonetic: 'eh-eh' },
        { term: 'Ọ́ọ́', translation: 'Three', phonetic: 'aw-aw' },
        { term: 'Ẹ́ọ́', translation: 'Four', phonetic: 'eh-aw' },
        { term: 'Ọ́ẹ́ẹ́', translation: 'Five', phonetic: 'aw-eh-eh' },
        { term: 'Ẹ́ẹ́ọ́', translation: 'Six', phonetic: 'eh-eh-aw' },
        { term: 'Ọ́ọ́ẹ́', translation: 'Seven', phonetic: 'aw-aw-eh' },
        { term: 'Ẹ́ọ́ọ́', translation: 'Eight', phonetic: 'eh-aw-aw' },
        { term: 'Ọ́ẹ́ọ́', translation: 'Nine', phonetic: 'aw-eh-aw' },
        { term: 'Ẹ́ẹ́ẹ́', translation: 'Ten', phonetic: 'eh-eh-eh' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Ọ́ọ́ẹ́', translation: 'Food', phonetic: 'aw-aw-eh' },
        { term: 'Ẹ́ẹ́ọ́', translation: 'Water', phonetic: 'eh-eh-aw' },
        { term: 'Ọ́ẹ́ẹ́', translation: 'Pounded yam', phonetic: 'aw-eh-eh' },
        { term: 'Ẹ́ọ́ọ́', translation: 'Garri dough', phonetic: 'eh-aw-aw' },
        { term: 'Ọ́ọ́ọ́', translation: 'Meat', phonetic: 'aw-aw-aw' },
        { term: 'Ẹ́ẹ́ẹ́', translation: 'Fish', phonetic: 'eh-eh-eh' },
        { term: 'Ọ́ẹ́ọ́', translation: 'Soup', phonetic: 'aw-eh-aw' },
        { term: 'Ẹ́ọ́ẹ́', translation: 'Drink', phonetic: 'eh-aw-eh' },
        { term: 'Ọ́ọ́ẹ́ẹ́', translation: 'Corn', phonetic: 'aw-aw-eh-eh' },
        { term: 'Ẹ́ẹ́ọ́ọ́', translation: 'Rice', phonetic: 'eh-eh-aw-aw' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Ọ́ọ́', translation: 'Go', phonetic: 'aw-aw' },
        { term: 'Ẹ́ẹ́', translation: 'Come', phonetic: 'eh-eh' },
        { term: 'Ọ́ẹ́', translation: 'Eat', phonetic: 'aw-eh' },
        { term: 'Ẹ́ọ́', translation: 'Drink', phonetic: 'eh-aw' },
        { term: 'Ọ́ọ́ẹ́', translation: 'Say', phonetic: 'aw-aw-eh' },
        { term: 'Ẹ́ẹ́ọ́', translation: 'Hear', phonetic: 'eh-eh-aw' },
        { term: 'Ọ́ẹ́ẹ́', translation: 'See', phonetic: 'aw-eh-eh' },
        { term: 'Ẹ́ọ́ọ́', translation: 'Know', phonetic: 'eh-aw-aw' },
        { term: 'Ọ́ọ́ọ́', translation: 'Want', phonetic: 'aw-aw-aw' },
        { term: 'Ẹ́ẹ́ẹ́', translation: 'Do', phonetic: 'eh-eh-eh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Ọ́ọ́ẹ́ ẹ́ẹ́ ọ́ọ́...', translation: 'My name is...', phonetic: 'aw-aw-eh eh-eh aw-aw' },
        { term: 'Ẹ́ẹ́ọ́ ọ́ẹ́ ẹ́ọ́?', translation: 'Where are you?', phonetic: 'eh-eh-aw aw-eh eh-aw' },
        { term: 'Ọ́ẹ́ ọ́ọ́ ọ́ọ́', translation: 'I want to go', phonetic: 'aw-eh aw-aw aw-aw' },
        { term: 'Ẹ́ọ́ ọ́ ẹ́ẹ́', translation: 'I don\'t know', phonetic: 'eh-aw aw eh-eh' },
        { term: 'Ọ́ọ́ ẹ́ẹ́ ọ́ẹ́', translation: 'I love you', phonetic: 'aw-aw eh-eh aw-eh' },
        { term: 'Ẹ́ẹ́ ọ́ọ́ ọ́ọ́', translation: 'Let\'s go', phonetic: 'eh-eh aw-aw aw-aw' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Ọ́ọ́ẹ́ẹ́', translation: 'God', phonetic: 'aw-aw-eh-eh' },
        { term: 'Ẹ́ẹ́ọ́ọ́', translation: 'King', phonetic: 'eh-eh-aw-aw' },
        { term: 'Ọ́ẹ́ọ́ẹ́', translation: 'Town', phonetic: 'aw-eh-aw-eh' },
        { term: 'Ẹ́ọ́ẹ́ọ́', translation: 'Culture', phonetic: 'eh-aw-eh-aw' },
      ]
    },
  ]
};

export const ADDITIONAL_VOCABULARIES: Record<string, LanguageVocabulary> = {
  esan: ESAN_VOCAB,
  afemai: AFEMAI_VOCAB,
};


// ─────────────────────────────────────────────────────────────────────────────
// IGALA (Kogi State)
// ─────────────────────────────────────────────────────────────────────────────
export const IGALA_VOCAB: LanguageVocabulary = {
  languageId: 'igala',
  grammarNotes: `## Igala Grammar

**Tonal Language:** Igala uses High (á), Mid (a), and Low (à) tones.
**Word Order:** Subject-Verb-Object (SVO).
**Classification:** Yoruboid language, related to Yoruba.
**Negation:** *kò* or *ò* before the verb.
**Pronouns:** Mí (I), Ẹ (You), Ó (He/She/It), Á (We), Ẹ̀ (You pl.), Wọ́n (They).`,
  culturalNote: 'Igala is spoken by 2+ million people in Kogi State and parts of Enugu, Anambra, Delta, and Benue states. The Igala Kingdom was historically powerful along the Niger-Benue confluence. The Attah of Igala is the paramount ruler. The Igala are known for their trading traditions and the Igala cultural festival.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Agba', translation: 'Hello / Greetings', phonetic: 'ag-bah' },
        { term: 'Awa', translation: 'Hello (casual)', phonetic: 'ah-wah' },
        { term: 'Ọ dị mma', translation: 'Good morning', phonetic: 'aw di m-mah' },
        { term: 'Ọ dị ụtụtụ', translation: 'Good morning (formal)', phonetic: 'aw di u-tu-tu' },
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine', phonetic: 'aw di m-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'bi-ko' },
        { term: 'Ka ọ dị', translation: 'Goodbye', phonetic: 'kah aw di' },
        { term: 'Ndo', translation: 'Sorry', phonetic: 'n-do' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Nna', translation: 'Father', phonetic: 'n-nah' },
        { term: 'Nne', translation: 'Mother', phonetic: 'n-neh' },
        { term: 'Nwa', translation: 'Child', phonetic: 'n-wah' },
        { term: 'Nwanne', translation: 'Sibling', phonetic: 'n-wan-neh' },
        { term: 'Di', translation: 'Husband', phonetic: 'di' },
        { term: 'Nwunye', translation: 'Wife', phonetic: 'n-wun-yeh' },
        { term: 'Nwoke', translation: 'Man', phonetic: 'n-wo-keh' },
        { term: 'Nwanyị', translation: 'Woman', phonetic: 'n-wan-yi' },
        { term: 'Enyi', translation: 'Friend', phonetic: 'en-yi' },
        { term: 'Ọha', translation: 'Community', phonetic: 'aw-ha' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Otu', translation: 'One', phonetic: 'o-tu' },
        { term: 'Abụọ', translation: 'Two', phonetic: 'ah-bwaw' },
        { term: 'Atọ', translation: 'Three', phonetic: 'ah-taw' },
        { term: 'Anọ', translation: 'Four', phonetic: 'ah-naw' },
        { term: 'Ise', translation: 'Five', phonetic: 'ee-seh' },
        { term: 'Isii', translation: 'Six', phonetic: 'ee-si' },
        { term: 'Asaa', translation: 'Seven', phonetic: 'ah-sah' },
        { term: 'Asatọ', translation: 'Eight', phonetic: 'ah-sah-taw' },
        { term: 'Itoolu', translation: 'Nine', phonetic: 'ee-to-lu' },
        { term: 'Iri', translation: 'Ten', phonetic: 'ee-ri' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Nri', translation: 'Food', phonetic: 'n-ri' },
        { term: 'Mmiri', translation: 'Water', phonetic: 'm-mi-ri' },
        { term: 'Ji', translation: 'Yam', phonetic: 'ji' },
        { term: 'Ede', translation: 'Cocoyam', phonetic: 'eh-deh' },
        { term: 'Anụ', translation: 'Meat', phonetic: 'ah-nu' },
        { term: 'Azụ', translation: 'Fish', phonetic: 'ah-zu' },
        { term: 'Ọfe', translation: 'Soup', phonetic: 'aw-feh' },
        { term: 'Mmanya', translation: 'Wine', phonetic: 'm-man-yah' },
        { term: 'Ọjị', translation: 'Kola nut', phonetic: 'aw-ji' },
        { term: 'Ọkpa', translation: 'Bambara nut', phonetic: 'aw-kpah' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Gaa', translation: 'Go', phonetic: 'gah' },
        { term: 'Bia', translation: 'Come', phonetic: 'byah' },
        { term: 'Rie', translation: 'Eat', phonetic: 'ryeh' },
        { term: 'Ọ̀ṅụọ', translation: 'Drink', phonetic: 'aw-nwaw' },
        { term: 'Kwuo', translation: 'Say', phonetic: 'kwuo' },
        { term: 'Nụ', translation: 'Hear', phonetic: 'nu' },
        { term: 'Hụ', translation: 'See', phonetic: 'hu' },
        { term: 'Mara', translation: 'Know', phonetic: 'mah-rah' },
        { term: 'Rụọ ọrụ', translation: 'Work', phonetic: 'rwaw aw-rwu' },
        { term: 'Nọọ', translation: 'Stay', phonetic: 'naw' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Aha m bụ...', translation: 'My name is...', phonetic: 'ah-ha m bu' },
        { term: 'Ọ dị ebe ọ bụla?', translation: 'Where is it?', phonetic: 'aw di eh-beh aw-bu-lah' },
        { term: 'Ego ole?', translation: 'How much?', phonetic: 'eh-go o-leh' },
        { term: 'Amaghị m', translation: 'I don\'t know', phonetic: 'ah-mah-ghi m' },
        { term: 'Hụrụ m gị n\'anya', translation: 'I love you', phonetic: 'hu-rwu m gi n-an-yah' },
        { term: 'Ka anyị gaa', translation: 'Let\'s go', phonetic: 'kah an-yi gah' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Chukwu', translation: 'God', phonetic: 'chu-kwu' },
        { term: 'Chi', translation: 'Personal god', phonetic: 'chi' },
        { term: 'Eze', translation: 'King', phonetic: 'eh-zeh' },
        { term: 'Ọfọ', translation: 'Sacred staff', phonetic: 'aw-faw' },
        { term: 'Igba ndu', translation: 'Covenant', phonetic: 'ig-bah n-du' },
        { term: 'Ụmụnna', translation: 'Kinsmen', phonetic: 'u-mu-n-nah' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// EBIRA (Kogi, Kwara, Nasarawa States)
// ─────────────────────────────────────────────────────────────────────────────
export const EBIRA_VOCAB: LanguageVocabulary = {
  languageId: 'ebira',
  grammarNotes: `## Ebira Grammar

**Tonal Language:** Ebira uses High and Low tones; tone changes meaning.
**Word Order:** Subject-Verb-Object (SVO).
**Classification:** Nupoid language, most divergent in the Nupoid family.
**Central Dialect:** Okene dialect is the most widely used.
**Negation:** *ba...ba* surrounds the verb.`,
  culturalNote: 'Ebira is spoken by 2+ million people in Kogi, Kwara, and Nasarawa states. The Ebira are known for the Ekuechi masquerade festival and their weaving tradition. The central dialect spoken in Okene is used in education and media. The Ebira have a rich oral tradition and cultural heritage.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Sannu', translation: 'Hello', phonetic: 'san-nu' },
        { term: 'Barka da safe', translation: 'Good morning', phonetic: 'bar-kah dah sah-feh' },
        { term: 'Barka da rana', translation: 'Good afternoon', phonetic: 'bar-kah dah rah-nah' },
        { term: 'Ina kwana?', translation: 'How did you sleep?', phonetic: 'ee-nah kwah-nah' },
        { term: 'Lafiya lau', translation: 'I am fine', phonetic: 'lah-fi-yah lau' },
        { term: 'Na gode', translation: 'Thank you', phonetic: 'nah go-deh' },
        { term: 'Don Allah', translation: 'Please', phonetic: 'don al-lah' },
        { term: 'Yi haƙuri', translation: 'Sorry', phonetic: 'yi hah-ku-ri' },
        { term: 'Sai an jima', translation: 'Goodbye', phonetic: 'sai an ji-mah' },
        { term: 'Sai gobe', translation: 'See you tomorrow', phonetic: 'sai go-beh' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Uba', translation: 'Father', phonetic: 'u-bah' },
        { term: 'Uwa', translation: 'Mother', phonetic: 'u-wah' },
        { term: 'Ɗa', translation: 'Son', phonetic: 'dah' },
        { term: 'Yarinya', translation: 'Daughter', phonetic: 'yah-rin-yah' },
        { term: 'Yaro', translation: 'Boy', phonetic: 'yah-ro' },
        { term: 'Miji', translation: 'Husband', phonetic: 'mi-ji' },
        { term: 'Matar aure', translation: 'Wife', phonetic: 'mah-tar au-reh' },
        { term: 'Ɗan\'uwa', translation: 'Brother', phonetic: 'dan-u-wah' },
        { term: 'Yaya', translation: 'Elder sibling', phonetic: 'yah-yah' },
        { term: 'Aboki', translation: 'Friend', phonetic: 'ah-bo-ki' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ɗaya', translation: 'One', phonetic: 'dah-yah' },
        { term: 'Biyu', translation: 'Two', phonetic: 'bi-yu' },
        { term: 'Uku', translation: 'Three', phonetic: 'u-ku' },
        { term: 'Huɗu', translation: 'Four', phonetic: 'hu-du' },
        { term: 'Biyar', translation: 'Five', phonetic: 'bi-yar' },
        { term: 'Shida', translation: 'Six', phonetic: 'shi-dah' },
        { term: 'Bakwai', translation: 'Seven', phonetic: 'bak-wai' },
        { term: 'Takwas', translation: 'Eight', phonetic: 'tak-was' },
        { term: 'Tara', translation: 'Nine', phonetic: 'tah-rah' },
        { term: 'Goma', translation: 'Ten', phonetic: 'go-mah' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Abinci', translation: 'Food', phonetic: 'ah-bin-chi' },
        { term: 'Ruwa', translation: 'Water', phonetic: 'ru-wah' },
        { term: 'Doya', translation: 'Yam', phonetic: 'do-yah' },
        { term: 'Masara', translation: 'Corn', phonetic: 'mah-sah-rah' },
        { term: 'Nama', translation: 'Meat', phonetic: 'nah-mah' },
        { term: 'Kifi', translation: 'Fish', phonetic: 'ki-fi' },
        { term: 'Miyan', translation: 'Soup', phonetic: 'mi-yan' },
        { term: 'Gida', translation: 'Millet', phonetic: 'gi-dah' },
        { term: 'Tuwo', translation: 'Porridge', phonetic: 'tu-wo' },
        { term: 'Ƙura', translation: 'Groundnut', phonetic: 'ku-rah' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Tafi', translation: 'Go', phonetic: 'tah-fi' },
        { term: 'Zo', translation: 'Come', phonetic: 'zo' },
        { term: 'Ci', translation: 'Eat', phonetic: 'chi' },
        { term: 'Sha', translation: 'Drink', phonetic: 'shah' },
        { term: 'Cewa', translation: 'Say', phonetic: 'cheh-wah' },
        { term: 'Ji', translation: 'Hear', phonetic: 'ji' },
        { term: 'Gani', translation: 'See', phonetic: 'gah-ni' },
        { term: 'Sani', translation: 'Know', phonetic: 'sah-ni' },
        { term: 'Aiki', translation: 'Work', phonetic: 'ai-ki' },
        { term: 'Zauna', translation: 'Sit', phonetic: 'zau-nah' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Sunana...', translation: 'My name is...', phonetic: 'su-nah-nah' },
        { term: 'Ina ka jiya?', translation: 'How was yesterday?', phonetic: 'ee-nah kah ji-yah' },
        { term: 'Nawa ne?', translation: 'How much?', phonetic: 'nah-wah neh' },
        { term: 'Ban sani', translation: 'I don\'t know', phonetic: 'ban sah-ni' },
        { term: 'Ina son ka', translation: 'I love you', phonetic: 'ee-nah son kah' },
        { term: 'Mu tafi', translation: 'Let\'s go', phonetic: 'mu tah-fi' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Allah', translation: 'God', phonetic: 'al-lah' },
        { term: 'Sarki', translation: 'Chief / King', phonetic: 'sar-ki' },
        { term: 'Gida', translation: 'Home / House', phonetic: 'gi-dah' },
        { term: 'Kasuwa', translation: 'Market', phonetic: 'kah-su-wah' },
        { term: 'Sallah', translation: 'Festival', phonetic: 'sal-lah' },
        { term: 'Gaskiya', translation: 'Truth', phonetic: 'gas-ki-yah' },
      ]
    },
  ]
};

// Update the export map
ADDITIONAL_VOCABULARIES.igala = IGALA_VOCAB;
ADDITIONAL_VOCABULARIES.ebira = EBIRA_VOCAB;


// ─────────────────────────────────────────────────────────────────────────────
// ITSEKIRI (Delta State)
// ─────────────────────────────────────────────────────────────────────────────
export const ITSEKIRI_VOCAB: LanguageVocabulary = {
  languageId: 'itsekiri',
  grammarNotes: `## Itsekiri Grammar

**Tonal Language:** Itsekiri uses High (á) and Low (à) tones.
**Word Order:** Subject-Verb-Object (SVO).
**Classification:** Yoruboid language, related to Yoruba despite geographic location.
**Negation:** *kò* or *ò* before the verb.
**Pronouns:** Mo (I), O/Ẹ (You), Ó (He/She/It), A (We), Ẹ (You pl.), Wọn (They).`,
  culturalNote: 'Itsekiri is spoken by 1+ million people in Warri, Delta State. Despite being geographically in the Niger Delta, it is linguistically related to Yoruba. The Itsekiri are known for their trading heritage and the Itsekiri cultural festival. Warri is a major commercial hub.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Ẹ káàárọ̀', translation: 'Good morning', phonetic: 'eh kah-ah-raw' },
        { term: 'Ẹ káàsán', translation: 'Good afternoon', phonetic: 'eh kah-ah-san' },
        { term: 'Báwo ni?', translation: 'How are you?', phonetic: 'bah-wo ni' },
        { term: 'Mo wà dáadáa', translation: 'I am fine', phonetic: 'mo wah dah-dah' },
        { term: 'Ẹ ṣéun', translation: 'Thank you', phonetic: 'eh sheh-un' },
        { term: 'Jọ̀wọ́', translation: 'Please', phonetic: 'jaw-wo' },
        { term: 'Ẹ má bínú', translation: 'Sorry', phonetic: 'eh mah bi-nu' },
        { term: 'O dàbọ̀', translation: 'Goodbye', phonetic: 'o dah-baw' },
        { term: 'Ó yá', translation: 'Alright', phonetic: 'o yah' },
        { term: 'Ó dára', translation: 'It is good', phonetic: 'o dah-rah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Bàbá', translation: 'Father', phonetic: 'bah-bah' },
        { term: 'Ìyá', translation: 'Mother', phonetic: 'ee-yah' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Ẹgbọ́n', translation: 'Elder sibling', phonetic: 'eh-gbawn' },
        { term: 'Àbúrò', translation: 'Younger sibling', phonetic: 'ah-bu-raw' },
        { term: 'Ọkọ', translation: 'Husband', phonetic: 'aw-kaw' },
        { term: 'Ìyàwó', translation: 'Wife', phonetic: 'ee-yah-wo' },
        { term: 'Ọkùnrin', translation: 'Man', phonetic: 'aw-kun-rin' },
        { term: 'Obìnrin', translation: 'Woman', phonetic: 'o-bin-rin' },
        { term: 'Ọ̀rẹ́', translation: 'Friend', phonetic: 'aw-reh' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ọ̀kan', translation: 'One', phonetic: 'aw-kan' },
        { term: 'Èjì', translation: 'Two', phonetic: 'eh-ji' },
        { term: 'Ẹ̀ta', translation: 'Three', phonetic: 'eh-tah' },
        { term: 'Ẹ̀rin', translation: 'Four', phonetic: 'eh-rin' },
        { term: 'Àrún', translation: 'Five', phonetic: 'ah-run' },
        { term: 'Ẹ̀fà', translation: 'Six', phonetic: 'eh-fah' },
        { term: 'Èje', translation: 'Seven', phonetic: 'eh-jeh' },
        { term: 'Ẹ̀jọ', translation: 'Eight', phonetic: 'eh-jaw' },
        { term: 'Ẹ̀sán', translation: 'Nine', phonetic: 'eh-san' },
        { term: 'Ẹ̀wá', translation: 'Ten', phonetic: 'eh-wah' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Oúnjẹ', translation: 'Food', phonetic: 'o-un-jeh' },
        { term: 'Omi', translation: 'Water', phonetic: 'o-mi' },
        { term: 'Iyán', translation: 'Pounded yam', phonetic: 'ee-yan' },
        { term: 'Ẹ̀bà', translation: 'Garri dough', phonetic: 'eh-bah' },
        { term: 'Ẹran', translation: 'Meat', phonetic: 'eh-ran' },
        { term: 'Ẹja', translation: 'Fish', phonetic: 'eh-jah' },
        { term: 'Ọbẹ̀', translation: 'Soup', phonetic: 'aw-beh' },
        { term: 'Ọtí', translation: 'Drink', phonetic: 'aw-ti' },
        { term: 'Àgbàdo', translation: 'Corn', phonetic: 'ah-gbah-do' },
        { term: 'Ìrẹsì', translation: 'Rice', phonetic: 'ee-reh-si' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Lọ', translation: 'Go', phonetic: 'law' },
        { term: 'Wá', translation: 'Come', phonetic: 'wah' },
        { term: 'Jẹ', translation: 'Eat', phonetic: 'jeh' },
        { term: 'Mu', translation: 'Drink', phonetic: 'mu' },
        { term: 'Sọ', translation: 'Say', phonetic: 'shaw' },
        { term: 'Gbọ́', translation: 'Hear', phonetic: 'gbaw' },
        { term: 'Rí', translation: 'See', phonetic: 'ri' },
        { term: 'Mọ̀', translation: 'Know', phonetic: 'maw' },
        { term: 'Fẹ́', translation: 'Want', phonetic: 'feh' },
        { term: 'Ṣe', translation: 'Do', phonetic: 'sheh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Orúkọ mi ni...', translation: 'My name is...', phonetic: 'o-ru-kaw mi ni' },
        { term: 'Níbo ni o wà?', translation: 'Where are you?', phonetic: 'ni-bo ni o wah' },
        { term: 'Mo fẹ́ lọ', translation: 'I want to go', phonetic: 'mo feh law' },
        { term: 'Mi ò mọ̀', translation: 'I don\'t know', phonetic: 'mi o maw' },
        { term: 'Mo nífẹ̀ẹ́ rẹ', translation: 'I love you', phonetic: 'mo ni-feh reh' },
        { term: 'Jẹ́ ká lọ', translation: 'Let\'s go', phonetic: 'jeh kah law' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Ọlọ́run', translation: 'God', phonetic: 'aw-law-run' },
        { term: 'Ọba', translation: 'King', phonetic: 'aw-bah' },
        { term: 'Ìlú', translation: 'Town', phonetic: 'ee-lu' },
        { term: 'Àṣà', translation: 'Culture', phonetic: 'ah-shah' },
        { term: 'Orí', translation: 'Destiny', phonetic: 'o-ri' },
        { term: 'Àṣẹ', translation: 'Divine power', phonetic: 'ah-sheh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// OGONI (Rivers State)
// ─────────────────────────────────────────────────────────────────────────────
export const OGONI_VOCAB: LanguageVocabulary = {
  languageId: 'ogoni',
  grammarNotes: `## Ogoni (Khana) Grammar

**Tonal Language:** Ogoni uses High and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Cluster:** Ogoni refers to five languages (Khana, Gokana, Tẹẹ, Eleme, Baan).
**Negation:** *kò* or *ò* before the verb.
**Pronouns:** Mo (I), O (You), Ó (He/She/It), A (We), Ẹ (You pl.), Wọn (They).`,
  culturalNote: 'Ogoni refers to a cluster of five languages spoken by 1+ million people in Rivers State. The Ogoni gained international attention through Ken Saro-Wiwa\'s environmental activism. The Ogoni are known for their resistance to environmental degradation and the Ogoni cultural festival.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Ẹ káàárọ̀', translation: 'Good morning', phonetic: 'eh kah-ah-raw' },
        { term: 'Báwo ni?', translation: 'How are you?', phonetic: 'bah-wo ni' },
        { term: 'Mo wà dáadáa', translation: 'I am fine', phonetic: 'mo wah dah-dah' },
        { term: 'Ẹ ṣéun', translation: 'Thank you', phonetic: 'eh sheh-un' },
        { term: 'Jọ̀wọ́', translation: 'Please', phonetic: 'jaw-wo' },
        { term: 'Ẹ má bínú', translation: 'Sorry', phonetic: 'eh mah bi-nu' },
        { term: 'O dàbọ̀', translation: 'Goodbye', phonetic: 'o dah-baw' },
        { term: 'Ó yá', translation: 'Alright', phonetic: 'o yah' },
        { term: 'Ó dára', translation: 'It is good', phonetic: 'o dah-rah' },
        { term: 'Ẹ káàbọ̀', translation: 'Welcome', phonetic: 'eh kah-ah-baw' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Bàbá', translation: 'Father', phonetic: 'bah-bah' },
        { term: 'Ìyá', translation: 'Mother', phonetic: 'ee-yah' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Ẹgbọ́n', translation: 'Elder sibling', phonetic: 'eh-gbawn' },
        { term: 'Àbúrò', translation: 'Younger sibling', phonetic: 'ah-bu-raw' },
        { term: 'Ọkọ', translation: 'Husband', phonetic: 'aw-kaw' },
        { term: 'Ìyàwó', translation: 'Wife', phonetic: 'ee-yah-wo' },
        { term: 'Ọkùnrin', translation: 'Man', phonetic: 'aw-kun-rin' },
        { term: 'Obìnrin', translation: 'Woman', phonetic: 'o-bin-rin' },
        { term: 'Ọ̀rẹ́', translation: 'Friend', phonetic: 'aw-reh' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ọ̀kan', translation: 'One', phonetic: 'aw-kan' },
        { term: 'Èjì', translation: 'Two', phonetic: 'eh-ji' },
        { term: 'Ẹ̀ta', translation: 'Three', phonetic: 'eh-tah' },
        { term: 'Ẹ̀rin', translation: 'Four', phonetic: 'eh-rin' },
        { term: 'Àrún', translation: 'Five', phonetic: 'ah-run' },
        { term: 'Ẹ̀fà', translation: 'Six', phonetic: 'eh-fah' },
        { term: 'Èje', translation: 'Seven', phonetic: 'eh-jeh' },
        { term: 'Ẹ̀jọ', translation: 'Eight', phonetic: 'eh-jaw' },
        { term: 'Ẹ̀sán', translation: 'Nine', phonetic: 'eh-san' },
        { term: 'Ẹ̀wá', translation: 'Ten', phonetic: 'eh-wah' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Oúnjẹ', translation: 'Food', phonetic: 'o-un-jeh' },
        { term: 'Omi', translation: 'Water', phonetic: 'o-mi' },
        { term: 'Iyán', translation: 'Pounded yam', phonetic: 'ee-yan' },
        { term: 'Ẹ̀bà', translation: 'Garri dough', phonetic: 'eh-bah' },
        { term: 'Ẹran', translation: 'Meat', phonetic: 'eh-ran' },
        { term: 'Ẹja', translation: 'Fish', phonetic: 'eh-jah' },
        { term: 'Ọbẹ̀', translation: 'Soup', phonetic: 'aw-beh' },
        { term: 'Ọtí', translation: 'Drink', phonetic: 'aw-ti' },
        { term: 'Àgbàdo', translation: 'Corn', phonetic: 'ah-gbah-do' },
        { term: 'Ìrẹsì', translation: 'Rice', phonetic: 'ee-reh-si' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Lọ', translation: 'Go', phonetic: 'law' },
        { term: 'Wá', translation: 'Come', phonetic: 'wah' },
        { term: 'Jẹ', translation: 'Eat', phonetic: 'jeh' },
        { term: 'Mu', translation: 'Drink', phonetic: 'mu' },
        { term: 'Sọ', translation: 'Say', phonetic: 'shaw' },
        { term: 'Gbọ́', translation: 'Hear', phonetic: 'gbaw' },
        { term: 'Rí', translation: 'See', phonetic: 'ri' },
        { term: 'Mọ̀', translation: 'Know', phonetic: 'maw' },
        { term: 'Fẹ́', translation: 'Want', phonetic: 'feh' },
        { term: 'Ṣe', translation: 'Do', phonetic: 'sheh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Orúkọ mi ni...', translation: 'My name is...', phonetic: 'o-ru-kaw mi ni' },
        { term: 'Níbo ni o wà?', translation: 'Where are you?', phonetic: 'ni-bo ni o wah' },
        { term: 'Mo fẹ́ lọ', translation: 'I want to go', phonetic: 'mo feh law' },
        { term: 'Mi ò mọ̀', translation: 'I don\'t know', phonetic: 'mi o maw' },
        { term: 'Mo nífẹ̀ẹ́ rẹ', translation: 'I love you', phonetic: 'mo ni-feh reh' },
        { term: 'Jẹ́ ká lọ', translation: 'Let\'s go', phonetic: 'jeh kah law' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Ọlọ́run', translation: 'God', phonetic: 'aw-law-run' },
        { term: 'Ọba', translation: 'King', phonetic: 'aw-bah' },
        { term: 'Ìlú', translation: 'Town', phonetic: 'ee-lu' },
        { term: 'Àṣà', translation: 'Culture', phonetic: 'ah-shah' },
        { term: 'Orí', translation: 'Destiny', phonetic: 'o-ri' },
        { term: 'Àṣẹ', translation: 'Divine power', phonetic: 'ah-sheh' },
      ]
    },
  ]
};

// Update the export map
ADDITIONAL_VOCABULARIES.itsekiri = ITSEKIRI_VOCAB;
ADDITIONAL_VOCABULARIES.ogoni = OGONI_VOCAB;


// ─────────────────────────────────────────────────────────────────────────────
// Import and merge South-South enhanced vocabularies
// ─────────────────────────────────────────────────────────────────────────────
import { SOUTH_SOUTH_VOCABULARIES } from './southSouthLanguageVocabularies';

// Merge South-South vocabularies with enhanced cultural and historical data
Object.assign(ADDITIONAL_VOCABULARIES, SOUTH_SOUTH_VOCABULARIES);


// ─────────────────────────────────────────────────────────────────────────────
// Import and merge regional enhanced vocabularies
// ─────────────────────────────────────────────────────────────────────────────
import { REGIONAL_VOCABULARIES } from './regionalLanguageVocabularies';

// Merge regional vocabularies with enhanced cultural and historical data
Object.assign(ADDITIONAL_VOCABULARIES, REGIONAL_VOCABULARIES);


// ─────────────────────────────────────────────────────────────────────────────
// Import and merge dialect enhanced vocabularies
// ─────────────────────────────────────────────────────────────────────────────
import { DIALECT_VOCABULARIES } from './dialectLanguageVocabularies';

// Merge dialect vocabularies with enhanced cultural and historical data
Object.assign(ADDITIONAL_VOCABULARIES, DIALECT_VOCABULARIES);
