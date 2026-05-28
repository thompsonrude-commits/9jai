/**
 * Regional Nigerian Languages Vocabularies - Enhanced Edition
 * Comprehensive vocabulary data with cultural, historical, and linguistic information
 * Regions: South-West, North-West, North-Central, North-East
 * 
 * Data sources: Wikipedia, Britannica, Joshua Project, academic linguistic databases
 */

import { LanguageVocabulary } from './languageVocabularies';

// ─────────────────────────────────────────────────────────────────────────────
// SOUTH-WEST REGION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * YORUBA - South-West Nigeria (40M+ speakers)
 * One of Nigeria's three major languages with global diaspora
 */
export const YORUBA_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'yoruba',
  grammarNotes: `## Yoruba Grammar

**Classification:** Niger-Congo language, Yoruboid group
**Speakers:** 40+ million (one of world's largest Niger-Congo languages)
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Distribution:** South-West Nigeria, Benin, Togo, diaspora in Brazil, Cuba, Caribbean
**Linguistic Ties:** Related to Itsekiri and Igala
**Negation:** Negation particles used in verb phrases
**Pronouns:** Mo (I), O/Ẹ (You), Ó (He/She), A (We), Ẹ (You pl.), Wọn (They)`,
  culturalNote: `Yoruba is one of Nigeria's three major languages, spoken by 40+ million people across South-West Nigeria, Benin, Togo, and diaspora communities in Brazil, Cuba, and the Caribbean. The Yoruba are known for excellent craftsmanship including blacksmithing, leatherworking, weaving, glassmaking, and ivory and wood carving. The language has a rich literary tradition and the Ifá divination corpus is a UNESCO Masterpiece of the Oral and Intangible Heritage of Humanity. Yoruba vocabulary is used in African diaspora religions including Candomblé, Umbanda, and Santería. The Yoruba people make up 20.7% of Nigeria's population, making them one of Africa's largest ethnic groups. Traditional governance included powerful city-states and kingdoms. The Oyo Empire was one of West Africa's most powerful states (17th-19th centuries).`,
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Ẹ káàárọ̀', translation: 'Good morning', phonetic: 'eh kah-ah-raw' },
        { term: 'Báwo ni?', translation: 'How are you?', phonetic: 'bah-wo ni' },
        { term: 'Mo wà dáadáa', translation: 'I am fine', phonetic: 'mo wah dah-dah' },
        { term: 'Ẹ ṣéun', translation: 'Thank you', phonetic: 'eh sheh-un' },
        { term: 'Jọ̀wọ́', translation: 'Please', phonetic: 'jaw-wo' },
        { term: 'O dàbọ̀', translation: 'Goodbye', phonetic: 'o dah-baw' },
      ]
    },
    {
      category: 'Craftsmanship & Trade',
      items: [
        { term: 'Ọ̀nà', translation: 'Craft / Art', phonetic: 'aw-nah' },
        { term: 'Ìgbá', translation: 'Calabash / Gourd', phonetic: 'ee-gbah' },
        { term: 'Ẹ̀kó', translation: 'Weaving', phonetic: 'eh-ko' },
        { term: 'Ìrọ̀kọ̀', translation: 'Ironwork', phonetic: 'ee-raw-kaw' },
      ]
    },
    {
      category: 'Spirituality & Culture',
      items: [
        { term: 'Ifá', translation: 'Divination system', phonetic: 'ee-fah' },
        { term: 'Ọrìṣà', translation: 'Deity / Spirit', phonetic: 'aw-ree-shah' },
        { term: 'Ẹ̀bọ̀', translation: 'Sacrifice / Offering', phonetic: 'eh-baw' },
        { term: 'Àṣẹ', translation: 'Divine power / Blessing', phonetic: 'ah-sheh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// NORTH-WEST REGION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HAUSA - North-West Nigeria (70M+ speakers)
 * Most widely spoken language in West Africa
 */
export const HAUSA_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'hausa',
  grammarNotes: `## Hausa Grammar

**Classification:** Chadic language, Afro-Asiatic family
**Speakers:** 70+ million (most widely spoken in West Africa)
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Distribution:** Northern Nigeria, Niger, diaspora across West Africa
**Arabic Influence:** Infused with Arabic words from Islamic influence (14th century onwards)
**Negation:** Negation particles used in verb phrases
**Pronouns:** Ni (I), Ka (You), Shi (He/She), Mu (We), Ku (You pl.), Su (They)`,
  culturalNote: `Hausa is the most widely spoken language in West Africa with 70+ million speakers. The Hausa are traditionally agriculturists living in villages and precolonial towns. The Hausa aristocracy developed an equestrian-based culture. The Hausa city-states (1100-1804 AD) were major centers of trade and Islamic scholarship. The Sokoto Caliphate (founded 1804) was one of Africa's largest pre-colonial states. The Hausa are predominantly Muslim since the 14th century. The language belongs to the Chadic group of the Afro-Asiatic family and is heavily influenced by Arabic. Hausa trade networks historically contributed to flourishing urban centers. The Hausa Bakwai (seven original city-states) included Kano, Katsina, Daura, Gobir, Kabi, Rano, and Zaria.`,
  categories: [
    {
      category: 'Greetings & Courtesy',
      items: [
        { term: 'Sannu', translation: 'Hello', phonetic: 'san-nu' },
        { term: 'Barka da safe', translation: 'Good morning', phonetic: 'bar-kah dah sah-feh' },
        { term: 'Ina kwana?', translation: 'How did you sleep?', phonetic: 'ee-nah kwah-nah' },
        { term: 'Lafiya lau', translation: 'I am fine', phonetic: 'lah-fi-yah lau' },
        { term: 'Na gode', translation: 'Thank you', phonetic: 'nah go-deh' },
      ]
    },
    {
      category: 'Trade & Commerce',
      items: [
        { term: 'Kasuwa', translation: 'Market', phonetic: 'kah-su-wah' },
        { term: 'Ciniki', translation: 'Business / Trade', phonetic: 'chi-ni-ki' },
        { term: 'Kudin', translation: 'Money', phonetic: 'ku-din' },
        { term: 'Sida', translation: 'Goods / Merchandise', phonetic: 'see-dah' },
      ]
    },
    {
      category: 'Islamic Heritage',
      items: [
        { term: 'Allah', translation: 'God', phonetic: 'al-lah' },
        { term: 'Sarki', translation: 'Chief / King / Emir', phonetic: 'sar-ki' },
        { term: 'Gida', translation: 'Home / House', phonetic: 'gi-dah' },
        { term: 'Sallah', translation: 'Festival / Prayer', phonetic: 'sal-lah' },
      ]
    },
  ]
};

/**
 * FULFULDE (FULANI) - North-West Nigeria (15M+ speakers)
 * Pastoral nomadic people with global diaspora
 */
export const FULFULDE_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'fulfulde',
  grammarNotes: `## Fulfulde Grammar

**Classification:** Atlantic language, Niger-Congo family
**Speakers:** 15+ million in Nigeria, 40+ million globally
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Distribution:** West Africa (Senegal to Sudan), Nigeria, Cameroon
**Pastoral Heritage:** Language reflects cattle herding culture
**Negation:** Negation particles used in verb phrases
**Pronouns:** Mi (I), Yoo (You), O (He/She), En (We), Inyee (You pl.), Ɓe (They)`,
  culturalNote: `Fulfulde is spoken by the Fulani (Fulɓe) people, traditionally nomadic pastoralists known for cattle herding. The Fulani originated in the Senegambian region over a thousand years ago and migrated across West Africa. In the 18th-19th centuries, some Fulani populations adopted Islam and initiated jihads (holy wars) across West Africa. The Fulani are known for the Gerewol beauty festival where young men compete for attention. The language reflects their pastoral lifestyle and cattle-centered culture. Fulani have established communities across West Africa and beyond, with significant diaspora populations. The Fulani are traditionally organized into hierarchical social structures with distinct status groups.`,
  categories: [
    {
      category: 'Pastoral Life',
      items: [
        { term: 'Nagge', translation: 'Cattle', phonetic: 'nag-geh' },
        { term: 'Pullo', translation: 'Fulani man / Pastoral Fulani', phonetic: 'pul-lo' },
        { term: 'Fulɓe', translation: 'Fulani people', phonetic: 'ful-beh' },
        { term: 'Fulfulde', translation: 'Fulani language', phonetic: 'ful-ful-deh' },
      ]
    },
    {
      category: 'Cultural Practices',
      items: [
        { term: 'Gerewol', translation: 'Beauty festival / Dance competition', phonetic: 'geh-reh-wol' },
        { term: 'Diya', translation: 'Respect / Honor', phonetic: 'dee-yah' },
        { term: 'Pulaaku', translation: 'Fulani code of conduct / Pride', phonetic: 'pu-lah-ku' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// NORTH-CENTRAL REGION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NUPE - North-Central Nigeria (1M+ speakers)
 * Kingdom emerged 14th-15th century, influenced by Benin and Ife
 */
export const NUPE_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'nupe',
  grammarNotes: `## Nupe Grammar

**Classification:** Nupoid language, Volta-Niger family
**Speakers:** 1+ million
**Tonal Language:** Uses 3-level tones
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Distribution:** Niger State, Kwara State, Kogi State
**Historical Kingdom:** Nupe Kingdom emerged 14th-15th century
**Negation:** Negation particles used in verb phrases`,
  culturalNote: `The Nupe Kingdom emerged in the 14th-15th century, nestled between the Niger and Kaduna rivers. The kingdom was founded by Tsoede, an Igala prince from Idah, who united neighboring tribes by conquest. The Nupe trace their origins back to 9,000 BCE or 40,000 years ago in the Middle Niger region. The Nupe were influenced by surrounding peoples including Benin and Ife groups. They are known for glasswork and brasswork. The Nupe are primarily traders and farmers. The Nupe Kingdom was a major center of trade and Islamic learning. The Bida Emirate traces direct descent from the historical Nupe Kingdom.`,
  categories: [
    {
      category: 'Kingdom & Governance',
      items: [
        { term: 'Etsu', translation: 'King / Ruler', phonetic: 'et-su' },
        { term: 'Nupeci', translation: 'Nupe people (self-identification)', phonetic: 'nu-peh-chi' },
        { term: 'Bida', translation: 'Capital city / Emirate', phonetic: 'bee-dah' },
      ]
    },
    {
      category: 'Craftsmanship',
      items: [
        { term: 'Gara', translation: 'Glasswork / Glass beads', phonetic: 'gah-rah' },
        { term: 'Iya', translation: 'Brasswork / Metalwork', phonetic: 'ee-yah' },
      ]
    },
  ]
};

/**
 * TIV - North-Central Nigeria (4M+ speakers)
 * Egalitarian society with decentralized structure
 */
export const TIV_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'tiv',
  grammarNotes: `## Tiv Grammar

**Classification:** Benue-Congo language, Niger-Congo family
**Speakers:** 4+ million
**Tonal Language:** Uses High and Low tones
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Distribution:** Benue State, Taraba State, Nasarawa State, Plateau State, Cross River State
**Social Structure:** Egalitarian, decentralized (no centralized authority pre-colonial)
**Negation:** Negation particles used in verb phrases`,
  culturalNote: `The Tiv are a group of about 4 million people living on both sides of the Benue River in Nigeria. "Tiv" is the name of the common ancestor from whom all are descended. The Tiv traditionally organized themselves into an egalitarian society without centralized authority until the British established a paramount ruler position. The Tiv are known for their Kwagh-hir puppet theatre and distinctive geometric body markings (Abi). They are prosperous subsistence farmers growing yams, millet, and sorghum. The Tiv practiced exchange marriage where two men exchanged sisters, binding lineages closely. Their villages comprise compounds of sleeping huts, reception huts, granaries, and central marketplaces. The Tiv have a strong tradition of storytelling, dance, and poetry.`,
  categories: [
    {
      category: 'Social Structure',
      items: [
        { term: 'Tar', translation: 'Lineage / Clan', phonetic: 'tar' },
        { term: 'Mbatsav', translation: 'Council of elders', phonetic: 'm-bat-sav' },
        { term: 'Kem', translation: 'Age group / Generation', phonetic: 'kem' },
      ]
    },
    {
      category: 'Cultural Practices',
      items: [
        { term: 'Kwagh-hir', translation: 'Puppet theatre / Masquerade', phonetic: 'kwagh-hir' },
        { term: 'Abi', translation: 'Geometric body markings', phonetic: 'ah-bi' },
        { term: 'Swem', translation: 'Dance / Celebration', phonetic: 'swem' },
      ]
    },
    {
      category: 'Agriculture',
      items: [
        { term: 'Iyo', translation: 'Yam', phonetic: 'ee-yo' },
        { term: 'Mbaagu', translation: 'Millet', phonetic: 'm-bah-gu' },
        { term: 'Gbe', translation: 'Sorghum', phonetic: 'gbeh' },
      ]
    },
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// NORTH-EAST REGION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * KANURI - North-East Nigeria (5M+ speakers)
 * Ancient Kanem-Bornu Empire (700-1900 CE) - Africa's longest-lasting empire
 */
export const KANURI_ENHANCED_VOCAB: LanguageVocabulary = {
  languageId: 'kanuri',
  grammarNotes: `## Kanuri Grammar

**Classification:** Saharan language, Nilo-Saharan family
**Speakers:** 5+ million in Nigeria, 11+ million globally
**Tonal Language:** Uses tones to distinguish meaning
**Word Order:** Subject-Verb-Object (SVO)
**Geographic Distribution:** Borno State, Yobe State, Niger, Chad, Cameroon
**Historical Empire:** Kanem-Bornu Empire (700-1900 CE)
**Islamic Heritage:** Muslim emirate since 11th century
**Negation:** Negation particles used in verb phrases`,
  culturalNote: `Kanuri is the language associated with the Kanem-Bornu Empire, one of Africa's longest-lasting empires (700-1900 CE). The Kanuri people are one of the oldest and most historically influential ethnic groups in West Africa. They developed a powerful state at the Sudanese terminus of the major trans-Saharan trade route through the Bilma oasis to Libya. The empire reached its zenith in the 16th century. The Kanuri have been Muslims since the 11th century and practice the Malikite code of Islamic law. The largest population of Kanuri reside in northeast Nigeria where the ceremonial Emirate of Bornu traces direct descent from the Kanem-Bornu empire. The Kanuri are traditionally sedentary, engaging in farming, fishing in the Chad Basin, trade, and salt processing. Archaeological evidence suggests they were early adopters of settled agrarian lifestyles and trade.`,
  categories: [
    {
      category: 'Empire & Governance',
      items: [
        { term: 'Shehu', translation: 'Chief / Ruler / Emir', phonetic: 'sheh-hu' },
        { term: 'Kanem-Bornu', translation: 'Historical empire', phonetic: 'kah-nem bor-nu' },
        { term: 'Borno', translation: 'Emirate / Kingdom', phonetic: 'bor-no' },
      ]
    },
    {
      category: 'Trade & Economy',
      items: [
        { term: 'Kasuwa', translation: 'Market', phonetic: 'kah-su-wah' },
        { term: 'Gara', translation: 'Salt / Salt trade', phonetic: 'gah-rah' },
        { term: 'Jiya', translation: 'Fishing', phonetic: 'jee-yah' },
      ]
    },
    {
      category: 'Lake Chad Basin',
      items: [
        { term: 'Cad', translation: 'Lake Chad', phonetic: 'chad' },
        { term: 'Gara', translation: 'Water / Fishing area', phonetic: 'gah-rah' },
      ]
    },
  ]
};

// Export all regional vocabularies
export const REGIONAL_VOCABULARIES: Record<string, LanguageVocabulary> = {
  yoruba: YORUBA_ENHANCED_VOCAB,
  hausa: HAUSA_ENHANCED_VOCAB,
  fulfulde: FULFULDE_ENHANCED_VOCAB,
  nupe: NUPE_ENHANCED_VOCAB,
  tiv: TIV_ENHANCED_VOCAB,
  kanuri: KANURI_ENHANCED_VOCAB,
};
