// African Languages organized by regions required by the upgrade
export interface Language {
  id: string;
  name: string;
  nativeName?: string;
  speakers?: string;
  description?: string;
}

export interface Region {
  id: string;
  name: string;
  languages: Language[];
}

export const AFRICAN_LANGUAGES: Region[] = [
  {
    id: 'west-africa',
    name: 'West Africa',
    languages: [
      { id: 'wolof', name: 'Wolof', nativeName: 'Wolof', speakers: '10M+', description: 'Spoken in Senegal, Gambia, Mauritania.' },
      { id: 'bambara', name: 'Bambara', nativeName: 'Bamanankan', speakers: '14M+', description: 'Major language in Mali.' },
      { id: 'akan-twi', name: 'Akan/Twi', nativeName: 'Twi', speakers: '20M+', description: 'Ghanaian Akan language with Twi dialects.' },
      { id: 'ewe', name: 'Ewe', nativeName: 'Eʋe', speakers: '7M+', description: 'Spoken in Ghana and Togo.' },
      { id: 'fon', name: 'Fon', nativeName: 'Fon', speakers: '1.7M+', description: 'Spoken in Benin.' },
      { id: 'fulfulde', name: 'Fulfulde', nativeName: 'Pulaar/Fulfulde', speakers: '25M+', description: 'Widespread across West Africa.' },
    ]
  },
  {
    id: 'east-africa',
    name: 'East Africa',
    languages: [
      { id: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', speakers: '150M+', description: 'Lingua franca across East Africa.' },
      { id: 'amharic', name: 'Amharic', nativeName: 'አማርኛ', speakers: '32M+', description: 'Official language of Ethiopia.' },
      { id: 'oromo', name: 'Oromo', nativeName: 'Afaan Oromoo', speakers: '40M+', description: 'Widely spoken in Ethiopia and Kenya.' },
      { id: 'somali', name: 'Somali', nativeName: 'Soomaaliga', speakers: '25M+', description: 'Spoken in Somalia and neighboring states.' },
      { id: 'luganda', name: 'Luganda', nativeName: 'Luganda', speakers: '6M+', description: 'Major language in Uganda.' },
      { id: 'kinyarwanda', name: 'Kinyarwanda', nativeName: 'Kinyarwanda', speakers: '12M+', description: 'Official language of Rwanda.' },
    ]
  },
  {
    id: 'central-africa',
    name: 'Central Africa',
    languages: [
      { id: 'lingala', name: 'Lingala', nativeName: 'Lingála', speakers: '45M+', description: 'Spoken in DRC and Congo.' },
      { id: 'kikongo', name: 'Kikongo', nativeName: 'Kikongo', speakers: '7M+', description: 'Used in Angola, DRC, Congo.' },
      { id: 'sango', name: 'Sango', nativeName: 'Sängö', speakers: '5M+', description: 'Nationwide lingua franca of Central African Republic.' },
    ]
  },
  {
    id: 'southern-africa',
    name: 'Southern Africa',
    languages: [
      { id: 'zulu', name: 'Zulu', nativeName: 'isiZulu', speakers: '27M+', description: 'Major language in South Africa.' },
      { id: 'xhosa', name: 'Xhosa', nativeName: 'isiXhosa', speakers: '19M+', description: 'Spoken in South Africa.' },
      { id: 'shona', name: 'Shona', nativeName: 'ChiShona', speakers: '14M+', description: 'Major language in Zimbabwe.' },
      { id: 'ndebele', name: 'Ndebele', nativeName: 'isiNdebele', speakers: '2M+', description: 'Spoken in Zimbabwe and South Africa.' },
      { id: 'tswana', name: 'Tswana', nativeName: 'Setswana', speakers: '5M+', description: 'Spoken in Botswana and South Africa.' },
      { id: 'sesotho', name: 'Sesotho', nativeName: 'Sesotho', speakers: '6M+', description: 'Spoken in Lesotho and South Africa.' },
      { id: 'afrikaans', name: 'Afrikaans', nativeName: 'Afrikaans', speakers: '17M+', description: 'Derived from Dutch, widely used in South Africa.' },
    ]
  },
  {
    id: 'north-africa',
    name: 'North Africa',
    languages: [
      { id: 'arabic', name: 'Arabic', nativeName: 'العربية', speakers: '250M+', description: 'Widespread in North Africa.' },
      { id: 'darija', name: 'Darija', nativeName: 'الدارجة', speakers: '60M+', description: 'Maghrebi Arabic (Morocco/Algeria/Tunisia).' },
      { id: 'amazigh', name: 'Amazigh/Berber', nativeName: 'Tamazight', speakers: '20M+', description: 'Indigenous languages across North Africa.' },
    ]
  }
];

export default AFRICAN_LANGUAGES;
