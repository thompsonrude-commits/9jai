/**
 * Vocabulary data for all Nigerian languages (except Edo, which uses repository.ts)
 */

import { ADDITIONAL_VOCABULARIES } from './additionalLanguageVocabularies';

export interface VocabEntry {
  term: string;       // word in the target language
  translation: string; // English meaning
  phonetic: string;   // pronunciation guide
  context?: string;
}

export interface VocabCategory {
  category: string;
  items: VocabEntry[];
}

export interface LanguageVocabulary {
  languageId: string;
  categories: VocabCategory[];
  grammarNotes: string;
  culturalNote: string;
  audioArchive?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// NIGERIAN PIDGIN ENGLISH (Naija)
// ─────────────────────────────────────────────────────────────────────────────
const PIDGIN_VOCAB: LanguageVocabulary = {
  languageId: 'pidgin',
  grammarNotes: `## Nigerian Pidgin English (Naija) Grammar

**Word Order:** Subject-Verb-Object, same as English.
**Tense:** Marked by particles: *don* (completed), *dey* (ongoing), *go* (future).
**Negation:** Use *no* before the verb — "I no know" = I don't know.
**Copula:** *na* replaces "is/am/are" — "Na me" = It is me.
**Plural:** No plural suffix; context or *dem* signals plurality.`,
  culturalNote: 'Nigerian Pidgin (Naija) is spoken by over 75 million Nigerians across all 36 states. It bridges ethnic divides and is the language of markets, music, comedy, and street culture. BBC Pidgin broadcasts news in Naija daily.',
  audioArchive: 'https://www.bbc.com/pidgin',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'How far?', translation: 'How are you? / What\'s up?', phonetic: 'hau fah' },
        { term: 'How you dey?', translation: 'How are you doing?', phonetic: 'hau yu dey' },
        { term: 'I dey fine', translation: 'I am fine', phonetic: 'ah dey fain' },
        { term: 'Wetin dey happen?', translation: 'What is happening?', phonetic: 'wetin dey hap-pen' },
        { term: 'Tenki', translation: 'Thank you', phonetic: 'ten-ki' },
        { term: 'Abeg', translation: 'Please / I beg you', phonetic: 'ah-beg' },
        { term: 'No wahala', translation: 'No problem / No worries', phonetic: 'no wa-ha-la' },
        { term: 'Gud monin', translation: 'Good morning', phonetic: 'gud mo-nin' },
        { term: 'Gud afta', translation: 'Good afternoon', phonetic: 'gud af-ta' },
        { term: 'Gud nite', translation: 'Good night', phonetic: 'gud nait' },
        { term: 'Bye bye', translation: 'Goodbye', phonetic: 'bai bai' },
        { term: 'Oya', translation: 'Let\'s go / Come on / Alright', phonetic: 'o-ya' },
        { term: 'E don do', translation: 'It is finished / That\'s enough', phonetic: 'eh don do' },
        { term: 'Na so', translation: 'That\'s right / Exactly', phonetic: 'na so' },
      ]
    },
    {
      category: 'People & Family',
      items: [
        { term: 'Mama', translation: 'Mother', phonetic: 'ma-ma' },
        { term: 'Papa', translation: 'Father', phonetic: 'pa-pa' },
        { term: 'Pikin', translation: 'Child', phonetic: 'pi-kin' },
        { term: 'Broda', translation: 'Brother / Male friend', phonetic: 'bro-da' },
        { term: 'Sista', translation: 'Sister / Female friend', phonetic: 'sis-ta' },
        { term: 'Oga', translation: 'Boss / Sir / Master', phonetic: 'o-ga' },
        { term: 'Madam', translation: 'Ma\'am / Female boss', phonetic: 'ma-dam' },
        { term: 'Baba', translation: 'Old man / Father figure', phonetic: 'ba-ba' },
        { term: 'Wifey', translation: 'Wife', phonetic: 'wai-fi' },
        { term: 'Husban', translation: 'Husband', phonetic: 'hus-ban' },
        { term: 'Dem', translation: 'They / Them / Those people', phonetic: 'dem' },
        { term: 'Una', translation: 'You all / You people', phonetic: 'u-na' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Wan', translation: 'One', phonetic: 'wan' },
        { term: 'Tu', translation: 'Two', phonetic: 'tu' },
        { term: 'Tri', translation: 'Three', phonetic: 'tri' },
        { term: 'Fo', translation: 'Four', phonetic: 'fo' },
        { term: 'Faiv', translation: 'Five', phonetic: 'faiv' },
        { term: 'Sikis', translation: 'Six', phonetic: 'si-kis' },
        { term: 'Seven', translation: 'Seven', phonetic: 'se-ven' },
        { term: 'Eit', translation: 'Eight', phonetic: 'eit' },
        { term: 'Nain', translation: 'Nine', phonetic: 'nain' },
        { term: 'Ten', translation: 'Ten', phonetic: 'ten' },
        { term: 'Handred', translation: 'One Hundred', phonetic: 'han-dred' },
        { term: 'Tausand', translation: 'One Thousand', phonetic: 'tau-sand' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Go', translation: 'Go', phonetic: 'go' },
        { term: 'Come', translation: 'Come', phonetic: 'kom' },
        { term: 'Chop', translation: 'Eat', phonetic: 'chop' },
        { term: 'Drink', translation: 'Drink', phonetic: 'drink' },
        { term: 'Sabi', translation: 'Know / Understand', phonetic: 'sa-bi' },
        { term: 'Gree', translation: 'Agree / Accept', phonetic: 'gree' },
        { term: 'Hear', translation: 'Hear / Listen', phonetic: 'hia' },
        { term: 'See', translation: 'See / Look', phonetic: 'si' },
        { term: 'Run', translation: 'Run / Flee', phonetic: 'ron' },
        { term: 'Carry', translation: 'Carry / Take', phonetic: 'ka-ri' },
        { term: 'Gree', translation: 'Agree', phonetic: 'gree' },
        { term: 'Vex', translation: 'Be angry', phonetic: 'veks' },
        { term: 'Shine ya eye', translation: 'Be alert / Be smart', phonetic: 'shain ya ai' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'I no sabi', translation: 'I don\'t know', phonetic: 'ah no sa-bi' },
        { term: 'Wetin be dat?', translation: 'What is that?', phonetic: 'we-tin be dat' },
        { term: 'E don finish', translation: 'It is finished / It\'s over', phonetic: 'eh don fi-nish' },
        { term: 'I wan chop', translation: 'I want to eat', phonetic: 'ah wan chop' },
        { term: 'How much e be?', translation: 'How much does it cost?', phonetic: 'hau moch eh be' },
        { term: 'My name na...', translation: 'My name is...', phonetic: 'mai neim na' },
        { term: 'I dey go', translation: 'I am going', phonetic: 'ah dey go' },
        { term: 'Make we go', translation: 'Let us go', phonetic: 'mek wi go' },
        { term: 'E no easy', translation: 'It is not easy', phonetic: 'eh no ee-zi' },
        { term: 'God don butter my bread', translation: 'God has blessed me', phonetic: 'god don bu-ta mai bred' },
        { term: 'I love you', translation: 'I love you', phonetic: 'ah lov yu' },
        { term: 'Wahala dey', translation: 'There is trouble / There is a problem', phonetic: 'wa-ha-la dey' },
      ]
    },
    {
      category: 'Food & Market',
      items: [
        { term: 'Chop', translation: 'Food / To eat', phonetic: 'chop' },
        { term: 'Eba', translation: 'Garri (cassava) dough', phonetic: 'e-ba' },
        { term: 'Egusi soup', translation: 'Melon seed soup', phonetic: 'e-gu-si sup' },
        { term: 'Suya', translation: 'Spiced grilled meat', phonetic: 'su-ya' },
        { term: 'Akara', translation: 'Bean cake / fritters', phonetic: 'a-ka-ra' },
        { term: 'Moi moi', translation: 'Steamed bean pudding', phonetic: 'moi moi' },
        { term: 'Pepper soup', translation: 'Spicy broth with meat/fish', phonetic: 'pe-pa sup' },
        { term: 'Garri', translation: 'Cassava granules', phonetic: 'ga-ri' },
        { term: 'Naira', translation: 'Nigerian currency', phonetic: 'nai-ra' },
        { term: 'Market', translation: 'Market / Marketplace', phonetic: 'ma-ket' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// YORUBA
// ─────────────────────────────────────────────────────────────────────────────
const YORUBA_VOCAB: LanguageVocabulary = {
  languageId: 'yoruba',
  grammarNotes: `## Yoruba Grammar

**Tonal Language:** Yoruba has 3 tones — High (á), Mid (a), Low (à). Tone changes meaning completely.
**Word Order:** Subject-Verb-Object (SVO).
**Negation:** *kò* or *ò* before the verb — "Ó kò lọ" = He did not go.
**Pronouns:** Mo (I), O/Ẹ (You), Ó (He/She/It), A (We), Ẹ (You pl.), Wọn (They).
**Nouns:** No grammatical gender. Plurals formed with context or *àwọn*.`,
  culturalNote: 'Yoruba is spoken by 40+ million people in Lagos, Ogun, Oyo, Osun, Ondo, and Ekiti states. It is one of Africa\'s most documented languages with a rich literary tradition, Ifá divination corpus, and global diaspora in Brazil, Cuba, and the Caribbean.',
  audioArchive: 'https://www.yorubaname.com',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Ẹ káàárọ̀', translation: 'Good morning', phonetic: 'eh kah-ah-raw' },
        { term: 'Ẹ káàsán', translation: 'Good afternoon', phonetic: 'eh kah-ah-san' },
        { term: 'Ẹ kàalẹ̀', translation: 'Good evening', phonetic: 'eh kah-ah-leh' },
        { term: 'Ẹ káàbọ̀', translation: 'Welcome', phonetic: 'eh kah-ah-baw' },
        { term: 'Báwo ni?', translation: 'How are you?', phonetic: 'bah-wo ni' },
        { term: 'Mo wà dáadáa', translation: 'I am fine / I am well', phonetic: 'mo wah dah-dah' },
        { term: 'Ẹ ṣéun', translation: 'Thank you', phonetic: 'eh sheh-un' },
        { term: 'Jọ̀wọ́', translation: 'Please', phonetic: 'jaw-wo' },
        { term: 'Ẹ má bínú', translation: 'Sorry / Excuse me', phonetic: 'eh mah bi-nu' },
        { term: 'O dàbọ̀', translation: 'Goodbye', phonetic: 'o dah-baw' },
        { term: 'Ó yá', translation: 'Alright / OK / Let\'s go', phonetic: 'o yah' },
        { term: 'Ẹ jọ̀wọ́', translation: 'Please (formal)', phonetic: 'eh jaw-wo' },
        { term: 'Ẹ káàbọ̀ padà', translation: 'Welcome back', phonetic: 'eh kah-baw pah-dah' },
        { term: 'Ó dára', translation: 'It is good / Fine', phonetic: 'o dah-rah' },
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
        { term: 'Ẹbí', translation: 'Family / Relative', phonetic: 'eh-bi' },
        { term: 'Ọkùnrin', translation: 'Man', phonetic: 'aw-kun-rin' },
        { term: 'Obìnrin', translation: 'Woman', phonetic: 'o-bin-rin' },
        { term: 'Àgbàdo', translation: 'Grandfather / Elder', phonetic: 'ah-gbah-do' },
        { term: 'Ìyá àgbà', translation: 'Grandmother', phonetic: 'ee-yah ah-gbah' },
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
        { term: 'Ogún', translation: 'Twenty', phonetic: 'o-gun' },
        { term: 'Ọgọ́ta', translation: 'Sixty', phonetic: 'aw-gaw-tah' },
        { term: 'Ọgọ́rùn', translation: 'One Hundred', phonetic: 'aw-gaw-run' },
      ]
    },
    {
      category: 'Body Parts',
      items: [
        { term: 'Orí', translation: 'Head', phonetic: 'o-ri' },
        { term: 'Ojú', translation: 'Eye / Face', phonetic: 'o-ju' },
        { term: 'Etí', translation: 'Ear', phonetic: 'eh-ti' },
        { term: 'Imú', translation: 'Nose', phonetic: 'ee-mu' },
        { term: 'Ẹnu', translation: 'Mouth', phonetic: 'eh-nu' },
        { term: 'Eyín', translation: 'Tooth', phonetic: 'eh-yin' },
        { term: 'Ọwọ́', translation: 'Hand / Arm', phonetic: 'aw-wo' },
        { term: 'Ẹsẹ̀', translation: 'Leg / Foot', phonetic: 'eh-sheh' },
        { term: 'Àyà', translation: 'Chest', phonetic: 'ah-yah' },
        { term: 'Inú', translation: 'Stomach / Inside', phonetic: 'ee-nu' },
        { term: 'Ẹ̀yìn', translation: 'Back', phonetic: 'eh-yin' },
        { term: 'Orùn', translation: 'Neck', phonetic: 'o-run' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Oúnjẹ', translation: 'Food', phonetic: 'o-un-jeh' },
        { term: 'Omi', translation: 'Water', phonetic: 'o-mi' },
        { term: 'Iyán', translation: 'Pounded yam', phonetic: 'ee-yan' },
        { term: 'Ẹ̀bà', translation: 'Garri dough', phonetic: 'eh-bah' },
        { term: 'Egúsí', translation: 'Melon seed soup', phonetic: 'eh-gu-si' },
        { term: 'Ẹran', translation: 'Meat', phonetic: 'eh-ran' },
        { term: 'Ẹja', translation: 'Fish', phonetic: 'eh-jah' },
        { term: 'Ìyán', translation: 'Yam', phonetic: 'ee-yan' },
        { term: 'Ìrẹsì', translation: 'Rice', phonetic: 'ee-reh-si' },
        { term: 'Àgbàdo', translation: 'Corn / Maize', phonetic: 'ah-gbah-do' },
        { term: 'Ọtí', translation: 'Alcohol / Drink', phonetic: 'aw-ti' },
        { term: 'Ọbẹ̀', translation: 'Soup / Stew', phonetic: 'aw-beh' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Lọ', translation: 'Go', phonetic: 'law' },
        { term: 'Wá', translation: 'Come', phonetic: 'wah' },
        { term: 'Jẹ', translation: 'Eat', phonetic: 'jeh' },
        { term: 'Mu', translation: 'Drink', phonetic: 'mu' },
        { term: 'Sọ', translation: 'Say / Speak', phonetic: 'shaw' },
        { term: 'Gbọ́', translation: 'Hear / Listen', phonetic: 'gbaw' },
        { term: 'Rí', translation: 'See', phonetic: 'ri' },
        { term: 'Mọ̀', translation: 'Know', phonetic: 'maw' },
        { term: 'Fẹ́', translation: 'Want / Love', phonetic: 'feh' },
        { term: 'Ṣe', translation: 'Do / Make', phonetic: 'sheh' },
        { term: 'Jókòó', translation: 'Sit down', phonetic: 'jo-ko' },
        { term: 'Dìde', translation: 'Stand up', phonetic: 'di-deh' },
        { term: 'Sáré', translation: 'Run', phonetic: 'sah-reh' },
        { term: 'Rìn', translation: 'Walk', phonetic: 'rin' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Orúkọ mi ni...', translation: 'My name is...', phonetic: 'o-ru-kaw mi ni' },
        { term: 'Níbo ni o wà?', translation: 'Where are you?', phonetic: 'ni-bo ni o wah' },
        { term: 'Mo fẹ́ lọ', translation: 'I want to go', phonetic: 'mo feh law' },
        { term: 'Ẹ jọ̀wọ́ ran mí lọ́wọ́', translation: 'Please help me', phonetic: 'eh jaw-wo ran mi law-wo' },
        { term: 'Melo ni?', translation: 'How much?', phonetic: 'meh-lo ni' },
        { term: 'Mi ò mọ̀', translation: 'I don\'t know', phonetic: 'mi o maw' },
        { term: 'Ẹ dúpẹ́', translation: 'Thank you (formal)', phonetic: 'eh du-peh' },
        { term: 'Mo nífẹ̀ẹ́ rẹ', translation: 'I love you', phonetic: 'mo ni-feh reh' },
        { term: 'Jẹ́ ká lọ', translation: 'Let\'s go', phonetic: 'jeh kah law' },
        { term: 'Ẹ jọ̀wọ́ sọ lẹ́ẹ̀kan sí i', translation: 'Please say it again', phonetic: 'eh jaw-wo shaw leh-kan si' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Ọlọ́run', translation: 'God (Almighty)', phonetic: 'aw-law-run' },
        { term: 'Ifá', translation: 'Yoruba divination system', phonetic: 'ee-fah' },
        { term: 'Ọba', translation: 'King', phonetic: 'aw-bah' },
        { term: 'Ìlú', translation: 'Town / City', phonetic: 'ee-lu' },
        { term: 'Egúngún', translation: 'Ancestral masquerade', phonetic: 'eh-gun-gun' },
        { term: 'Àṣà', translation: 'Culture / Tradition', phonetic: 'ah-shah' },
        { term: 'Orí', translation: 'Personal destiny / Inner head', phonetic: 'o-ri' },
        { term: 'Àṣẹ', translation: 'So be it / Divine power', phonetic: 'ah-sheh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// IGBO
// ─────────────────────────────────────────────────────────────────────────────
const IGBO_VOCAB: LanguageVocabulary = {
  languageId: 'igbo',
  grammarNotes: `## Igbo Grammar

**Tonal Language:** Igbo uses High (á) and Low (à) tones; tone changes meaning.
**Word Order:** Subject-Verb-Object (SVO).
**Negation:** *Ọ bụghị* (it is not) or *Ọ dịghị* (there is not).
**Pronouns:** M/Mu (I), Gị (You), Ọ (He/She/It), Anyị (We), Ụnụ (You pl.), Ha (They).
**Verbs:** Verbs often take suffixes to indicate tense and aspect.`,
  culturalNote: 'Igbo is spoken by 30+ million people in Abia, Anambra, Ebonyi, Enugu, and Imo states. The Igbo have a rich tradition of trade, art (Igbo-Ukwu bronzes), and the Odinani spiritual system. The language has many dialects including Owerri, Onitsha, and Nnewi.',
  audioArchive: 'https://www.igboguide.org',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Nnọọ', translation: 'Welcome', phonetic: 'n-noh' },
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine / It is good', phonetic: 'aw di m-mah' },
        { term: 'Ụtụtụ ọma', translation: 'Good morning', phonetic: 'u-tu-tu aw-mah' },
        { term: 'Ehihie ọma', translation: 'Good afternoon', phonetic: 'eh-hi-hye aw-mah' },
        { term: 'Anyasị ọma', translation: 'Good evening', phonetic: 'an-ya-si aw-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'bi-ko' },
        { term: 'Ndo', translation: 'Sorry / Condolence', phonetic: 'n-do' },
        { term: 'Ka ọ dị', translation: 'Goodbye / Farewell', phonetic: 'kah aw di' },
        { term: 'Ka emesia', translation: 'See you later', phonetic: 'kah eh-meh-sya' },
        { term: 'Ọ dị mma', translation: 'It is fine / OK', phonetic: 'aw di m-mah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Nna', translation: 'Father', phonetic: 'n-nah' },
        { term: 'Nne', translation: 'Mother', phonetic: 'n-neh' },
        { term: 'Nwa', translation: 'Child', phonetic: 'n-wah' },
        { term: 'Nwanne', translation: 'Sibling / Relative', phonetic: 'n-wan-neh' },
        { term: 'Di', translation: 'Husband', phonetic: 'di' },
        { term: 'Nwunye', translation: 'Wife', phonetic: 'n-wun-yeh' },
        { term: 'Nwoke', translation: 'Man', phonetic: 'n-wo-keh' },
        { term: 'Nwanyị', translation: 'Woman', phonetic: 'n-wan-yi' },
        { term: 'Ụmụ', translation: 'Children / People of', phonetic: 'u-mu' },
        { term: 'Ọha', translation: 'Community / People', phonetic: 'aw-ha' },
        { term: 'Enyi', translation: 'Friend', phonetic: 'en-yi' },
        { term: 'Nnanna', translation: 'Grandfather', phonetic: 'n-nan-nah' },
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
        { term: 'Iri abụọ', translation: 'Twenty', phonetic: 'ee-ri ah-bwaw' },
        { term: 'Otu narị', translation: 'One Hundred', phonetic: 'o-tu nah-ri' },
      ]
    },
    {
      category: 'Body Parts',
      items: [
        { term: 'Isi', translation: 'Head', phonetic: 'ee-si' },
        { term: 'Anya', translation: 'Eye', phonetic: 'an-yah' },
        { term: 'Ntị', translation: 'Ear', phonetic: 'n-ti' },
        { term: 'Imi', translation: 'Nose', phonetic: 'ee-mi' },
        { term: 'Ọnụ', translation: 'Mouth', phonetic: 'aw-nu' },
        { term: 'Eze', translation: 'Tooth', phonetic: 'eh-zeh' },
        { term: 'Aka', translation: 'Hand / Arm', phonetic: 'ah-kah' },
        { term: 'Ụkwụ', translation: 'Leg / Foot', phonetic: 'u-kwu' },
        { term: 'Obi', translation: 'Heart / Chest', phonetic: 'o-bi' },
        { term: 'Afọ', translation: 'Stomach', phonetic: 'ah-faw' },
        { term: 'Azụ', translation: 'Back / Fish', phonetic: 'ah-zu' },
        { term: 'Olu', translation: 'Neck', phonetic: 'o-lu' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Nri', translation: 'Food', phonetic: 'n-ri' },
        { term: 'Mmiri', translation: 'Water', phonetic: 'm-mi-ri' },
        { term: 'Ji', translation: 'Yam', phonetic: 'ji' },
        { term: 'Ede', translation: 'Cocoyam', phonetic: 'eh-deh' },
        { term: 'Ọsọ ọjị', translation: 'Kola nut', phonetic: 'aw-saw aw-ji' },
        { term: 'Anụ', translation: 'Meat', phonetic: 'ah-nu' },
        { term: 'Azụ', translation: 'Fish', phonetic: 'ah-zu' },
        { term: 'Ọfe', translation: 'Soup / Stew', phonetic: 'aw-feh' },
        { term: 'Ọkpa', translation: 'Bambara nut', phonetic: 'aw-kpah' },
        { term: 'Ugba', translation: 'Oil bean (ukpaka)', phonetic: 'ug-bah' },
        { term: 'Mmanya', translation: 'Wine / Drink', phonetic: 'm-man-yah' },
        { term: 'Ọjị', translation: 'Kola nut (sacred)', phonetic: 'aw-ji' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Gaa', translation: 'Go', phonetic: 'gah' },
        { term: 'Bia', translation: 'Come', phonetic: 'byah' },
        { term: 'Rie', translation: 'Eat', phonetic: 'ryeh' },
        { term: 'Ọ̀ṅụọ', translation: 'Drink', phonetic: 'aw-nwaw' },
        { term: 'Kwuo', translation: 'Say / Speak', phonetic: 'kwuo' },
        { term: 'Nụ', translation: 'Hear', phonetic: 'nu' },
        { term: 'Hụ', translation: 'See', phonetic: 'hu' },
        { term: 'Mara', translation: 'Know', phonetic: 'mah-rah' },
        { term: 'Chee', translation: 'Think / Wait', phonetic: 'cheh' },
        { term: 'Rụọ ọrụ', translation: 'Work', phonetic: 'rwaw aw-rwu' },
        { term: 'Gaa ije', translation: 'Travel / Walk', phonetic: 'gah ee-jeh' },
        { term: 'Nọọ', translation: 'Stay / Remain', phonetic: 'naw' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Aha m bụ...', translation: 'My name is...', phonetic: 'ah-ha m bu' },
        { term: 'Ọ dị ebe ọ bụla?', translation: 'Where is it?', phonetic: 'aw di eh-beh aw-bu-lah' },
        { term: 'Ego ole?', translation: 'How much?', phonetic: 'eh-go o-leh' },
        { term: 'Amaghị m', translation: 'I don\'t know', phonetic: 'ah-mah-ghi m' },
        { term: 'Ọ dị mma', translation: 'It is fine / OK', phonetic: 'aw di m-mah' },
        { term: 'Hụrụ m gị n\'anya', translation: 'I love you', phonetic: 'hu-rwu m gi n-an-yah' },
        { term: 'Ka anyị gaa', translation: 'Let\'s go', phonetic: 'kah an-yi gah' },
        { term: 'Ọ dị ike', translation: 'It is difficult / It is strong', phonetic: 'aw di ee-keh' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Chukwu', translation: 'God (Supreme Being)', phonetic: 'chu-kwu' },
        { term: 'Chi', translation: 'Personal god / Guardian spirit', phonetic: 'chi' },
        { term: 'Odinani', translation: 'Igbo traditional religion', phonetic: 'o-di-nah-ni' },
        { term: 'Eze', translation: 'King / Chief', phonetic: 'eh-zeh' },
        { term: 'Ọfọ', translation: 'Sacred staff of justice', phonetic: 'aw-faw' },
        { term: 'Ọjị', translation: 'Kola nut (used in ceremonies)', phonetic: 'aw-ji' },
        { term: 'Igba ndu', translation: 'Covenant / Life pact', phonetic: 'ig-bah n-du' },
        { term: 'Ụmụnna', translation: 'Kinsmen / Patrilineal group', phonetic: 'u-mu-n-nah' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// HAUSA
// ─────────────────────────────────────────────────────────────────────────────
const HAUSA_VOCAB: LanguageVocabulary = {
  languageId: 'hausa',
  grammarNotes: `## Hausa Grammar

**Tonal Language:** Hausa has High (á), Low (à), and Falling (â) tones.
**Word Order:** Subject-Verb-Object (SVO).
**Gender:** Hausa nouns have masculine and feminine gender. Feminine nouns often end in -a.
**Negation:** *ba...ba* surrounds the verb — "Ba na tafiya ba" = I am not going.
**Pronouns:** Ni (I), Kai/Ke (You m/f), Shi/Ita (He/She), Mu (We), Ku (You pl.), Su (They).`,
  culturalNote: 'Hausa is spoken by 70+ million people, making it the most widely spoken language in West Africa. It is the dominant language of northern Nigeria (Kano, Kaduna, Katsina, Sokoto) and serves as a trade language across the Sahel. Hausa has a rich literary tradition in Ajami (Arabic script) dating back centuries.',
  audioArchive: 'https://www.hausadictionary.com',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Sannu', translation: 'Hello / Hi', phonetic: 'san-nu' },
        { term: 'Barka da safe', translation: 'Good morning', phonetic: 'bar-kah dah sah-feh' },
        { term: 'Barka da rana', translation: 'Good afternoon', phonetic: 'bar-kah dah rah-nah' },
        { term: 'Barka da yamma', translation: 'Good evening', phonetic: 'bar-kah dah yam-mah' },
        { term: 'Ina kwana?', translation: 'Good morning (lit. How did you sleep?)', phonetic: 'ee-nah kwah-nah' },
        { term: 'Lafiya lau', translation: 'Fine / Very well', phonetic: 'lah-fi-yah lau' },
        { term: 'Ina wuni?', translation: 'How are you? (afternoon)', phonetic: 'ee-nah wu-ni' },
        { term: 'Na gode', translation: 'Thank you', phonetic: 'nah go-deh' },
        { term: 'Don Allah', translation: 'Please / For God\'s sake', phonetic: 'don al-lah' },
        { term: 'Yi haƙuri', translation: 'Be patient / Sorry', phonetic: 'yi hah-ku-ri' },
        { term: 'Sai an jima', translation: 'See you later / Goodbye', phonetic: 'sai an ji-mah' },
        { term: 'Sai gobe', translation: 'See you tomorrow', phonetic: 'sai go-beh' },
        { term: 'Madalla', translation: 'Well done / Excellent', phonetic: 'mah-dal-lah' },
        { term: 'Yauwa', translation: 'Yes / OK / Alright', phonetic: 'yau-wah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Uba', translation: 'Father', phonetic: 'u-bah' },
        { term: 'Uwa', translation: 'Mother', phonetic: 'u-wah' },
        { term: 'Ɗa', translation: 'Son', phonetic: 'dah' },
        { term: 'Yarinya', translation: 'Girl / Daughter', phonetic: 'yah-rin-yah' },
        { term: 'Yaro', translation: 'Boy / Son', phonetic: 'yah-ro' },
        { term: 'Miji', translation: 'Husband', phonetic: 'mi-ji' },
        { term: 'Matar aure', translation: 'Wife', phonetic: 'mah-tar au-reh' },
        { term: 'Ɗan\'uwa', translation: 'Brother', phonetic: 'dan-u-wah' },
        { term: 'Yaya', translation: 'Elder sibling', phonetic: 'yah-yah' },
        { term: 'Ƙanwa', translation: 'Younger sibling', phonetic: 'kan-wah' },
        { term: 'Kaka', translation: 'Grandfather / Grandmother', phonetic: 'kah-kah' },
        { term: 'Aboki', translation: 'Friend (male)', phonetic: 'ah-bo-ki' },
        { term: 'Abokin aiki', translation: 'Colleague', phonetic: 'ah-bo-kin ai-ki' },
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
        { term: 'Ashirin', translation: 'Twenty', phonetic: 'ah-shi-rin' },
        { term: 'Ɗari', translation: 'One Hundred', phonetic: 'dah-ri' },
        { term: 'Dubu', translation: 'One Thousand', phonetic: 'du-bu' },
      ]
    },
    {
      category: 'Body Parts',
      items: [
        { term: 'Kai', translation: 'Head', phonetic: 'kai' },
        { term: 'Ido', translation: 'Eye', phonetic: 'ee-do' },
        { term: 'Kunne', translation: 'Ear', phonetic: 'kun-neh' },
        { term: 'Hanci', translation: 'Nose', phonetic: 'han-chi' },
        { term: 'Baki', translation: 'Mouth', phonetic: 'bah-ki' },
        { term: 'Haƙori', translation: 'Tooth', phonetic: 'hah-ko-ri' },
        { term: 'Hannu', translation: 'Hand / Arm', phonetic: 'han-nu' },
        { term: 'Ƙafa', translation: 'Leg / Foot', phonetic: 'kah-fah' },
        { term: 'Kirji', translation: 'Chest', phonetic: 'kir-ji' },
        { term: 'Ciki', translation: 'Stomach / Inside', phonetic: 'chi-ki' },
        { term: 'Baya', translation: 'Back', phonetic: 'bah-yah' },
        { term: 'Wuya', translation: 'Neck', phonetic: 'wu-yah' },
      ]
    },
    {
      category: 'Food & Drinks',
      items: [
        { term: 'Abinci', translation: 'Food', phonetic: 'ah-bin-chi' },
        { term: 'Ruwa', translation: 'Water', phonetic: 'ru-wah' },
        { term: 'Tuwo', translation: 'Stiff porridge (tuwo shinkafa/masara)', phonetic: 'tu-wo' },
        { term: 'Miyan kuka', translation: 'Baobab leaf soup', phonetic: 'mi-yan ku-kah' },
        { term: 'Suya', translation: 'Spiced grilled meat', phonetic: 'su-yah' },
        { term: 'Fura da nono', translation: 'Millet balls with yoghurt', phonetic: 'fu-rah dah no-no' },
        { term: 'Nama', translation: 'Meat', phonetic: 'nah-mah' },
        { term: 'Kifi', translation: 'Fish', phonetic: 'ki-fi' },
        { term: 'Shinkafa', translation: 'Rice', phonetic: 'shin-kah-fah' },
        { term: 'Gero', translation: 'Millet', phonetic: 'geh-ro' },
        { term: 'Gyaɗa', translation: 'Groundnut / Peanut', phonetic: 'gyah-dah' },
        { term: 'Madara', translation: 'Milk', phonetic: 'mah-dah-rah' },
      ]
    },
    {
      category: 'Action Verbs',
      items: [
        { term: 'Tafi', translation: 'Go', phonetic: 'tah-fi' },
        { term: 'Zo', translation: 'Come', phonetic: 'zo' },
        { term: 'Ci', translation: 'Eat', phonetic: 'chi' },
        { term: 'Sha', translation: 'Drink', phonetic: 'shah' },
        { term: 'Faɗa', translation: 'Say / Tell', phonetic: 'fah-dah' },
        { term: 'Ji', translation: 'Hear / Feel', phonetic: 'ji' },
        { term: 'Gani', translation: 'See', phonetic: 'gah-ni' },
        { term: 'Sani', translation: 'Know', phonetic: 'sah-ni' },
        { term: 'Yi', translation: 'Do / Make', phonetic: 'yi' },
        { term: 'Zauna', translation: 'Sit / Stay', phonetic: 'zau-nah' },
        { term: 'Tashi', translation: 'Stand up / Wake up', phonetic: 'tah-shi' },
        { term: 'Gudu', translation: 'Run', phonetic: 'gu-du' },
        { term: 'Tafiya', translation: 'Walk / Travel', phonetic: 'tah-fi-yah' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Sunana...', translation: 'My name is...', phonetic: 'su-nah-nah' },
        { term: 'Ina so ka/ki', translation: 'I love you (m/f)', phonetic: 'ee-nah so kah/ki' },
        { term: 'Ban sani ba', translation: 'I don\'t know', phonetic: 'ban sah-ni bah' },
        { term: 'Nawa ne?', translation: 'How much?', phonetic: 'nah-wah neh' },
        { term: 'Ina gida?', translation: 'Where is the house?', phonetic: 'ee-nah gi-dah' },
        { term: 'Mu tafi', translation: 'Let\'s go', phonetic: 'mu tah-fi' },
        { term: 'Ina jin yunwa', translation: 'I am hungry', phonetic: 'ee-nah jin yun-wah' },
        { term: 'Allah ya kiyaye', translation: 'God protect us', phonetic: 'al-lah yah ki-yah-yeh' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Allah', translation: 'God', phonetic: 'al-lah' },
        { term: 'Sallah', translation: 'Prayer / Islamic festival', phonetic: 'sal-lah' },
        { term: 'Sarki', translation: 'King / Emir', phonetic: 'sar-ki' },
        { term: 'Masallaci', translation: 'Mosque', phonetic: 'mah-sal-lah-chi' },
        { term: 'Alƙali', translation: 'Judge (Islamic)', phonetic: 'al-kah-li' },
        { term: 'Gida', translation: 'Home / Compound', phonetic: 'gi-dah' },
        { term: 'Kasuwa', translation: 'Market', phonetic: 'kah-su-wah' },
        { term: 'Darika', translation: 'Sufi brotherhood', phonetic: 'dah-ri-kah' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// EFIK
// ─────────────────────────────────────────────────────────────────────────────
const EFIK_VOCAB: LanguageVocabulary = {
  languageId: 'efik',
  grammarNotes: `## Efik Grammar

**Word Order:** Subject-Verb-Object (SVO).
**Tones:** Efik is tonal with High and Low tones marking meaning.
**Negation:** *kpọkọ* or *ke* used for negation.
**Pronouns:** Ami (I), Afo (You), Ọ (He/She), Nyin (We), Ufọk (You pl.), Ọkọ (They).
**Nouns:** Nouns take prefixes to indicate class and number.`,
  culturalNote: 'Efik is spoken by the Efik people of Cross River and Akwa Ibom states. It was one of the first Nigerian languages to be written (1812) and has a rich tradition of trade, the Ekpe secret society, and the Calabar Carnival. Efik and Ibibio are closely related and mutually intelligible.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Mọ fo', translation: 'Good morning', phonetic: 'maw fo' },
        { term: 'Mọ ke', translation: 'Good afternoon', phonetic: 'maw keh' },
        { term: 'Mọ nyọrọ', translation: 'Good evening', phonetic: 'maw nyaw-raw' },
        { term: 'Ọ fo sọn?', translation: 'How are you?', phonetic: 'aw fo sawn' },
        { term: 'Ami fo', translation: 'I am fine', phonetic: 'ah-mi fo' },
        { term: 'Sosongo', translation: 'Thank you', phonetic: 'so-son-go' },
        { term: 'Ke sọn', translation: 'Please', phonetic: 'keh sawn' },
        { term: 'Ọkọrọ', translation: 'Welcome', phonetic: 'aw-ko-raw' },
        { term: 'Ọ dọrọ', translation: 'Goodbye', phonetic: 'aw do-raw' },
        { term: 'Ndito', translation: 'Sorry / Condolence', phonetic: 'n-di-to' },
        { term: 'Ọ ke fo', translation: 'It is good', phonetic: 'aw keh fo' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Ete', translation: 'Father', phonetic: 'eh-teh' },
        { term: 'Eka', translation: 'Mother', phonetic: 'eh-kah' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Ọkpọ', translation: 'Man', phonetic: 'aw-kpaw' },
        { term: 'Ọfọn', translation: 'Woman', phonetic: 'aw-fawn' },
        { term: 'Ọkọ', translation: 'Husband', phonetic: 'aw-kaw' },
        { term: 'Ọfọn afo', translation: 'Wife', phonetic: 'aw-fawn ah-fo' },
        { term: 'Ndidem', translation: 'Elder / Chief', phonetic: 'n-di-dem' },
        { term: 'Ọbọn', translation: 'King / Lord', phonetic: 'aw-bawn' },
        { term: 'Ọkpọkpọ', translation: 'Friend', phonetic: 'aw-kpaw-kpaw' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Kiet', translation: 'One', phonetic: 'kyet' },
        { term: 'Iba', translation: 'Two', phonetic: 'ee-bah' },
        { term: 'Ita', translation: 'Three', phonetic: 'ee-tah' },
        { term: 'Inan', translation: 'Four', phonetic: 'ee-nan' },
        { term: 'Itiọn', translation: 'Five', phonetic: 'ee-tyawn' },
        { term: 'Itiọn kiet', translation: 'Six', phonetic: 'ee-tyawn kyet' },
        { term: 'Itiọn iba', translation: 'Seven', phonetic: 'ee-tyawn ee-bah' },
        { term: 'Itiọn ita', translation: 'Eight', phonetic: 'ee-tyawn ee-tah' },
        { term: 'Itiọn inan', translation: 'Nine', phonetic: 'ee-tyawn ee-nan' },
        { term: 'Duọp', translation: 'Ten', phonetic: 'dwawp' },
        { term: 'Duọp iba', translation: 'Twenty', phonetic: 'dwawp ee-bah' },
        { term: 'Ibuọt', translation: 'One Hundred', phonetic: 'ee-bwawt' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Ọkọrọ ami ke...', translation: 'My name is...', phonetic: 'aw-ko-raw ah-mi keh' },
        { term: 'Ami kọrọ ọkọrọ', translation: 'I don\'t know', phonetic: 'ah-mi kaw-raw aw-ko-raw' },
        { term: 'Ọ ke fo nte?', translation: 'How much is it?', phonetic: 'aw keh fo n-teh' },
        { term: 'Ami yak afo', translation: 'I love you', phonetic: 'ah-mi yak ah-fo' },
        { term: 'Ke dọrọ', translation: 'Let\'s go', phonetic: 'keh do-raw' },
        { term: 'Ọ ke fo', translation: 'It is fine / OK', phonetic: 'aw keh fo' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Abasi', translation: 'God', phonetic: 'ah-bah-si' },
        { term: 'Ekpe', translation: 'Sacred leopard society', phonetic: 'ek-peh' },
        { term: 'Ọbọn', translation: 'King / Paramount ruler', phonetic: 'aw-bawn' },
        { term: 'Ufọk', translation: 'House / Home', phonetic: 'u-fawk' },
        { term: 'Nwed', translation: 'Song / Music', phonetic: 'n-wed' },
        { term: 'Nnyin', translation: 'We / Our people', phonetic: 'n-nyin' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// IBIBIO
// ─────────────────────────────────────────────────────────────────────────────
const IBIBIO_VOCAB: LanguageVocabulary = {
  languageId: 'ibibio',
  grammarNotes: `## Ibibio Grammar

**Word Order:** Subject-Verb-Object (SVO).
**Tones:** High and Low tones distinguish meaning.
**Closely related to Efik** — many words are shared or similar.
**Negation:** *kpọkọ* negates verbs.
**Pronouns:** Ami (I), Afo (You), Ọ (He/She), Nyin (We), Ọkọ (They).`,
  culturalNote: 'Ibibio is spoken by 4+ million people in Akwa Ibom State. The Ibibio are known for their Ekpo masquerade tradition, skilled woodcarving, and the Ekpe society. The language is closely related to Efik and Annang.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Amesiere', translation: 'Good morning', phonetic: 'ah-meh-sye-reh' },
        { term: 'Emesiere', translation: 'Good afternoon', phonetic: 'eh-meh-sye-reh' },
        { term: 'Ọ fo sọn?', translation: 'How are you?', phonetic: 'aw fo sawn' },
        { term: 'Ami fo', translation: 'I am fine', phonetic: 'ah-mi fo' },
        { term: 'Sosongo', translation: 'Thank you', phonetic: 'so-son-go' },
        { term: 'Ke sọn', translation: 'Please', phonetic: 'keh sawn' },
        { term: 'Ndito', translation: 'Sorry', phonetic: 'n-di-to' },
        { term: 'Ọkọrọ', translation: 'Welcome', phonetic: 'aw-ko-raw' },
        { term: 'Dimi', translation: 'Come here', phonetic: 'di-mi' },
        { term: 'Didia odia', translation: 'Come and eat', phonetic: 'di-dyah o-dyah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Ete', translation: 'Father', phonetic: 'eh-teh' },
        { term: 'Eka', translation: 'Mother', phonetic: 'eh-kah' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Ọkpọ', translation: 'Man', phonetic: 'aw-kpaw' },
        { term: 'Ọfọn', translation: 'Woman', phonetic: 'aw-fawn' },
        { term: 'Ndidem', translation: 'Elder / Chief', phonetic: 'n-di-dem' },
        { term: 'Abasi', translation: 'God', phonetic: 'ah-bah-si' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Kiet', translation: 'One', phonetic: 'kyet' },
        { term: 'Iba', translation: 'Two', phonetic: 'ee-bah' },
        { term: 'Ita', translation: 'Three', phonetic: 'ee-tah' },
        { term: 'Inan', translation: 'Four', phonetic: 'ee-nan' },
        { term: 'Itiọn', translation: 'Five', phonetic: 'ee-tyawn' },
        { term: 'Duọp', translation: 'Ten', phonetic: 'dwawp' },
        { term: 'Ibuọt', translation: 'One Hundred', phonetic: 'ee-bwawt' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Ami yak afo', translation: 'I love you', phonetic: 'ah-mi yak ah-fo' },
        { term: 'Ọ ke fo nte?', translation: 'How much?', phonetic: 'aw keh fo n-teh' },
        { term: 'Ke dọrọ', translation: 'Let\'s go', phonetic: 'keh do-raw' },
        { term: 'Ọ ke fo', translation: 'It is fine', phonetic: 'aw keh fo' },
        { term: 'Ami kọrọ', translation: 'I don\'t know', phonetic: 'ah-mi kaw-raw' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// IJAW (IZON)
// ─────────────────────────────────────────────────────────────────────────────
const IJAW_VOCAB: LanguageVocabulary = {
  languageId: 'ijaw',
  grammarNotes: `## Ijaw (Izon) Grammar

**Word Order:** Subject-Object-Verb (SOV) — unusual in Niger-Congo languages.
**Tones:** High and Low tones are phonemic.
**Negation:** *keme* or *kẹmẹ* negates verbs.
**Pronouns:** Mí (I), Wó (You), Ó (He/She), Wári (We), Wóni (You pl.), Ọní (They).
**Postpositions:** Ijaw uses postpositions rather than prepositions.`,
  culturalNote: 'Ijaw (Izon) is spoken by the Ijaw people of Bayelsa, Delta, and Rivers states in the Niger Delta. The Ijaw are one of Nigeria\'s oldest indigenous peoples, with a history of fishing, trading, and the Owuamapu water spirit tradition. The Kolokuma dialect is used in education.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Wóyingi', translation: 'God / Creator (greeting context)', phonetic: 'wo-yin-gi' },
        { term: 'Ọ dọ?', translation: 'How are you?', phonetic: 'aw daw' },
        { term: 'Mí dọ', translation: 'I am fine', phonetic: 'mi daw' },
        { term: 'Ọ wáo', translation: 'Good morning', phonetic: 'aw wao' },
        { term: 'Ọ bọ', translation: 'Good afternoon', phonetic: 'aw baw' },
        { term: 'Ọ yẹ', translation: 'Good evening', phonetic: 'aw yeh' },
        { term: 'Ọ kẹmẹ', translation: 'Thank you', phonetic: 'aw keh-meh' },
        { term: 'Bọ', translation: 'Please / Come', phonetic: 'baw' },
        { term: 'Ọ dọ bọ', translation: 'Welcome', phonetic: 'aw daw baw' },
        { term: 'Ọ yẹ bọ', translation: 'Goodbye', phonetic: 'aw yeh baw' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Bou', translation: 'Father', phonetic: 'bou' },
        { term: 'Iye', translation: 'Mother', phonetic: 'ee-yeh' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Okó', translation: 'Man / Husband', phonetic: 'o-ko' },
        { term: 'Ọpụ', translation: 'Woman / Wife', phonetic: 'aw-pu' },
        { term: 'Ọrụ', translation: 'Elder', phonetic: 'aw-rwu' },
        { term: 'Ọbọ', translation: 'Friend', phonetic: 'aw-baw' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ọkó', translation: 'One', phonetic: 'aw-ko' },
        { term: 'Ọwẹi', translation: 'Two', phonetic: 'aw-wei' },
        { term: 'Ẹni', translation: 'Three', phonetic: 'eh-ni' },
        { term: 'Ọni', translation: 'Four', phonetic: 'aw-ni' },
        { term: 'Ọgbọ', translation: 'Five', phonetic: 'aw-gbaw' },
        { term: 'Ọkó ọgbọ', translation: 'Six', phonetic: 'aw-ko aw-gbaw' },
        { term: 'Ọwẹi ọgbọ', translation: 'Seven', phonetic: 'aw-wei aw-gbaw' },
        { term: 'Ẹni ọgbọ', translation: 'Eight', phonetic: 'eh-ni aw-gbaw' },
        { term: 'Ọni ọgbọ', translation: 'Nine', phonetic: 'aw-ni aw-gbaw' },
        { term: 'Ẹbị', translation: 'Ten', phonetic: 'eh-bi' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Mí ẹrẹ...', translation: 'My name is...', phonetic: 'mi eh-reh' },
        { term: 'Mí sọ', translation: 'I don\'t know', phonetic: 'mi saw' },
        { term: 'Ọ bẹ nte?', translation: 'How much?', phonetic: 'aw beh n-teh' },
        { term: 'Mí fụrụ wó', translation: 'I love you', phonetic: 'mi fu-rwu wo' },
        { term: 'Wári bọ', translation: 'Let\'s go', phonetic: 'wah-ri baw' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Wóyingi', translation: 'Supreme God / Creator', phonetic: 'wo-yin-gi' },
        { term: 'Owuamapu', translation: 'Water spirit / Deity', phonetic: 'o-wua-mah-pu' },
        { term: 'Egbesu', translation: 'God of war and justice', phonetic: 'eg-beh-su' },
        { term: 'Amayanabo', translation: 'King / Paramount ruler', phonetic: 'ah-mah-yah-nah-bo' },
        { term: 'Ẹrẹ', translation: 'Name / Identity', phonetic: 'eh-reh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// URHOBO
// ─────────────────────────────────────────────────────────────────────────────
const URHOBO_VOCAB: LanguageVocabulary = {
  languageId: 'urhobo',
  grammarNotes: `## Urhobo Grammar

**Word Order:** Subject-Verb-Object (SVO).
**Tones:** High and Low tones are phonemic.
**Related to Edo** — both are Edoid languages with shared vocabulary.
**Negation:** *o* or *kẹ* used for negation.
**Pronouns:** Ọ (I), Uwe (You), Ọ (He/She), Ọrọ (We), Unu (You pl.), Ẹvẹ (They).`,
  culturalNote: 'Urhobo is spoken by 2+ million people in Delta State. The Urhobo are known for their Ohworu water spirit festival, skilled craftsmanship, and the Udje dance competition tradition. The language is closely related to Isoko and Edo.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Miguo', translation: 'Greetings / Hello (response: Vrendo)', phonetic: 'mi-guo' },
        { term: 'Vrendo', translation: 'Response to Miguo', phonetic: 'vren-do' },
        { term: 'Ọ rọ?', translation: 'How are you?', phonetic: 'aw raw' },
        { term: 'Ọ vwẹ', translation: 'I am fine', phonetic: 'aw vweh' },
        { term: 'Ọ bọ', translation: 'Good morning', phonetic: 'aw baw' },
        { term: 'Ọ van', translation: 'Good afternoon', phonetic: 'aw van' },
        { term: 'Ọ rọ vwẹ', translation: 'Thank you', phonetic: 'aw raw vweh' },
        { term: 'Ọ jẹ', translation: 'Please', phonetic: 'aw jeh' },
        { term: 'Ọ dọ', translation: 'Welcome', phonetic: 'aw daw' },
        { term: 'Ọ yẹ', translation: 'Goodbye', phonetic: 'aw yeh' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Erha', translation: 'Father', phonetic: 'er-hah' },
        { term: 'Iye', translation: 'Mother', phonetic: 'ee-yeh' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Okiẹ', translation: 'Man', phonetic: 'o-kyeh' },
        { term: 'Ọkuọ', translation: 'Woman', phonetic: 'aw-kwaw' },
        { term: 'Ọdọ', translation: 'Husband', phonetic: 'aw-daw' },
        { term: 'Ọvbọ', translation: 'Wife', phonetic: 'aw-vbaw' },
        { term: 'Ẹdion', translation: 'Elder', phonetic: 'eh-dyon' },
        { term: 'Ọse', translation: 'Friend', phonetic: 'aw-seh' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ọkpa', translation: 'One', phonetic: 'aw-kpah' },
        { term: 'Ẹva', translation: 'Two', phonetic: 'eh-vah' },
        { term: 'Ẹha', translation: 'Three', phonetic: 'eh-hah' },
        { term: 'Ẹne', translation: 'Four', phonetic: 'eh-neh' },
        { term: 'Ẹrẹ', translation: 'Five', phonetic: 'eh-reh' },
        { term: 'Ẹhan', translation: 'Six', phonetic: 'eh-han' },
        { term: 'Ẹhiẹn', translation: 'Seven', phonetic: 'eh-hyen' },
        { term: 'Ẹrẹlẹ', translation: 'Eight', phonetic: 'eh-reh-leh' },
        { term: 'Ẹhiẹnrin', translation: 'Nine', phonetic: 'eh-hyen-rin' },
        { term: 'Igbe', translation: 'Ten', phonetic: 'ig-beh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Ẹni mwẹn ọre...', translation: 'My name is...', phonetic: 'eh-ni mwen aw-reh' },
        { term: 'Ọ ma rẹn', translation: 'I don\'t know', phonetic: 'aw mah ren' },
        { term: 'Ọ fẹ nte?', translation: 'How much?', phonetic: 'aw feh n-teh' },
        { term: 'Ọ fẹ uwe', translation: 'I love you', phonetic: 'aw feh u-weh' },
        { term: 'Ma rrie', translation: 'Let\'s go', phonetic: 'mah ree-eh' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Ohworu', translation: 'Water spirit festival', phonetic: 'oh-wo-ru' },
        { term: 'Udje', translation: 'Satirical dance competition', phonetic: 'u-jeh' },
        { term: 'Ọvwian', translation: 'God / Supreme Being', phonetic: 'aw-vwyan' },
        { term: 'Ọba', translation: 'King / Chief', phonetic: 'aw-bah' },
        { term: 'Ẹki', translation: 'Market', phonetic: 'eh-ki' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// ISOKO
// ─────────────────────────────────────────────────────────────────────────────
const ISOKO_VOCAB: LanguageVocabulary = {
  languageId: 'isoko',
  grammarNotes: `## Isoko Grammar

**Word Order:** Subject-Verb-Object (SVO).
**Tones:** High and Low tones are phonemic.
**Related to Urhobo and Edo** — all are Edoid languages.
**Negation:** *kẹ* or *o* used for negation.`,
  culturalNote: 'Isoko is spoken by 1+ million people in Delta State. The Isoko people are closely related to the Urhobo and share many cultural traditions including the Ohworu water spirit festival. The language has many dialects.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Miguo', translation: 'Greetings (response: Vrendo)', phonetic: 'mi-guo' },
        { term: 'Vrendo', translation: 'Response to Miguo', phonetic: 'vren-do' },
        { term: 'Ọ rọ?', translation: 'How are you?', phonetic: 'aw raw' },
        { term: 'Ọ vwẹ', translation: 'I am fine', phonetic: 'aw vweh' },
        { term: 'Ọ bọ', translation: 'Good morning', phonetic: 'aw baw' },
        { term: 'Ọ rọ vwẹ', translation: 'Thank you', phonetic: 'aw raw vweh' },
        { term: 'Ọ jẹ', translation: 'Please', phonetic: 'aw jeh' },
        { term: 'Ọ yẹ', translation: 'Goodbye', phonetic: 'aw yeh' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Erha', translation: 'Father', phonetic: 'er-hah' },
        { term: 'Iye', translation: 'Mother', phonetic: 'ee-yeh' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Okiẹ', translation: 'Man', phonetic: 'o-kyeh' },
        { term: 'Ọkuọ', translation: 'Woman', phonetic: 'aw-kwaw' },
        { term: 'Ẹdion', translation: 'Elder', phonetic: 'eh-dyon' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Ọkpa', translation: 'One', phonetic: 'aw-kpah' },
        { term: 'Ẹva', translation: 'Two', phonetic: 'eh-vah' },
        { term: 'Ẹha', translation: 'Three', phonetic: 'eh-hah' },
        { term: 'Ẹne', translation: 'Four', phonetic: 'eh-neh' },
        { term: 'Ẹrẹ', translation: 'Five', phonetic: 'eh-reh' },
        { term: 'Igbe', translation: 'Ten', phonetic: 'ig-beh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Ẹni mwẹn...', translation: 'My name is...', phonetic: 'eh-ni mwen' },
        { term: 'Ọ ma rẹn', translation: 'I don\'t know', phonetic: 'aw mah ren' },
        { term: 'Ọ fẹ uwe', translation: 'I love you', phonetic: 'aw feh u-weh' },
        { term: 'Ma rrie', translation: 'Let\'s go', phonetic: 'mah ree-eh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// FULFULDE (FULANI)
// ─────────────────────────────────────────────────────────────────────────────
const FULFULDE_VOCAB: LanguageVocabulary = {
  languageId: 'fulfulde',
  grammarNotes: `## Fulfulde Grammar

**Word Order:** Subject-Object-Verb (SOV).
**Noun Classes:** Fulfulde has 20+ noun classes marked by suffixes.
**Tones:** Not strongly tonal compared to other Nigerian languages.
**Negation:** *alaa* (there is not) or *wanaa* (it is not).
**Pronouns:** Mi (I), An (You), O (He/She), En (We), On (You pl.), Be (They).`,
  culturalNote: 'Fulfulde is spoken by 15+ million Fulani people across northern Nigeria and West Africa. The Fulani are traditionally pastoral nomads known for cattle herding, Islamic scholarship, and the Gerewol beauty festival. The language is also called Fula or Peul.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Jam na?', translation: 'How are you? (lit. Is there peace?)', phonetic: 'jam nah' },
        { term: 'Jam tan', translation: 'Fine / Peace only', phonetic: 'jam tan' },
        { term: 'Jam waali?', translation: 'Good morning (lit. Did you sleep in peace?)', phonetic: 'jam wah-li' },
        { term: 'Jam weeti?', translation: 'Good morning (lit. Did you wake in peace?)', phonetic: 'jam wee-ti' },
        { term: 'Jam hiri?', translation: 'Good afternoon', phonetic: 'jam hi-ri' },
        { term: 'Jam hiiri?', translation: 'Good evening', phonetic: 'jam hii-ri' },
        { term: 'A jaraama', translation: 'Thank you', phonetic: 'ah jah-rah-mah' },
        { term: 'Tiiɗno', translation: 'Please', phonetic: 'tii-dno' },
        { term: 'Saa woo', translation: 'Goodbye', phonetic: 'sah woo' },
        { term: 'Ɓe njaaraama', translation: 'Welcome', phonetic: 'beh n-jah-rah-mah' },
        { term: 'Yoo', translation: 'Yes / OK', phonetic: 'yoo' },
        { term: 'Alaa', translation: 'No / There is not', phonetic: 'ah-lah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Baaba', translation: 'Father', phonetic: 'bah-bah' },
        { term: 'Yiɗo', translation: 'Mother', phonetic: 'yi-do' },
        { term: 'Ɓiɗɗo', translation: 'Child', phonetic: 'bi-do' },
        { term: 'Gorko', translation: 'Man', phonetic: 'gor-ko' },
        { term: 'Debbo', translation: 'Woman', phonetic: 'deb-bo' },
        { term: 'Mawɗo', translation: 'Elder / Big person', phonetic: 'maw-do' },
        { term: 'Banndiraaɓe', translation: 'Siblings / Relatives', phonetic: 'ban-di-rah-beh' },
        { term: 'Dow', translation: 'Husband', phonetic: 'dow' },
        { term: 'Debbo am', translation: 'My wife', phonetic: 'deb-bo am' },
        { term: 'Teddungal', translation: 'Friend / Companion', phonetic: 'ted-dun-gal' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Go\'o', translation: 'One', phonetic: 'go-o' },
        { term: 'Ɗiɗi', translation: 'Two', phonetic: 'di-di' },
        { term: 'Tati', translation: 'Three', phonetic: 'tah-ti' },
        { term: 'Nayi', translation: 'Four', phonetic: 'nah-yi' },
        { term: 'Jowi', translation: 'Five', phonetic: 'jo-wi' },
        { term: 'Jeego\'o', translation: 'Six', phonetic: 'jee-go-o' },
        { term: 'Jeeɗiɗi', translation: 'Seven', phonetic: 'jee-di-di' },
        { term: 'Jeetati', translation: 'Eight', phonetic: 'jee-tah-ti' },
        { term: 'Jeenayi', translation: 'Nine', phonetic: 'jee-nah-yi' },
        { term: 'Sappo', translation: 'Ten', phonetic: 'sap-po' },
        { term: 'Noogaas', translation: 'Twenty', phonetic: 'noo-gahs' },
        { term: 'Temedere', translation: 'One Hundred', phonetic: 'teh-meh-deh-reh' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Innde am woni...', translation: 'My name is...', phonetic: 'in-deh am wo-ni' },
        { term: 'Mi anndaa', translation: 'I don\'t know', phonetic: 'mi an-dah' },
        { term: 'Noy wonata?', translation: 'Where is it?', phonetic: 'noy wo-nah-tah' },
        { term: 'Noy ɗum?', translation: 'How much?', phonetic: 'noy dum' },
        { term: 'Mi yiɗi maa', translation: 'I love you', phonetic: 'mi yi-di mah' },
        { term: 'En njaha', translation: 'Let\'s go', phonetic: 'en n-jah-hah' },
        { term: 'Mi laari', translation: 'I am hungry', phonetic: 'mi lah-ri' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Allah', translation: 'God', phonetic: 'al-lah' },
        { term: 'Gerewol', translation: 'Fulani beauty and courtship festival', phonetic: 'geh-reh-wol' },
        { term: 'Pulaaku', translation: 'Fulani code of conduct / identity', phonetic: 'pu-lah-ku' },
        { term: 'Ardo', translation: 'Clan leader / Chief', phonetic: 'ar-do' },
        { term: 'Nagge', translation: 'Cow (central to Fulani culture)', phonetic: 'nag-geh' },
        { term: 'Wuro', translation: 'Village / Settlement', phonetic: 'wu-ro' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// KANURI
// ─────────────────────────────────────────────────────────────────────────────
const KANURI_VOCAB: LanguageVocabulary = {
  languageId: 'kanuri',
  grammarNotes: `## Kanuri Grammar

**Word Order:** Subject-Object-Verb (SOV).
**Postpositions:** Kanuri uses postpositions (after nouns) rather than prepositions.
**Noun Classes:** Nouns take suffixes to indicate possession and case.
**Negation:** *-gin* suffix on verbs for negation.
**Pronouns:** Shi (I), Yi (You), Wu (He/She), Nyi (We), Nyin (You pl.), Wuri (They).`,
  culturalNote: 'Kanuri is spoken by 5+ million people in Borno and Yobe states. It is the language of the ancient Kanem-Bornu Empire, one of the longest-lasting empires in African history (700–1900 CE). The Kanuri have a rich tradition of Islamic scholarship, trade, and the Shuwa Arab influence.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Wushe wushe', translation: 'Hello / Greetings', phonetic: 'wu-sheh wu-sheh' },
        { term: 'Modu?', translation: 'How are you?', phonetic: 'mo-du' },
        { term: 'Ngawo', translation: 'Fine / Good', phonetic: 'n-gah-wo' },
        { term: 'Fero', translation: 'Good morning', phonetic: 'feh-ro' },
        { term: 'Kura', translation: 'Good afternoon', phonetic: 'ku-rah' },
        { term: 'Ngawo kura', translation: 'Good evening', phonetic: 'n-gah-wo ku-rah' },
        { term: 'Alla barke', translation: 'Thank you (God bless you)', phonetic: 'al-lah bar-keh' },
        { term: 'Kaga', translation: 'Please', phonetic: 'kah-gah' },
        { term: 'Salam', translation: 'Peace / Goodbye', phonetic: 'sah-lam' },
        { term: 'Iri', translation: 'Yes', phonetic: 'ee-ri' },
        { term: 'Gawo', translation: 'No', phonetic: 'gah-wo' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Baba', translation: 'Father', phonetic: 'bah-bah' },
        { term: 'Yaya', translation: 'Mother', phonetic: 'yah-yah' },
        { term: 'Ngawu', translation: 'Child', phonetic: 'n-gah-wu' },
        { term: 'Gana', translation: 'Man', phonetic: 'gah-nah' },
        { term: 'Kadi', translation: 'Woman', phonetic: 'kah-di' },
        { term: 'Mala', translation: 'Elder / Scholar', phonetic: 'mah-lah' },
        { term: 'Mai', translation: 'King / Chief', phonetic: 'mai' },
        { term: 'Shuwoma', translation: 'Friend', phonetic: 'shu-wo-mah' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Tilo', translation: 'One', phonetic: 'ti-lo' },
        { term: 'Ɗiwo', translation: 'Two', phonetic: 'di-wo' },
        { term: 'Yaskwa', translation: 'Three', phonetic: 'yas-kwah' },
        { term: 'Dəgəwa', translation: 'Four', phonetic: 'deh-geh-wah' },
        { term: 'Ugu', translation: 'Five', phonetic: 'u-gu' },
        { term: 'Arwa', translation: 'Six', phonetic: 'ar-wah' },
        { term: 'Tulur', translation: 'Seven', phonetic: 'tu-lur' },
        { term: 'Wusgwa', translation: 'Eight', phonetic: 'wus-gwah' },
        { term: 'Lɛgwa', translation: 'Nine', phonetic: 'leh-gwah' },
        { term: 'Gawon', translation: 'Ten', phonetic: 'gah-won' },
        { term: 'Mia', translation: 'One Hundred', phonetic: 'mi-ah' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Shi ləm...', translation: 'My name is...', phonetic: 'shi lehm' },
        { term: 'Shi kəmgin', translation: 'I don\'t know', phonetic: 'shi kehm-gin' },
        { term: 'Nzəm?', translation: 'How much?', phonetic: 'n-zehm' },
        { term: 'Shi yi yəmgin', translation: 'I love you', phonetic: 'shi yi yehm-gin' },
        { term: 'Nyi kəla', translation: 'Let\'s go', phonetic: 'nyi keh-lah' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Allah', translation: 'God', phonetic: 'al-lah' },
        { term: 'Mai', translation: 'King / Sultan', phonetic: 'mai' },
        { term: 'Kanem-Bornu', translation: 'Ancient empire of the Kanuri', phonetic: 'kah-nem bor-nu' },
        { term: 'Mala', translation: 'Islamic scholar', phonetic: 'mah-lah' },
        { term: 'Ngawo', translation: 'Good / Peace', phonetic: 'n-gah-wo' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// TIV
// ─────────────────────────────────────────────────────────────────────────────
const TIV_VOCAB: LanguageVocabulary = {
  languageId: 'tiv',
  grammarNotes: `## Tiv Grammar\n\n**Word Order:** Subject-Verb-Object (SVO).\n**Tones:** High and Low tones are phonemic in Tiv.\n**Negation:** *ga* negates verbs.\n**Pronouns:** Mba (I), We (You), U (He/She), Tamen (We), Yough (You pl.), Aver (They).`,
  culturalNote: 'Tiv is spoken by 4+ million people in Benue and Taraba states. The Tiv are known for their egalitarian society, the Kwagh-hir puppet theatre tradition, and their distinctive geometric body markings (Abi). The language is one of the major languages of the Middle Belt.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Mba iyol', translation: 'Good morning', phonetic: 'mbah ee-yol' },
        { term: 'Mba iyange', translation: 'Good afternoon', phonetic: 'mbah ee-yan-geh' },
        { term: 'Mba ikyegh', translation: 'Good evening', phonetic: 'mbah ee-kyeh' },
        { term: 'Iyol?', translation: 'How are you? (morning)', phonetic: 'ee-yol' },
        { term: 'Iyol sha', translation: 'I am fine', phonetic: 'ee-yol shah' },
        { term: 'Ngu', translation: 'Thank you', phonetic: 'n-gu' },
        { term: 'Alu', translation: 'Please', phonetic: 'ah-lu' },
        { term: 'Wase', translation: 'Welcome', phonetic: 'wah-seh' },
        { term: 'Chia', translation: 'Goodbye', phonetic: 'chyah' },
        { term: 'Ee', translation: 'Yes', phonetic: 'ee' },
        { term: 'Ga', translation: 'No', phonetic: 'gah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Ter', translation: 'Father / Chief', phonetic: 'ter' },
        { term: 'Iyar', translation: 'Mother', phonetic: 'ee-yar' },
        { term: 'Wan', translation: 'Child', phonetic: 'wan' },
        { term: 'Orya', translation: 'Man', phonetic: 'or-yah' },
        { term: 'Kwase', translation: 'Woman / Wife', phonetic: 'kwah-seh' },
        { term: 'Igba', translation: 'Husband', phonetic: 'ig-bah' },
        { term: 'Iyough', translation: 'Elder', phonetic: 'ee-yoh' },
        { term: 'Anen', translation: 'Friend', phonetic: 'ah-nen' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Mba', translation: 'One', phonetic: 'mbah' },
        { term: 'Har', translation: 'Two', phonetic: 'har' },
        { term: 'Tar', translation: 'Three', phonetic: 'tar' },
        { term: 'Naen', translation: 'Four', phonetic: 'naen' },
        { term: 'Hiar', translation: 'Five', phonetic: 'hyar' },
        { term: 'Iyihi', translation: 'Six', phonetic: 'ee-yi-hi' },
        { term: 'Iyindi', translation: 'Seven', phonetic: 'ee-yin-di' },
        { term: 'Iyintar', translation: 'Eight', phonetic: 'ee-yin-tar' },
        { term: 'Iyinnaen', translation: 'Nine', phonetic: 'ee-yin-naen' },
        { term: 'Puuun', translation: 'Ten', phonetic: 'puun' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Sha mba...', translation: 'My name is...', phonetic: 'shah mbah' },
        { term: 'Mba ga ieren', translation: 'I don\'t know', phonetic: 'mbah gah ee-ren' },
        { term: 'Ngu sha', translation: 'How much?', phonetic: 'n-gu shah' },
        { term: 'Mba yiigh we', translation: 'I love you', phonetic: 'mbah yiigh weh' },
        { term: 'Tamen chia', translation: 'Let\'s go', phonetic: 'tah-men chyah' },
      ]
    },
    {
      category: 'Culture & Religion',
      items: [
        { term: 'Aondo', translation: 'God / Sky', phonetic: 'ah-on-do' },
        { term: 'Kwagh-hir', translation: 'Tiv puppet theatre tradition', phonetic: 'kwah-hir' },
        { term: 'Ter', translation: 'Chief / King', phonetic: 'ter' },
        { term: 'Abi', translation: 'Geometric body markings', phonetic: 'ah-bi' },
        { term: 'Swem', translation: 'Sacred mountain / ancestral origin', phonetic: 'swem' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// NUPE
// ─────────────────────────────────────────────────────────────────────────────
const NUPE_VOCAB: LanguageVocabulary = {
  languageId: 'nupe',
  grammarNotes: `## Nupe Grammar\n\n**Word Order:** Subject-Verb-Object (SVO).\n**Tones:** High, Mid, and Low tones are phonemic.\n**Negation:** *ba* negates verbs.\n**Pronouns:** Mi (I), Wo (You), A (He/She), Munci (We), Woci (You pl.), Eci (They).`,
  culturalNote: 'Nupe is spoken by 1+ million people in Niger, Kwara, and Kogi states. The Nupe are known for their glasswork, brasswork, and the Etsu Nupe (king). The Nupe Kingdom was one of the major kingdoms of the Middle Belt.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Basa', translation: 'Hello / Greetings', phonetic: 'bah-sah' },
        { term: 'Wo cika?', translation: 'How are you?', phonetic: 'wo chi-kah' },
        { term: 'N cika', translation: 'I am fine', phonetic: 'n chi-kah' },
        { term: 'Basa wuci', translation: 'Good morning', phonetic: 'bah-sah wu-chi' },
        { term: 'Basa kpan', translation: 'Good afternoon', phonetic: 'bah-sah kpan' },
        { term: 'Elo', translation: 'Thank you', phonetic: 'eh-lo' },
        { term: 'Kpan', translation: 'Please', phonetic: 'kpan' },
        { term: 'Eba', translation: 'Welcome', phonetic: 'eh-bah' },
        { term: 'Wo de', translation: 'Goodbye', phonetic: 'wo deh' },
        { term: 'Ee', translation: 'Yes', phonetic: 'ee' },
        { term: 'Kaa', translation: 'No', phonetic: 'kah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Baba', translation: 'Father', phonetic: 'bah-bah' },
        { term: 'Nda', translation: 'Mother', phonetic: 'n-dah' },
        { term: 'Egi', translation: 'Child', phonetic: 'eh-gi' },
        { term: 'Doci', translation: 'Man', phonetic: 'do-chi' },
        { term: 'Yelwa', translation: 'Woman', phonetic: 'yel-wah' },
        { term: 'Etsu', translation: 'King / Chief', phonetic: 'et-su' },
        { term: 'Kpata', translation: 'Friend', phonetic: 'kpah-tah' },
      ]
    },
    {
      category: 'Numbers',
      items: [
        { term: 'Kpati', translation: 'One', phonetic: 'kpah-ti' },
        { term: 'Gbibi', translation: 'Two', phonetic: 'gbi-bi' },
        { term: 'Ita', translation: 'Three', phonetic: 'ee-tah' },
        { term: 'Ini', translation: 'Four', phonetic: 'ee-ni' },
        { term: 'Itsun', translation: 'Five', phonetic: 'it-sun' },
        { term: 'Itsun kpati', translation: 'Six', phonetic: 'it-sun kpah-ti' },
        { term: 'Itsun gbibi', translation: 'Seven', phonetic: 'it-sun gbi-bi' },
        { term: 'Itsun ita', translation: 'Eight', phonetic: 'it-sun ee-tah' },
        { term: 'Itsun ini', translation: 'Nine', phonetic: 'it-sun ee-ni' },
        { term: 'Egu', translation: 'Ten', phonetic: 'eh-gu' },
      ]
    },
    {
      category: 'Everyday Phrases',
      items: [
        { term: 'Eci mi...', translation: 'My name is...', phonetic: 'eh-chi mi' },
        { term: 'Mi ba kpan', translation: 'I don\'t know', phonetic: 'mi bah kpan' },
        { term: 'Elo sha?', translation: 'How much?', phonetic: 'eh-lo shah' },
        { term: 'Mi yiwo', translation: 'I love you', phonetic: 'mi yi-wo' },
        { term: 'Munci de', translation: 'Let\'s go', phonetic: 'mun-chi deh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// IDOMA
// ─────────────────────────────────────────────────────────────────────────────
const IDOMA_VOCAB: LanguageVocabulary = {
  languageId: 'idoma',
  grammarNotes: `## Idoma Grammar\n\n**Word Order:** Subject-Verb-Object (SVO).\n**Tones:** High and Low tones are phonemic.\n**Negation:** *a* or *ga* negates verbs.\n**Pronouns:** Omi (I), Owo (You), O (He/She), Oma (We), Owu (You pl.), Obe (They).`,
  culturalNote: 'Idoma is spoken by 1+ million people in Benue State. The Idoma are known for the Alekwu ancestral spirit masquerade, the Oglinye dance, and their warrior tradition. The Och\'Idoma is the paramount ruler of the Idoma people.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Eje', translation: 'Hello / Greetings', phonetic: 'eh-jeh' },
        { term: 'Owo ciga?', translation: 'How are you?', phonetic: 'o-wo chi-gah' },
        { term: 'Omi ciga', translation: 'I am fine', phonetic: 'o-mi chi-gah' },
        { term: 'Eje owuche', translation: 'Good morning', phonetic: 'eh-jeh o-wu-cheh' },
        { term: 'Eje onyinya', translation: 'Good afternoon', phonetic: 'eh-jeh on-yi-nyah' },
        { term: 'Eje ocho', translation: 'Good evening', phonetic: 'eh-jeh o-cho' },
        { term: 'Omi eje', translation: 'Thank you', phonetic: 'o-mi eh-jeh' },
        { term: 'Biko', translation: 'Please', phonetic: 'bi-ko' },
        { term: 'Eje owo', translation: 'Welcome', phonetic: 'eh-jeh o-wo' },
        { term: 'Owo ga', translation: 'Goodbye', phonetic: 'o-wo gah' },
      ]
    },
    {
      category: 'Family & People',
      items: [
        { term: 'Oche', translation: 'Father', phonetic: 'o-cheh' },
        { term: 'Ine', translation: 'Mother', phonetic: 'ee-neh' },
        { term: 'Ọmọ', translation: 'Child', phonetic: 'aw-maw' },
        { term: 'Okwu', translation: 'Man', phonetic: 'ok-wu' },
        { term: 'Ọkwu ọbọ', translation: 'Woman', phonetic: 'ok-wu aw-baw' },
        { term: 'Och\'Idoma', translation: 'Paramount ruler of Idoma', phonetic: 'och ee-do-mah' },
        { term: 'Onen', translation: 'Friend', phonetic: 'o-nen' },
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
      category: 'Culture & Religion',
      items: [
        { term: 'Alekwu', translation: 'Ancestral spirit masquerade', phonetic: 'ah-lek-wu' },
        { term: 'Oglinye', translation: 'Traditional dance', phonetic: 'og-li-nyeh' },
        { term: 'Och\'Idoma', translation: 'Paramount ruler', phonetic: 'och ee-do-mah' },
        { term: 'Owo', translation: 'God / Supreme Being', phonetic: 'o-wo' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT MAP — keyed by language ID
// ─────────────────────────────────────────────────────────────────────────────
export const LANGUAGE_VOCABULARIES: Record<string, LanguageVocabulary> = {
  pidgin: PIDGIN_VOCAB,
  yoruba: YORUBA_VOCAB,
  igbo: IGBO_VOCAB,
  hausa: HAUSA_VOCAB,
  efik: EFIK_VOCAB,
  ibibio: IBIBIO_VOCAB,
  ijaw: IJAW_VOCAB,
  urhobo: URHOBO_VOCAB,
  isoko: ISOKO_VOCAB,
  fulfulde: FULFULDE_VOCAB,
  kanuri: KANURI_VOCAB,
  tiv: TIV_VOCAB,
  nupe: NUPE_VOCAB,
  idoma: IDOMA_VOCAB,
};

/**
 * Get vocabulary for a language by its ID or name.
 * Returns null for Edo (handled separately by useLexicon/repository.ts).
 */
export function getLanguageVocabulary(languageIdOrName: string): LanguageVocabulary | null {
  const key = languageIdOrName.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
  // Direct match
  if (LANGUAGE_VOCABULARIES[key]) return LANGUAGE_VOCABULARIES[key];
  // Partial match — e.g. "Nigerian Pidgin English" -> "pidgin"
  for (const [id, vocab] of Object.entries(LANGUAGE_VOCABULARIES)) {
    if (key.includes(id) || id.includes(key.split('-')[0])) return vocab;
  }
  return null;
}

// Merge additional vocabularies (Esan, Afemai, Igala, Ebira, Itsekiri, Ogoni, etc.)
Object.assign(LANGUAGE_VOCABULARIES, ADDITIONAL_VOCABULARIES);
