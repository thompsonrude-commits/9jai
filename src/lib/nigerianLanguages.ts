// Nigerian Languages organized by geopolitical zones
// Each region lists languages from all states within that zone

export interface Language {
  id: string;
  name: string;
  nativeName: string;
  speakers: string;
  description: string;
}

export interface Region {
  id: string;
  name: string;
  languages: Language[];
}

export const NIGERIAN_LANGUAGES: Region[] = [
  {
    id: 'pidgin-english',
    name: 'Pidgin English',
    languages: [
      {
        id: 'pidgin',
        name: 'Nigerian Pidgin English',
        nativeName: 'Naija',
        speakers: '75 million+',
        description: 'Nigerian Pidgin (Naija) is an English-based creole spoken across all 36 states as a lingua franca. It bridges ethnic divides and is the language of markets, music, comedy, and street culture. BBC Pidgin broadcasts daily in Naija.'
      }
    ]
  },
  {
    id: 'south-south',
    name: 'South-South',
    languages: [
      // EDO STATE
      {
        id: 'edo',
        name: 'Edo (Bini)',
        nativeName: 'Ẹ̀dó',
        speakers: '4 million+',
        description: 'Edo (Bini) is the language of the ancient Benin Kingdom, spoken by the Edo people. It is the most widely spoken Edoid language and the cultural heartbeat of Edo State.'
      },
      {
        id: 'esan',
        name: 'Esan',
        nativeName: 'Esan',
        speakers: '500,000+',
        description: 'Esan is spoken by the Esan people of the Esan plateau in Edo State. It is an Edoid language closely related to Edo (Bini) and has five main dialects: Ewohimi, Igueben, Irrua, Ekpoma, and Ubiaja.'
      },
      {
        id: 'afemai',
        name: 'Afemai (Etsako)',
        nativeName: 'Yekhee',
        speakers: '500,000+',
        description: 'Afemai (also called Yekhee or Etsako) is spoken by the Afemai people of northern Edo State. It is an Edoid language with several dialects including Etsako West, Central, and East.'
      },
      {
        id: 'owan',
        name: 'Owan',
        nativeName: 'Owan',
        speakers: '200,000+',
        description: 'Owan is spoken by the Owan people of Owan East and Owan West local government areas of Edo State. It is an Edoid language with close ties to Afemai.'
      },
      // DELTA STATE
      {
        id: 'urhobo',
        name: 'Urhobo',
        nativeName: 'Urhobo',
        speakers: '2 million+',
        description: 'Urhobo is the major language of Delta State, spoken by the Urhobo people of the northwestern Niger Delta. It is an Edoid language known for the Ohworu water spirit festival and Udje dance tradition.'
      },
      {
        id: 'isoko',
        name: 'Isoko',
        nativeName: 'Isoko',
        speakers: '1 million+',
        description: 'Isoko is spoken by the Isoko people of Delta State. It is closely related to Urhobo and is an Edoid language. The Isoko share many cultural traditions with the Urhobo.'
      },
      {
        id: 'itsekiri',
        name: 'Itsekiri',
        nativeName: 'Itsekiri',
        speakers: '1 million+',
        description: 'Itsekiri is a Yoruboid language spoken by the Itsekiri people of Warri, Delta State. Despite being geographically in the Niger Delta, it is linguistically related to Yoruba.'
      },
      {
        id: 'ukwuani',
        name: 'Ukwuani',
        nativeName: 'Ukwuani',
        speakers: '300,000+',
        description: 'Ukwuani is an Igboid language spoken by the Ukwuani people of Delta State. It is closely related to Igbo and is spoken in the Ndokwa area of Delta State.'
      },
      // CROSS RIVER STATE
      {
        id: 'efik',
        name: 'Efik',
        nativeName: 'Efịk',
        speakers: '2 million+',
        description: 'Efik is the indigenous language of the Efik people of Cross River State. It was one of the first Nigerian languages to be written (1812) and is associated with the Ekpe secret society and Calabar Carnival.'
      },
      {
        id: 'ejagham',
        name: 'Ejagham',
        nativeName: 'Ejagham',
        speakers: '200,000+',
        description: 'Ejagham (Ekoi) is spoken by the Ejagham people of Cross River State. The Ejagham are known for creating the Nsibidi script, one of Africa\'s indigenous writing systems.'
      },
      {
        id: 'bekwarra',
        name: 'Bekwarra',
        nativeName: 'Bekwarra',
        speakers: '100,000+',
        description: 'Bekwarra is spoken by the Bekwarra people of northern Cross River State. It is a Cross River language with a rich oral tradition.'
      },
      // AKWA IBOM STATE
      {
        id: 'ibibio',
        name: 'Ibibio',
        nativeName: 'Ibibio',
        speakers: '4 million+',
        description: 'Ibibio is the major language of Akwa Ibom State. The Ibibio are known for the Ekpo masquerade tradition and skilled woodcarving. The language is closely related to Efik and Annang.'
      },
      {
        id: 'annang',
        name: 'Annang',
        nativeName: 'Ànnang',
        speakers: '1 million+',
        description: 'Annang is spoken by the Annang people of Akwa Ibom State. It is closely related to Ibibio and is spoken in eight local government areas including Abak, Ikot Ekpene, and Essien Udim.'
      },
      {
        id: 'oron',
        name: 'Oron',
        nativeName: 'Oron',
        speakers: '300,000+',
        description: 'Oron is spoken by the Oron people of southern Akwa Ibom State. The Oron are known for their Ekpu ancestor figures, among the oldest wooden sculptures in sub-Saharan Africa.'
      },
      // RIVERS STATE
      {
        id: 'ijaw',
        name: 'Ijaw (Izon)',
        nativeName: 'Ịjọ',
        speakers: '2 million+',
        description: 'Ijaw (Izon) is the dominant language of the Ijaw people across the Niger Delta. It has SOV word order, unusual in Niger-Congo. The Kolokuma dialect is used in education in Bayelsa State.'
      },
      {
        id: 'ikwerre',
        name: 'Ikwerre',
        nativeName: 'Ikwerre',
        speakers: '500,000+',
        description: 'Ikwerre is an Igboid language spoken by the Ikwerre people of Rivers State, particularly around Port Harcourt. Despite similarities to Igbo, the Ikwerre maintain a distinct cultural identity.'
      },
      {
        id: 'ogoni',
        name: 'Ogoni (Khana)',
        nativeName: 'Khana',
        speakers: '1 million+',
        description: 'Ogoni refers to a cluster of five languages (Khana, Gokana, Tẹẹ, Eleme, Baan) spoken by the Ogoni people of Rivers State. The Ogoni gained international attention through Ken Saro-Wiwa\'s environmental activism.'
      },
      {
        id: 'kalabari',
        name: 'Kalabari',
        nativeName: 'Kalabari',
        speakers: '300,000+',
        description: 'Kalabari is an Ijaw language spoken by the Kalabari people of Rivers State. The Kalabari were major traders in the Niger Delta and are known for their elaborate masquerade traditions.'
      },
      // BAYELSA STATE
      {
        id: 'nembe',
        name: 'Nembe',
        nativeName: 'Nembe',
        speakers: '200,000+',
        description: 'Nembe is an Ijaw language spoken by the Nembe people of Bayelsa State. The Nembe Kingdom was one of the powerful trading states of the Niger Delta in the 19th century.'
      },
      {
        id: 'ogbia',
        name: 'Ogbia',
        nativeName: 'Ogbia',
        speakers: '200,000+',
        description: 'Ogbia is spoken by the Ogbia people of Bayelsa State. It is an Ijoid language and the native language of former President Goodluck Jonathan\'s home area.'
      }
    ]
  },
  {
    id: 'south-west',
    name: 'South-West',
    languages: [
      // LAGOS STATE
      {
        id: 'yoruba',
        name: 'Yoruba',
        nativeName: 'Yorùbá',
        speakers: '40 million+',
        description: 'Yoruba is one of Nigeria\'s three major languages, spoken across the entire South-West. It has a rich literary tradition, the Ifá divination corpus, and a global diaspora in Brazil, Cuba, and the Caribbean.'
      },
      {
        id: 'egun',
        name: 'Egun (Gun)',
        nativeName: 'Gungbe',
        speakers: '200,000+',
        description: 'Egun (Gun) is spoken by the Egun people of Badagry, Lagos State. It is a Gbe language related to Fon and Ewe, spoken along the Nigeria-Benin border. The Egun are known for the Vlekete festival.'
      },
      // OGUN STATE
      {
        id: 'awori',
        name: 'Awori',
        nativeName: 'Awori',
        speakers: '300,000+',
        description: 'Awori is a Yoruba dialect spoken by the Awori people of Ogun and Lagos states. The Awori are considered the original settlers of Lagos Island and have a distinct cultural identity within the Yoruba family.'
      },
      {
        id: 'egba',
        name: 'Egba',
        nativeName: 'Egba',
        speakers: '500,000+',
        description: 'Egba is a Yoruba dialect spoken by the Egba people of Abeokuta, Ogun State. The Egba successfully resisted Dahomean and Fulani invasions and established Abeokuta as a major 19th-century city-state.'
      },
      // OYO STATE
      {
        id: 'oyo-yoruba',
        name: 'Oyo Yoruba',
        nativeName: 'Yorùbá Ọ̀yọ́',
        speakers: '3 million+',
        description: 'Oyo Yoruba is the prestige dialect of Yoruba, spoken in Oyo State. It formed the basis of Standard Yoruba and was the language of the powerful Oyo Empire, which dominated West Africa from the 17th to 19th centuries.'
      },
      // ONDO STATE
      {
        id: 'ondo-yoruba',
        name: 'Ondo Yoruba',
        nativeName: 'Yorùbá Ọ̀ndó',
        speakers: '1 million+',
        description: 'Ondo Yoruba is spoken in Ondo State and has distinct phonological features from Standard Yoruba. Ondo State also has Ijaw-speaking communities in its coastal areas.'
      },
      {
        id: 'ikale',
        name: 'Ikale',
        nativeName: 'Ikale',
        speakers: '300,000+',
        description: 'Ikale is a Yoruba dialect spoken by the Ikale people of southern Ondo State. The Ikale have a distinct cultural identity and are known for their fishing traditions along the Atlantic coast.'
      },
      // EKITI STATE
      {
        id: 'ekiti-yoruba',
        name: 'Ekiti Yoruba',
        nativeName: 'Yorùbá Èkìtì',
        speakers: '1 million+',
        description: 'Ekiti Yoruba is spoken in Ekiti State and is known for its unique tonal patterns and vocabulary. The Ekiti people are known for their warrior tradition and the Udiroko festival.'
      },
      // OSUN STATE
      {
        id: 'ijesa',
        name: 'Ijesa',
        nativeName: 'Ijẹṣà',
        speakers: '500,000+',
        description: 'Ijesa is a Yoruba dialect spoken by the Ijesa people of Osun State. The Ijesa are known for their trading tradition and the Ogun festival. Ilesa is the major Ijesa city.'
      }
    ]
  },
  {
    id: 'south-east',
    name: 'South-East',
    languages: [
      // ANAMBRA STATE
      {
        id: 'igbo',
        name: 'Igbo',
        nativeName: 'Ásụ̀sụ́ Ìgbò',
        speakers: '30 million+',
        description: 'Igbo is one of Nigeria\'s three major languages, spoken across the South-East. It has a rich tradition of trade, the Igbo-Ukwu bronzes, and the Odinani spiritual system. Onitsha Igbo is a major prestige dialect.'
      },
      {
        id: 'igala',
        name: 'Igala',
        nativeName: 'Igala',
        speakers: '2 million+',
        description: 'Igala is spoken by the Igala people of Kogi State and parts of Anambra. It is a Yoruboid language related to Yoruba and Edo, and the Igala Kingdom was historically powerful along the Niger-Benue confluence.'
      },
      // ABIA STATE
      {
        id: 'ngwa-igbo',
        name: 'Ngwa Igbo',
        nativeName: 'Ngwa',
        speakers: '1 million+',
        description: 'Ngwa is an Igbo dialect spoken by the Ngwa people of Abia State. The Ngwa are known for their palm oil production and the Aro Long Juju oracle tradition in nearby Arochukwu.'
      },
      {
        id: 'aro',
        name: 'Aro',
        nativeName: 'Aro',
        speakers: '200,000+',
        description: 'Aro is an Igbo dialect spoken by the Aro people of Arochukwu, Abia State. The Aro were historically powerful traders who controlled the Long Juju oracle (Ibini Ukpabi) and dominated trade networks across southeastern Nigeria.'
      },
      // ENUGU STATE
      {
        id: 'enugu-igbo',
        name: 'Enugu Igbo',
        nativeName: 'Igbo Énugwú',
        speakers: '2 million+',
        description: 'Enugu Igbo is spoken in Enugu State and includes dialects like Udi, Awgu, and Oji-River. Enugu was the capital of the Eastern Region and the Republic of Biafra during the Nigerian Civil War.'
      },
      {
        id: 'igede',
        name: 'Igede',
        nativeName: 'Igede',
        speakers: '300,000+',
        description: 'Igede is spoken by the Igede people of Benue State and parts of Enugu State. It is a distinct language in the Middle Belt with its own rich oral tradition and the Igede cultural festival.'
      },
      // IMO STATE
      {
        id: 'owerri-igbo',
        name: 'Owerri Igbo',
        nativeName: 'Igbo Ọ̀wẹ̀rị',
        speakers: '2 million+',
        description: 'Owerri Igbo is spoken in Imo State and is one of the most widely understood Igbo dialects. Owerri is known for the Mbari art tradition and the Ikeji festival.'
      },
      {
        id: 'oguta',
        name: 'Oguta',
        nativeName: 'Oguta',
        speakers: '100,000+',
        description: 'Oguta is an Igbo dialect spoken by the Oguta people of Imo State, near Oguta Lake. The Oguta have a distinct cultural identity and are known for their fishing and trading traditions.'
      },
      // EBONYI STATE
      {
        id: 'izii',
        name: 'Izii',
        nativeName: 'Izii',
        speakers: '300,000+',
        description: 'Izii is an Igbo dialect spoken by the Izii people of Ebonyi State. The Izii are known for their farming traditions and the Izii cultural festival. Ebonyi State has several distinct Igbo dialects.'
      },
      {
        id: 'ezza',
        name: 'Ezza',
        nativeName: 'Ezza',
        speakers: '400,000+',
        description: 'Ezza is an Igbo dialect spoken by the Ezza people of Ebonyi State. The Ezza are known for their warrior tradition and the Ezza cultural festival. They are one of the major groups in Ebonyi State.'
      }
    ]
  },
  {
    id: 'north-central',
    name: 'North-Central',
    languages: [
      // BENUE STATE
      {
        id: 'tiv',
        name: 'Tiv',
        nativeName: 'Tiv',
        speakers: '4 million+',
        description: 'Tiv is the major language of Benue State, spoken by the Tiv people. The Tiv are known for their egalitarian society, Kwagh-hir puppet theatre, and distinctive geometric body markings (Abi).'
      },
      {
        id: 'idoma',
        name: 'Idoma',
        nativeName: 'Idoma',
        speakers: '1 million+',
        description: 'Idoma is spoken by the Idoma people of Benue State. The Idoma are known for the Alekwu ancestral spirit masquerade and the Oglinye dance. The Och\'Idoma is the paramount ruler.'
      },
      {
        id: 'igede',
        name: 'Igede',
        nativeName: 'Igede',
        speakers: '300,000+',
        description: 'Igede is spoken by the Igede people of Benue State. It is a distinct language with its own rich oral tradition and the Igede cultural festival held annually.'
      },
      // KOGI STATE
      {
        id: 'igala',
        name: 'Igala',
        nativeName: 'Igala',
        speakers: '2 million+',
        description: 'Igala is spoken by the Igala people of Kogi State. It is a Yoruboid language and the Igala Kingdom was historically powerful along the Niger-Benue confluence. The Attah of Igala is the paramount ruler.'
      },
      {
        id: 'ebira',
        name: 'Ebira',
        nativeName: 'Ebira',
        speakers: '2 million+',
        description: 'Ebira is spoken by the Ebira people of Kogi, Kwara, and Nasarawa states. The Ebira are known for the Ekuechi masquerade festival and their weaving tradition.'
      },
      {
        id: 'okun',
        name: 'Okun (Yoruba)',
        nativeName: 'Okun',
        speakers: '500,000+',
        description: 'Okun is a group of Yoruba dialects spoken by the Okun people of western Kogi State. The Okun Yoruba include the Yagba, Ijumu, Kabba, and Bunu sub-groups.'
      },
      // KWARA STATE
      {
        id: 'nupe',
        name: 'Nupe',
        nativeName: 'Nupe',
        speakers: '1 million+',
        description: 'Nupe is spoken by the Nupe people of Niger, Kwara, and Kogi states. The Nupe Kingdom (Bida Emirate) was one of the major kingdoms of the Middle Belt, known for glasswork and brasswork.'
      },
      {
        id: 'baruten',
        name: 'Baruten (Borgu)',
        nativeName: 'Baatonum',
        speakers: '300,000+',
        description: 'Baruten (Baatonum) is spoken by the Bariba people of Kwara State\'s Baruten Local Government Area. The Bariba are known for their equestrian culture and the Gaani festival.'
      },
      // NIGER STATE
      {
        id: 'gbagyi',
        name: 'Gbagyi',
        nativeName: 'Gbagyi',
        speakers: '1 million+',
        description: 'Gbagyi (Gwari) is spoken by the Gbagyi people of Niger State and the FCT. The Gbagyi are the original inhabitants of the Abuja area and are known for their pottery and farming traditions.'
      },
      {
        id: 'hausa-niger',
        name: 'Hausa (Niger)',
        nativeName: 'Harshen Hausa',
        speakers: '2 million+',
        description: 'Hausa is widely spoken in Niger State alongside indigenous languages. Niger State is home to the Nupe, Gbagyi, and Hausa-Fulani communities, making it one of Nigeria\'s most linguistically diverse states.'
      },
      // PLATEAU STATE
      {
        id: 'berom',
        name: 'Berom',
        nativeName: 'Berom',
        speakers: '500,000+',
        description: 'Berom is spoken by the Berom people of Plateau State, particularly around Jos. The Berom are the major indigenous group of the Jos Plateau and are known for their tin mining history and the Nzem Berom festival.'
      },
      {
        id: 'angas',
        name: 'Angas (Ngas)',
        nativeName: 'Ngas',
        speakers: '300,000+',
        description: 'Angas (Ngas) is spoken by the Angas people of Plateau State. It is a Chadic language and the Angas are known for their farming traditions on the Jos Plateau.'
      },
      {
        id: 'tyap',
        name: 'Tyap (Katab)',
        nativeName: 'Tyap',
        speakers: '200,000+',
        description: 'Tyap (Katab) is spoken by the Atyap people of southern Kaduna and Plateau states. It is a Plateau language and the Atyap are known for their resistance to Fulani raids in the 19th century.'
      },
      // NASARAWA STATE
      {
        id: 'eggon',
        name: 'Eggon',
        nativeName: 'Eggon',
        speakers: '300,000+',
        description: 'Eggon is spoken by the Eggon people of Nasarawa State. It is a Plateau language and the Eggon are known for their farming traditions and the Eggon cultural festival.'
      },
      {
        id: 'alago',
        name: 'Alago',
        nativeName: 'Alago',
        speakers: '200,000+',
        description: 'Alago is spoken by the Alago people of Nasarawa State. It is a Plateau language and the Alago are one of the major indigenous groups of Nasarawa State.'
      }
    ]
  },
  {
    id: 'north-west',
    name: 'North-West',
    languages: [
      // KANO STATE
      {
        id: 'hausa',
        name: 'Hausa',
        nativeName: 'Harshen Hausa',
        speakers: '70 million+',
        description: 'Hausa is the most widely spoken language in West Africa and Nigeria\'s dominant northern language. Kano is the heartland of Hausa culture, with a history of Islamic scholarship, trade, and the ancient Kano Chronicle.'
      },
      // KADUNA STATE
      {
        id: 'fulfulde',
        name: 'Fulfulde (Fulani)',
        nativeName: 'Fulfulde',
        speakers: '15 million+',
        description: 'Fulfulde is spoken by the Fulani people across northern Nigeria. The Fulani are traditionally pastoral nomads known for cattle herding, Islamic scholarship, and the Gerewol beauty festival.'
      },
      {
        id: 'gbagyi-kaduna',
        name: 'Gbagyi (Kaduna)',
        nativeName: 'Gbagyi',
        speakers: '500,000+',
        description: 'Gbagyi is spoken by the Gbagyi people of southern Kaduna State. The Gbagyi are known for their pottery, farming, and the Gbagyi cultural festival.'
      },
      {
        id: 'kataf',
        name: 'Kataf (Atyap)',
        nativeName: 'Tyap',
        speakers: '300,000+',
        description: 'Kataf (Atyap) is spoken by the Atyap people of southern Kaduna State. The Atyap are known for their resistance to Fulani raids and the Atyap cultural festival.'
      },
      // SOKOTO STATE
      {
        id: 'hausa-sokoto',
        name: 'Hausa (Sokoto)',
        nativeName: 'Harshen Hausa',
        speakers: '5 million+',
        description: 'Sokoto Hausa is the dialect spoken in Sokoto State, home of the Sokoto Caliphate founded by Usman dan Fodio in 1804. The Sultan of Sokoto is the spiritual leader of Nigerian Muslims.'
      },
      {
        id: 'kambari',
        name: 'Kambari',
        nativeName: 'Kambari',
        speakers: '100,000+',
        description: 'Kambari is spoken by the Kambari people of Kebbi and Niger states. It is a Nupoid language and the Kambari are known for their farming and fishing traditions along the Niger River.'
      },
      // KEBBI STATE
      {
        id: 'kebbi-hausa',
        name: 'Kebbi Hausa',
        nativeName: 'Harshen Kebbi',
        speakers: '2 million+',
        description: 'Kebbi Hausa is the dialect spoken in Kebbi State. The Kebbi Emirate was historically independent of the Sokoto Caliphate and has its own distinct cultural traditions.'
      },
      {
        id: 'dendi',
        name: 'Dendi',
        nativeName: 'Dendi',
        speakers: '50,000+',
        description: 'Dendi is a Songhay language spoken by the Dendi people of Kebbi State along the Niger River border with Benin Republic. It is related to Zarma and Songhay languages of the Sahel.'
      },
      // ZAMFARA STATE
      {
        id: 'zamfara-hausa',
        name: 'Zamfara Hausa',
        nativeName: 'Harshen Zamfara',
        speakers: '3 million+',
        description: 'Zamfara Hausa is the dialect spoken in Zamfara State. The Zamfara Emirate has a rich history and the state is known for its gold deposits and the Zamfara cultural festival.'
      },
      // KATSINA STATE
      {
        id: 'katsina-hausa',
        name: 'Katsina Hausa',
        nativeName: 'Harshen Katsina',
        speakers: '6 million+',
        description: 'Katsina Hausa is spoken in Katsina State. Katsina was one of the seven original Hausa city-states (Hausa Bakwai) and a major centre of Islamic learning and trans-Saharan trade.'
      },
      // JIGAWA STATE
      {
        id: 'jigawa-hausa',
        name: 'Jigawa Hausa',
        nativeName: 'Harshen Jigawa',
        speakers: '4 million+',
        description: 'Jigawa Hausa is spoken in Jigawa State. The state was carved out of Kano State in 1991 and is known for its agricultural production and the Dutse Emirate.'
      }
    ]
  },
  {
    id: 'north-east',
    name: 'North-East',
    languages: [
      // BORNO STATE
      {
        id: 'kanuri',
        name: 'Kanuri',
        nativeName: 'Kanuri',
        speakers: '5 million+',
        description: 'Kanuri is the language of the ancient Kanem-Bornu Empire, one of Africa\'s longest-lasting empires (700–1900 CE). It is spoken by the Kanuri people of Borno and Yobe states.'
      },
      {
        id: 'shuwa-arabic',
        name: 'Shuwa Arabic',
        nativeName: 'Shuwa Arabic',
        speakers: '1 million+',
        description: 'Shuwa Arabic is spoken by the Shuwa Arabs of northeastern Nigeria and Chad. It is an Arabic dialect that arrived in the Lake Chad basin through centuries of trans-Saharan migration.'
      },
      {
        id: 'bura',
        name: 'Bura',
        nativeName: 'Bura',
        speakers: '300,000+',
        description: 'Bura is spoken by the Bura people of Borno and Adamawa states. It is a Chadic language and the Bura are known for their farming traditions and the Bura cultural festival.'
      },
      {
        id: 'marghi',
        name: 'Marghi',
        nativeName: 'Marghi',
        speakers: '200,000+',
        description: 'Marghi is a Chadic language spoken by the Marghi people of Borno State. The Marghi are known for their iron-smelting tradition and the Marghi cultural festival.'
      },
      // YOBE STATE
      {
        id: 'bade',
        name: 'Bade',
        nativeName: 'Bade',
        speakers: '200,000+',
        description: 'Bade is a Chadic language spoken by the Bade people of Yobe State. The Bade are known for their fishing traditions around Lake Chad and the Bade cultural festival.'
      },
      {
        id: 'ngizim',
        name: 'Ngizim',
        nativeName: 'Ngizim',
        speakers: '100,000+',
        description: 'Ngizim is a Chadic language spoken by the Ngizim people of Yobe State. It is closely related to Bade and the Ngizim are known for their farming and fishing traditions.'
      },
      // ADAMAWA STATE
      {
        id: 'bachama',
        name: 'Bachama',
        nativeName: 'Bachama',
        speakers: '500,000+',
        description: 'Bachama is spoken by the Bachama people of Adamawa State. It is an Adamawa language and the Bachama are known for their farming traditions and the Bachama cultural festival.'
      },
      {
        id: 'chamba',
        name: 'Chamba',
        nativeName: 'Chamba',
        speakers: '300,000+',
        description: 'Chamba is spoken by the Chamba people of Adamawa and Taraba states. It is an Adamawa language and the Chamba are known for their masquerade traditions and the Chamba cultural festival.'
      },
      {
        id: 'mumuye',
        name: 'Mumuye',
        nativeName: 'Mumuye',
        speakers: '400,000+',
        description: 'Mumuye is spoken by the Mumuye people of Taraba and Adamawa states. The Mumuye are known for their Vabo masquerade and their distinctive wooden sculptures which are collected worldwide.'
      },
      // GOMBE STATE
      {
        id: 'tangale',
        name: 'Tangale',
        nativeName: 'Tangale',
        speakers: '200,000+',
        description: 'Tangale is a Chadic language spoken by the Tangale people of Gombe State. The Tangale are known for their farming traditions and the Tangale cultural festival.'
      },
      {
        id: 'tera',
        name: 'Tera',
        nativeName: 'Tera',
        speakers: '100,000+',
        description: 'Tera is a Chadic language spoken by the Tera people of Gombe State. It is closely related to Tangale and the Tera are known for their farming and pottery traditions.'
      },
      // BAUCHI STATE
      {
        id: 'gerawa',
        name: 'Gerawa',
        nativeName: 'Gerawa',
        speakers: '100,000+',
        description: 'Gerawa is a Chadic language spoken by the Gerawa people of Bauchi State. The Gerawa are known for their farming traditions and the Gerawa cultural festival.'
      },
      {
        id: 'warji',
        name: 'Warji',
        nativeName: 'Warji',
        speakers: '100,000+',
        description: 'Warji is a Chadic language spoken by the Warji people of Bauchi State. The Warji are known for their farming traditions and the Warji cultural festival.'
      },
      // TARABA STATE
      {
        id: 'jukun',
        name: 'Jukun',
        nativeName: 'Jukun',
        speakers: '500,000+',
        description: 'Jukun is spoken by the Jukun people of Taraba, Benue, and Nasarawa states. The Jukun Kingdom (Kwararafa) was one of the most powerful kingdoms in the Middle Belt, known for its divine kingship tradition.'
      },
      {
        id: 'kuteb',
        name: 'Kuteb',
        nativeName: 'Kuteb',
        speakers: '200,000+',
        description: 'Kuteb is spoken by the Kuteb people of Taraba State. It is a Jukunoid language and the Kuteb are known for their farming traditions and the Kuteb cultural festival.'
      }
    ]
  }
];
