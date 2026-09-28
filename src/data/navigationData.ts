import type { NavCategory } from '../types/index.ts';

export const defaultCategories: NavCategory[] = [
  {
    id: 'seeds',
    slug: 'seeds',
    name: 'Seeds',
    nameMr: 'बियाणे',
    image: '/assets/categories/seeds.png',
    icon: 'Sprout',
    shortDesc: 'Certified high-germination seed varieties',
    shortDescMr: 'प्रमाणित व उच्च उगवणक्षमता असलेली दर्जेदार बियाणे',
    highlight: false,
    featured: false,
    order: 1,
    active: true,
    subcategories: [
      {
        id: 'field-crops',
        name: 'Field Crop Seeds',
        nameMr: 'शेती पिके बियाणे (सोयाबीन, कापूस, गहू)',
        description: 'Certified seeds for major seasonal crops',
        descriptionMr: 'हंगामी मुख्य पिकांसाठी अधिकृत बियाणे'
      },
      {
        id: 'vegetable-seeds',
        name: 'Vegetable & Hybrid Seeds',
        nameMr: 'भाजीपाला व हायब्रिड बियाणे (कांदा, टोमॅटो)',
        description: 'High-yield commercial vegetable cultivars',
        descriptionMr: 'उत्कृष्ट उत्पादनासाठी प्रमाणित भाजीपाला बियाणे'
      },
      {
        id: 'forage-green-manure',
        name: 'Forage & Green Manure',
        nameMr: 'चारा व हिरवळीचे खत बियाणे (ताग, धैंचा)',
        description: 'Nutritious fodder and soil reviving green crops',
        descriptionMr: 'पशुधनासाठी पौष्टिक चारा व हिरवळीच्या खताचे बियाणे'
      }
    ]
  },
  {
    id: 'fertilizers',
    slug: 'fertilizers',
    name: 'Fertilizers',
    nameMr: 'रासायनिक खते व पोषण',
    image: '/assets/categories/fertilizers.png',
    icon: 'Wheat',
    shortDesc: 'Complete crop nutrition & water-soluble nutrients',
    shortDescMr: 'संपूर्ण पीक पोषण, विद्राव्य खते व सूक्ष्म अन्नद्रव्ये',
    highlight: false,
    featured: false,
    order: 2,
    active: true,
    subcategories: [
      {
        id: 'water-soluble',
        name: 'Water Soluble Fertilizers',
        nameMr: 'विद्राव्य खते (19:19:19, 0:52:34)',
        description: 'Drip grade NPK fertilizers for fast uptake',
        descriptionMr: 'ठिबकद्वारे द्यावयाची १००% विद्राव्य खते'
      },
      {
        id: 'micronutrients',
        name: 'Micronutrients & Chelated Minerals',
        nameMr: 'सूक्ष्म अन्नद्रव्ये (झिंक, बोरॉन, फेरस)',
        description: 'Essential trace minerals for deficiency correction',
        descriptionMr: 'पिकांमधील अन्नद्रव्यांची कमतरता भरून काढणारी खते'
      },
      {
        id: 'organic-bio',
        name: 'Organic & Bio-Fertilizers',
        nameMr: 'सेंद्रिय व जैविक खते',
        description: 'Eco-friendly soil enrichment inputs',
        descriptionMr: 'जमिनीची सुपीकता वाढवणारी जैविक खते'
      },
      {
        id: 'soil-conditioners',
        name: 'Soil Conditioners & Humic Extracts',
        nameMr: 'जमीन सुधारक व ह्युमिक ॲसिड',
        description: 'Root stimulants and soil structure improvers',
        descriptionMr: 'मुळांच्या जोमदार वाढीसाठी व जमिनीच्या सुधारणेसाठी'
      }
    ]
  },
  {
    id: 'crop-protection',
    slug: 'crop-protection',
    name: 'Crop Protection',
    nameMr: 'पीक संरक्षण (कीटकनाशके)',
    image: '/assets/categories/crop-protection.png',
    icon: 'ShieldCheck',
    shortDesc: 'Targeted pest, disease and weed control',
    shortDescMr: 'कीड, बुरशी व तणांचे खात्रीशीर नियंत्रण',
    highlight: false,
    featured: false,
    order: 3,
    active: true,
    subcategories: [
      {
        id: 'insecticides',
        name: 'Insecticides',
        nameMr: 'कीटकनाशके',
        description: 'Sucking pest and caterpillar management',
        descriptionMr: 'रसशोषक कीड व अळी नियंत्रणासाठी'
      },
      {
        id: 'fungicides',
        name: 'Fungicides & Bactericides',
        nameMr: 'बुरशीनाशके व जिवाणूनाशके',
        description: 'Preventive and curative disease remedies',
        descriptionMr: 'करपा, भुरी व बुरशीजन्य रोगांचे निवारण'
      },
      {
        id: 'herbicides',
        name: 'Herbicides & Weedicides',
        nameMr: 'तणनाशके',
        description: 'Pre and post-emergence weed solutions',
        descriptionMr: 'उगवणीपूर्वी व उगवणीनंतर तण नियंत्रणासाठी'
      },
      {
        id: 'bio-pesticides',
        name: 'Bio-Pesticides & Traps',
        nameMr: 'जैविक कीड नियंत्रक व सापळे',
        description: 'Eco-friendly integrated pest management',
        descriptionMr: 'कामगंध सापळे, चिकट सापळे व मित्रबुरशी'
      }
    ]
  },
  {
    id: 'combos',
    slug: 'combos',
    name: 'Special Combos & Ginger Care',
    nameMr: 'विशेष किट्स व आले पीक',
    image: '/assets/categories/combos.png',
    icon: 'Sparkles',
    shortDesc: 'Field-tested kits & ginger cultivation packages',
    shortDescMr: 'प्रत्यक्ष शेती अनुभवावर आधारित विशेष आले पीक पॅकेजेस',
    highlight: true,
    featured: true,
    order: 4,
    active: true,
    subcategories: [
      {
        id: 'ginger-rhizome-treatment',
        name: 'Ginger Sowing & Rhizome Kit',
        nameMr: 'आले बेणेप्रक्रिया व लागवड किट',
        description: 'Initial fungal and pest treatment for seed rhizomes',
        descriptionMr: 'लागवडीवेळी कंद प्रक्रिया व सुरुवातीच्या संरक्षणासाठी'
      },
      {
        id: 'ginger-rot-management',
        name: 'Rhizome Rot & Wilt Solutions',
        nameMr: 'आले कंदकुज व मर रोग व्यवस्थापन',
        description: 'Specialized curative packages for ginger root rot',
        descriptionMr: 'पावसाळ्यातील कंदकुज व खोडकिडा प्रतिबंधक विशेष किट'
      },
      {
        id: 'tillering-yield-booster',
        name: 'Tillering & Tuber Bulk Boosters',
        nameMr: 'फुटवे संख्या व कंद फुगवण किट',
        description: 'Micronutrient and biological growth promoters',
        descriptionMr: 'आले फुटव्यांची संख्या वाढवण्यासाठी व कंदाच्या फुगवणीसाठी'
      }
    ]
  }
];

export const navigationCategories: NavCategory[] = defaultCategories;
