import type { FieldExperience } from '../types/index';

/**
 * BALIRAJA KRISHI SEVA KENDRA — Field Experience & Agricultural Observations
 * 
 * IMPORTANT NOTE ON SAMPLE CONTENT:
 * In accordance with prompt requirements and responsible agricultural communication,
 * these records represent realistic agronomic field observations and crop-care practices.
 * There are ZERO fake customer reviews, fabricated farmer names, fake phone numbers,
 * fake yield percentages, or guaranteed outcome claims.
 * All demonstration records are explicitly marked with `isSample: true`.
 */
export const fieldExperiences: FieldExperience[] = [
  {
    id: 'fe-ginger-rhizome-drainage',
    cropKey: 'ginger',
    cropNameEnglish: 'Ginger',
    cropNameMarathi: 'आले (अद्रक)',
    titleEnglish: 'Ginger Rhizome Rot Prevention & Raised-Bed Drainage Practice',
    titleMarathi: 'आले पिकातील कंद कुज प्रतिबंध आणि गादीवाफा निचरा पद्धत',
    summaryEnglish: 'Field observations on maintaining 12-15 inch raised beds and timely root-zone bio-treatments during heavy monsoon spells to protect active rhizomes.',
    summaryMarathi: 'अति पावसाच्या काळात पाण्याचा निचरा न होणाऱ्या जमिनीत किमान १२-१५ इंच गादीवाफा व जैविक घटकांची वेळेवर आळवणी उपयुक्त ठरल्याचे शेतातील निरीक्षण.',
    observationEnglish: 'In continuous monsoon showers, stagnant moisture around root-zones creates anaerobic conditions that rapidly accelerate fungal Pythium/Fusarium rhizome rot. Maintaining elevated beds with free-flowing cross trenches dramatically reduces rhizome water-logging.',
    observationMarathi: 'सततच्या पावसात मुळांभोवती पाणी साचून राहिल्यास हवा खेळती राहत नाही आणि कंदकुज (Rhizome Rot) व मर रोगाच्या बुरशीचा प्रादुर्भाव वेगाने वाढतो. १२-१५ इंच उंच गादीवाफा असल्यास अतिरिक्त पाण्याचा निचरा तातडीने होतो.',
    practiceEnglish: '1. Ensure pre-planting seed rhizome treatment with certified fungicide/bio-agent.\n2. Create drainage channels across slopes before the onset of monsoon.\n3. At the first sign of yellowing or collar softening, drench the root zone with recommended systemic fungicide and bio-fungicides.',
    practiceMarathi: '१. लागवडीपूर्वी शिफारशीत बुरशीनाशक व जैविक घटकांद्वारे बेणेप्रक्रिया करणे.\n२. पावसाळा सुरू होण्यापूर्वी शेतातून पाणी वाहून जाण्यासाठी उताराला समांतर निचरा चर काढणे.\n३. पानांवर पिवळेपणा किंवा खोडाजवळ मऊपणा दिसताच त्वरित कृषी तज्ज्ञांच्या सल्ल्याने मुळांभोवती शिफारशीत आळवणी (Drenching) करणे.',
    seasonEnglish: 'Kharif Season',
    seasonMarathi: 'खरीप हंगाम',
    stageEnglish: 'Vegetative & Rhizome Formation (60–120 Days)',
    stageMarathi: 'शाकीय वाढ व कंद फुटवे अवस्था (६० ते १२० दिवस)',
    categoryKey: 'nutrition-protection',
    isSample: true,
    image: '/assets/videos/hero_poster.jpg',
    relatedProductIds: ['prod-sample-02', 'prod-sample-03'],
    keyInsightsEnglish: [
      'Elevated raised beds (12–15 inches) ensure healthy aeration',
      'Timely drenching at early symptoms is significantly more effective than late sprays',
      'Balanced potassium and organic matter support rhizome firmness'
    ],
    keyInsightsMarathi: [
      '१२ ते १५ इंच उंचीचा गादीवाफा मुळांना ऑक्सिजन मिळवून देण्यास मदत करतो',
      'प्राथमिक लक्षणे दिसताच केलेली आळवणी ही नंतरच्या फवारणीपेक्षा अधिक फायदेशीर ठरते',
      'समतोल पोटॅश व सेंद्रिय खतांचा वापर कंदाची ताकद वाढवतो'
    ]
  },
  {
    id: 'fe-soybean-pest-scouting',
    cropKey: 'soybean',
    cropNameEnglish: 'Soybean',
    cropNameMarathi: 'सोयाबीन',
    titleEnglish: 'Soybean Stem Fly & Girdle Beetle Early Scouting at Flowering',
    titleMarathi: 'सोयाबीनमध्ये फुलोऱ्याच्या अवस्थेत खोडकिडी व चक्रीभुंग्याचे वेळेवर निरीक्षण',
    summaryEnglish: 'Systematic field scouting during the transition from vegetative to flowering stage to detect girdle beetle girdles and stem fly punctures before economic thresholds are breached.',
    summaryMarathi: 'फुलोरा आणि शेंगा भरण्याच्या टप्प्यावर झाडाच्या पानांचे व खोडाचे नियमित निरीक्षण करून चक्रीभुंग्याच्या प्रादुर्भावाचे वेळेवर नियंत्रण करणे.',
    observationEnglish: 'Extended rain gaps in July-August create dry spells that favor stem fly and girdle beetle multiplication. In severe cases, girdle beetle ringing prevents sap flow, causing flower drops and stunted pods.',
    observationMarathi: 'जुलै-ऑगस्ट दरम्यान पावसाचा खंड पडल्यास कोरड्या हवामानात खोडकिडी व चक्रीभुंग्याचा प्रादुर्भाव वेगाने वाढतो. चक्रीभुंगा पानांच्या देठावर किंवा खोडावर बांगडीसारखे काप देतो, ज्यामुळे अन्नरस खंडित होऊन फुले गळतात.',
    practiceEnglish: '1. Scout the crop twice a week during early flowering.\n2. Collect and destroy affected wilted twigs showing ring cuts.\n3. Apply authorized selective insecticide only when infestation exceeds the economic threshold level (ETL).',
    practiceMarathi: '१. फुलोऱ्याच्या सुरुवातीला आठवड्यातून किमान दोन वेळा शेताची पाहणी करणे.\n२. चक्री कापलेली व वाळलेली पाने तोडून नष्ट करणे.\n३. प्रादुर्भाव आर्थिक नुकसानीच्या पातळीच्या (ETL) वर गेल्यासच अधिकृत शिफारशीत कीटकनाशकाची वेळेवर फवारणी करणे.',
    seasonEnglish: 'Kharif Season',
    seasonMarathi: 'खरीप हंगाम',
    stageEnglish: 'Flowering to Pod Setting (40–65 Days)',
    stageMarathi: 'फुलोरा व शेंगा धारणा अवस्था (४० ते ६५ दिवस)',
    categoryKey: 'crop-protection',
    isSample: true,
    image: '/assets/products/insecticide-sample.png',
    relatedProductIds: ['prod-sample-04'],
    keyInsightsEnglish: [
      'Scout early morning or late afternoon for accurate insect counts',
      'Avoid high-dose nitrogen when pest pressure is active',
      'Follow integrated pest management (IPM) practices'
    ],
    keyInsightsMarathi: [
      'कीड मोजण्यासाठी सकाळच्या किंवा संध्याकाळच्या वेळी शेताची पाहणी उपयुक्त ठरते',
      'किडींचा प्रादुर्भाव असताना युरियाचा बेसुमार वापर टाळावा',
      'एकात्मिक कीड नियंत्रण पद्धतीचा अवलंब करावा'
    ]
  },
  {
    id: 'fe-cotton-square-drop',
    cropKey: 'cotton',
    cropNameEnglish: 'Cotton',
    cropNameMarathi: 'कापूस',
    titleEnglish: 'Cotton Sucking Pest Management & Square Retention Practice',
    titleMarathi: 'कापूस पिकात रसशोषक किडींचे नियंत्रण व पातेगळ प्रतिबंधक नियोजन',
    summaryEnglish: 'Field observations on managing jassids and thrips during square initiation, complemented by balanced micronutrient sprays to maximize boll retention.',
    summaryMarathi: 'पाते लागवडीच्या संवेदनशील टप्प्यावर मावा, तुडतुडे या रसशोषक किडींचा बंदोबस्त आणि सूक्ष्म अन्नद्रव्यांचा समतोल वापर करून पातेगळ रोखण्याचे नियोजन.',
    observationEnglish: 'Heavy cloud cover and high relative humidity trigger spikes in sucking pest populations, which curl leaf margins downwards and starve young squares, leading to substantial square shedding.',
    observationMarathi: 'सतत ढगाळ वातावरण आणि दमट हवेमुळे मावा व तुडतुडे पानांच्या खालून रस शोषून घेतात. पाने वाकडी होतात आणि अन्नद्रव्यांचा पुरवठा न झाल्यामुळे कोवळी पाते पिवळी पडून गळतात.',
    practiceEnglish: '1. Install 8-10 yellow and blue sticky traps per acre.\n2. Ensure balanced basal fertilizer; avoid excess vegetative growth.\n3. Foliar spray of authorized boron and calibrated micronutrients at square formation upon local agronomist advice.',
    practiceMarathi: '१. प्रति एकरी ८ ते १० पिवळे व निळे चिकट सापळे शेतात लावावेत.\n२. रासायनिक खतांचा समतोल राखावा; झाडांची अवाजवी शाकीय वाढ होणार नाही याची काळजी घ्यावी.\n३. पाते लागताना बोरॉन व सूक्ष्म अन्नद्रव्यांची शिफारशीत मात्रेत फवारणी करावी.',
    seasonEnglish: 'Kharif Season',
    seasonMarathi: 'खरीप हंगाम',
    stageEnglish: 'Square & Early Boll Formation (50–90 Days)',
    stageMarathi: 'पाते व बोंड लागवड अवस्था (५० ते ९० दिवस)',
    categoryKey: 'nutrition-protection',
    isSample: true,
    image: '/assets/products/fertilizers/fertilizer-sample.png',
    relatedProductIds: ['prod-sample-01', 'prod-sample-04'],
    keyInsightsEnglish: [
      'Sticky traps provide early warning before visual crop distress occurs',
      'Micronutrients during square formation improve retention',
      'Water management during boll swelling is vital'
    ],
    keyInsightsMarathi: [
      'चिकट सापळ्यांमुळे किडींच्या आगमनाची आधीच माहिती मिळते',
      'पाते लागताना सूक्ष्म अन्नद्रव्यांची मात्रा पाते गळ रोखण्यास मदत करते',
      'बोंड भरताना जमिनीत योग्य ओलावा असणे आवश्यक आहे'
    ]
  },
  {
    id: 'fe-vegetables-drip-fertigation',
    cropKey: 'vegetables',
    cropNameEnglish: 'Vegetables (Tomato / Chilli)',
    cropNameMarathi: 'भाजीपाला (टोमॅटो / मिरची)',
    titleEnglish: 'Vegetables Precision Drip Fertigation & Early Blight Vigilance',
    titleMarathi: 'भाजीपाला पिकात ठिबकद्वारे विद्राव्य खतांचे नियोजन व करपा प्रतिबंध',
    summaryEnglish: 'Splitting water-soluble nutrient doses through weekly drip schedules to maintain steady root development and minimize fungal blight risk.',
    summaryMarathi: 'टोमॅटो व मिरचीमध्ये पिकाच्या वयानुसार ठिबकमधून विद्राव्य खतांचे हप्ते विभागून देणे आणि पानांवरील करप्याचे वेळेवर नियंत्रण.',
    observationEnglish: 'Dumping heavy solid fertilizer near vegetable stem bases often burns feeding roots and creates open wounds for soil pathogens. Drip fertigation in small, regular intervals keeps plant immunity resilient against fungal blight.',
    observationMarathi: 'खोडालगत मोठ्या प्रमाणावर खतांचे ढीग दिल्यास पांढरी मुळे जळण्याचा धोका असतो आणि रोगांचा शिरकाव होतो. त्याऐवजी ठिबकमधून विभागून विद्राव्य खते दिल्यास झाडांची ताकद टिकून राहते व करपा रोगाचा प्रादुर्भाव कमी होतो.',
    practiceEnglish: '1. Follow a step-wise NPK fertigation schedule (19:19:19 in early vegetative, 12:61:0 during rooting/flowering, 13:0:45 during fruit maturity).\n2. Maintain consistent soil moisture; avoid drastic wet-dry cycles.\n3. Inspect lower leaves weekly for concentric fungal rings and apply recommended preventive fungicides.',
    practiceMarathi: '१. पिकाच्या अवस्थेनुसार १९:१९:१९, १२:६१:० आणि फळे भरताना १३:०:४५ खतांचे प्रमाण विभागून द्यावे.\n२. जमिनीतील ओलावा एकसारखा ठेवावा; मुळांना पाण्याचा ताण अथवा दलदल होऊ देऊ नये.\n३. खालच्या पानांवर काळे किंवा तपकिरी डाग दिसताच शिफारशीत बुरशीनाशकाची वेळेवर फवारणी करावी.',
    seasonEnglish: 'Rabi & Summer Seasons',
    seasonMarathi: 'रब्बी व उन्हाळी हंगाम',
    stageEnglish: 'Vegetative Growth to Fruiting (30–90 Days)',
    stageMarathi: 'शाकीय वाढ व फळधारणा अवस्था (३० ते ९० दिवस)',
    categoryKey: 'nutrition-protection',
    isSample: true,
    image: '/assets/products/fungicide-sample.png',
    relatedProductIds: ['prod-sample-01', 'prod-sample-03'],
    keyInsightsEnglish: [
      'Split micro-doses through drip outperform single heavy bulk applications',
      'Scouting bottom canopy leaves catches early blight before it spreads upwards',
      'Calcium and boron help prevent fruit-end cracking and blossom drop'
    ],
    keyInsightsMarathi: [
      'एकदाच जास्त खत देण्यापेक्षा ठिबकमधून थोडे-थोडे देणे जास्त फायदेशीर ठरते',
      'झाडाच्या खालच्या पानांचे निरीक्षण केल्यास करपा रोगाचा प्राथमिक टप्प्यातच बंदोबस्त होतो',
      'कॅल्शियम व बोरॉन फळ तडकणे आणि फुलगळ रोखण्यासाठी उपयुक्त ठरतात'
    ]
  },
  {
    id: 'fe-turmeric-nutrition-care',
    cropKey: 'turmeric',
    cropNameEnglish: 'Turmeric',
    cropNameMarathi: 'हळद',
    titleEnglish: 'Turmeric Rhizome Development & Micronutrient Balance',
    titleMarathi: 'हळद पिकात कंद वाढीचा काळ आणि सूक्ष्म अन्नद्रव्य व्यवस्थापन',
    summaryEnglish: 'Practical observations on potash application, soil earthing-up (माती लावणे), and foliage health during the 90 to 150-day development window.',
    summaryMarathi: 'हळदीमध्ये ९० ते १५० दिवसांच्या कालावधीत भर लावणे (माती लावणे) आणि कंद पोसण्यासाठी आवश्यक अन्नद्रव्यांचे समतोल नियोजन.',
    observationEnglish: 'Exposed rhizomes turning green due to sun exposure suffer in quality and weight. Earthing up soil around plants keeps growing fingers protected and cool, enabling maximum nutrient conversion.',
    observationMarathi: 'पाण्याच्या प्रवाहामुळे किंवा वाफ्यातील माती वाहून गेल्यामुळे हळदीचे कंद उघडे पडल्यास ते हिरवे पडतात व वजन घटते. वेळेवर भर लावून कंद मातीखाली झाकल्यास कंदांची जाडी व दर्जा सुधारतो.',
    practiceEnglish: '1. Complete earthing-up operation around 75–90 days with well-decomposed organic manure.\n2. Ensure adequate potash and sulfur to improve curcumin development and finger density.\n3. Scout for leaf spot (Colletotrichum) and spray authorized fungicide at first symptoms.',
    practiceMarathi: '१. लागवडीनंतर ७५ ते ९० दिवसांच्या दरम्यान शेणखताचा वापर करून झाडांना योग्य भर लावावी.\n२. कंद भरण्याच्या काळात पोटॅश व गंधकाचा समतोल ठेवावा.\n३. पानांवर तांबडे किंवा तपकिरी ठिपके दिसल्यास वेळेवर बुरशीनाशकाची फवारणी करावी.',
    seasonEnglish: 'Kharif to Rabi Season',
    seasonMarathi: 'खरीप ते रब्बी हंगाम',
    stageEnglish: 'Rhizome Development & Maturation (90–180 Days)',
    stageMarathi: 'कंद वाढ व भरणी अवस्था (९० ते १८० दिवस)',
    categoryKey: 'nutrition-protection',
    isSample: true,
    image: '/assets/products/combos/combo-sample.png',
    relatedProductIds: ['prod-sample-02'],
    keyInsightsEnglish: [
      'Earthing up protects growing rhizome fingers from sunlight and heat stress',
      'Sulfur aids quality, color, and curcumin content',
      'Keep field free of water stagnation during late monsoon'
    ],
    keyInsightsMarathi: [
      'वेळेवर भर लावल्याने हळदीचे कंद उन्हापासून सुरक्षित राहून वेगाने पोसतात',
      'गंधक (Sulfur) कंदाचा रंग व दर्जा सुधारण्यास मदत करतो',
      'पावसाळ्याच्या शेवटी जमिनीत पाणी साचणार नाही याची खबरदारी घ्यावी'
    ]
  }
];

