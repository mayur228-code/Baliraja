import React, { useState } from 'react';
import type { FC } from 'react';
import { 
  Calculator, 
  Sprout, 
  FlaskConical, 
  Droplets, 
  Coins, 
  TrendingUp, 
  SprayCan, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle2, 
  Info, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Sparkles
} from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../data/translations';

interface AgriCalculatorsProps {
  lang: Language;
}

export type CalcType = 'seed' | 'fertilizer' | 'water' | 'cost' | 'profit' | 'spray';
export type LandUnit = 'acre' | 'guntha' | 'hectare';

// Helper for Area conversion to Acres
const toAcres = (area: number, unit: LandUnit): number => {
  if (!area || isNaN(area) || !isFinite(area) || area <= 0) return 0;
  if (unit === 'acre') return area;
  if (unit === 'guntha') return area / 40; // 40 Gunthas = 1 Acre
  if (unit === 'hectare') return area * 2.47105; // 1 Hectare ≈ 2.471 Acres
  return area;
};

// Seed Calculator presets
interface SeedCropPreset {
  id: string;
  nameMr: string;
  nameEn: string;
  defaultRate: number; // rate per acre
  unitMr: string;
  unitEn: string;
  bagSize?: number;
  bagLabelMr?: string;
  bagLabelEn?: string;
  methodMr: string;
  methodEn: string;
  treatmentTipMr: string;
  treatmentTipEn: string;
}

const SEED_PRESETS: SeedCropPreset[] = [
  {
    id: 'soybean',
    nameMr: 'सोयाबीन (Soybean)',
    nameEn: 'Soybean',
    defaultRate: 30,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 30,
    bagLabelMr: '३० किलोची पोती',
    bagLabelEn: '30 kg Bags',
    methodMr: 'पेरणी (Row Sowing - BBF पद्धत)',
    methodEn: 'Row Sowing (BBF Method)',
    treatmentTipMr: 'पेरणीपूर्वी ७०%+ उगवणक्षमता तपासा. ट्रायकोडर्मा किंवा बुरशीनाशकाची बीजप्रक्रिया अवश्य करा.',
    treatmentTipEn: 'Ensure >70% germination test. Treat seeds with Trichoderma or fungicide before sowing.'
  },
  {
    id: 'cotton',
    nameMr: 'कापूस / बीटी कॉटन (Cotton)',
    nameEn: 'Cotton (Bt Cotton)',
    defaultRate: 2,
    unitMr: 'पाकिटे (Packets)',
    unitEn: 'Packets (450g)',
    bagSize: 1,
    bagLabelMr: 'पाकिटे (४५० ग्रॅम)',
    bagLabelEn: 'Packets (450g each)',
    methodMr: 'टोकण पद्धत (Dibbling - ४×१.५ किंवा ५×१.५ फूट)',
    methodEn: 'Dibbling (4x1.5 or 5x1.5 ft spacing)',
    treatmentTipMr: 'कमी अंतरावर लागवड करताना शिफारशीनुसार टोकण करा. बियाण्यासोबतचे नॉन-बीटी बियाणे सीमेवर लावा.',
    treatmentTipEn: 'Maintain recommended spacing. Plant non-Bt refuge seeds along field borders.'
  },
  {
    id: 'jowar',
    nameMr: 'ज्वारी (Jowar / Jwar)',
    nameEn: 'Jowar / Sorghum',
    defaultRate: 4,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 4,
    bagLabelMr: '४ किलोची पिशवी',
    bagLabelEn: '4 kg Bags',
    methodMr: 'पेरणी / टोकण (४५×१५ सें.मी.)',
    methodEn: 'Line Sowing (45x15 cm)',
    treatmentTipMr: 'सल्फर ४ ग्रॅम + अझोटोबॅक्टर व पीएसबी २५ ग्रॅम प्रति किलो बियाण्यास चोळावे.',
    treatmentTipEn: 'Treat with Sulphur 4g/kg + Azotobacter & PSB 25g/kg bio-fertilizers.'
  },
  {
    id: 'bajra',
    nameMr: 'बाजरी (Bajra)',
    nameEn: 'Bajra / Pearl Millet',
    defaultRate: 1.5,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 1.5,
    bagLabelMr: '१.५ किलो पॅकेट',
    bagLabelEn: '1.5 kg Packets',
    methodMr: 'पेरणी / टोकण (४५×१५ सें.मी.)',
    methodEn: 'Line Sowing / Dibbling (45x15 cm)',
    treatmentTipMr: 'अॅझोस्पिरीलम व पीएसबी २५ ग्रॅम प्रति किलो बियाण्यास चोळावे.',
    treatmentTipEn: 'Treat seeds with Azospirillum + PSB (25g/kg) bio-fertilizers.'
  },
  {
    id: 'rajma',
    nameMr: 'राजमा (Rajma)',
    nameEn: 'Rajma / French Bean',
    defaultRate: 35,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 30,
    bagLabelMr: '३० किलोची पोती',
    bagLabelEn: '30 kg Bags',
    methodMr: 'पेरणी (४५×१० सें.मी.)',
    methodEn: 'Line Sowing (45x10 cm)',
    treatmentTipMr: 'ट्रायकोडर्मा ५ ग्रॅम + रायझोबियम व पीएसबी २५ ग्रॅम प्रति किलो चोळावे.',
    treatmentTipEn: 'Treat with Trichoderma 5g + Rhizobium & PSB 25g/kg.'
  },
  {
    id: 'tur',
    nameMr: 'तूर / अरहर (Tur / Arhar)',
    nameEn: 'Tur / Pigeon Pea',
    defaultRate: 4.5,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 5,
    bagLabelMr: '५ किलो पॅक',
    bagLabelEn: '5 kg Packs',
    methodMr: 'सलग / आंतरपीक टोकण (Dibbling)',
    methodEn: 'Dibbling / Intercrop',
    treatmentTipMr: 'तूर बियाण्यास ट्रायकोडर्मा व रायझोबियमची प्रक्रिया करून योग्य अंतरावर टोकण करावे.',
    treatmentTipEn: 'Treat with Trichoderma & Rhizobium culture for wilt resistance and nodulation.'
  },
  {
    id: 'moong',
    nameMr: 'मूग (Moong)',
    nameEn: 'Moong / Green Gram',
    defaultRate: 6,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 5,
    bagLabelMr: '५ किलोची पिशवी',
    bagLabelEn: '5 kg Bags',
    methodMr: 'पेरणी (३०×१० सें.मी.)',
    methodEn: 'Line Sowing (30x10 cm)',
    treatmentTipMr: 'ट्रायकोडर्मा ५ ग्रॅम + रायझोबियम व पीएसबी जिवाणू संवर्धक २५ ग्रॅम लावावे.',
    treatmentTipEn: 'Treat with Trichoderma 5g + Rhizobium & PSB culture 25g/kg.'
  },
  {
    id: 'udid',
    nameMr: 'उडीद (Udid / Black Gram)',
    nameEn: 'Udid / Black Gram',
    defaultRate: 6,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 5,
    bagLabelMr: '५ किलोची पिशवी',
    bagLabelEn: '5 kg Bags',
    methodMr: 'पेरणी (३०×१० सें.मी.)',
    methodEn: 'Line Sowing (30x10 cm)',
    treatmentTipMr: 'ट्रायकोडर्मा ५ ग्रॅम + रायझोबियम व पीएसबी जिवाणू संवर्धक २५ ग्रॅम लावावे.',
    treatmentTipEn: 'Treat with Trichoderma 5g + Rhizobium & PSB culture 25g/kg.'
  },
  {
    id: 'gram',
    nameMr: 'हरभरा / चणा (Gram / Chana)',
    nameEn: 'Gram / Chickpea (Chana)',
    defaultRate: 30,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 30,
    bagLabelMr: '३० किलोची पोती',
    bagLabelEn: '30 kg Bags',
    methodMr: 'पेरणी / टोकण (Line Sowing)',
    methodEn: 'Line Sowing (30x10 cm)',
    treatmentTipMr: 'रायझोबियम + पीएसबी जिवाणू संवर्धकाची बीजप्रक्रिया करून सावलीत वाळवून पेरणी करा.',
    treatmentTipEn: 'Treat with Rhizobium + PSB bio-fertilizers and dry in shade before sowing.'
  },
  {
    id: 'groundnut',
    nameMr: 'भुईमूग (Groundnut)',
    nameEn: 'Groundnut / Peanut',
    defaultRate: 40,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 40,
    bagLabelMr: '४० किलोची पोती',
    bagLabelEn: '40 kg Bags',
    methodMr: 'पेरणी / टोकण (३०×१० सें.मी.)',
    methodEn: 'Line Sowing / Dibbling (30x10 cm)',
    treatmentTipMr: 'ट्रायकोडर्मा ५ ग्रॅम + रायझोबियम व पीएसबी जिवाणू संवर्धकाची प्रक्रिया करावी.',
    treatmentTipEn: 'Treat kernel with Trichoderma 5g + Rhizobium & PSB culture.'
  },
  {
    id: 'sunflower',
    nameMr: 'सूर्यफूल (Sunflower)',
    nameEn: 'Sunflower',
    defaultRate: 2.5,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 2,
    bagLabelMr: '२ किलोची पाकिटे',
    bagLabelEn: '2 kg Packets',
    methodMr: 'टोकण पद्धत (६०×३० सें.मी.)',
    methodEn: 'Dibbling (60x30 cm)',
    treatmentTipMr: 'थायरम ३ ग्रॅम + अझोटोबॅक्टर व पीएसबी २५ ग्रॅम प्रति किलो चोळावे.',
    treatmentTipEn: 'Treat with Thiram 3g + Azotobacter & PSB 25g/kg.'
  },
  {
    id: 'safflower',
    nameMr: 'करडई (Safflower / Kardi)',
    nameEn: 'Safflower / Kardi',
    defaultRate: 5,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 5,
    bagLabelMr: '५ किलो पॅक',
    bagLabelEn: '5 kg Packs',
    methodMr: 'पेरणी (४५×२० सें.मी.)',
    methodEn: 'Line Sowing (45x20 cm)',
    treatmentTipMr: 'थायरम ३ ग्रॅम किंवा ट्रायकोडर्मा ५ ग्रॅम + अझोटोबॅक्टर २५ ग्रॅम लावावे.',
    treatmentTipEn: 'Treat with Thiram 3g or Trichoderma 5g + Azotobacter 25g/kg.'
  },
  {
    id: 'wheat',
    nameMr: 'गहू (Wheat)',
    nameEn: 'Wheat',
    defaultRate: 45,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 40,
    bagLabelMr: '४० किलोची पोती',
    bagLabelEn: '40 kg Bags',
    methodMr: 'पेरणी (२२.५ सें.मी. ओळीत)',
    methodEn: 'Line Sowing (22.5 cm row spacing)',
    treatmentTipMr: 'वेळेवर पेरणीसाठी ४०-४५ किलो व उशिरा पेरणीसाठी ५० किलो प्रति एकर बियाणे वापरावे.',
    treatmentTipEn: 'Use 40-45 kg for timely sowing; increase to 50 kg for late sowing.'
  },
  {
    id: 'maize',
    nameMr: 'मका (Maize)',
    nameEn: 'Maize (Corn)',
    defaultRate: 8,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 4,
    bagLabelMr: '४ किलोची पाकिटे',
    bagLabelEn: '4 kg Bags',
    methodMr: 'टोकण (६०×२० सें.मी.)',
    methodEn: 'Line Dibbling (60x20 cm)',
    treatmentTipMr: 'संकरित मका बियाणे प्रमाणित कंपनीचे निवडून ओल असताना टोकण करावे.',
    treatmentTipEn: 'Sow hybrid certified seeds at 60x20 cm spacing in moist soil.'
  },
  {
    id: 'onion',
    nameMr: 'कांदा रोपवाटिका (Onion Nursery)',
    nameEn: 'Onion (Nursery)',
    defaultRate: 4,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    bagSize: 1,
    bagLabelMr: '१ किलो पॅक',
    bagLabelEn: '1 kg Packs',
    methodMr: 'गादीवाफा रोपवाटिका (Raised Nursery Beds)',
    methodEn: 'Raised Nursery Beds',
    treatmentTipMr: '१ एकर पुनर्लागवडीसाठी ४ किलो बियाण्याची गादीवाफ्यावर रोपवाटिका तयार करावी.',
    treatmentTipEn: '4 kg seed is sufficient to raise seedlings for 1 acre transplanted field.'
  },
  {
    id: 'ginger',
    nameMr: 'आले / अद्रक बेणे (Ginger Rhizomes)',
    nameEn: 'Ginger (Seed Rhizomes)',
    defaultRate: 9,
    unitMr: 'क्विंटल (Quintals)',
    unitEn: 'Quintals',
    bagSize: 1,
    bagLabelMr: 'क्विंटल',
    bagLabelEn: 'Quintals',
    methodMr: 'गादीवाफा / बेड लागवड (Broad Bed Furrow)',
    methodEn: 'Raised Bed Plantation',
    treatmentTipMr: 'निरोगी, डोळे फुगलेले बेणे निवडून कार्बेन्डाझिम + कीटकनाशकाच्या द्रावणात बुडवून बेणेप्रक्रिया करावी.',
    treatmentTipEn: 'Select healthy, bold rhizomes and treat in Carbendazim + insecticide solution before planting.'
  },
  {
    id: 'custom',
    nameMr: 'इतर पीक / स्वतःचे प्रमाण (Custom Crop)',
    nameEn: 'Custom Crop / Custom Rate',
    defaultRate: 10,
    unitMr: 'किलो (kg)',
    unitEn: 'kg',
    methodMr: 'स्थानिक शिफारशीनुसार',
    methodEn: 'As per local recommendation',
    treatmentTipMr: 'स्थानिक कृषी सल्लागार किंवा बळीराजा केंद्राच्या सल्ल्यानुसार योग्य बीजप्रक्रिया करावी.',
    treatmentTipEn: 'Consult local agronomist or Baliraja Kendra for specific seed treatment.'
  }
];

// Fertilizer Crop Presets
interface FertilizerPreset {
  id: string;
  nameMr: string;
  nameEn: string;
  dapBags: number; // per acre (50kg bags)
  ureaBags: number;
  mopBags: number;
  complexType: string;
  complexBags: number;
  secondaryKg: number; // e.g. Sulphur / Micro
  secondaryNameMr: string;
  secondaryNameEn: string;
  splitInfoMr: string[];
  splitInfoEn: string[];
}

const FERTILIZER_PRESETS: FertilizerPreset[] = [
  {
    id: 'soybean',
    nameMr: 'सोयाबीन (Soybean)',
    nameEn: 'Soybean',
    dapBags: 1.0,
    ureaBags: 0.5,
    mopBags: 0.5,
    complexType: '10:26:26',
    complexBags: 1.5,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर (गंधक)',
    secondaryNameEn: 'Sulphur 90%',
    splitInfoMr: [
      '१. पेरणीवेळी (बेसल): संपूर्ण DAP व MOP किंवा १०:२६:२६ + सल्फर बियाण्यालगत द्यावे.',
      '२. २५-३० दिवसांनी: नत्राची गरज असल्यास युरियाचा हलका डोस द्यावा.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Apply 100% DAP & MOP (or 10:26:26) + Sulphur near seed furrow.',
      '2. At 25-30 Days: Light split of Urea if nitrogen deficiency is observed.'
    ]
  },
  {
    id: 'cotton',
    nameMr: 'कापूस (Cotton)',
    nameEn: 'Cotton',
    dapBags: 1.5,
    ureaBags: 2.0,
    mopBags: 1.0,
    complexType: '10:26:26',
    complexBags: 2.0,
    secondaryKg: 10,
    secondaryNameMr: 'मॅग्नेशियम व सल्फर',
    secondaryNameEn: 'Magnesium & Sulphur',
    splitInfoMr: [
      '१. पेरणीवेळी (बेसल): DAP १.५ पोती + MOP अर्धी पोती किंवा १०:२६:२६.',
      '२. ३०-३५ दिवसांनी: १ पोते युरिया खुरपणीनंतर रिंग पद्धतीने द्यावा.',
      '३. ६०-६५ दिवसांनी (फुलोरा/बोंड): उरलेला युरिया + अर्धी पोती MOP द्यावे.'
    ],
    splitInfoEn: [
      '1. Basal at Sowing: 1.5 bags DAP + 0.5 bag MOP (or 10:26:26).',
      '2. 30-35 Days: 1 bag Urea applied in ring method after weeding.',
      '3. 60-65 Days (Boll dev): Remaining Urea + 0.5 bag MOP.'
    ]
  },
  {
    id: 'jowar',
    nameMr: 'ज्वारी (Jowar / Jwar)',
    nameEn: 'Jowar / Sorghum',
    dapBags: 1.0,
    ureaBags: 1.5,
    mopBags: 0.5,
    complexType: '10:26:26',
    complexBags: 1.5,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर व झिंक',
    secondaryNameEn: 'Sulphur & Zinc',
    splitInfoMr: [
      '१. पेरणीवेळी (बेसल): संपूर्ण DAP व MOP किंवा १०:२६:२६ + सल्फर व झिंक.',
      '२. ३० दिवसांनी (कोळपणीनंतर): १ पोते युरिया पाऊस/ओलावा असताना द्यावा.'
    ],
    splitInfoEn: [
      '1. Basal at Sowing: Full DAP & MOP (or 10:26:26) + Sulphur & Zinc.',
      '2. At 30 Days: 1 bag Urea top dressed after hoeing in moist soil.'
    ]
  },
  {
    id: 'bajra',
    nameMr: 'बाजरी (Bajra)',
    nameEn: 'Bajra / Pearl Millet',
    dapBags: 1.0,
    ureaBags: 1.2,
    mopBags: 0.4,
    complexType: '20:20:0:13',
    complexBags: 1.5,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर (गंधक)',
    secondaryNameEn: 'Sulphur',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण फॉस्फरस व पोटॅश (DAP व MOP) किंवा २०:२०:०:१३.',
      '२. २५-३० दिवसांनी: १ पोते युरिया खुरपणीनंतर द्यावा.'
    ],
    splitInfoEn: [
      '1. Basal at Sowing: Full P & K (DAP + MOP or 20:20:0:13).',
      '2. At 25-30 Days: 1 bag Urea top dressing after weeding.'
    ]
  },
  {
    id: 'rajma',
    nameMr: 'राजमा (Rajma)',
    nameEn: 'Rajma / French Bean',
    dapBags: 1.5,
    ureaBags: 1.5,
    mopBags: 0.6,
    complexType: '10:26:26',
    complexBags: 2.0,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर व सूक्ष्मअन्नद्रव्ये',
    secondaryNameEn: 'Sulphur & Micronutrients',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण DAP, MOP व अर्धा युरिया किंवा १०:२६:२६.',
      '२. ३०-३५ दिवसांनी (फुलोऱ्यापूर्वी): उर्वरित १ पोते युरिया द्यावा.'
    ],
    splitInfoEn: [
      '1. Basal at Sowing: Full DAP, MOP and half Urea (or 10:26:26).',
      '2. At 30-35 Days (Pre-flowering): Remaining 1 bag Urea.'
    ]
  },
  {
    id: 'tur',
    nameMr: 'तूर / अरहर (Tur / Arhar)',
    nameEn: 'Tur / Pigeon Pea',
    dapBags: 1.0,
    ureaBags: 0.4,
    mopBags: 0.5,
    complexType: '10:26:26',
    complexBags: 1.5,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर व पीएसबी',
    secondaryNameEn: 'Sulphur & PSB',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण खताचा डोस पेरणीसोबत द्यावा.',
      '२. नत्राची गाठींद्वारे निर्मिती होत असल्याने जास्त युरियाची गरज भासत नाही.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Apply full fertilizer dose along the seed furrow.',
      '2. Root nodules fix atmospheric nitrogen; excess Urea is not required.'
    ]
  },
  {
    id: 'moong',
    nameMr: 'मूग (Moong)',
    nameEn: 'Moong / Green Gram',
    dapBags: 0.8,
    ureaBags: 0.3,
    mopBags: 0.3,
    complexType: '20:20:0:13',
    complexBags: 1.0,
    secondaryKg: 8,
    secondaryNameMr: 'सल्फर (गंधक)',
    secondaryNameEn: 'Sulphur',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण खत (DAP / २०:२०:०:१३ + सल्फर) पेरणीच्या वेळी द्यावे.',
      '२. कमी कालावधीचे पीक असल्याने सर्व खत एकाच वेळी बेसल देणे फायदेशीर ठरते.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Apply entire dose (DAP / 20:20:0:13 + Sulphur) at sowing.',
      '2. Short duration crop; single basal application ensures optimal yield.'
    ]
  },
  {
    id: 'udid',
    nameMr: 'उडीद (Udid / Black Gram)',
    nameEn: 'Udid / Black Gram',
    dapBags: 0.8,
    ureaBags: 0.3,
    mopBags: 0.3,
    complexType: '20:20:0:13',
    complexBags: 1.0,
    secondaryKg: 8,
    secondaryNameMr: 'सल्फर (गंधक)',
    secondaryNameEn: 'Sulphur',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण खत (DAP / २०:२०:०:१३ + सल्फर) पेरणीच्या वेळी द्यावे.',
      '२. उडदाच्या मुळांवर गाठी तयार होत असल्याने रासायनिक नत्राची गरज कमी असते.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Apply full dose (DAP / 20:20:0:13 + Sulphur) at sowing.',
      '2. Requires low chemical nitrogen due to active root nodulation.'
    ]
  },
  {
    id: 'gram',
    nameMr: 'हरभरा / चणा (Gram / Chana)',
    nameEn: 'Gram / Chickpea',
    dapBags: 1.0,
    ureaBags: 0.3,
    mopBags: 0.4,
    complexType: 'SSP + DAP',
    complexBags: 1.5,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर व पीएसबी',
    secondaryNameEn: 'Sulphur & PSB',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण खताचा डोस पेरणीसोबत द्यावा.',
      '२. हरभऱ्याच्या मुळांवरील गाठी हवेतील नत्र शोषतात, त्यामुळे जास्त युरिया देऊ नये.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Apply full fertilizer dose at sowing.',
      '2. Avoid excess Urea as root nodules fix atmospheric nitrogen.'
    ]
  },
  {
    id: 'groundnut',
    nameMr: 'भुईमूग (Groundnut)',
    nameEn: 'Groundnut / Peanut',
    dapBags: 1.2,
    ureaBags: 0.5,
    mopBags: 0.8,
    complexType: '10:26:26',
    complexBags: 1.8,
    secondaryKg: 20,
    secondaryNameMr: 'जिप्सम व सल्फर (शेंगा भरण्यासाठी)',
    secondaryNameEn: 'Gypsum & Sulphur (For pod filling)',
    splitInfoMr: [
      '१. पेरणीवेळी: DAP १.२ पोती + MOP ०.८ पोती + सल्फर.',
      '२. ३०-३५ दिवसांनी (आऱ्या सुटताना): जिप्सम २०० किलो प्रति एकर जमिनीत मिसळावे.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: 1.2 bags DAP + 0.8 bag MOP + Sulphur.',
      '2. At 30-35 Days (Pegging stage): Apply Gypsum 200 kg/acre in soil.'
    ]
  },
  {
    id: 'sunflower',
    nameMr: 'सूर्यफूल (Sunflower)',
    nameEn: 'Sunflower',
    dapBags: 1.0,
    ureaBags: 1.2,
    mopBags: 0.5,
    complexType: '20:20:0:13',
    complexBags: 1.5,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर व बोरॉन',
    secondaryNameEn: 'Sulphur & Boron',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण DAP व MOP किंवा २०:२०:०:१३ + सल्फर.',
      '२. ३०-३५ दिवसांनी: १ पोते युरिया द्यावा. फुलोरा अवस्थेत बोरॉन फवारणी उपयुक्त.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Full DAP & MOP (or 20:20:0:13) + Sulphur.',
      '2. At 30-35 Days: 1 bag Urea. Boron foliar spray at flowering aids seed setting.'
    ]
  },
  {
    id: 'safflower',
    nameMr: 'करडई (Safflower / Kardi)',
    nameEn: 'Safflower / Kardi',
    dapBags: 0.8,
    ureaBags: 0.8,
    mopBags: 0.4,
    complexType: '20:20:0:13',
    complexBags: 1.2,
    secondaryKg: 10,
    secondaryNameMr: 'सल्फर व झिंक',
    secondaryNameEn: 'Sulphur & Zinc',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण DAP, MOP व अर्धा युरिया खताचा डोस द्यावा.',
      '२. २५-३० दिवसांनी: उर्वरित अर्धा युरिया ओलावा पाहून द्यावा.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Full DAP, MOP and half Urea.',
      '2. At 25-30 Days: Remaining half Urea based on soil moisture.'
    ]
  },
  {
    id: 'wheat',
    nameMr: 'गहू (Wheat)',
    nameEn: 'Wheat',
    dapBags: 1.2,
    ureaBags: 2.0,
    mopBags: 0.6,
    complexType: '12:32:16',
    complexBags: 1.8,
    secondaryKg: 5,
    secondaryNameMr: 'झिंक सल्फेट',
    secondaryNameEn: 'Zinc Sulphate',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण DAP, MOP व १/२ पोते युरिया द्यावा.',
      '२. पहिल्या पाटाच्या वेळी (२१ दिवस - मुकुट मुळे): १ पोते युरिया द्यावा.',
      '३. कांडी अवस्था (४०-४५ दिवस): उरलेला युरिया द्यावा.'
    ],
    splitInfoEn: [
      '1. At Sowing: Full DAP, MOP and 1/2 bag Urea.',
      '2. 1st Irrigation (CRI stage, 21 days): 1 bag Urea.',
      '3. Booting Stage (40-45 days): Remaining Urea.'
    ]
  },
  {
    id: 'maize',
    nameMr: 'मका (Maize)',
    nameEn: 'Maize (Corn)',
    dapBags: 1.5,
    ureaBags: 2.5,
    mopBags: 0.8,
    complexType: '10:26:26',
    complexBags: 2.0,
    secondaryKg: 10,
    secondaryNameMr: 'झिंक सल्फेट',
    secondaryNameEn: 'Zinc Sulphate',
    splitInfoMr: [
      '१. पेरणीवेळी: संपूर्ण DAP, MOP व १/२ पोते युरिया + झिंक सल्फेट.',
      '२. २५-३० दिवसांनी (गुडघा उंची): १ पोते युरिया खुरपणीनंतर द्यावा.',
      '३. ४५-५० दिवसांनी (तुरा फुटताना): उर्वरित १ पोते युरिया द्यावा.'
    ],
    splitInfoEn: [
      '1. Basal Sowing: Full DAP, MOP & 0.5 bag Urea + Zinc Sulphate.',
      '2. At 25-30 Days (Knee-high): 1 bag Urea after weeding.',
      '3. At 45-50 Days (Tasseling): Remaining 1 bag Urea.'
    ]
  },
  {
    id: 'onion',
    nameMr: 'कांदा (Onion)',
    nameEn: 'Onion',
    dapBags: 1.2,
    ureaBags: 1.8,
    mopBags: 1.0,
    complexType: '10:26:26',
    complexBags: 2.0,
    secondaryKg: 15,
    secondaryNameMr: 'सल्फर (गंधक)',
    secondaryNameEn: 'Sulphur (Essential for pungency & shelf life)',
    splitInfoMr: [
      '१. पुनर्लागवड बेसल: संपूर्ण DAP, MOP व सल्फर द्यावे.',
      '२. ३० दिवसांनी: १ पोते युरिया द्यावा.',
      '३. ४५-५० दिवसांनी: उरलेला अर्धा युरिया डोस द्यावा. ६० दिवसांनंतर नत्र देणे थांबवावे.'
    ],
    splitInfoEn: [
      '1. Basal Transplanting: Full DAP, MOP, and Sulphur.',
      '2. 30 Days: 1 bag Urea.',
      '3. 45-50 Days: Remaining half Urea. Stop nitrogen after 60 days to prevent bolting.'
    ]
  },
  {
    id: 'ginger',
    nameMr: 'आले / अद्रक (Ginger)',
    nameEn: 'Ginger',
    dapBags: 2.5,
    ureaBags: 3.5,
    mopBags: 2.0,
    complexType: '12:32:16',
    complexBags: 3.0,
    secondaryKg: 25,
    secondaryNameMr: 'मॅग्नेशियम सल्फेट व फेरस',
    secondaryNameEn: 'Magnesium Sulphate & Micronutrients',
    splitInfoMr: [
      '१. लागवड बेसल डोस: शेणखतासोबत DAP २.५ पोती, MOP १ पोते, सल्फर व सूक्ष्मअन्नद्रव्ये.',
      '२. ४५ दिवसांनी (भरणी १): १०:२६:२६ व युरिया डोस.',
      '३. ९० व १२० दिवसांनी (भरणी २ व गाठ फुगवण): पोटॅश, युरिया व विद्राव्य खतांचे ड्रीप नियोजन.'
    ],
    splitInfoEn: [
      '1. Basal Bed Dose: 2.5 bags DAP + 1 bag MOP + FYM + Micronutrients.',
      '2. 45 Days (1st Earthing): 10:26:26 and Urea split.',
      '3. 90 & 120 Days (Rhizome bulking): Potash, Urea & water soluble drip fertigation.'
    ]
  },
  {
    id: 'sugarcane',
    nameMr: 'ऊस (Sugarcane)',
    nameEn: 'Sugarcane',
    dapBags: 2.5,
    ureaBags: 5.0,
    mopBags: 2.5,
    complexType: '10:26:26',
    complexBags: 4.5,
    secondaryKg: 20,
    secondaryNameMr: 'सल्फर व फेरस सल्फेट',
    secondaryNameEn: 'Sulphur & Ferrous Sulphate',
    splitInfoMr: [
      '१. लागवड वेळी: १०% नत्र, संपूर्ण फॉस्फरस व पोटॅश (DAP व MOP).',
      '२. ६-८ आठवड्यांनी: ४०% नत्र (युरिया).',
      '३. मोठ्या बांधणीवेळी (१२०-१३५ दिवस): उर्वरित ५०% नत्र व पोटॅश द्यावे.'
    ],
    splitInfoEn: [
      '1. Planting: 10% N, 100% P & K (DAP + MOP).',
      '2. 6-8 Weeks: 40% N (Urea).',
      '3. Final Earthing-up (120-135 days): Remaining 50% N and K.'
    ]
  }
];

// Water Presets
interface IrrigationMethod {
  id: 'drip' | 'sprinkler' | 'flood';
  nameMr: string;
  nameEn: string;
  litersPerAcreCycle: number;
  efficiency: string;
  savingMr: string;
  savingEn: string;
  descMr: string;
  descEn: string;
}

const IRRIGATION_METHODS: IrrigationMethod[] = [
  {
    id: 'drip',
    nameMr: 'ठिबक सिंचन (Drip Irrigation)',
    nameEn: 'Drip Irrigation',
    litersPerAcreCycle: 16000,
    efficiency: '90 - 95%',
    savingMr: 'पाण्याची ५०% ते ६०% थेट बचत',
    savingEn: '50% - 60% Water Saved',
    descMr: 'थेट मुळांच्या कार्यक्षेत्रात पाण्याचे थेंब पडतात, पाण्याचा बाष्पीभवन व अपव्यय टळतो.',
    descEn: 'Delivers water directly to the crop root zone with minimal evaporation.'
  },
  {
    id: 'sprinkler',
    nameMr: 'तुषार सिंचन (Sprinkler Irrigation)',
    nameEn: 'Sprinkler Irrigation',
    litersPerAcreCycle: 32000,
    efficiency: '75 - 80%',
    savingMr: 'पाण्याची २५% ते ३५% बचत',
    savingEn: '25% - 35% Water Saved',
    descMr: 'पावसासारखे पाणी फवारले जाते. हलक्या व मध्यम जमिनीसाठी उपयुक्त.',
    descEn: 'Simulates gentle rainfall. Ideal for undulating terrain and light to medium soil.'
  },
  {
    id: 'flood',
    nameMr: 'पाट पाणी / मोकाट सिंचन (Flood / Furrow)',
    nameEn: 'Flood / Furrow Irrigation',
    litersPerAcreCycle: 65000,
    efficiency: '45 - 50%',
    savingMr: 'पाण्याचा जास्त वापर (०% बचत)',
    savingEn: 'High Water Usage (0% Saved)',
    descMr: 'पाण्याचा मोठ्या प्रमाणावर अपव्यय व जमिनीची धूप होण्याची शक्यता असते.',
    descEn: 'Traditional furrow flooding; prone to runoff and deep percolation loss.'
  }
];

// Pump Options
const PUMP_PRESETS = [
  { id: '3hp', nameMr: '३ HP मोटार (~१२,००० लि./तास)', nameEn: '3 HP Motor (~12,000 L/hr)', discharge: 12000 },
  { id: '5hp', nameMr: '५ HP मोटार (~२०,००० लि./तास)', nameEn: '5 HP Motor (~20,000 L/hr)', discharge: 20000 },
  { id: '7.5hp', nameMr: '७.५ HP मोटार (~३०,००० लि./तास)', nameEn: '7.5 HP Motor (~30,000 L/hr)', discharge: 30000 },
  { id: '10hp', nameMr: '१० HP मोटार (~४०,००० लि./तास)', nameEn: '10 HP Motor (~40,000 L/hr)', discharge: 40000 },
];

// Spray Equipment Presets
interface SprayEquipment {
  id: string;
  nameMr: string;
  nameEn: string;
  capacityLiters: number;
}

const SPRAY_EQUIPMENTS: SprayEquipment[] = [
  { id: 'knapsack15', nameMr: '१५ लिटर मॅन्युअल / बॅटरी पंप (15L Knapsack)', nameEn: '15 Liters Knapsack Pump', capacityLiters: 15 },
  { id: 'battery16', nameMr: '१६ लिटर बॅटरी पंप (16L Battery Pump)', nameEn: '16 Liters Battery Pump', capacityLiters: 16 },
  { id: 'power20', nameMr: '२० लिटर पॉवर स्प्रेअर (20L Power Pump)', nameEn: '20 Liters Power Sprayer', capacityLiters: 20 },
  { id: 'trolley100', nameMr: '१०० लिटर ट्रॉली पंप (100L Trolley Sprayer)', nameEn: '100 Liters Trolley Sprayer', capacityLiters: 100 },
  { id: 'barrel200', nameMr: '२०० लिटर ड्रम / बॅरल (200L Barrel)', nameEn: '200 Liters Barrel / Drum', capacityLiters: 200 },
  { id: 'tractor500', nameMr: '५०० लिटर ट्रॅक्टर टाकी (500L Tractor Tank)', nameEn: '500 Liters Tractor Sprayer Tank', capacityLiters: 500 },
];

export const AgriCalculators: FC<AgriCalculatorsProps> = ({ lang }) => {
  const [activeCalc, setActiveCalc] = useState<CalcType>('seed');
  const [showHowCalculated, setShowHowCalculated] = useState<boolean>(false);

  // -------------------------------------------------------------
  // 1. SEED CALCULATOR STATE
  // -------------------------------------------------------------
  const [seedCropId, setSeedCropId] = useState<string>('soybean');
  const [seedArea, setSeedArea] = useState<number>(2);
  const [seedUnit, setSeedUnit] = useState<LandUnit>('acre');
  const [seedRateOverride, setSeedRateOverride] = useState<number | null>(null);

  // -------------------------------------------------------------
  // 2. FERTILIZER CALCULATOR STATE
  // -------------------------------------------------------------
  const [fertCropId, setFertCropId] = useState<string>('soybean');
  const [fertArea, setFertArea] = useState<number>(2);
  const [fertUnit, setFertUnit] = useState<LandUnit>('acre');
  const [fertOption, setFertOption] = useState<'straight' | 'complex'>('straight');
  const [soilFertility, setSoilFertility] = useState<'low' | 'medium' | 'high'>('medium');

  // -------------------------------------------------------------
  // 3. WATER CALCULATOR STATE
  // -------------------------------------------------------------
  const [waterArea, setWaterArea] = useState<number>(2);
  const [waterUnit, setWaterUnit] = useState<LandUnit>('acre');
  const [irrigationMethodId, setIrrigationMethodId] = useState<'drip' | 'sprinkler' | 'flood'>('drip');
  const [pumpMotorId, setPumpMotorId] = useState<string>('5hp');

  // -------------------------------------------------------------
  // 4. CROP COST CALCULATOR STATE
  // -------------------------------------------------------------
  const [costArea, setCostArea] = useState<number>(2);
  const [costUnit, setCostUnit] = useState<LandUnit>('acre');
  // Per acre expense components (in ₹)
  const [tillageCost, setTillageCost] = useState<number>(3500);
  const [seedCost, setSeedCost] = useState<number>(4000);
  const [fertCost, setFertCost] = useState<number>(6500);
  const [sprayCost, setSprayCost] = useState<number>(4500);
  const [labourCost, setLabourCost] = useState<number>(5500);
  const [harvestCost, setHarvestCost] = useState<number>(4000);
  const [otherCost, setOtherCost] = useState<number>(2000);

  // -------------------------------------------------------------
  // 5. YIELD & PROFIT CALCULATOR STATE
  // -------------------------------------------------------------
  const [profitCrop, setProfitCrop] = useState<string>('soybean');
  const [profitArea, setProfitArea] = useState<number>(2);
  const [profitUnit, setProfitUnit] = useState<LandUnit>('acre');
  const [profitYieldPerAcre, setProfitYieldPerAcre] = useState<number>(10); // quintals
  const [profitPricePerQuintal, setProfitPricePerQuintal] = useState<number>(4800); // ₹
  const [profitCostPerAcre, setProfitCostPerAcre] = useState<number>(16000); // ₹

  // -------------------------------------------------------------
  // 6. SPRAY CALCULATOR STATE
  // -------------------------------------------------------------
  const [sprayEquipmentId, setSprayEquipmentId] = useState<string>('knapsack15');
  const [sprayDoseType, setSprayDoseType] = useState<'ml_per_liter' | 'gm_per_liter' | 'ml_per_tank' | 'gm_per_tank'>('ml_per_liter');
  const [sprayDoseValue, setSprayDoseValue] = useState<number>(2);
  const [sprayCountMode, setSprayCountMode] = useState<'tanks' | 'area'>('tanks');
  const [sprayTankCount, setSprayTankCount] = useState<number>(6);
  const [sprayArea, setSprayArea] = useState<number>(1);
  const [sprayAreaUnit, setSprayAreaUnit] = useState<LandUnit>('acre');

  const t = translations[lang];

  // -------------------------------------------------------------
  // 1. CALCULATIONS: SEED
  // -------------------------------------------------------------
  const currentSeedPreset = SEED_PRESETS.find(p => p.id === seedCropId) || SEED_PRESETS[0];
  const effectiveSeedRate = seedRateOverride !== null ? seedRateOverride : currentSeedPreset.defaultRate;
  const seedAcres = toAcres(seedArea, seedUnit);
  const totalSeedRequired = Math.max(0, +(seedAcres * effectiveSeedRate).toFixed(1));
  const estimatedSeedBags = currentSeedPreset.bagSize 
    ? +(totalSeedRequired / currentSeedPreset.bagSize).toFixed(1) 
    : 0;

  // -------------------------------------------------------------
  // 2. CALCULATIONS: FERTILIZER
  // -------------------------------------------------------------
  const currentFertPreset = FERTILIZER_PRESETS.find(p => p.id === fertCropId) || FERTILIZER_PRESETS[0];
  const fertAcres = toAcres(fertArea, fertUnit);
  const fertilityMultiplier = soilFertility === 'low' ? 1.15 : soilFertility === 'high' ? 0.90 : 1.0;

  const totalDapBags = Math.max(0, +(currentFertPreset.dapBags * fertAcres * fertilityMultiplier).toFixed(1));
  const totalUreaBags = Math.max(0, +(currentFertPreset.ureaBags * fertAcres * fertilityMultiplier).toFixed(1));
  const totalMopBags = Math.max(0, +(currentFertPreset.mopBags * fertAcres * fertilityMultiplier).toFixed(1));
  const totalComplexBags = Math.max(0, +(currentFertPreset.complexBags * fertAcres * fertilityMultiplier).toFixed(1));
  const totalSecondaryKg = Math.max(0, +(currentFertPreset.secondaryKg * fertAcres * fertilityMultiplier).toFixed(1));

  // -------------------------------------------------------------
  // 3. CALCULATIONS: WATER
  // -------------------------------------------------------------
  const currentIrrigation = IRRIGATION_METHODS.find(m => m.id === irrigationMethodId) || IRRIGATION_METHODS[0];
  const currentPump = PUMP_PRESETS.find(p => p.id === pumpMotorId) || PUMP_PRESETS[1];
  const waterAcres = toAcres(waterArea, waterUnit);
  const totalWaterLiters = Math.round(waterAcres * currentIrrigation.litersPerAcreCycle);
  const pumpRuntimeHoursDecimal = currentPump.discharge > 0 ? (totalWaterLiters / currentPump.discharge) : 0;
  const pumpRuntimeHours = Math.floor(pumpRuntimeHoursDecimal);
  const pumpRuntimeMins = Math.round((pumpRuntimeHoursDecimal - pumpRuntimeHours) * 60);

  // -------------------------------------------------------------
  // 4. CALCULATIONS: CROP COST
  // -------------------------------------------------------------
  const costAcres = toAcres(costArea, costUnit);
  const perAcreSum = tillageCost + seedCost + fertCost + sprayCost + labourCost + harvestCost + otherCost;
  const totalCultivationCost = Math.round(perAcreSum * costAcres);
  const costPerGuntha = costAcres > 0 ? Math.round(totalCultivationCost / (costAcres * 40)) : 0;

  // -------------------------------------------------------------
  // 5. CALCULATIONS: YIELD & PROFIT
  // -------------------------------------------------------------
  const profitAcres = toAcres(profitArea, profitUnit);
  const totalYieldQuintals = +(profitAcres * profitYieldPerAcre).toFixed(1);
  const grossRevenue = Math.round(totalYieldQuintals * profitPricePerQuintal);
  const totalProfitCost = Math.round(profitAcres * profitCostPerAcre);
  const netProfit = grossRevenue - totalProfitCost;
  const profitPerAcre = profitAcres > 0 ? Math.round(netProfit / profitAcres) : 0;
  const roiPercent = totalProfitCost > 0 ? +((netProfit / totalProfitCost) * 100).toFixed(1) : 0;

  // -------------------------------------------------------------
  // 6. CALCULATIONS: SPRAY
  // -------------------------------------------------------------
  const currentSprayEq = SPRAY_EQUIPMENTS.find(e => e.id === sprayEquipmentId) || SPRAY_EQUIPMENTS[0];
  const tankCapacity = currentSprayEq.capacityLiters;
  
  // Effective number of tanks
  const effectiveTanks = sprayCountMode === 'tanks' 
    ? Math.max(1, sprayTankCount)
    : Math.max(1, Math.round(toAcres(sprayArea, sprayAreaUnit) * (tankCapacity <= 20 ? 8 : (200 / tankCapacity))));

  let dosePerTank = 0;
  let doseUnitLabel = '';
  if (sprayDoseType === 'ml_per_liter') {
    dosePerTank = +(tankCapacity * sprayDoseValue).toFixed(1);
    doseUnitLabel = lang === 'mr' ? 'मिली (ml)' : 'ml';
  } else if (sprayDoseType === 'gm_per_liter') {
    dosePerTank = +(tankCapacity * sprayDoseValue).toFixed(1);
    doseUnitLabel = lang === 'mr' ? 'ग्रॅम (gm)' : 'gm';
  } else if (sprayDoseType === 'ml_per_tank') {
    dosePerTank = sprayDoseValue;
    doseUnitLabel = lang === 'mr' ? 'मिली (ml)' : 'ml';
  } else {
    dosePerTank = sprayDoseValue;
    doseUnitLabel = lang === 'mr' ? 'ग्रॅम (gm)' : 'gm';
  }

  const totalChemicalNeeded = +(dosePerTank * effectiveTanks).toFixed(1);
  const totalSprayWaterLiters = tankCapacity * effectiveTanks;

  // Reset Handlers
  const handleResetCurrent = () => {
    if (activeCalc === 'seed') {
      setSeedCropId('soybean');
      setSeedArea(2);
      setSeedUnit('acre');
      setSeedRateOverride(null);
    } else if (activeCalc === 'fertilizer') {
      setFertCropId('soybean');
      setFertArea(2);
      setFertUnit('acre');
      setFertOption('straight');
      setSoilFertility('medium');
    } else if (activeCalc === 'water') {
      setWaterArea(2);
      setWaterUnit('acre');
      setIrrigationMethodId('drip');
      setPumpMotorId('5hp');
    } else if (activeCalc === 'cost') {
      setCostArea(2);
      setCostUnit('acre');
      setTillageCost(3500);
      setSeedCost(4000);
      setFertCost(6500);
      setSprayCost(4500);
      setLabourCost(5500);
      setHarvestCost(4000);
      setOtherCost(2000);
    } else if (activeCalc === 'profit') {
      setProfitCrop('soybean');
      setProfitArea(2);
      setProfitUnit('acre');
      setProfitYieldPerAcre(10);
      setProfitPricePerQuintal(4800);
      setProfitCostPerAcre(16000);
    } else if (activeCalc === 'spray') {
      setSprayEquipmentId('knapsack15');
      setSprayDoseType('ml_per_liter');
      setSprayDoseValue(2);
      setSprayCountMode('tanks');
      setSprayTankCount(6);
      setSprayArea(1);
      setSprayAreaUnit('acre');
    }
  };

  // Crop change handlers for profit
  const handleProfitCropChange = (cropKey: string) => {
    setProfitCrop(cropKey);
    if (cropKey === 'soybean') {
      setProfitYieldPerAcre(10);
      setProfitPricePerQuintal(4800);
      setProfitCostPerAcre(16000);
    } else if (cropKey === 'cotton') {
      setProfitYieldPerAcre(12);
      setProfitPricePerQuintal(7500);
      setProfitCostPerAcre(28000);
    } else if (cropKey === 'jowar') {
      setProfitYieldPerAcre(14);
      setProfitPricePerQuintal(3200);
      setProfitCostPerAcre(15000);
    } else if (cropKey === 'bajra') {
      setProfitYieldPerAcre(12);
      setProfitPricePerQuintal(2500);
      setProfitCostPerAcre(12000);
    } else if (cropKey === 'rajma') {
      setProfitYieldPerAcre(8);
      setProfitPricePerQuintal(7500);
      setProfitCostPerAcre(20000);
    } else if (cropKey === 'tur') {
      setProfitYieldPerAcre(8);
      setProfitPricePerQuintal(7800);
      setProfitCostPerAcre(15000);
    } else if (cropKey === 'moong') {
      setProfitYieldPerAcre(5);
      setProfitPricePerQuintal(8200);
      setProfitCostPerAcre(11000);
    } else if (cropKey === 'udid') {
      setProfitYieldPerAcre(5);
      setProfitPricePerQuintal(7900);
      setProfitCostPerAcre(11000);
    } else if (cropKey === 'gram') {
      setProfitYieldPerAcre(10);
      setProfitPricePerQuintal(5800);
      setProfitCostPerAcre(14000);
    } else if (cropKey === 'groundnut') {
      setProfitYieldPerAcre(12);
      setProfitPricePerQuintal(6200);
      setProfitCostPerAcre(22000);
    } else if (cropKey === 'sunflower') {
      setProfitYieldPerAcre(8);
      setProfitPricePerQuintal(4800);
      setProfitCostPerAcre(14000);
    } else if (cropKey === 'safflower') {
      setProfitYieldPerAcre(7);
      setProfitPricePerQuintal(5200);
      setProfitCostPerAcre(11000);
    } else if (cropKey === 'wheat') {
      setProfitYieldPerAcre(18);
      setProfitPricePerQuintal(2900);
      setProfitCostPerAcre(18000);
    } else if (cropKey === 'maize') {
      setProfitYieldPerAcre(25);
      setProfitPricePerQuintal(2300);
      setProfitCostPerAcre(18000);
    } else if (cropKey === 'onion') {
      setProfitYieldPerAcre(80);
      setProfitPricePerQuintal(2200);
      setProfitCostPerAcre(45000);
    } else if (cropKey === 'ginger') {
      setProfitYieldPerAcre(100);
      setProfitPricePerQuintal(5500);
      setProfitCostPerAcre(85000);
    } else if (cropKey === 'sugarcane') {
      setProfitYieldPerAcre(60);
      setProfitPricePerQuintal(3200);
      setProfitCostPerAcre(60000);
    }
  };

  // List of all 6 calculators for the category cards
  const calculatorOptions: {
    id: CalcType;
    icon: React.ReactNode;
    titleMr: string;
    titleEn: string;
    descMr: string;
    descEn: string;
    badgeMr: string;
    badgeEn: string;
    color: string;
  }[] = [
    {
      id: 'seed',
      icon: <Sprout className="w-6 h-6 text-emerald-700" />,
      titleMr: 'बियाणे गणक',
      titleEn: 'Seed Calculator',
      descMr: 'क्षेत्रफळ व शिफारस दरानुसार लागणारे एकूण बियाणे व पोती मोजा.',
      descEn: 'Calculate required seed quantity & bags based on land area.',
      badgeMr: 'बियाणे प्रमाण',
      badgeEn: 'Seed Quantity',
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-300/80'
    },
    {
      id: 'fertilizer',
      icon: <FlaskConical className="w-6 h-6 text-amber-700" />,
      titleMr: 'खत गणक',
      titleEn: 'Fertilizer Calculator',
      descMr: 'डीएपी, युरिया, १०:२६:२६ व पोटॅश खतांची अचूक पोती व डोस मोजा.',
      descEn: 'Calculate required bags of DAP, Urea, MOP & complex grades.',
      badgeMr: 'खतांची मात्रा',
      badgeEn: 'Fertilizer Dose',
      color: 'from-amber-500/10 to-yellow-500/10 border-amber-300/80'
    },
    {
      id: 'water',
      icon: <Droplets className="w-6 h-6 text-sky-700" />,
      titleMr: 'पाणी / सिंचन गणक',
      titleEn: 'Water & Irrigation',
      descMr: 'ठिबक, तुषार व पाट पाण्याचा अंदाज आणि मोटार चालवण्याची वेळ मोजा.',
      descEn: 'Estimate irrigation water in liters and pump running hours.',
      badgeMr: 'सिंचन व पंप वेळ',
      badgeEn: 'Pump Runtime',
      color: 'from-sky-500/10 to-blue-500/10 border-sky-300/80'
    },
    {
      id: 'cost',
      icon: <Coins className="w-6 h-6 text-emerald-800" />,
      titleMr: 'लागवड खर्च गणक',
      titleEn: 'Crop Cost Calculator',
      descMr: 'मशागत, बियाणे, खते, मजुरी व काढणीचा एकूण उत्पादन खर्च मोजा.',
      descEn: 'Estimate total cultivation expenditure and cost per acre.',
      badgeMr: 'लागवड खर्च',
      badgeEn: 'Production Cost',
      color: 'from-emerald-500/10 to-green-500/10 border-emerald-300/80'
    },
    {
      id: 'profit',
      icon: <TrendingUp className="w-6 h-6 text-teal-800" />,
      titleMr: 'उत्पादन व नफा गणक',
      titleEn: 'Yield & Profit',
      descMr: 'अंदाजित उत्पादन, बाजार भाव आणि खर्चावरून निव्वळ नफा व परतावा मोजा.',
      descEn: 'Forecast expected gross revenue, net profit margin and ROI.',
      badgeMr: 'नफा व परतावा',
      badgeEn: 'Net Profit & ROI',
      color: 'from-teal-500/10 to-emerald-500/10 border-teal-300/80'
    },
    {
      id: 'spray',
      icon: <SprayCan className="w-6 h-6 text-indigo-700" />,
      titleMr: 'फवारणी औषध मिश्रण गणक',
      titleEn: 'Spray Mixing Calculator',
      descMr: 'पंपाची टाकी व औषधाच्या शिफारशीनुसार अचूक मिली/ग्रॅम प्रमाण मोजा.',
      descEn: 'Calculate chemical dose per tank and total pesticide needed.',
      badgeMr: 'फवारणी प्रमाण',
      badgeEn: 'Spray Dosage',
      color: 'from-indigo-500/10 to-purple-500/10 border-indigo-300/80'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner - Gassomorphic Warm Agricultural Tone */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>{lang === 'mr' ? 'बळीराजा शेती गणक' : 'Baliraja Smart Farm Calculators'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2 font-serif">
            {t.whatToCalculate || (lang === 'mr' ? 'तुम्हाला काय मोजायचे आहे?' : 'What do you want to calculate?')}
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            {t.whatToCalculateDesc || (lang === 'mr' ? 'शेतकऱ्यांसाठी साधे, सोपे आणि अचूक शेती हिशोब गणक — खालील पर्यायांपैकी हवा तो गणक निवडा.' : 'Simple, practical and reliable calculators for accurate farm planning. Select any calculator below.')}
          </p>
        </div>
      </div>

      {/* 6 What Do You Want To Calculate Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'mr' ? 'उपलब्ध शेती गणक (६ प्रकार):' : 'Available Farm Calculators (6 Tools):'}</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium hidden sm:inline">
            {lang === 'mr' ? 'हव्या त्या कार्डवर क्लिक करा' : 'Click any card to calculate'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculatorOptions.map((opt) => {
            const isSelected = activeCalc === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setActiveCalc(opt.id);
                  setShowHowCalculated(false);
                }}
                className={`group text-left p-5 rounded-3xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#f6fbf3] via-[#ecf7e7] to-[#e4f2dc] border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white/80 hover:bg-[#fafdf8] border border-stone-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-2xl bg-stone-100 text-stone-700 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-110 group-active:-translate-y-0.5 group-active:scale-105 will-change-transform">
                      {opt.icon}
                    </div>
                    <span className={`text-2xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isSelected 
                        ? 'bg-emerald-700 text-white border-emerald-700' 
                        : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      {lang === 'mr' ? opt.badgeMr : opt.badgeEn}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1 font-serif">
                    {lang === 'mr' ? opt.titleMr : opt.titleEn}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {lang === 'mr' ? opt.descMr : opt.descEn}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
                  <span className={`text-xs font-bold flex items-center gap-1 ${isSelected ? 'text-emerald-800' : 'text-stone-500'}`}>
                    {isSelected 
                      ? (lang === 'mr' ? '✓ हिशोब चालू आहे' : '✓ Active Calculator') 
                      : (lang === 'mr' ? 'वापरा →' : 'Open Calculator →')}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE CALCULATOR PANEL */}
      <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-emerald-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_24px_rgba(16,185,129,0.04)] space-y-6">
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/80">
                {lang === 'mr' ? 'कृषी गणक' : 'Active Tool'}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {calculatorOptions.find(o => o.id === activeCalc)?.titleMr}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 font-serif">
              {lang === 'mr' 
                ? calculatorOptions.find(o => o.id === activeCalc)?.titleMr 
                : calculatorOptions.find(o => o.id === activeCalc)?.titleEn}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetCurrent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetBtn || (lang === 'mr' ? 'रीसेट' : 'Reset')}</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. SEED CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeCalc === 'seed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-5 bg-[#fafcf8] rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'mr' ? 'पिकाची व क्षेत्राची माहिती' : 'Crop & Land Information'}</span>
              </h3>

              {/* Crop Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {t.cropLabel || (lang === 'mr' ? 'पीक निवडा' : 'Select Crop')}
                </label>
                <select
                  value={seedCropId}
                  onChange={(e) => {
                    setSeedCropId(e.target.value);
                    setSeedRateOverride(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {SEED_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'mr' ? p.nameMr : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Land Area and Unit Switcher */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'mr' ? 'जमीन क्षेत्र (Area)' : 'Land Area'}
                  </label>
                  <span className="text-2xs text-stone-500 font-medium">
                    {lang === 'mr' ? 'एकक निवडा:' : 'Select unit:'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {(['acre', 'guntha', 'hectare'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setSeedUnit(unit)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        seedUnit === unit
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {unit === 'acre' 
                        ? (lang === 'mr' ? 'एकर (Acre)' : 'Acre')
                        : unit === 'guntha'
                        ? (lang === 'mr' ? 'गुंठा (Guntha)' : 'Guntha')
                        : (lang === 'mr' ? 'हेक्टर (Hectare)' : 'Hectare')}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={seedArea}
                  onChange={(e) => setSeedArea(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <span className="text-2xs text-stone-500 block mt-1">
                  {seedUnit !== 'acre' && `≈ ${seedAcres.toFixed(2)} ${lang === 'mr' ? 'एकर क्षेत्र' : 'Acres equivalent'}`}
                </span>
              </div>

              {/* Seed Rate */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'प्रति एकर बियाणे दर' : 'Seed Rate Per Acre'} ({lang === 'mr' ? currentSeedPreset.unitMr : currentSeedPreset.unitEn})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={effectiveSeedRate}
                  onChange={(e) => setSeedRateOverride(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <span className="text-2xs text-emerald-800 font-semibold block mt-1">
                  {lang === 'mr' ? `मानक पद्धत: ${currentSeedPreset.methodMr}` : `Recommended method: ${currentSeedPreset.methodEn}`}
                </span>
              </div>
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#fdfbf7] via-[#f7faf2] to-[#edf6ea] rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                    {seedArea} {seedUnit === 'acre' ? (lang === 'mr' ? 'एकर' : 'Acres') : seedUnit === 'guntha' ? (lang === 'mr' ? 'गुंठे' : 'Gunthas') : (lang === 'mr' ? 'हेक्टर' : 'Hectares')}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-serif">
                    {lang === 'mr' ? 'एकूण लागणारे बियाणे:' : 'Total Seed Requirement:'}
                  </h3>
                </div>
              </div>

              {/* Primary Result Metric */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    {lang === 'mr' ? 'एकूण बियाणे प्रमाण' : 'Total Seed Quantity'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-serif">
                      {totalSeedRequired}
                    </span>
                    <span className="text-sm font-bold text-stone-700">
                      {lang === 'mr' ? currentSeedPreset.unitMr : currentSeedPreset.unitEn}
                    </span>
                  </div>
                  <span className="text-2xs text-stone-500 block mt-1">
                    ({seedAcres.toFixed(2)} एकर × {effectiveSeedRate} दर)
                  </span>
                </div>

                {currentSeedPreset.bagSize && currentSeedPreset.bagSize > 0 && (
                  <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-emerald-200 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      {lang === 'mr' ? 'अंदाजित पॅकिंग / पोती' : 'Standard Packaging / Bags'}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-stone-900 font-serif">
                        {estimatedSeedBags}
                      </span>
                      <span className="text-xs font-bold text-stone-600">
                        {lang === 'mr' ? currentSeedPreset.bagLabelMr : currentSeedPreset.bagLabelEn}
                      </span>
                    </div>
                    <span className="text-2xs text-emerald-800 font-semibold block mt-1">
                      {lang === 'mr' ? 'प्रमाणित कंपनी पॅकनुसार' : 'Based on standard packing'}
                    </span>
                  </div>
                )}
              </div>

              {/* Seed Treatment Agronomic Tip */}
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{lang === 'mr' ? 'महत्त्वाची कृषी सूचना (Seed Care):' : 'Key Agronomic Advice:'}</span>
                </div>
                <p className="leading-relaxed">
                  {lang === 'mr' ? currentSeedPreset.treatmentTipMr : currentSeedPreset.treatmentTipEn}
                </p>
              </div>

              {/* How is this calculated accordion */}
              <div className="border-t border-emerald-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-stone-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-700" />
                    <span>{t.howIsCalculated || (lang === 'mr' ? 'हे कसे मोजले गेले?' : 'How is this calculated?')}</span>
                  </span>
                  {showHowCalculated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowCalculated && (
                  <div className="mt-3 bg-white/90 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
                    <p className="font-bold text-stone-900">
                      {lang === 'mr' ? 'सूत्र (Calculation Formula):' : 'Formula:'}
                    </p>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      एकूण बियाणे = क्षेत्र (एकर) × प्रति एकर शिफारस दर
                    </code>
                    <p>
                      १. प्रविष्ट केलेले क्षेत्र: {seedArea} {seedUnit} (≈ {seedAcres.toFixed(2)} एकर)
                    </p>
                    <p>
                      २. प्रति एकर दर: {effectiveSeedRate} {currentSeedPreset.unitMr}
                    </p>
                    <p className="font-semibold text-emerald-900">
                      ३. हिशोब: {seedAcres.toFixed(2)} × {effectiveSeedRate} = <strong>{totalSeedRequired} {currentSeedPreset.unitMr}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. FERTILIZER CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeCalc === 'fertilizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-5 bg-[#fafcf8] rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-700" />
                <span>{lang === 'mr' ? 'पिक व जमिनीची माहिती' : 'Crop & Fertilizer Selection'}</span>
              </h3>

              {/* Crop */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {t.cropLabel || (lang === 'mr' ? 'पीक निवडा' : 'Select Crop')}
                </label>
                <select
                  value={fertCropId}
                  onChange={(e) => setFertCropId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {FERTILIZER_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'mr' ? p.nameMr : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Land Area and Unit Switcher */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'mr' ? 'जमीन क्षेत्र (Area)' : 'Land Area'}
                  </label>
                  <span className="text-2xs text-stone-500 font-medium">
                    {lang === 'mr' ? 'एकक:' : 'Unit:'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {(['acre', 'guntha', 'hectare'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setFertUnit(unit)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        fertUnit === unit
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {unit === 'acre' 
                        ? (lang === 'mr' ? 'एकर' : 'Acre')
                        : unit === 'guntha'
                        ? (lang === 'mr' ? 'गुंठा' : 'Guntha')
                        : (lang === 'mr' ? 'हेक्टर' : 'Hectare')}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={fertArea}
                  onChange={(e) => setFertArea(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Fertilizer Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'खताचा प्रकार / कॉम्बिनेशन' : 'Fertilizer Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFertOption('straight')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      fertOption === 'straight'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'mr' ? 'सरळ खते (DAP+युरिया+MOP)' : 'Straight (DAP+Urea+MOP)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFertOption('complex')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      fertOption === 'complex'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'mr' ? `मिश्र खत (${currentFertPreset.complexType})` : `Complex (${currentFertPreset.complexType})`}
                  </button>
                </div>
              </div>

              {/* Soil Fertility adjustment */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'जमिनीची प्रत / सुपीकता' : 'Soil Fertility Level'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSoilFertility(lvl)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        soilFertility === lvl
                          ? 'bg-stone-800 text-white border-stone-800'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {lvl === 'low' 
                        ? (lang === 'mr' ? 'हलकी / मुरमाड' : 'Low / Light')
                        : lvl === 'medium'
                        ? (lang === 'mr' ? 'मध्यम' : 'Medium')
                        : (lang === 'mr' ? 'भारी / काळी' : 'High / Heavy')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Results */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#fdfbf7] via-[#f7faf2] to-[#edf6ea] rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                  {fertArea} {fertUnit === 'acre' ? (lang === 'mr' ? 'एकर' : 'Acres') : fertUnit === 'guntha' ? (lang === 'mr' ? 'गुंठे' : 'Gunthas') : (lang === 'mr' ? 'हेक्टर' : 'Hectares')} {lang === 'mr' ? 'शेतीसाठी शिफारस' : 'Requirement'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-serif">
                  {t.npkResultTitle || (lang === 'mr' ? 'शिफारस केलेली खतांची मात्रा:' : 'Recommended Fertilizer Quantities:')}
                </h3>
              </div>

              {/* Fertilizer Bag Cards */}
              {fertOption === 'straight' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* DAP */}
                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-center shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                      {lang === 'mr' ? 'डीएपी (DAP 18:46:0)' : 'DAP (18:46:0)'}
                    </span>
                    <span className="text-3xl font-black text-amber-950 font-serif">
                      {totalDapBags}
                    </span>
                    <span className="text-xs text-stone-600 block mt-0.5 font-medium">
                      {t.bags || 'पोती (50 kg)'}
                    </span>
                    <div className="mt-2 text-2xs text-amber-900 bg-amber-100/80 py-1 px-2 rounded-lg font-semibold">
                      (~{Math.round(totalDapBags * 50)} kg)
                    </div>
                  </div>

                  {/* Urea */}
                  <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 text-center shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                      {lang === 'mr' ? 'युरिया (Urea 46% N)' : 'Urea (46% N)'}
                    </span>
                    <span className="text-3xl font-black text-emerald-950 font-serif">
                      {totalUreaBags}
                    </span>
                    <span className="text-xs text-stone-600 block mt-0.5 font-medium">
                      {t.bags || 'पोती (50 kg)'}
                    </span>
                    <div className="mt-2 text-2xs text-emerald-900 bg-emerald-100/80 py-1 px-2 rounded-lg font-semibold">
                      (~{Math.round(totalUreaBags * 50)} kg)
                    </div>
                  </div>

                  {/* Potash */}
                  <div className="bg-sky-50/90 border border-sky-200/90 rounded-2xl p-4 text-center shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-900 block mb-1">
                      {lang === 'mr' ? 'पोटॅश (MOP 60% K)' : 'Potash (MOP)'}
                    </span>
                    <span className="text-3xl font-black text-sky-950 font-serif">
                      {totalMopBags}
                    </span>
                    <span className="text-xs text-stone-600 block mt-0.5 font-medium">
                      {t.bags || 'पोती (50 kg)'}
                    </span>
                    <div className="mt-2 text-2xs text-sky-900 bg-sky-100/80 py-1 px-2 rounded-lg font-semibold">
                      (~{Math.round(totalMopBags * 50)} kg)
                    </div>
                  </div>
                </div>
              ) : (
                /* Complex Grade Card */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-center shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                      {currentFertPreset.complexType} {lang === 'mr' ? 'मिश्र खत' : 'Complex'}
                    </span>
                    <span className="text-3xl font-black text-amber-950 font-serif">
                      {totalComplexBags}
                    </span>
                    <span className="text-xs text-stone-600 block mt-0.5 font-medium">
                      {t.bags || 'पोती (50 kg)'}
                    </span>
                    <div className="mt-2 text-2xs text-amber-900 bg-amber-100/80 py-1 px-2 rounded-lg font-semibold">
                      (~{Math.round(totalComplexBags * 50)} kg)
                    </div>
                  </div>

                  <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 text-center shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                      {lang === 'mr' ? 'युरिया (नत्र पुरवठा)' : 'Urea (Top Dressing)'}
                    </span>
                    <span className="text-3xl font-black text-emerald-950 font-serif">
                      {totalUreaBags}
                    </span>
                    <span className="text-xs text-stone-600 block mt-0.5 font-medium">
                      {t.bags || 'पोती (50 kg)'}
                    </span>
                    <div className="mt-2 text-2xs text-emerald-900 bg-emerald-100/80 py-1 px-2 rounded-lg font-semibold">
                      (~{Math.round(totalUreaBags * 50)} kg)
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Nutrients / Sulphur badge */}
              {totalSecondaryKg > 0 && (
                <div className="bg-white/80 p-3.5 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">
                    + {lang === 'mr' ? currentFertPreset.secondaryNameMr : currentFertPreset.secondaryNameEn}:
                  </span>
                  <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {totalSecondaryKg} kg
                  </span>
                </div>
              )}

              {/* Application Timetable */}
              <div className="bg-white/85 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-2.5">
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'mr' ? 'खते देण्याची शिफारस वेळ व विभागणी:' : 'Recommended Application Schedule:'}</span>
                </h4>
                <div className="space-y-1.5 text-xs text-stone-700">
                  {(lang === 'mr' ? currentFertPreset.splitInfoMr : currentFertPreset.splitInfoEn).map((info, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {info}
                    </p>
                  ))}
                </div>
              </div>

              {/* How is this calculated */}
              <div className="border-t border-emerald-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-stone-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-700" />
                    <span>{t.howIsCalculated || (lang === 'mr' ? 'हे कसे मोजले गेले?' : 'How is this calculated?')}</span>
                  </span>
                  {showHowCalculated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowCalculated && (
                  <div className="mt-3 bg-white/90 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
                    <p className="font-bold text-stone-900">
                      {lang === 'mr' ? 'सूत्र (Calculation Formula):' : 'Formula:'}
                    </p>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      एकूण खत (पोती) = क्षेत्र (एकर) × प्रति एकर शिफारस पोती × जमीन सुपीकता घटक
                    </code>
                    <p>
                      १. क्षेत्र: {fertArea} {fertUnit} (≈ {fertAcres.toFixed(2)} एकर)
                    </p>
                    <p>
                      २. सुपीकता घटक: {soilFertility === 'low' ? '१.१५ (हलकी जमीन +१५%)' : soilFertility === 'high' ? '०.९० (काळी जमीन -१०%)' : '१.० (मध्यम जमीन)'}
                    </p>
                    <p className="text-2xs text-stone-500 italic">
                      {t.adviceNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. WATER / IRRIGATION CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeCalc === 'water' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-5 bg-[#fafcf8] rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-700" />
                <span>{lang === 'mr' ? 'सिंचन व पंप माहिती' : 'Irrigation & Pump Settings'}</span>
              </h3>

              {/* Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'mr' ? 'जमीन क्षेत्र (Area)' : 'Land Area'}
                  </label>
                  <span className="text-2xs text-stone-500 font-medium">
                    {lang === 'mr' ? 'एकक:' : 'Unit:'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {(['acre', 'guntha', 'hectare'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setWaterUnit(unit)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        waterUnit === unit
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {unit === 'acre' 
                        ? (lang === 'mr' ? 'एकर' : 'Acre')
                        : unit === 'guntha'
                        ? (lang === 'mr' ? 'गुंठा' : 'Guntha')
                        : (lang === 'mr' ? 'हेक्टर' : 'Hectare')}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={waterArea}
                  onChange={(e) => setWaterArea(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Irrigation Method */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'सिंचन पद्धत (Irrigation Method)' : 'Irrigation Method'}
                </label>
                <div className="space-y-2">
                  {IRRIGATION_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setIrrigationMethodId(m.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        irrigationMethodId === m.id
                          ? 'bg-sky-50/90 border-sky-600 ring-2 ring-sky-500/20 shadow-xs'
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-stone-900 block">
                          {lang === 'mr' ? m.nameMr : m.nameEn}
                        </span>
                        <span className="text-2xs text-stone-500 block">
                          {lang === 'mr' ? m.descMr : m.descEn}
                        </span>
                      </div>
                      <span className={`text-2xs font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        m.id === 'drip' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                        m.id === 'sprinkler' ? 'bg-sky-100 text-sky-900 border-sky-300' :
                        'bg-stone-100 text-stone-700 border-stone-300'
                      }`}>
                        {m.efficiency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pump Motor selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'मोटार / पंप क्षमता' : 'Pump / Motor Capacity'}
                </label>
                <select
                  value={pumpMotorId}
                  onChange={(e) => setPumpMotorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {PUMP_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === 'mr' ? p.nameMr : p.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Results */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#fdfbf7] via-[#f5fbfd] to-[#edf6f9] rounded-3xl p-6 sm:p-7 border border-sky-200/90 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold text-sky-800 bg-sky-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-sky-200">
                  {waterArea} {waterUnit === 'acre' ? (lang === 'mr' ? 'एकर' : 'Acres') : waterUnit === 'guntha' ? (lang === 'mr' ? 'गुंठे' : 'Gunthas') : (lang === 'mr' ? 'हेक्टर' : 'Hectares')} {lang === 'mr' ? 'सिंचन अंदाज' : 'Irrigation Estimate'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-serif">
                  {lang === 'mr' ? 'पाण्याची एकूण गरज व पंप वेळ:' : 'Estimated Water Volume & Pump Runtime:'}
                </h3>
              </div>

              {/* Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-sky-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800 block mb-1">
                    {lang === 'mr' ? 'एका पाळीसाठी एकूण पाणी' : 'Water Volume Per Irrigation'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-sky-950 font-serif">
                      {totalWaterLiters.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm font-bold text-stone-700">
                      {lang === 'mr' ? 'लिटर' : 'Liters'}
                    </span>
                  </div>
                  <span className="text-2xs text-stone-500 block mt-1">
                    (~{(totalWaterLiters / 1000).toFixed(1)} {lang === 'mr' ? 'हजार लिटर' : 'kilo liters'})
                  </span>
                </div>

                <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-sky-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                    {lang === 'mr' ? 'अंदाजित पंप चालवण्याची वेळ' : 'Estimated Pump Running Time'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-stone-900 font-serif">
                      {pumpRuntimeHours > 0 ? `${pumpRuntimeHours} ` : ''}
                    </span>
                    <span className="text-sm font-bold text-stone-700">
                      {pumpRuntimeHours > 0 ? (lang === 'mr' ? 'तास' : 'hrs') : ''}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-stone-900 font-serif ml-1">
                      {pumpRuntimeMins}
                    </span>
                    <span className="text-sm font-bold text-stone-700">
                      {lang === 'mr' ? 'मिनिटे' : 'mins'}
                    </span>
                  </div>
                  <span className="text-2xs text-sky-800 font-semibold block mt-1">
                    ({currentPump.nameMr.split(' ')[0]} {lang === 'mr' ? 'पंपानुसार' : 'pump capacity'})
                  </span>
                </div>
              </div>

              {/* Water Saving Banner */}
              <div className="bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      {lang === 'mr' ? currentIrrigation.savingMr : currentIrrigation.savingEn}
                    </span>
                    <span className="text-2xs text-emerald-800">
                      {lang === 'mr' ? 'पारंपरिक मोकाट पद्धतीच्या तुलनेत कार्यक्षमता.' : 'Efficiency compared to conventional flood method.'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold bg-emerald-200 text-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-300 shrink-0">
                  {currentIrrigation.efficiency}
                </span>
              </div>

              {/* How is this calculated */}
              <div className="border-t border-sky-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-stone-700 hover:text-sky-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-sky-700" />
                    <span>{t.howIsCalculated || (lang === 'mr' ? 'हे कसे मोजले गेले?' : 'How is this calculated?')}</span>
                  </span>
                  {showHowCalculated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowCalculated && (
                  <div className="mt-3 bg-white/90 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
                    <p className="font-bold text-stone-900">
                      {lang === 'mr' ? 'हिशोब तपशील (Formulas):' : 'Calculation details:'}
                    </p>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      १. एकूण पाणी = {waterAcres.toFixed(2)} एकर × {currentIrrigation.litersPerAcreCycle.toLocaleString()} लि./एकर = {totalWaterLiters.toLocaleString()} लिटर
                    </code>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      २. पंप वेळ = {totalWaterLiters.toLocaleString()} ÷ {currentPump.discharge.toLocaleString()} लि./तास = {pumpRuntimeHoursDecimal.toFixed(2)} तास ({pumpRuntimeHours} तास {pumpRuntimeMins} मिनिटे)
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. CROP COST CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeCalc === 'cost' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-6 bg-[#fafcf8] rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-800" />
                  <span>{lang === 'mr' ? 'प्रति एकर खर्चाचे तपशील (₹)' : 'Cultivation Cost Items / Acre (₹)'}</span>
                </span>
                <span className="text-2xs text-stone-500 font-medium">
                  {lang === 'mr' ? 'बदलू शकता' : 'Editable'}
                </span>
              </h3>

              {/* Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'mr' ? 'जमीन क्षेत्र (Area)' : 'Land Area'}
                  </label>
                  <span className="text-2xs text-stone-500 font-medium">
                    {lang === 'mr' ? 'एकक:' : 'Unit:'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {(['acre', 'guntha', 'hectare'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setCostUnit(unit)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        costUnit === unit
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {unit === 'acre' 
                        ? (lang === 'mr' ? 'एकर' : 'Acre')
                        : unit === 'guntha'
                        ? (lang === 'mr' ? 'गुंठा' : 'Guntha')
                        : (lang === 'mr' ? 'हेक्टर' : 'Hectare')}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={costArea}
                  onChange={(e) => setCostArea(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Expense Breakdown Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">
                    🚜 {lang === 'mr' ? 'नांगरणी व मशागत' : 'Tillage & Prep'} (₹)
                  </label>
                  <input
                    type="number"
                    value={tillageCost}
                    onChange={(e) => setTillageCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">
                    🌱 {lang === 'mr' ? 'बियाणे / रोपे खर्च' : 'Seeds / Seedlings'} (₹)
                  </label>
                  <input
                    type="number"
                    value={seedCost}
                    onChange={(e) => setSeedCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">
                    🧪 {lang === 'mr' ? 'रासायनिक व शेणखत' : 'Fertilizer & Manure'} (₹)
                  </label>
                  <input
                    type="number"
                    value={fertCost}
                    onChange={(e) => setFertCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">
                    🛡️ {lang === 'mr' ? 'कीटकनाशके व फवारणी' : 'Pesticides & Spray'} (₹)
                  </label>
                  <input
                    type="number"
                    value={sprayCost}
                    onChange={(e) => setSprayCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">
                    👥 {lang === 'mr' ? 'खुरपणी व मजूर खर्च' : 'Labour & Weeding'} (₹)
                  </label>
                  <input
                    type="number"
                    value={labourCost}
                    onChange={(e) => setLabourCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-stone-700 mb-1">
                    🌾 {lang === 'mr' ? 'काढणी व मळणी खर्च' : 'Harvest & Threshing'} (₹)
                  </label>
                  <input
                    type="number"
                    value={harvestCost}
                    onChange={(e) => setHarvestCost(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-stone-700 mb-1">
                  📦 {lang === 'mr' ? 'इतर खर्च (सिंचन वीज बिल, वाहतूक इ.)' : 'Other / Miscellaneous (Power, Transport)'} (₹)
                </label>
                <input
                  type="number"
                  value={otherCost}
                  onChange={(e) => setOtherCost(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-xs outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Right Results */}
            <div className="lg:col-span-6 bg-gradient-to-br from-[#fdfbf7] via-[#f7faf2] to-[#edf6ea] rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                  {costArea} {costUnit === 'acre' ? (lang === 'mr' ? 'एकर' : 'Acres') : costUnit === 'guntha' ? (lang === 'mr' ? 'गुंठे' : 'Gunthas') : (lang === 'mr' ? 'हेक्टर' : 'Hectares')} {lang === 'mr' ? 'एकूण खर्च' : 'Cost Breakdown'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-serif">
                  {lang === 'mr' ? 'अंदाजित एकूण उत्पादन खर्च:' : 'Total Cultivation Expenditure:'}
                </h3>
              </div>

              {/* Total Cost Highlight */}
              <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-emerald-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block mb-1">
                  {lang === 'mr' ? 'एकूण शेती खर्च' : 'Total Cultivation Cost'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-stone-950 font-serif">
                    ₹{totalCultivationCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-stone-100 text-xs font-bold text-stone-600">
                  <span>≈ ₹{perAcreSum.toLocaleString('en-IN')} / {lang === 'mr' ? 'एकर' : 'Acre'}</span>
                  <span>•</span>
                  <span>≈ ₹{costPerGuntha.toLocaleString('en-IN')} / {lang === 'mr' ? 'गुंठा' : 'Guntha'}</span>
                </div>
              </div>

              {/* Cost Category Mini Breakdown */}
              <div className="bg-white/85 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
                <h4 className="font-bold text-stone-900 mb-2">
                  {lang === 'mr' ? 'खर्चाची प्रमुख विभागणी (प्रति एकर):' : 'Key Expense Categories:'}
                </h4>
                <div className="space-y-1.5 text-stone-700">
                  <div className="flex justify-between">
                    <span>खते व बियाणे निविष्ठा (Inputs):</span>
                    <span className="font-bold text-stone-900">₹{(seedCost + fertCost + sprayCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>मशागत व मजुरी (Labour & Tillage):</span>
                    <span className="font-bold text-stone-900">₹{(tillageCost + labourCost + harvestCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>इतर किरकोळ खर्च (Misc):</span>
                    <span className="font-bold text-stone-900">₹{otherCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* How is this calculated */}
              <div className="border-t border-emerald-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-stone-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-700" />
                    <span>{t.howIsCalculated || (lang === 'mr' ? 'हे कसे मोजले गेले?' : 'How is this calculated?')}</span>
                  </span>
                  {showHowCalculated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowCalculated && (
                  <div className="mt-3 bg-white/90 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
                    <p className="font-bold text-stone-900">
                      {lang === 'mr' ? 'हिशोब सूत्र:' : 'Calculation Formula:'}
                    </p>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      एकूण खर्च = सर्व घटकांची बेरीज (₹{perAcreSum.toLocaleString('en-IN')}) × क्षेत्र ({costAcres.toFixed(2)} एकर)
                    </code>
                    <p className="font-semibold text-emerald-900">
                      = ₹{totalCultivationCost.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. YIELD & PROFIT CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeCalc === 'profit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-5 bg-[#fafcf8] rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-800" />
                <span>{lang === 'mr' ? 'उत्पादन, भाव व खर्च आकडे' : 'Yield, Price & Cost Inputs'}</span>
              </h3>

              {/* Crop */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {t.cropLabel || (lang === 'mr' ? 'पीक निवडा' : 'Select Crop')}
                </label>
                <select
                  value={profitCrop}
                  onChange={(e) => handleProfitCropChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="soybean">{lang === 'mr' ? 'सोयाबीन (Soybean)' : 'Soybean'}</option>
                  <option value="cotton">{lang === 'mr' ? 'कापूस (Cotton)' : 'Cotton'}</option>
                  <option value="jowar">{lang === 'mr' ? 'ज्वारी (Jowar / Jwar)' : 'Jowar / Sorghum'}</option>
                  <option value="bajra">{lang === 'mr' ? 'बाजरी (Bajra)' : 'Bajra / Pearl Millet'}</option>
                  <option value="rajma">{lang === 'mr' ? 'राजमा (Rajma)' : 'Rajma / French Bean'}</option>
                  <option value="tur">{lang === 'mr' ? 'तूर / अरहर (Tur / Arhar)' : 'Tur / Pigeon Pea'}</option>
                  <option value="moong">{lang === 'mr' ? 'मूग (Moong)' : 'Moong / Green Gram'}</option>
                  <option value="udid">{lang === 'mr' ? 'उडीद (Udid / Black Gram)' : 'Udid / Black Gram'}</option>
                  <option value="gram">{lang === 'mr' ? 'हरभरा / चणा (Gram / Chana)' : 'Gram / Chickpea'}</option>
                  <option value="groundnut">{lang === 'mr' ? 'भुईमूग (Groundnut)' : 'Groundnut / Peanut'}</option>
                  <option value="sunflower">{lang === 'mr' ? 'सूर्यफूल (Sunflower)' : 'Sunflower'}</option>
                  <option value="safflower">{lang === 'mr' ? 'करडई (Safflower / Kardi)' : 'Safflower / Kardi'}</option>
                  <option value="wheat">{lang === 'mr' ? 'गहू (Wheat)' : 'Wheat'}</option>
                  <option value="maize">{lang === 'mr' ? 'मका (Maize)' : 'Maize (Corn)'}</option>
                  <option value="onion">{lang === 'mr' ? 'कांदा (Onion)' : 'Onion'}</option>
                  <option value="ginger">{lang === 'mr' ? 'आले / अद्रक (Ginger)' : 'Ginger'}</option>
                  <option value="sugarcane">{lang === 'mr' ? 'ऊस (Sugarcane)' : 'Sugarcane'}</option>
                  <option value="custom">{lang === 'mr' ? 'इतर पीक (Custom)' : 'Custom Crop'}</option>
                </select>
              </div>

              {/* Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'mr' ? 'जमीन क्षेत्र (Area)' : 'Land Area'}
                  </label>
                  <span className="text-2xs text-stone-500 font-medium">
                    {lang === 'mr' ? 'एकक:' : 'Unit:'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  {(['acre', 'guntha', 'hectare'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setProfitUnit(unit)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        profitUnit === unit
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {unit === 'acre' 
                        ? (lang === 'mr' ? 'एकर' : 'Acre')
                        : unit === 'guntha'
                        ? (lang === 'mr' ? 'गुंठा' : 'Guntha')
                        : (lang === 'mr' ? 'हेक्टर' : 'Hectare')}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min="0.1"
                  step="0.25"
                  value={profitArea}
                  onChange={(e) => setProfitArea(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Expected Yield */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? 'अपेक्षित उत्पादन प्रति एकर' : 'Expected Yield / Acre'} ({lang === 'mr' ? 'क्विंटल' : 'Quintals'})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={profitYieldPerAcre}
                  onChange={(e) => setProfitYieldPerAcre(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-sm outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Expected Price */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? 'अपेक्षित बाजार भाव' : 'Expected Market Price'} (₹ / {lang === 'mr' ? 'क्विंटल' : 'Quintal'})
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={profitPricePerQuintal}
                  onChange={(e) => setProfitPricePerQuintal(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-sm outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Cost per Acre */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? 'लागवड खर्च प्रति एकर (₹)' : 'Cultivation Cost / Acre (₹)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={profitCostPerAcre}
                  onChange={(e) => setProfitCostPerAcre(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-sm outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Right Results */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#fdfbf7] via-[#f7faf2] to-[#edf6ea] rounded-3xl p-6 sm:p-7 border border-emerald-200/90 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                  {profitArea} {profitUnit === 'acre' ? (lang === 'mr' ? 'एकर' : 'Acres') : profitUnit === 'guntha' ? (lang === 'mr' ? 'गुंठे' : 'Gunthas') : (lang === 'mr' ? 'हेक्टर' : 'Hectares')} {lang === 'mr' ? 'आर्थिक ताळेबंद' : 'Financial Forecast'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-serif">
                  {lang === 'mr' ? 'अपेक्षित उत्पन्न व निव्वळ नफा:' : 'Estimated Revenue & Net Profit:'}
                </h3>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Total Yield */}
                <div className="bg-white/90 p-4 rounded-2xl border border-stone-200">
                  <span className="text-xs text-stone-500 font-bold block">
                    {lang === 'mr' ? 'एकूण अंदाजित उत्पादन' : 'Total Expected Output'}
                  </span>
                  <span className="text-2xl font-black text-stone-900 font-serif">
                    {totalYieldQuintals} {lang === 'mr' ? 'क्विंटल' : 'Quintals'}
                  </span>
                  <span className="text-2xs text-stone-400 block mt-1">
                    ({profitAcres.toFixed(2)} एकर × {profitYieldPerAcre} क्विंटल)
                  </span>
                </div>

                {/* Gross Revenue */}
                <div className="bg-white/90 p-4 rounded-2xl border border-stone-200">
                  <span className="text-xs text-stone-500 font-bold block">
                    {t.totalRevenue || (lang === 'mr' ? 'एकूण अंदाजित उत्पन्न' : 'Total Revenue')}
                  </span>
                  <span className="text-2xl font-black text-emerald-800 font-serif">
                    ₹{grossRevenue.toLocaleString('en-IN')}
                  </span>
                  <span className="text-2xs text-stone-400 block mt-1">
                    (@ ₹{profitPricePerQuintal.toLocaleString('en-IN')} / क्विंटल)
                  </span>
                </div>

                {/* Total Cost */}
                <div className="bg-white/90 p-4 rounded-2xl border border-stone-200">
                  <span className="text-xs text-stone-500 font-bold block">
                    {t.estimatedCost || (lang === 'mr' ? 'अंदाजे उत्पादन खर्च' : 'Estimated Cost')}
                  </span>
                  <span className="text-2xl font-black text-rose-800 font-serif">
                    ₹{totalProfitCost.toLocaleString('en-IN')}
                  </span>
                  <span className="text-2xs text-stone-400 block mt-1">
                    ({profitAcres.toFixed(2)} एकर × ₹{profitCostPerAcre.toLocaleString('en-IN')})
                  </span>
                </div>

                {/* Net Profit */}
                <div className={`p-4 rounded-2xl border shadow-sm ${
                  netProfit >= 0
                    ? 'bg-gradient-to-br from-emerald-800 to-teal-900 text-white border-emerald-700'
                    : 'bg-rose-800 text-white border-rose-700'
                }`}>
                  <span className="text-xs uppercase tracking-wider font-bold block opacity-90">
                    {t.netProfit || (lang === 'mr' ? 'निव्वळ नफा (अंदाजे)' : 'Estimated Net Profit')}
                  </span>
                  <span className="text-3xl font-black font-serif block mt-0.5">
                    ₹{netProfit.toLocaleString('en-IN')}
                  </span>
                  <div className="mt-1 pt-1 border-t border-white/20 text-2xs flex items-center justify-between font-medium opacity-90">
                    <span>{profitAcres > 0 ? `₹${profitPerAcre.toLocaleString('en-IN')} / एकर` : ''}</span>
                    <span>ROI: {roiPercent}%</span>
                  </div>
                </div>
              </div>

              {/* How is this calculated */}
              <div className="border-t border-emerald-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-stone-700 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-700" />
                    <span>{t.howIsCalculated || (lang === 'mr' ? 'हे कसे मोजले गेले?' : 'How is this calculated?')}</span>
                  </span>
                  {showHowCalculated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowCalculated && (
                  <div className="mt-3 bg-white/90 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
                    <p className="font-bold text-stone-900">
                      {lang === 'mr' ? 'नफा हिशोब सूत्र:' : 'Formulas:'}
                    </p>
                    <p>१. एकूण उत्पन्न = {totalYieldQuintals} क्विंटल × ₹{profitPricePerQuintal} = ₹{grossRevenue.toLocaleString('en-IN')}</p>
                    <p>२. एकूण खर्च = {profitAcres.toFixed(2)} एकर × ₹{profitCostPerAcre} = ₹{totalProfitCost.toLocaleString('en-IN')}</p>
                    <p className="font-bold text-emerald-950">३. निव्वळ नफा = उत्पन्न (₹{grossRevenue.toLocaleString('en-IN')}) - खर्च (₹{totalProfitCost.toLocaleString('en-IN')}) = ₹{netProfit.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. SPRAY / PESTICIDE MIXING CALCULATOR VIEW */}
        {/* ------------------------------------------------------------- */}
        {activeCalc === 'spray' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-5 bg-[#fafcf8] rounded-2xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center gap-2">
                <SprayCan className="w-4 h-4 text-indigo-700" />
                <span>{lang === 'mr' ? 'पंप टाकी व औषध प्रमाण' : 'Spray Equipment & Dosage'}</span>
              </h3>

              {/* Equipment Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'फवारणी साधन / टाकीची क्षमता' : 'Spray Equipment / Tank Size'}
                </label>
                <select
                  value={sprayEquipmentId}
                  onChange={(e) => setSprayEquipmentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-semibold text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {SPRAY_EQUIPMENTS.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {lang === 'mr' ? eq.nameMr : eq.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dosage type selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'औषधाचे शिफारस प्रमाण (Dosage Unit)' : 'Dosage Recommendation Unit'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSprayDoseType('ml_per_liter')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      sprayDoseType === 'ml_per_liter'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'mr' ? 'मिली प्रति लिटर (ml/L)' : 'ml per Liter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSprayDoseType('gm_per_liter')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      sprayDoseType === 'gm_per_liter'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'mr' ? 'ग्रॅम प्रति लिटर (gm/L)' : 'gm per Liter'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSprayDoseType('ml_per_tank')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      sprayDoseType === 'ml_per_tank'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'mr' ? 'मिली प्रति पंप (ml/pump)' : 'ml per Pump'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSprayDoseType('gm_per_tank')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-left ${
                      sprayDoseType === 'gm_per_tank'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {lang === 'mr' ? 'ग्रॅम प्रति पंप (gm/pump)' : 'gm per Pump'}
                  </button>
                </div>
              </div>

              {/* Dosage Value */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? 'औषधाची मात्रा (प्रमाण)' : 'Recommended Dose Value'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={sprayDoseValue}
                  onChange={(e) => setSprayDoseValue(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Spray Count Mode: Number of Tanks vs Land Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700">
                    {lang === 'mr' ? 'फवारणी व्याप्ती (Scope)' : 'Spray Area / Tanks'}
                  </label>
                  <div className="flex gap-1 text-2xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSprayCountMode('tanks')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        sprayCountMode === 'tanks' ? 'bg-indigo-700 text-white' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {lang === 'mr' ? 'पंप संख्या' : 'Tanks Count'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSprayCountMode('area')}
                      className={`px-2 py-0.5 rounded-md cursor-pointer ${
                        sprayCountMode === 'area' ? 'bg-indigo-700 text-white' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {lang === 'mr' ? 'जमीन क्षेत्र' : 'Area'}
                    </button>
                  </div>
                </div>

                {sprayCountMode === 'tanks' ? (
                  <div>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={sprayTankCount}
                      onChange={(e) => setSprayTankCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="text-2xs text-stone-500 block mt-1">
                      {lang === 'mr' ? 'उदा. ५ पंप किंवा २ बॅरल' : 'e.g. 5 tanks or 2 barrels'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-1.5 mb-2 bg-stone-100 p-1 rounded-xl border border-stone-200">
                      {(['acre', 'guntha', 'hectare'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setSprayAreaUnit(unit)}
                          className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                            sprayAreaUnit === unit ? 'bg-indigo-700 text-white shadow-xs' : 'text-stone-700'
                          }`}
                        >
                          {unit === 'acre' ? (lang === 'mr' ? 'एकर' : 'Acre') : unit === 'guntha' ? (lang === 'mr' ? 'गुंठा' : 'Guntha') : (lang === 'mr' ? 'हेक्टर' : 'Hectare')}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0.1"
                      step="0.25"
                      value={sprayArea}
                      onChange={(e) => setSprayArea(Math.max(0.1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 font-bold text-base outline-hidden focus:border-indigo-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Results */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#fdfbf7] via-[#f8f7fe] to-[#edf0f9] rounded-3xl p-6 sm:p-7 border border-indigo-200/90 shadow-sm space-y-5">
              <div>
                <span className="text-xs font-bold text-indigo-800 bg-indigo-100/90 px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-200">
                  {effectiveTanks} {currentSprayEq.capacityLiters <= 20 ? (lang === 'mr' ? 'पंप' : 'Pumps') : (lang === 'mr' ? 'टाक्या/बॅरल' : 'Tanks')} {lang === 'mr' ? 'फवारणी हिशोब' : 'Mixing Calculation'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-2 font-serif">
                  {lang === 'mr' ? 'अचूक औषध व पाण्याचे प्रमाण:' : 'Exact Chemical & Water Dosage:'}
                </h3>
              </div>

              {/* 3 Result Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Per Tank Dose */}
                <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-indigo-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                    {lang === 'mr' ? 'एका पंपासाठी / टाकीसाठी औषध' : 'Chemical Required Per Tank'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-indigo-950 font-serif">
                      {dosePerTank}
                    </span>
                    <span className="text-sm font-bold text-stone-700">
                      {doseUnitLabel}
                    </span>
                  </div>
                  <span className="text-2xs text-stone-500 block mt-1">
                    ({tankCapacity} {lang === 'mr' ? 'लिटर टाकीत मिसळावे' : 'Liters Tank'})
                  </span>
                </div>

                {/* Total Chemical */}
                <div className="bg-white/90 backdrop-blur-xs p-5 rounded-2xl border border-indigo-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                    {lang === 'mr' ? 'एकूण लागणारे औषध' : 'Total Chemical Needed'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-950 font-serif">
                      {totalChemicalNeeded}
                    </span>
                    <span className="text-sm font-bold text-stone-700">
                      {doseUnitLabel}
                    </span>
                  </div>
                  <span className="text-2xs text-stone-500 block mt-1">
                    ({effectiveTanks} {lang === 'mr' ? 'पंपांसाठी एकूण' : 'Tanks Total'})
                  </span>
                </div>
              </div>

              {/* Water Volume */}
              <div className="bg-white/80 p-3.5 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">
                  💧 {lang === 'mr' ? 'एकूण लागणारे पाणी:' : 'Total Water Volume:'}
                </span>
                <span className="font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 text-sm font-serif">
                  {totalSprayWaterLiters} {lang === 'mr' ? 'लिटर' : 'Liters'}
                </span>
              </div>

              {/* Safety Rules */}
              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{lang === 'mr' ? 'सुरक्षित फवारणीचे सुवर्ण नियम:' : 'Golden Spraying Rules:'}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-2xs sm:text-xs leading-relaxed text-stone-700">
                  <li>{lang === 'mr' ? 'फवारणी नेहमी सकाळी किंवा संध्याकाळी शांत हवेत करावी (कडक उन्हात टाळावी).' : 'Spray during early morning or late evening in calm weather.'}</li>
                  <li>{lang === 'mr' ? 'औषध मोजण्यासाठी अचूक मापाचा (Measuring Cap / Syringe) वापर करावा.' : 'Always use calibrated measuring caps for exact dosing.'}</li>
                  <li>{lang === 'mr' ? 'तोंड झाकणारा मास्क व हातमोजे वापरावेत, वाऱ्याच्या उलट दिशेने फवारू नये.' : 'Wear mask & gloves; never spray against wind direction.'}</li>
                </ul>
              </div>

              {/* How is this calculated */}
              <div className="border-t border-indigo-200/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-stone-700 hover:text-indigo-800 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-700" />
                    <span>{t.howIsCalculated || (lang === 'mr' ? 'हे कसे मोजले गेले?' : 'How is this calculated?')}</span>
                  </span>
                  {showHowCalculated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHowCalculated && (
                  <div className="mt-3 bg-white/90 p-4 rounded-2xl border border-stone-200 text-xs text-stone-700 space-y-2 leading-relaxed">
                    <p className="font-bold text-stone-900">
                      {lang === 'mr' ? 'हिशोब सूत्र:' : 'Formulas:'}
                    </p>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      १. एका पंपाचे औषध = टाकीची क्षमता ({tankCapacity} लि.) × डोस ({sprayDoseValue} {doseUnitLabel}/लि.) = {dosePerTank} {doseUnitLabel}
                    </code>
                    <code className="block bg-stone-100 p-2 rounded-xl text-2xs text-stone-800 font-mono">
                      २. एकूण औषध = {dosePerTank} {doseUnitLabel} × {effectiveTanks} पंप = {totalChemicalNeeded} {doseUnitLabel}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
