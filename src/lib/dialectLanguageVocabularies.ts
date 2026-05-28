/**
 * Nigerian Language Dialects Vocabularies
 * Comprehensive vocabulary data for major language dialects
 * Hausa, Yoruba, and Igbo dialects with regional variations
 * Sourced from: Linguistic databases, academic research, and community resources
 */

import { LanguageVocabulary } from './languageVocabularies';

// ─────────────────────────────────────────────────────────────────────────────
// HAUSA DIALECTS (North-West Region)
// ─────────────────────────────────────────────────────────────────────────────

// HAUSA - KATSINA DIALECT (6 million+ speakers)
export const HAUSA_KATSINA_VOCAB: LanguageVocabulary = {
  languageId: 'hausa-katsina',
  grammarNotes: `## Hausa (Katsina Dialect) Grammar

**Tonal Language:** Hausa uses High (á), Mid (a), and Low (à) tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Katsina dialect is one of the major Hausa dialects spoken in Katsina State.
**Negation:** *ba...ba* surrounds the verb for negation.
**Pronouns:** Ni (I), Ka (You), Shi (He), Ita (She), Mu (We), Ku (You pl.), Su (They).
**Verb Conjugation:** Verbs change form based on tense, aspect, and mood.`,
  culturalNote: 'Hausa is spoken by 6+ million people in Katsina State, one of the major Hausa-speaking regions. The Katsina Emirate is historically significant with the Emir of Katsina as the paramount ruler. The region is known for leather work, indigo dyeing, and the Durbar Festival. Katsina is a major commercial and cultural center in northern Nigeria.',
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

// HAUSA - SOKOTO DIALECT (5 million+ speakers)
export const HAUSA_SOKOTO_VOCAB: LanguageVocabulary = {
  languageId: 'hausa-sokoto',
  grammarNotes: `## Hausa (Sokoto Dialect) Grammar

**Tonal Language:** Hausa uses High, Mid, and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Sokoto dialect is spoken in Sokoto State, historically the seat of the Sokoto Caliphate.
**Negation:** *ba...ba* surrounds the verb.
**Pronouns:** Ni (I), Ka (You), Shi (He), Ita (She), Mu (We), Ku (You pl.), Su (They).`,
  culturalNote: 'Hausa is spoken by 5+ million people in Sokoto State. Sokoto is historically significant as the seat of the Sokoto Caliphate (1804-1903), one of the largest Islamic empires in African history. The Sultan of Sokoto is the spiritual leader of Nigerian Muslims. The region is known for Islamic scholarship, leather work, and the Durbar Festival.',
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


// HAUSA - KEBBI DIALECT (2 million+ speakers)
export const HAUSA_KEBBI_VOCAB: LanguageVocabulary = {
  languageId: 'hausa-kebbi',
  grammarNotes: `## Hausa (Kebbi Dialect) Grammar

**Tonal Language:** Hausa uses High, Mid, and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Kebbi dialect is spoken in Kebbi State, known for trans-Saharan trade routes.
**Negation:** *ba...ba* surrounds the verb.
**Pronouns:** Ni (I), Ka (You), Shi (He), Ita (She), Mu (We), Ku (You pl.), Su (They).`,
  culturalNote: 'Hausa is spoken by 2+ million people in Kebbi State. Kebbi is historically significant as a major center of trans-Saharan trade. The region is known for its trading heritage, Islamic scholarship, and the Argungu Fishing Festival. Kebbi has strong cultural ties to Niger and Mali.',
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


// HAUSA - ZAMFARA DIALECT (3 million+ speakers)
export const HAUSA_ZAMFARA_VOCAB: LanguageVocabulary = {
  languageId: 'hausa-zamfara',
  grammarNotes: `## Hausa (Zamfara Dialect) Grammar

**Tonal Language:** Hausa uses High, Mid, and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Zamfara dialect is spoken in Zamfara State, known for mining and agriculture.
**Negation:** *ba...ba* surrounds the verb.
**Pronouns:** Ni (I), Ka (You), Shi (He), Ita (She), Mu (We), Ku (You pl.), Su (They).`,
  culturalNote: 'Hausa is spoken by 3+ million people in Zamfara State. Zamfara is known for its rich mineral resources, particularly gold and gemstones. The region has a strong agricultural tradition and is known for the Zamfara cultural festival. The Emir of Gusau is a prominent traditional ruler.',
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

// HAUSA - JIGAWA DIALECT (4 million+ speakers)
export const HAUSA_JIGAWA_VOCAB: LanguageVocabulary = {
  languageId: 'hausa-jigawa',
  grammarNotes: `## Hausa (Jigawa Dialect) Grammar

**Tonal Language:** Hausa uses High, Mid, and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Jigawa dialect is spoken in Jigawa State, known for agriculture and commerce.
**Negation:** *ba...ba* surrounds the verb.
**Pronouns:** Ni (I), Ka (You), Shi (He), Ita (She), Mu (We), Ku (You pl.), Su (They).`,
  culturalNote: 'Hausa is spoken by 4+ million people in Jigawa State. Jigawa is known for its agricultural production, particularly cotton and groundnuts. The region has a strong trading tradition and is known for the Jigawa cultural festival. The Emir of Dutse is a prominent traditional ruler.',
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


// ─────────────────────────────────────────────────────────────────────────────
// YORUBA DIALECTS (South-West Region)
// ─────────────────────────────────────────────────────────────────────────────

// YORUBA - OYO DIALECT (3 million+ speakers)
export const YORUBA_OYO_VOCAB: LanguageVocabulary = {
  languageId: 'yoruba-oyo',
  grammarNotes: `## Yoruba (Oyo Dialect) Grammar

**Tonal Language:** Yoruba uses High (á), Mid (a), and Low (à) tones; tone changes meaning.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Oyo dialect is the prestige dialect of Yoruba, spoken in Oyo State.
**Negation:** *kò* or *ò* before the verb.
**Pronouns:** Mo (I), O/Ẹ (You), Ó (He/She/It), A (We), Ẹ (You pl.), Wọn (They).
**Verb Conjugation:** Verbs change form based on tense, aspect, and mood.`,
  culturalNote: 'Yoruba is spoken by 3+ million people in Oyo State. Oyo is historically significant as the seat of the Oyo Empire (1400-1896), one of the largest and most powerful pre-colonial African states. The Alaafin of Oyo is the paramount Yoruba ruler. Oyo is known for its cultural heritage, the Oyo cultural festival, and its role in Yoruba history and politics.',
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

// YORUBA - ONDO DIALECT (1 million+ speakers)
export const YORUBA_ONDO_VOCAB: LanguageVocabulary = {
  languageId: 'yoruba-ondo',
  grammarNotes: `## Yoruba (Ondo Dialect) Grammar

**Tonal Language:** Yoruba uses High, Mid, and Low tones; tone changes meaning.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Ondo dialect is spoken in Ondo State, known for its unique cultural practices.
**Negation:** *kò* or *ò* before the verb.
**Pronouns:** Mo (I), O/Ẹ (You), Ó (He/She/It), A (We), Ẹ (You pl.), Wọn (They).`,
  culturalNote: 'Yoruba is spoken by 1+ million people in Ondo State. Ondo is known for its cocoa production, timber resources, and the Ondo cultural festival. The Osemawe of Ondo is the paramount ruler. The state has a rich cultural heritage and is known for its traditional crafts and festivals.',
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
// IGBO DIALECTS (South-East Region)
// ─────────────────────────────────────────────────────────────────────────────

// IGBO - ENUGU DIALECT (2 million+ speakers)
export const IGBO_ENUGU_VOCAB: LanguageVocabulary = {
  languageId: 'igbo-enugu',
  grammarNotes: `## Igbo (Enugu Dialect) Grammar

**Tonal Language:** Igbo uses High (á), Mid (a), and Low (à) tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Enugu dialect is one of the major Igbo dialects spoken in Enugu State.
**Negation:** *ò* or *ụ* before the verb.
**Pronouns:** Mụ (I), Gị (You), Ọ (He/She/It), Anyị (We), Ụnụ (You pl.), Ha (They).
**Verb Conjugation:** Verbs change form based on tense, aspect, and mood.`,
  culturalNote: 'Igbo is spoken by 2+ million people in Enugu State. Enugu is historically significant as a major coal mining center and a cultural hub. The state is known for its vibrant Igbo culture, the Enugu cultural festival, and its role in Nigerian history. Enugu is home to many Igbo intellectuals and artists.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine', phonetic: 'aw di m-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'bi-ko' },
        { term: 'Ka ọ dị', translation: 'Goodbye', phonetic: 'kah aw di' },
        { term: 'Ndo', translation: 'Sorry', phonetic: 'n-do' },
        { term: 'Ọ dị ụtụtụ', translation: 'Good morning', phonetic: 'aw di u-tu-tu' },
        { term: 'Ọ dị ehihie', translation: 'Good afternoon', phonetic: 'aw di eh-hi-hie' },
        { term: 'Ọ dị mgbede', translation: 'Good evening', phonetic: 'aw di m-gbeh-deh' },
        { term: 'Ọ dị ọkụ', translation: 'Good night', phonetic: 'aw di aw-ku' },
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

// IGBO - OWERRI DIALECT (2 million+ speakers)
export const IGBO_OWERRI_VOCAB: LanguageVocabulary = {
  languageId: 'igbo-owerri',
  grammarNotes: `## Igbo (Owerri Dialect) Grammar

**Tonal Language:** Igbo uses High, Mid, and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Owerri dialect is one of the major Igbo dialects spoken in Imo State.
**Negation:** *ò* or *ụ* before the verb.
**Pronouns:** Mụ (I), Gị (You), Ọ (He/She/It), Anyị (We), Ụnụ (You pl.), Ha (They).`,
  culturalNote: 'Igbo is spoken by 2+ million people in Imo State. Owerri is the capital of Imo State and a major commercial hub. The state is known for its vibrant Igbo culture, the Owerri cultural festival, and its role in Igbo history. Owerri is home to many Igbo businesses and cultural institutions.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine', phonetic: 'aw di m-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'bi-ko' },
        { term: 'Ka ọ dị', translation: 'Goodbye', phonetic: 'kah aw di' },
        { term: 'Ndo', translation: 'Sorry', phonetic: 'n-do' },
        { term: 'Ọ dị ụtụtụ', translation: 'Good morning', phonetic: 'aw di u-tu-tu' },
        { term: 'Ọ dị ehihie', translation: 'Good afternoon', phonetic: 'aw di eh-hi-hie' },
        { term: 'Ọ dị mgbede', translation: 'Good evening', phonetic: 'aw di m-gbeh-deh' },
        { term: 'Ọ dị ọkụ', translation: 'Good night', phonetic: 'aw di aw-ku' },
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

// IGBO - NGWA DIALECT (1 million+ speakers)
export const IGBO_NGWA_VOCAB: LanguageVocabulary = {
  languageId: 'igbo-ngwa',
  grammarNotes: `## Igbo (Ngwa Dialect) Grammar

**Tonal Language:** Igbo uses High, Mid, and Low tones.
**Word Order:** Subject-Verb-Object (SVO).
**Dialect:** Ngwa dialect is spoken in Abia State, known for its unique linguistic features.
**Negation:** *ò* or *ụ* before the verb.
**Pronouns:** Mụ (I), Gị (You), Ọ (He/She/It), Anyị (We), Ụnụ (You pl.), Ha (They).`,
  culturalNote: 'Igbo is spoken by 1+ million people in Abia State. Abia is known for its vibrant Igbo culture, the Abia cultural festival, and its role in Igbo history. The state is home to many Igbo businesses and cultural institutions. Abia is known for its textile and craft industries.',
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Kedu?', translation: 'How are you?', phonetic: 'keh-du' },
        { term: 'Ọ dị mma', translation: 'I am fine', phonetic: 'aw di m-mah' },
        { term: 'Daalu', translation: 'Thank you', phonetic: 'dah-ah-lu' },
        { term: 'Biko', translation: 'Please', phonetic: 'bi-ko' },
        { term: 'Ka ọ dị', translation: 'Goodbye', phonetic: 'kah aw di' },
        { term: 'Ndo', translation: 'Sorry', phonetic: 'n-do' },
        { term: 'Ọ dị ụtụtụ', translation: 'Good morning', phonetic: 'aw di u-tu-tu' },
        { term: 'Ọ dị ehihie', translation: 'Good afternoon', phonetic: 'aw di eh-hi-hie' },
        { term: 'Ọ dị mgbede', translation: 'Good evening', phonetic: 'aw di m-gbeh-deh' },
        { term: 'Ọ dị ọkụ', translation: 'Good night', phonetic: 'aw di aw-ku' },
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
// EXPORT MAP
// ─────────────────────────────────────────────────────────────────────────────

export const DIALECT_VOCABULARIES: Record<string, LanguageVocabulary> = {
  'hausa-katsina': HAUSA_KATSINA_VOCAB,
  'hausa-sokoto': HAUSA_SOKOTO_VOCAB,
  'hausa-kebbi': HAUSA_KEBBI_VOCAB,
  'hausa-zamfara': HAUSA_ZAMFARA_VOCAB,
  'hausa-jigawa': HAUSA_JIGAWA_VOCAB,
  'yoruba-oyo': YORUBA_OYO_VOCAB,
  'yoruba-ondo': YORUBA_ONDO_VOCAB,
  'igbo-enugu': IGBO_ENUGU_VOCAB,
  'igbo-owerri': IGBO_OWERRI_VOCAB,
  'igbo-ngwa': IGBO_NGWA_VOCAB,
};
