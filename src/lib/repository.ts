export interface RepositoryEntry {
  category: string;
  items: {
    term: string;
    translation: string;
    phonetic: string;
    context?: string;
  }[];
}

export const LINGUISTIC_REPOSITORY: RepositoryEntry[] = [
  {
    category: "Greetings & Courtesy",
    items: [
      { term: "Kọyo", translation: "Hello", phonetic: "Kaw-yaw" },
      { term: "Obokhian", translation: "Welcome", phonetic: "O-bo-khian" },
      { term: "Obokhe", translation: "Response to welcome", phonetic: "O-bo-khay" },
      { term: "Vbẹe oye hẹ?", translation: "How are you?", phonetic: "Veh-eh oy-yeh heh" },
      { term: "Ọyese", translation: "I am fine / It is well", phonetic: "Oh-yeh-seh" },
      { term: "Uru ese", translation: "Thank you", phonetic: "Oo-roo ay-say" },
      { term: "Lahọ", translation: "Please", phonetic: "La-haw" },
      { term: "Ọkhíen Azẹkpẹrẹ", translation: "See you later", phonetic: "Ar-ze p-re" },
      { term: "À khi dẹ̀", translation: "Goodbye", phonetic: "Ah khi deh" },
      { term: "Dombọ", translation: "Safe journey", phonetic: "Dom-baw" },
      { term: "Ghẹ rirọ", translation: "Don't worry", phonetic: "Ghay ree-raw" },
      { term: "Ob'ọwie", translation: "Good morning", phonetic: "O-bo-wie" },
      { term: "Ob'avan", translation: "Good afternoon", phonetic: "O-ba-van" },
      { term: "Ob'ota", translation: "Good evening", phonetic: "O-bo-ta" },
      { term: "Ọkhíen òwiẹ", translation: "Good night", phonetic: "O-khyen o-wie" }
    ]
  },
  {
    category: "Family & People",
    items: [
      { term: "Erha", translation: "Father", phonetic: "Ay-ra" },
      { term: "Iye", translation: "Mother", phonetic: "Ee-yay" },
      { term: "Ọmọ", translation: "Child", phonetic: "Or-mor" },
      { term: "Okpia", translation: "Man", phonetic: "Ok-pya" },
      { term: "Okhuo", translation: "Woman", phonetic: "O-khwo" },
      { term: "Ọtẹn", translation: "Sibling/Relative", phonetic: "Or-tayn" },
      { term: "Ọvbokhan", translation: "Young person / Child", phonetic: "Or-vor-khan" },
      { term: "Ẹdion", translation: "Elders", phonetic: "Ay-dyon" },
      { term: "Ọvbokhuo", translation: "Wife", phonetic: "Or-vor-khwo" },
      { term: "Ọdọ", translation: "Husband", phonetic: "Or-daw" },
      { term: "Ọmwan", translation: "Person/Human", phonetic: "Or-mwan" },
      { term: "Ẹgbẹe", translation: "Family", phonetic: "Ay-gbay-ay" },
      { term: "Ọse", translation: "Friend", phonetic: "Or-say" }
    ]
  },
  {
    category: "Questions & Pronouns",
    items: [
      { term: "Mẹ", translation: "I / Me", phonetic: "Meh" },
      { term: "Wẹ", translation: "You (singular)", phonetic: "Weh" },
      { term: "Ọre", translation: "He / She / It (Focus Marker)", phonetic: "Aw-ray" },
      { term: "Ma", translation: "We / Us", phonetic: "Ma" },
      { term: "Wa", translation: "You (plural)", phonetic: "Wa" },
      { term: "Iran", translation: "They / Them", phonetic: "Ee-ran" },
      { term: "Vbọ?", translation: "What?", phonetic: "Vaw" },
      { term: "Ghẹẹ?", translation: "Who?", phonetic: "Ghee" },
      { term: "De?", translation: "Which?", phonetic: "Day" },
      { term: "Vbakha?", translation: "How?", phonetic: "Va-kha" },
      { term: "Vbevbọ?", translation: "Where?", phonetic: "Vay-vaw" },
      { term: "Deghẹ?", translation: "Why?", phonetic: "Day-gheh" }
    ]
  },
  {
    category: "Numerals",
    items: [
      { term: "Okpa", translation: "One", phonetic: "Ok-pa" },
      { term: "Eva", translation: "Two", phonetic: "Ay-va" },
      { term: "Eha", translation: "Three", phonetic: "Ay-ha" },
      { term: "Ene", translation: "Four", phonetic: "Ay-nay" },
      { term: "Isẹ", translation: "Five", phonetic: "Ee-seh" },
      { term: "Ehan", translation: "Six", phonetic: "Ay-han" },
      { term: "Ihinron", translation: "Seven", phonetic: "Ee-heen-ron" },
      { term: "Erele", translation: "Eight", phonetic: "Ay-ray-lay" },
      { term: "Ihinrin", translation: "Nine", phonetic: "Ee-heen-reen" },
      { term: "Igbe", translation: "Ten", phonetic: "Ig-bay" },
      { term: "Igbe okpa", translation: "Eleven", phonetic: "Ig-bay ok-pa" },
      { term: "Obe", translation: "Twenty", phonetic: "Oh-bay" },
      { term: "Ọgban", translation: "Thirty", phonetic: "Or-gban" },
      { term: "Igbe-ne", translation: "Forty", phonetic: "Ig-bay-nay" },
      { term: "Iyẹn", translation: "One Hundred", phonetic: "Ee-yen" }
    ]
  },
  {
    category: "Time & Days",
    items: [
      { term: "Ẹdẹ", translation: "Day", phonetic: "Ay-day" },
      { term: "Owiẹ", translation: "Morning", phonetic: "O-wie" },
      { term: "Avan", translation: "Afternoon", phonetic: "Ah-van" },
      { term: "Ota", translation: "Evening", phonetic: "O-ta" },
      { term: "Asọn", translation: "Night", phonetic: "Ah-son" },
      { term: "Uki", translation: "Month / Moon", phonetic: "Oo-kee" },
      { term: "Ukpo", translation: "Year", phonetic: "Ook-po" },
      { term: "Eken", translation: "Monday", phonetic: "Ay-ken" },
      { term: "Aho", translation: "Tuesday", phonetic: "Ah-ho" },
      { term: "Oha", translation: "Wednesday", phonetic: "Oh-ha" },
      { term: "Ugie", translation: "Thursday", phonetic: "Oo-gee-eh" },
      { term: "Eken ẹha", translation: "Friday", phonetic: "Ay-ken ay-ha" },
      { term: "Eken ene", translation: "Saturday", phonetic: "Ay-ken ay-nay" },
      { term: "Eken isẹ", translation: "Sunday", phonetic: "Ay-ken ee-seh" }
    ]
  },
  {
    category: "Body Parts",
    items: [
      { term: "Egbe", translation: "Body", phonetic: "Ay-gbay" },
      { term: "Uhunmwu", translation: "Head", phonetic: "Oo-hoon-mwoo" },
      { term: "Aro", translation: "Eye", phonetic: "Ah-ro" },
      { term: "Ehọ", translation: "Ear", phonetic: "Ay-hor" },
      { term: "Ihue", translation: "Nose", phonetic: "Ee-hway" },
      { term: "Unu", translation: "Mouth", phonetic: "Oo-noo" },
      { term: "Ọkpẹ", translation: "Tooth", phonetic: "Or-kpay" },
      { term: "Obọ", translation: "Hand/Arm", phonetic: "O-baw" },
      { term: "Owẹ", translation: "Leg/Foot", phonetic: "O-way" },
      { term: "Ẹtin", translation: "Chest", phonetic: "Ay-teen" },
      { term: "Ẹwẹ", translation: "Stomach", phonetic: "Ay-way" },
      { term: "Ẹkhu", translation: "Back", phonetic: "Ay-khoo" },
      { term: "Ukpu", translation: "Knee", phonetic: "Ook-poo" }
    ]
  },
  {
    category: "Food & Drinks",
    items: [
      { term: "Evbare", translation: "Food", phonetic: "Ay-va-ray" },
      { term: "Ame", translation: "Water", phonetic: "Ah-may" },
      { term: "Iyan", translation: "Yam", phonetic: "Ee-yan" },
      { term: "Emakhẹ", translation: "Pounded Yam", phonetic: "Ay-ma-khay" },
      { term: "Izẹ", translation: "Rice", phonetic: "Ee-zay" },
      { term: "Eran", translation: "Meat", phonetic: "Ay-ran" },
      { term: "Ẹhẹn", translation: "Fish", phonetic: "Ay-hen" },
      { term: "Ogiogi", translation: "Groundnut / Peanut", phonetic: "O-gyo-gee" },
      { term: "Ẹviẹ", translation: "Palm oil", phonetic: "Ay-vyeh" },
      { term: "Orogbo", translation: "Bitter Kola", phonetic: "O-ro-gbo" },
      { term: "Ẹkọ", translation: "Pap / Agidi", phonetic: "Ay-kor" },
      { term: "Ukpọn", translation: "Salt", phonetic: "Ook-pon" }
    ]
  },
  {
    category: "Nature & Environment",
    items: [
      { term: "Ovẹn", translation: "Sun", phonetic: "O-ven" },
      { term: "Okin", translation: "Moon", phonetic: "O-keen" },
      { term: "Ẹkẹn", translation: "Sand / Earth / Ground", phonetic: "Ay-ken" },
      { term: "Ekhue", translation: "Wind / Breeze", phonetic: "Ay-khway" },
      { term: "Ẹrhen", translation: "Fire", phonetic: "Ay-ren" },
      { term: "Eran", translation: "Tree / Wood", phonetic: "Ay-ran" },
      { term: "Ebe", translation: "Leaf", phonetic: "Ay-bay" },
      { term: "Oha", translation: "Bush / Forest", phonetic: "O-ha" },
      { term: "Owa", translation: "House / Home", phonetic: "O-wa" },
      { term: "Ẹki", translation: "Market", phonetic: "Ay-kee" }
    ]
  },
  {
    category: "Animals",
    items: [
      { term: "Ekita", translation: "Dog", phonetic: "Ay-kee-ta" },
      { term: "Patọ", translation: "Cat", phonetic: "Pa-taw" },
      { term: "Ewe", translation: "Goat", phonetic: "Ay-way" },
      { term: "Ukhuọ", translation: "Sheep", phonetic: "Oo-khwaw" },
      { term: "Emela", translation: "Cow", phonetic: "Ay-may-la" },
      { term: "Esi", translation: "Horse", phonetic: "Ay-see" },
      { term: "Ọfẹn", translation: "Rat", phonetic: "Or-fen" },
      { term: "Erakhi", translation: "Bird", phonetic: "Ay-ra-khee" },
      { term: "Ẹnwẹ", translation: "Elephant", phonetic: "Ay-nway" },
      { term: "Ẹnyẹ", translation: "Snake", phonetic: "Ay-nyeh" },
      { term: "Ẹnni", translation: "Fish", phonetic: "Ay-nee" }
    ]
  },
  {
    category: "Action Verbs",
    items: [
      { term: "Rrie", translation: "Go", phonetic: "Ree-eh" },
      { term: "Rre", translation: "Come", phonetic: "Ray" },
      { term: "Re", translation: "Eat", phonetic: "Ray" },
      { term: "Da", translation: "Drink", phonetic: "Da" },
      { term: "Gha", translation: "Do", phonetic: "Gha" },
      { term: "Khian", translation: "Walk", phonetic: "Khyan" },
      { term: "Lẹ", translation: "Run", phonetic: "Lay" },
      { term: "Guan", translation: "Speak / Talk", phonetic: "Gwan" },
      { term: "Viẹ", translation: "Cry", phonetic: "Vyeh" },
      { term: "Yiẹ", translation: "Laugh", phonetic: "Yyeh" },
      { term: "Ho", translation: "See", phonetic: "Hor" },
      { term: "Họn", translation: "Hear", phonetic: "Hon" },
      { term: "Dẹ", translation: "Buy", phonetic: "Day" },
      { term: "Khiẹn", translation: "Sell", phonetic: "Khyen" },
      { term: "Gbe", translation: "Beat / Kill / Break", phonetic: "Gbay" },
      { term: "Rẹn", translation: "Know", phonetic: "Ren" },
      { term: "Miẹ", translation: "Find / Get / Receive", phonetic: "Myeh" },
      { term: "Tiẹ", translation: "Call / Read", phonetic: "Tyeh" },
      { term: "Khọ", translation: "Wash", phonetic: "Khor" }
    ]
  },
  {
    category: "Emotions & Adjectives",
    items: [
      { term: "Ọghọghọ", translation: "Happiness / Joy", phonetic: "Or-ghor-ghor" },
      { term: "Ẹkẹ", translation: "Sadness", phonetic: "Ay-kay" },
      { term: "Ifiẹ", translation: "Love", phonetic: "Ee-fyeh" },
      { term: "Ẹkpẹ", translation: "Fear", phonetic: "Ay-kpay" },
      { term: "Ọghọ", translation: "Anger", phonetic: "Or-ghor" },
      { term: "Ọmọzẹ", translation: "Beauty", phonetic: "Or-mor-zay" },
      { term: "Kherhe", translation: "Small", phonetic: "Khay-ray" },
      { term: "Ọkhua", translation: "Big", phonetic: "Or-khwa" },
      { term: "Ese", translation: "Good", phonetic: "Ay-say" },
      { term: "Dan", translation: "Bad", phonetic: "Dan" }
    ]
  },
  {
    category: "Everyday Phrases",
    items: [
      { term: "I rrie owa", translation: "I am going home", phonetic: "Ee ree-eh o-wa" },
      { term: "Vbọ ọre u dẹ?", translation: "What did you buy?", phonetic: "Vaw aw-ray oo day" },
      { term: "I rre kherhe rre", translation: "I'll be back shortly", phonetic: "Ee ray khay-ray ray" },
      { term: "Gbe evbare rre", translation: "Bring the food", phonetic: "Gbay ay-va-ray ray" },
      { term: "I ho rre ma", translation: "I want to see you", phonetic: "Ee hor ray ma" },
      { term: "Wẹ vbọ?", translation: "What about you?", phonetic: "Way vaw" },
      { term: "Igho ma rre", translation: "The money has come (I have money)", phonetic: "Ee-gho ma ray" },
      { term: "Eni mwen ọre...", translation: "My name is...", phonetic: "Ay-nee m-wen aw-ray" },
      { term: "Ma rrie", translation: "Let's go", phonetic: "Ma ree-eh" },
      { term: "I rẹn", translation: "I know", phonetic: "Ee ren" },
      { term: "I ma rẹn", translation: "I don't know", phonetic: "Ee ma ren" }
    ]
  },
  {
    category: "Culture & Religion",
    items: [
      { term: "Osanobua", translation: "God", phonetic: "O-sa-no-bwa" },
      { term: "Ẹrinmwin", translation: "Heaven / Spirit world", phonetic: "Ay-reen-mween" },
      { term: "Ọba", translation: "King", phonetic: "Or-ba" },
      { term: "Iyoba", translation: "Queen Mother", phonetic: "Ee-yor-ba" },
      { term: "Edo", translation: "Benin / Edo people", phonetic: "Ay-do" },
      { term: "Iha", translation: "Destiny / Fate", phonetic: "Ee-ha" },
      { term: "Ọbo", translation: "Blessing", phonetic: "Or-bor" }
    ]
  }
];
