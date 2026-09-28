import type { Product } from '../types/index.ts';

/**
 * BALIRAJA KRISHI SEVA KENDRA — Product Catalog Data Foundation
 * Category-wise initial product dataset referencing the 4 real product images per category folder:
 * - assets/products/seeds/ (seed_1.png to seed_4.png)
 * - assets/products/fertilizers/ (fertilizer_1.png to fertilizer_4.png)
 * - assets/products/crop_protection/ (crop_protection1.png to crop_protection4.png)
 * - assets/products/combokits/ (combokit_1.png to combokit_4.png)
 */
export const sampleProducts: Product[] = [
  // ── SEEDS (assets/products/seeds/) ──────────────────────────────────────
  {
    id: 'prod-seed-01',
    slug: 'katyayani-imd-70',
    nameEnglish: 'Katyayani IMD-70 (Imidacloprid 70% WG)',
    nameMarathi: 'कात्यायनी आयएमडी-७० (इमिडाक्लोप्रिड ७०% डब्ल्यूजी)',
    categoryId: 'seeds',
    subcategoryId: 'field-crops',
    descriptionEnglish: 'Systemic seed treatment and seedling crop protector formulation with Imidacloprid 70% WG.',
    descriptionMarathi: 'इमिडाक्लोप्रिड ७०% डब्ल्यूजी असलेले उच्च कार्यक्षम आंतरप्रवाही कीटकनाशक व बीजप्रक्रिया घटक.',
    image: '/assets/products/seeds/seed_1.png',
    price: 420,
    availability: 'available',
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      'Early stage protection against sucking pests',
      'Protects young seedlings from soil & foliar insects',
      'High active ingredient systemic formulation'
    ],
    keyPointsMarathi: [
      'रसशोषक किडींविरुद्ध सुरुवातीचे संरक्षण',
      'तरुण रोपांचे जमिनीतील व पानांवरील किडींपासून रक्षण',
      'उच्च प्रभावी आंतरप्रवाही घटक'
    ],
    suitableCropsEnglish: ['Cotton', 'Soybean', 'Chilli', 'Vegetables'],
    suitableCropsMarathi: ['कापूस', 'सोयाबीन', 'मिरची', 'भाजीपाला']
  },
  {
    id: 'prod-seed-02',
    slug: 'katyayani-nashak',
    nameEnglish: 'Katyayani Nashak (Fipronil 40% + Imidacloprid 40% WG)',
    nameMarathi: 'कात्यायनी नाशक (फिप्रोनिल ४०% + इमिडाक्लोप्रिड ४०% डब्ल्यूजी)',
    categoryId: 'seeds',
    subcategoryId: 'field-crops',
    descriptionEnglish: 'Dual active contact and systemic protection formulation for robust seedling establishment.',
    descriptionMarathi: 'रोपवाटिका व उगवण संरक्षणासाठी दुहेरी कार्यक्षम संपर्क व आंतरप्रवाही कीटकनाशक.',
    image: '/assets/products/seeds/seed_2.png',
    price: 680,
    availability: 'available',
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      'Combined dual action chemistry',
      'Fast root uptake and quick knockdown',
      'Extends protection across vegetative stages'
    ],
    keyPointsMarathi: [
      'दुहेरी रासायनिक घटकांची जोड',
      'मुळांवाटे त्वरित शोषण व जलद परिणाम',
      'शाकीय वाढीदरम्यान दीर्घकाळ संरक्षण'
    ],
    suitableCropsEnglish: ['Sugarcane', 'Cotton', 'Groundnut'],
    suitableCropsMarathi: ['ऊस', 'कापूस', 'भुईमूग']
  },
  {
    id: 'prod-seed-03',
    slug: 'katyayani-joker',
    nameEnglish: 'Katyayani Joker (Fipronil 80% WDG)',
    nameMarathi: 'कात्यायनी जोकर (फिप्रोनिल ८०% डब्ल्यूडीजी)',
    categoryId: 'seeds',
    subcategoryId: 'field-crops',
    descriptionEnglish: 'Advanced water dispersible granule insecticide for broad spectrum root and foliar protection.',
    descriptionMarathi: 'मुळांचे व पिकांचे रसशोषक किडींपासून संरक्षणासाठी आधुनिक डब्ल्यूडीजी कीटकनाशक.',
    image: '/assets/products/seeds/seed_3.png',
    price: 550,
    availability: 'available',
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      'Broad spectrum pest control',
      'Concentrated 80% WDG formulation',
      'Fosters healthy tillering and foliage'
    ],
    keyPointsMarathi: [
      'विविध किडींवर व्यापक नियंत्रण',
      '८०% एकाग्र दाणेदार स्वरूप',
      'जोमदार फुटवे व निरोगी पानांसाठी उपयुक्त'
    ],
    suitableCropsEnglish: ['Paddy', 'Chilli', 'Vegetables'],
    suitableCropsMarathi: ['भात', 'मिरची', 'भाजीपाला']
  },
  {
    id: 'prod-seed-04',
    slug: 'katyayani-fantastic',
    nameEnglish: 'Katyayani Fantastic (Chlorantraniliprole 0.4% GR)',
    nameMarathi: 'कात्यायनी फॅन्टॅस्टिक (क्लोरॲन्ट्रानिलीप्रोल ०.४% जीआर)',
    categoryId: 'seeds',
    subcategoryId: 'field-crops',
    descriptionEnglish: 'Granular soil application insecticide for long-lasting root zone security and stem borer management.',
    descriptionMarathi: 'खोडकिडा व जमिनीतील किडींच्या दीर्घकालीन नियंत्रणासाठी दाणेदार कीटकनाशक.',
    image: '/assets/products/seeds/seed_4.png',
    price: 720,
    availability: 'available',
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      'Extended residual control against borers',
      'Easy soil application granules',
      'Promotes deep root proliferation'
    ],
    keyPointsMarathi: [
      'खोडकिडीविरुद्ध दीर्घकाळ टिकाऊ परिणाम',
      'जमिनीत टाकण्यास सोपे दाणेदार स्वरूप',
      'मुळांच्या खोलवर वाढीस पूरक'
    ],
    suitableCropsEnglish: ['Paddy', 'Sugarcane', 'Maize'],
    suitableCropsMarathi: ['भात', 'ऊस', 'मका']
  },

  // ── FERTILIZERS (assets/products/fertilizers/) ──────────────────────────
  {
    id: 'prod-fert-01',
    slug: 'katyayani-pro-grow',
    nameEnglish: 'Katyayani PRO Grow (Gibberellic Acid 0.001% L)',
    nameMarathi: 'कात्यायनी प्रो ग्रो (जिबरेलिक ॲसिड ०.००१% एल)',
    categoryId: 'fertilizers',
    subcategoryId: 'soil-conditioners',
    descriptionEnglish: 'Plant growth regulator liquid promoting cell elongation, tillering, and vigorous vegetative development.',
    descriptionMarathi: 'पिकांची शाकीय वाढ, फुटवे आणि जोमदार वाढीस चालना देणारे वनस्पती वाढ नियंत्रक.',
    image: '/assets/products/fertilizers/fertilizer_1.png',
    price: 380,
    availability: 'available',
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      'Accelerates natural cell division & growth',
      'Enhances photosynthetic canopy efficiency',
      'Improves produce size and market appeal'
    ],
    keyPointsMarathi: [
      'नैसर्गिक पेशी विभाजन व वाढीस गती',
      'पानांमधील प्रकाशसंश्लेषण क्षमता वाढवते',
      'उत्पादनाचा आकार व चमक सुधारते'
    ],
    suitableCropsEnglish: ['Ginger', 'Grapes', 'Vegetables', 'Field Crops'],
    suitableCropsMarathi: ['आले', 'द्राक्षे', 'भाजीपाला', 'शेती पिके']
  },
  {
    id: 'prod-fert-02',
    slug: 'katyayani-bhannaat',
    nameEnglish: 'Katyayani Bhannaat Biostimulant',
    nameMarathi: 'कात्यायनी भन्नाट बायोस्टिम्युलंट',
    categoryId: 'fertilizers',
    subcategoryId: 'organic-bio',
    descriptionEnglish: 'Premium natural biostimulant formulation boosting metabolic rate, flower retention, and yield quality.',
    descriptionMarathi: 'फुलगळ रोखण्यासाठी, फुलोरा वाढवण्यासाठी व गुणवत्तापूर्ण उत्पादनासाठी प्रीमियम बायोस्टिम्युलंट.',
    image: '/assets/products/fertilizers/fertilizer_2.png',
    price: 650,
    availability: 'available',
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      'Reduces flower and young fruit drop',
      'Enhances nutrient uptake and plant vigor',
      'Improves crop stress tolerance'
    ],
    keyPointsMarathi: [
      'फुलगळ व फळगळ कमी करण्यास मदत',
      'अन्नद्रव्य शोषण व पिकाची ताकद वाढवते',
      'प्रतिकूल हवामानात पिकाचे रक्षण'
    ],
    suitableCropsEnglish: ['Cotton', 'Soybean', 'Chilli', 'Ginger'],
    suitableCropsMarathi: ['कापूस', 'सोयाबीन', 'मिरची', 'आले']
  },
  {
    id: 'prod-fert-03',
    slug: 'katyayani-mix-micronutrient-super',
    nameEnglish: 'Katyayani Mix Micronutrient-Super (100% Water Soluble)',
    nameMarathi: 'कात्यायनी मिक्स मायक्रोन्युट्रिएंट-सुपर (१००% विद्राव्य)',
    categoryId: 'fertilizers',
    subcategoryId: 'micronutrients',
    descriptionEnglish: 'Multi-element chelated trace mineral mixture for extensive controlled growth and deficiency correction.',
    descriptionMarathi: 'पिकांमधील सर्व सूक्ष्म अन्नद्रव्यांची कमतरता भरून काढणारे १००% विद्राव्य मायक्रोन्युट्रिएंट.',
    image: '/assets/products/fertilizers/fertilizer_3.png',
    price: 490,
    availability: 'available',
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      '100% drip and foliar soluble composition',
      'Corrects multiple trace mineral deficiencies',
      'Restores lush green foliage and vitality'
    ],
    keyPointsMarathi: [
      'ठिबक व फवारणीसाठी १००% विद्राव्य मिश्रण',
      'सूक्ष्म अन्नद्रव्यांची कमतरता त्वरित दूर करते',
      'पिकाला हिरवेगार व टवटवीत ठेवते'
    ],
    suitableCropsEnglish: ['All Field Crops', 'Horticulture', 'Vegetables'],
    suitableCropsMarathi: ['सर्व शेती पिके', 'फळबागा', 'भाजीपाला']
  },
  {
    id: 'prod-fert-04',
    slug: 'katyayani-zinc-sulphate-monohydrate',
    nameEnglish: 'Katyayani Zinc Sulphate Monohydrate 33%',
    nameMarathi: 'कात्यायनी झिंक सल्फेट मोनोहायड्रेट ३३%',
    categoryId: 'fertilizers',
    subcategoryId: 'micronutrients',
    descriptionEnglish: 'High purity concentrated Zinc 33% formulation for healthy green foliage and enzymatic enzyme activation.',
    descriptionMarathi: 'क्लोरोफिल निर्मिती व पिकांच्या निरोगी वाढीसाठी उच्च दर्जाचे ३३% झिंक सल्फेट खत.',
    image: '/assets/products/fertilizers/fertilizer_4.png',
    price: 260,
    availability: 'available',
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      'High concentrated Zinc (Zn 33%) + Sulphur (S 15%)',
      'Prevents yellowing and stunted internodes',
      'Essential for enzyme systems & chlorophyll'
    ],
    keyPointsMarathi: [
      'उच्च झिंक (३३%) व गंधक (१५%) प्रमाण',
      'पाने पिवळी पडणे व खुंटलेली वाढ रोखते',
      'हरितद्रव्य व संजीवक निर्मितीसाठी अत्यावश्यक'
    ],
    suitableCropsEnglish: ['Paddy', 'Maize', 'Wheat', 'Ginger'],
    suitableCropsMarathi: ['भात', 'मका', 'गहू', 'आले']
  },

  // ── PESTICIDES / CROP PROTECTION (assets/products/crop_protection/) ──────
  {
    id: 'prod-pest-01',
    slug: 'katyayani-garuda',
    nameEnglish: 'Katyayani Garuda (Bispyribac Sodium 10% SC)',
    nameMarathi: 'कात्यायनी गरुडा (बिस्परिबॅक सोडियम १०% एससी)',
    categoryId: 'crop-protection',
    subcategoryId: 'herbicides',
    descriptionEnglish: 'Broad spectrum post-emergence systemic herbicide targeting major grasses and broadleaf weeds.',
    descriptionMarathi: 'उगवणीनंतर गवताळ व रुंद पानांच्या तणांचे संपूर्ण निर्मूलन करणारे आंतरप्रवाही तणनाशक.',
    image: '/assets/products/crop_protection/crop_protection1.png',
    price: 580,
    availability: 'available',
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      'Selective post-emergence weed solution',
      'Fast systemic translocation to roots & foliage',
      'Safe on recommended crop stages'
    ],
    keyPointsMarathi: [
      'उगवणीनंतर वापरण्यासाठी निवडक तणनाशक',
      'मुळांपर्यंत जलद आंतरप्रवाही संचलन',
      'शिफारस केलेल्या पीक टप्प्यांवर पूर्णपणे सुरक्षित'
    ],
    suitableCropsEnglish: ['Paddy (Rice)', 'Nurseries'],
    suitableCropsMarathi: ['भात (धान)', 'रोपवाटिका']
  },
  {
    id: 'prod-pest-02',
    slug: 'katyayani-weed-killer',
    nameEnglish: 'Katyayani Weed Killer (Non-Selective Herbicide)',
    nameMarathi: 'कात्यायनी वीड किलर (बिननिवडक तणनाशक)',
    categoryId: 'crop-protection',
    subcategoryId: 'herbicides',
    descriptionEnglish: 'Fast-acting non-selective herbicide concentrate for bunds, orchards, and non-crop areas.',
    descriptionMarathi: 'बांधावरील व बागेतील सर्व प्रकारच्या कठीण तणांच्या त्वरित नियंत्रणासाठी बिननिवडक तणनाशक.',
    image: '/assets/products/crop_protection/crop_protection2.png',
    price: 340,
    availability: 'available',
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      'Controls annual & perennial stubborn weeds',
      'Ideal for farm borders, bunds & prep tillage',
      'Complete foliage and root desiccation'
    ],
    keyPointsMarathi: [
      'कठीण व बहुवर्षीय तणांवर रामबाण उपाय',
      'शेताचे बांध, पडीक जमीन व पूर्वमशागतीसाठी योग्य',
      'तणांची पाने व मुळे संपूर्ण सुकून नष्ट होतात'
    ],
    suitableCropsEnglish: ['Orchards', 'Field Bunds', 'Fallow Land'],
    suitableCropsMarathi: ['फळबागा', 'शेताचे बांध', 'पडीक जमीन']
  },
  {
    id: 'prod-pest-03',
    slug: 'katyayani-clearance',
    nameEnglish: 'Katyayani Clearance (Paraquat Dichloride 24% SL)',
    nameMarathi: 'कात्यायनी क्लिअरन्स (पॅराक्वॉट डायक्लोराईड २४% एसएल)',
    categoryId: 'crop-protection',
    subcategoryId: 'herbicides',
    descriptionEnglish: 'Quick knockdown contact herbicide destroying all sprayed green foliage within hours.',
    descriptionMarathi: 'संपर्कात येणाऱ्या हिरव्या पानांचा काही तासांत नायनाट करणारे त्वरित परिणामकारक तणनाशक.',
    image: '/assets/products/crop_protection/crop_protection3.png',
    price: 410,
    availability: 'available',
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      'Ultra-fast contact burn down action',
      'Rainfast within 30 minutes of application',
      'Inactivated immediately upon soil contact'
    ],
    keyPointsMarathi: [
      'काही तासांत तण जाळण्याची अत्यंत वेगवान क्षमता',
      'फवारणीनंतर ३० मिनिटांत पावसाचा परिणाम नाही',
      'मातीत पडताच निष्क्रिय होणारे सुरक्षित तंत्रज्ञान'
    ],
    suitableCropsEnglish: ['Tea', 'Coffee', 'Orchards', 'Non-Crop Bunds'],
    suitableCropsMarathi: ['फळबागा', 'तण नियंत्रण', 'शेती बांध']
  },
  {
    id: 'prod-pest-04',
    slug: 'katyayani-lemar-surfactant',
    nameEnglish: 'Katyayani Lemar + Surfactant (Tembotrione 34.4% SC)',
    nameMarathi: 'कात्यायनी लेमार + सरफॅक्टंट (टेम्बोट्रिओन ३४.४% एससी)',
    categoryId: 'crop-protection',
    subcategoryId: 'herbicides',
    descriptionEnglish: 'Advanced selective maize weed control combo pack with dedicated penetration surfactant.',
    descriptionMarathi: 'मका पिकासाठी सुरक्षित व सर्व तणांचा खात्रीशीर बंदोबस्त करणारा विशेष कॉम्बो पॅक.',
    image: '/assets/products/crop_protection/crop_protection4.png',
    price: 950,
    availability: 'out_of_stock',
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      'Selective herbicide specifically for maize',
      'Dedicated surfactant enhances leaf penetration',
      'Destroys broadleaf & grassy weeds simultaneously'
    ],
    keyPointsMarathi: [
      'मका पिकासाठी विशेष निवडक तणनाशक',
      'सरफॅक्टंटमुळे तणांच्या पानांमध्ये जलद शोषण',
      'रुंद व अरुंद दोन्ही प्रकारच्या तणांवर प्रभावी'
    ],
    suitableCropsEnglish: ['Maize (Corn)'],
    suitableCropsMarathi: ['मका']
  },

  // ── COMBO KITS (assets/products/combokits/) ──────────────────────────────
  {
    id: 'prod-combo-01',
    slug: 'paddy-trishul-combo',
    nameEnglish: 'Paddy Trishul Combo (Insecticide + Humic + Zinc)',
    nameMarathi: 'भात त्रिशूळ विशेष कॉम्बो (कीटकनाशक + ह्युमिक + झिंक)',
    categoryId: 'combos',
    subcategoryId: 'ginger-rhizome-treatment',
    descriptionEnglish: 'Complete 3-way protection & nutrition package for healthy tillering, pest defense, and root proliferation in paddy.',
    descriptionMarathi: 'भात पिकातील फुटवे वाढ, किडींपासून संरक्षण व मुळांच्या जोमदार वाढीसाठी त्रिसूत्री कॉम्बो पॅक.',
    image: '/assets/products/combokits/combokit_1.png',
    price: 1450,
    availability: 'available',
    featured: true,
    displayOrder: 1,
    isSample: false,
    keyPointsEnglish: [
      '3-in-1 synergy: Insect defense + Humic root growth + Zinc nutrition',
      'Specially balanced for high-yield paddy fields',
      'Protects young tillers and promotes uniform stand'
    ],
    keyPointsMarathi: [
      '३-इन-१ त्रिसूत्री: कीड संरक्षण + ह्युमिक मुळवाढ + झिंक पोषण',
      'भात शेतीत विक्रमी उत्पादनासाठी संतुलित संयोजन',
      'नवीन फुटव्यांचे रक्षण करून एकसारखी वाढ देते'
    ],
    suitableCropsEnglish: ['Paddy (Rice)'],
    suitableCropsMarathi: ['भात (धान)']
  },
  {
    id: 'prod-combo-02',
    slug: 'katyayani-soybean-all-in-one-combo',
    nameEnglish: 'Katyayani Soybean All In One Combo',
    nameMarathi: 'कात्यायनी सोयाबीन ऑल इन वन कॉम्बो',
    categoryId: 'combos',
    subcategoryId: 'tillering-yield-booster',
    descriptionEnglish: 'Comprehensive seasonal package covering nutrition, disease defense, flower booster, and pod development.',
    descriptionMarathi: 'सोयाबीन पिकाचे संपूर्ण पोषण, रोग प्रतिबंध, फुलोरा वाढ व दाणे भरणीसाठी परिपूर्ण पॅकेज.',
    image: '/assets/products/combokits/combokit_2.png',
    price: 2100,
    availability: 'available',
    featured: true,
    displayOrder: 2,
    isSample: false,
    keyPointsEnglish: [
      'All-in-one complete soybean crop protection & nourishment',
      'Contains Bloom Booster, Humic 98%, Fungicide & Water Soluble NPK',
      'Maximizes pod formation and test grain weight'
    ],
    keyPointsMarathi: [
      'सोयाबीनसाठी सर्वसमावेशक पीक संरक्षण व पोषण किट',
      'ब्लूम बूस्टर, ह्युमिक ९८%, बुरशीनाशक व विद्राव्य खतांचा समावेश',
      'शेंगांची संख्या व दाण्यांचे वजन वाढवण्यास मदत'
    ],
    suitableCropsEnglish: ['Soybean'],
    suitableCropsMarathi: ['सोयाबीन']
  },
  {
    id: 'prod-combo-03',
    slug: 'katyayani-cotton-1st-spray-combo',
    nameEnglish: 'Katyayani Cotton 1st Spray Combo (15-25 Days)',
    nameMarathi: 'कात्यायनी कापूस पहिली फवारणी कॉम्बो (१५-२५ दिवस)',
    categoryId: 'combos',
    subcategoryId: 'tillering-yield-booster',
    descriptionEnglish: 'Early stage cotton management package defending young foliage from sucking pests with bio-stimulants.',
    descriptionMarathi: 'कापसाच्या १५ ते २५ दिवसांच्या सुरुवातीच्या काळात रसशोषक किडींचे नियंत्रण व जोमदार शाकीय वाढीसाठी किट.',
    image: '/assets/products/combokits/combokit_3.png',
    price: 1250,
    availability: 'available',
    featured: true,
    displayOrder: 3,
    isSample: false,
    keyPointsEnglish: [
      'Formulated specifically for 15-25 day young cotton crop',
      'Protects from thrips, jassids, aphids and whiteflies',
      'Seaweed extract + Spreader for rapid vegetative growth'
    ],
    keyPointsMarathi: [
      '१५ ते २५ दिवसांच्या कोवळ्या कपाशीसाठी खास तयार केलेली किट',
      'थ्रिप्स, मावा, तुडतुडे व पांढरी माशीपासून संपूर्ण रक्षण',
      'सीवीड अर्क व स्प्रेडरमुळे पानांची जोमदार वाढ'
    ],
    suitableCropsEnglish: ['Cotton'],
    suitableCropsMarathi: ['कापूस']
  },
  {
    id: 'prod-combo-04',
    slug: 'katyayani-paddy-1st-spray-combo',
    nameEnglish: 'Katyayani Paddy 1st Spray Combo (12-20 Days)',
    nameMarathi: 'कात्यायनी भात पहिली फवारणी कॉम्बो (१२-२० दिवस)',
    categoryId: 'combos',
    subcategoryId: 'ginger-rot-management',
    descriptionEnglish: 'Early vegetative paddy booster bundle providing rapid root anchoring, NPK 19:19:19, and fungal protection.',
    descriptionMarathi: 'भात रोपांच्या पुनर्लागवडीनंतर मुळांची घट्ट पकड, फुटव्यांची संख्या आणि पोषण देणारा सुरुवातीचा कॉम्बो.',
    image: '/assets/products/combokits/combokit_4.png',
    price: 1350,
    availability: 'available',
    featured: false,
    displayOrder: 4,
    isSample: false,
    keyPointsEnglish: [
      '12-20 days transplantation recovery and fast rooting kit',
      'Includes NPK 19:19:19, Biostimulant, Systemic Fungicide & Spreader',
      'Boosts tiller count and prevents early blast'
    ],
    keyPointsMarathi: [
      'पुनर्लागवडीनंतर १२ ते २० दिवसांत मुळे रुजवणारी विशेष किट',
      '१९:१९:१९ खत, बायोस्टिम्युलंट, बुरशीनाशक व स्प्रेडरचा समावेश',
      'फुटवे वाढवून करपा रोगापासून सुरुवातीचे संरक्षण'
    ],
    suitableCropsEnglish: ['Paddy'],
    suitableCropsMarathi: ['भात']
  },

  // ── BESTSELLER PRODUCTS (assets/products/best_seller/) ───────────────────
  {
    id: 'prod-best-01',
    slug: 'katyayani-anti-virus',
    nameEnglish: 'Katyayani Anti Virus (Broad Spectrum Organic Viricide)',
    nameMarathi: 'कात्यायनी अँटी व्हायरस (सेंद्रिय विषाणूनाशक)',
    categoryId: 'crop-protection',
    subcategoryId: 'bio-pesticides',
    descriptionEnglish: 'Broad spectrum organic viricide formulation preventing and curing viral infections like mosaic and leaf curl.',
    descriptionMarathi: 'पिकांवरील मोझॅक, चुरडा-मुरडा व विषाणूजन्य रोगांचे प्रभावी नियंत्रण करणारे सेंद्रिय औषध.',
    image: '/assets/products/best_seller/AntiVirus_75248f94-8de8-47c9-9592-a7aa49e36eeb.webp',
    price: 680,
    availability: 'available',
    featured: true,
    isBestseller: true,
    popularity: 98,
    displayOrder: 101,
    isSample: false,
    keyPointsEnglish: [
      'Certified organic plant viricide',
      'Stops viral multiplication and leaf curl damage',
      'Restores active growth in infected shoots'
    ],
    keyPointsMarathi: [
      'प्रमाणित सेंद्रिय विषाणू प्रतिबंधक',
      'व्हायरसचा प्रसार व पानांचा चुरडा-मुरडा रोखते',
      'बाधित शेंड्यांमध्ये नवीन निरोगी फूट आणते'
    ],
    suitableCropsEnglish: ['Chilli', 'Papaya', 'Tomato', 'Soybean', 'Okra'],
    suitableCropsMarathi: ['मिरची', 'पपई', 'टोमॅटो', 'सोयाबीन', 'भेंडी']
  },
  {
    id: 'prod-best-02',
    slug: 'katyayani-chakraveer',
    nameEnglish: 'Katyayani Chakraveer (Chlorantraniliprole 18.5% SC)',
    nameMarathi: 'कात्यायनी चक्रवीर (क्लोरॲन्ट्रानिलीप्रोल १८.५% एससी)',
    categoryId: 'crop-protection',
    subcategoryId: 'insecticides',
    descriptionEnglish: 'Premium broad spectrum insecticide delivering long-lasting protection against caterpillars, bollworms and borers.',
    descriptionMarathi: 'बोंडअळी, खोडकिडा व सर्व प्रकारच्या अळ्यांवर दीर्घकाळ नियंत्रण देणारे आधुनिक कीटकनाशक.',
    image: '/assets/products/best_seller/ChakraveerNewMockup.webp',
    price: 850,
    availability: 'available',
    featured: true,
    isBestseller: true,
    popularity: 95,
    displayOrder: 102,
    isSample: false,
    keyPointsEnglish: [
      'Advanced ryanodine receptor activator',
      'Extremely low dosage with rainfast performance',
      'Safe for beneficial natural predators'
    ],
    keyPointsMarathi: [
      'आधुनिक तंत्रज्ञानावर आधारित अळीनाशक',
      'कमी प्रमाणात दीर्घकाळ परिणामकारक',
      'फवारणीनंतर पाऊस आला तरी धुवून जात नाही'
    ],
    suitableCropsEnglish: ['Cotton', 'Paddy', 'Sugarcane', 'Soybean', 'Vegetables'],
    suitableCropsMarathi: ['कापूस', 'भात', 'ऊस', 'सोयाबीन', 'भाजीपाला']
  },
  {
    id: 'prod-best-03',
    slug: 'katyayani-chakrawarti',
    nameEnglish: 'Katyayani Chakrawarti (Thiamethoxam 12.6% + Lambda 9.5% ZC)',
    nameMarathi: 'कात्यायनी चक्रवर्ती (थायमेथोक्सम १२.६% + लॅम्बडा ९.५% झेडसी)',
    categoryId: 'crop-protection',
    subcategoryId: 'insecticides',
    descriptionEnglish: 'Synergistic systemic and contact insecticide effectively controlling sucking pests and chewing insects.',
    descriptionMarathi: 'रसशोषक किडी व अळ्यांवर दुहेरी वार करणारे शक्तिशाली आंतरप्रवाही व स्पर्शजन्य कीटकनाशक.',
    image: '/assets/products/best_seller/chakrawarti_7.webp',
    price: 760,
    availability: 'available',
    featured: true,
    isBestseller: true,
    popularity: 92,
    displayOrder: 103,
    isSample: false,
    keyPointsEnglish: [
      'Dual-mode ZC capsule suspension technology',
      'Knockdown contact + long residual systemic defense',
      'Effective against jassids, aphids, thrips and bollworms'
    ],
    keyPointsMarathi: [
      'कॅप्सूल सस्पेन्शन (झेडसी) प्रगत तंत्रज्ञान',
      'त्वरित स्पर्शजन्य परिणाम व आंतरप्रवाही टिकाऊपणा',
      'तुडतुडे, मावा, थ्रिप्स व बोंडअळीवर एकाच वेळी प्रभावी'
    ],
    suitableCropsEnglish: ['Cotton', 'Groundnut', 'Soybean', 'Chilli'],
    suitableCropsMarathi: ['कापूस', 'भुईमूग', 'सोयाबीन', 'मिरची']
  },
  {
    id: 'prod-best-04',
    slug: 'katyayani-shikaar',
    nameEnglish: 'Katyayani Shikaar (Acephate 75% SP)',
    nameMarathi: 'कात्यायनी शिकार (ॲसफेट ७५% एसपी)',
    categoryId: 'crop-protection',
    subcategoryId: 'insecticides',
    descriptionEnglish: 'Rapid action soluble powder insecticide targeting thrips, jassids, aphids and caterpillars.',
    descriptionMarathi: 'मावा, तुडतुडे, थ्रिप्स व विविध किडींचा तत्काळ खात्मा करणारे पाण्यात विद्राव्य कीटकनाशक.',
    image: '/assets/products/best_seller/katyayani-shikaar-acephate-75-sp.webp',
    price: 480,
    availability: 'available',
    featured: true,
    isBestseller: true,
    popularity: 90,
    displayOrder: 104,
    isSample: false,
    keyPointsEnglish: [
      'Proven organophosphate systemic chemistry',
      'Rapid foliar penetration and kill',
      'High compatibility in tank mixes'
    ],
    keyPointsMarathi: [
      'शेतकऱ्यांचे खात्रीशीर आंतरप्रवाही कीटकनाशक',
      'पानांमध्ये जलद शोषून किडींचा नाश',
      'इतर औषधांसोबत मिसळण्यास सुलभ'
    ],
    suitableCropsEnglish: ['Cotton', 'Paddy', 'Vegetables'],
    suitableCropsMarathi: ['कापूस', 'भात', 'भाजीपाला']
  },
  {
    id: 'prod-best-05',
    slug: 'soybean-yellow-mosaic-combo',
    nameEnglish: 'Katyayani Soybean Yellow Mosaic Virus Control Combo',
    nameMarathi: 'कात्यायनी सोयाबीन पिवळा मोझॅक व्हायरस नियंत्रण कॉम्बो',
    categoryId: 'combos',
    subcategoryId: 'tillering-yield-booster',
    descriptionEnglish: 'Specialized 3-product kit controlling whiteflies and curing yellow mosaic viral transmission in soybean.',
    descriptionMarathi: 'सोयाबीनवरील पांढरी माशी नियंत्रण व पिवळा मोझॅक रोगावर मात करणारा ३ औषधांचा विशेष कॉम्बो संच.',
    image: '/assets/products/best_seller/SoybeanYellowMosaicVirusControlCombo.webp',
    price: 1850,
    availability: 'available',
    featured: true,
    isBestseller: true,
    popularity: 96,
    displayOrder: 105,
    isSample: false,
    keyPointsEnglish: [
      'Combines Anti Virus viricide + Dualfen insecticide + Catalyser spreader',
      'Eradicates whitefly vectors while treating leaf yellowing',
      'Proven recovery in extensive field trials'
    ],
    keyPointsMarathi: [
      'अँटी व्हायरस + ड्युएलफेन कीटकनाशक + कॅटलायझर स्प्रेडरचे संयोजन',
      'पांढऱ्या माशीचा बंदोबस्त करून पानांचा पिवळेपणा थांबवते',
      'शेतकऱ्यांच्या शेतात खात्रीशीर सुधारणा'
    ],
    suitableCropsEnglish: ['Soybean', 'Blackgram (Urad)', 'Greengram (Moong)'],
    suitableCropsMarathi: ['सोयाबीन', 'उडीद', 'मूग']
  },
  {
    id: 'prod-best-06',
    slug: 'katyayani-triple-attack',
    nameEnglish: 'Katyayani Triple Attack (Bio Insecticide Trio)',
    nameMarathi: 'कात्यायनी ट्रिपल अटॅक (जैविक कीटकनाशक)',
    categoryId: 'crop-protection',
    subcategoryId: 'bio-pesticides',
    descriptionEnglish: 'High potency consortium of Verticillium, Beauveria, and Metarhizium for biological pest management.',
    descriptionMarathi: 'व्हर्टिसिलियम, बिव्हेरिया व मेटारायझियमचे मित्रबुरशी युक्त सेंद्रिय जैविक कीड नियंत्रक.',
    image: '/assets/products/best_seller/Triple_attack_1_2.webp',
    price: 620,
    availability: 'available',
    featured: false,
    isBestseller: true,
    popularity: 88,
    displayOrder: 106,
    isSample: false,
    keyPointsEnglish: [
      '3-in-1 biological fungal formulation with high CFU count',
      'Safe for export crops and residue-free harvesting',
      'Effective against root grubs, thrips, and mealybugs'
    ],
    keyPointsMarathi: [
      '३-इन-१ मित्रबुरशींचे नैसर्गिक जैविक मिश्रण',
      'निर्यातक्षम व अवशिष्ट अंशमुक्त शेतीसाठी सुरक्षित',
      'हुमणी, थ्रिप्स, मिलीबग व रसशोषक किडींवर प्रभावी'
    ],
    suitableCropsEnglish: ['Sugarcane', 'Ginger', 'Turmeric', 'Pomegranate', 'Grapes'],
    suitableCropsMarathi: ['ऊस', 'आले', 'हळद', 'डाळिंब', 'द्राक्षे']
  },
  {
    id: 'prod-best-07',
    slug: 'katyayani-bhumiraja',
    nameEnglish: 'Katyayani Bhumiraja (VAM Bio Fertilizer)',
    nameMarathi: 'कात्यायनी भूमिराजा (मायकोरायझा जैविक खत)',
    categoryId: 'fertilizers',
    subcategoryId: 'organic-bio',
    descriptionEnglish: 'Root inoculant VAM mycorrhiza bio-fertilizer dramatically increasing nutrient and moisture absorbing root area.',
    descriptionMarathi: 'मुळांचे जाळे व कार्यक्षेत्र अनेक पटींनी वाढवणारे मायकोरायझा युक्त सेंद्रिय जैविक खत.',
    image: '/assets/products/best_seller/kattap_bag_1.webp',
    price: 520,
    availability: 'available',
    featured: true,
    isBestseller: true,
    popularity: 94,
    displayOrder: 107,
    isSample: false,
    keyPointsEnglish: [
      'Enriched with Vesicular Arbuscular Mycorrhiza spores',
      'Expands root surface area by up to 10 times',
      'Maximizes phosphorus and micro-element uptake from soil'
    ],
    keyPointsMarathi: [
      'सक्रिय मायकोरायझा जिवाणूंनी समृद्ध',
      'मुळांची अन्नद्रव्य शोषण कक्षा १० पटींपर्यंत वाढवते',
      'जमिनीतील स्थिर फॉस्फरस व सूक्ष्मद्रव्ये पिकाला मिळवून देते'
    ],
    suitableCropsEnglish: ['Sugarcane', 'Ginger', 'Cotton', 'Soybean', 'Vegetables'],
    suitableCropsMarathi: ['ऊस', 'आले', 'कापूस', 'सोयाबीन', 'भाजीपाला']
  },
  {
    id: 'prod-best-08',
    slug: 'katyayani-imd-super',
    nameEnglish: 'Katyayani IMD Super (Imidacloprid 17.8% SL)',
    nameMarathi: 'कात्यायनी आयएमडी सुपर (इमिडाक्लोप्रिड १७.८% एसएल)',
    categoryId: 'crop-protection',
    subcategoryId: 'insecticides',
    descriptionEnglish: 'Trusted systemic insecticide for comprehensive protection against aphids, jassids, and sucking insects.',
    descriptionMarathi: 'रसशोषक किडींवर दीर्घकालीन नियंत्रण देणारे शेतकऱ्यांचे विश्वासू आंतरप्रवाही कीटकनाशक.',
    image: '/assets/products/best_seller/IMD_3__11zon.webp',
    price: 390,
    availability: 'available',
    featured: false,
    isBestseller: true,
    popularity: 85,
    displayOrder: 108,
    isSample: false,
    keyPointsEnglish: [
      'Fast systemic uptake through foliar spray',
      'Reliable defense against sucking pest complexes',
      'Economical per-acre treatment cost'
    ],
    keyPointsMarathi: [
      'पानांवाटे जलद शोषण व कीड निर्मूलन',
      'रसशोषक किडींवर दीर्घकालीन संरक्षण',
      'किफायतशीर व शेतकऱ्यांच्या पसंतीस उतरलेले'
    ],
    suitableCropsEnglish: ['Cotton', 'Paddy', 'Chilli', 'Okra'],
    suitableCropsMarathi: ['कापूस', 'भात', 'मिरची', 'भेंडी']
  },
  {
    id: 'prod-best-09',
    slug: 'katyayani-imida-protect',
    nameEnglish: 'Katyayani Imida Protect (Imidacloprid 30.5% SC)',
    nameMarathi: 'कात्यायनी इमिडा प्रोटेक्ट (इमिडाक्लोप्रिड ३०.५% एससी)',
    categoryId: 'seeds',
    subcategoryId: 'field-crops',
    descriptionEnglish: 'Suspension concentrate formulation ideal for seed dressing and termite protection.',
    descriptionMarathi: 'वाळवी व सुरुवातीच्या किडींपासून संरक्षणासाठी प्रमाणित बियाणे प्रक्रिया व फवारणी औषध.',
    image: '/assets/products/best_seller/IMIDA_4.webp',
    price: 510,
    availability: 'available',
    featured: false,
    isBestseller: true,
    popularity: 89,
    displayOrder: 109,
    isSample: false,
    keyPointsEnglish: [
      'Concentrated SC formulation for seed treatment',
      'Shields seedlings against subterranean termites',
      'Ensures uniform and healthy seed emergence'
    ],
    keyPointsMarathi: [
      'बीजप्रक्रियेसाठी खास एससी स्वरूप',
      'जमिनीतील वाळवी व किडींपासून कोवळ्या रोपांचे रक्षण',
      'उगवण क्षमता व रोपांची ताकद वाढवते'
    ],
    suitableCropsEnglish: ['Sugarcane', 'Cotton', 'Wheat', 'Soybean'],
    suitableCropsMarathi: ['ऊस', 'कापूस', 'गहू', 'सोयाबीन']
  }
];
