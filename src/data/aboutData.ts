import type { OwnerProfile, VerifiedBusinessInfo, BusinessStoryPrinciple } from '../types/index';

/**
 * Verified Single Source of Truth for Owner & Business Information.
 * Real verified data is strictly separated from temporary demonstration content.
 * Any future updates from the proprietor should be made here.
 */

export const ownerProfile: OwnerProfile = {
  name: 'Ganesh Shinde',
  nameMr: 'गणेश शिंदे',
  village: {
    en: 'Janegaon',
    mr: 'जानेगाव'
  },
  role: {
    en: 'Owner / Proprietor',
    mr: 'संचालक'
  },
  bio: {
    en: 'Ganesh Shinde is associated with Baliraja Krishi Seva Kendra, with this platform designed to present agricultural products, crop information, and practical information relevant to local farming needs.',
    mr: 'गणेश शिंदे हे बळीराजा कृषी सेवा केंद्राशी संबंधित असून, शेतकऱ्यांसाठी कृषी उत्पादने, पिकांची माहिती आणि स्थानिक शेतीच्या गरजांशी संबंधित मार्गदर्शन उपलब्ध करून देण्याच्या उद्देशाने हे व्यासपीठ उभारण्यात आले आहे.'
  },
  experience: {
    en: 'Agricultural guidance grounded in local crop requirements and practical field experience.',
    mr: 'स्थानिक शेतीच्या गरजा आणि प्रत्यक्ष अनुभवावर आधारित कृषी मार्गदर्शन.'
  },
  // Official verified portrait of the proprietor
  image: '/assets/owner.png',
  isDemoContent: false
};

export const verifiedBusinessInfo: VerifiedBusinessInfo = {
  businessNameEn: 'Baliraja Krishi Seva Kendra',
  businessNameMr: 'बळीराजा कृषी सेवा केंद्र',
  taglineEn: 'Agricultural information, products, and a trusted local connection.',
  taglineMr: 'शेतीसाठी माहिती, उत्पादने आणि विश्वासाचा आधार.',
  ownerNameEn: 'Ganesh Shinde',
  ownerNameMr: 'गणेश शिंदे',
  nativePlaceEn: 'Janegaon',
  nativePlaceMr: 'जानेगाव',
  shopAddressEn: 'Manglagwar Peth, Kaij, Dist. Beed, Maharashtra – 431123',
  shopAddressMr: 'मंगळवार पेठ, कैज, जि. बीड, महाराष्ट्र – ४३११२३',
  phone: '9881070520',
  whatsapp: '9881070520',
  email: 'shinde.krishi.director@baliraja.in',
  otherBusinessNameEn: 'Baliraja Jewellers',
  otherBusinessNameMr: 'बळीराजा ज्वेलर्स',
  otherBusinessNoteEn: 'Independent retail enterprise owned by the proprietor (Non-agricultural).',
  otherBusinessNoteMr: 'संचालकांशी संबंधित स्वतंत्र व्यावसायिक उपक्रम (गैर-कृषी).',
  location: {
    addressEn: 'Manglagwar Peth, Kaij, Dist. Beed, Maharashtra – 431123',
    addressMr: 'मंगळवार पेठ, कैज, जि. बीड, महाराष्ट्र – ४३११२३',
    cityEn: 'Kaij',
    cityMr: 'कैज',
    districtEn: 'Beed',
    districtMr: 'बीड',
    pincode: '431123',
    latitude: 18.7042,
    longitude: 75.9556,
    googleMapsEmbedUrl: 'https://maps.google.com/maps?q=18.7042,75.9556&t=&z=15&ie=UTF8&iwloc=&output=embed',
    googleMapsExternalUrl: 'https://www.google.com/maps/search/?api=1&query=Manglagwar+Peth%2C+Kaij%2C+Dist.+Beed%2C+Maharashtra+431123'
  },
  social: {
    whatsapp: '9881070520',
    // Instagram handle and URL intentionally undefined pending owner confirmation
    instagramUrl: undefined,
    instagramHandle: undefined
  }
};

export const businessStoryPrinciples: BusinessStoryPrinciple[] = [
  {
    id: 'trust',
    titleEn: 'Trust',
    titleMr: 'विश्वास',
    descriptionEn: 'Transparent, honest agricultural guidance built to support farmers without exaggerated claims or sales pressure.',
    descriptionMr: 'कोणत्याही खोट्या दाव्यांशिवाय किंवा अनावश्यक खर्चाशिवाय, शेतकऱ्यांच्या हिताचे व विश्वासाचे पारदर्शक मार्गदर्शन.',
    iconName: 'ShieldCheck'
  },
  {
    id: 'practical-information',
    titleEn: 'Practical Information',
    titleMr: 'योग्य माहिती',
    descriptionEn: 'Field-observed agronomic practices and timely recommendations tailored for actual crop stages and pest pressure.',
    descriptionMr: 'प्रत्यक्ष शेतातील अनुभवावर व शास्त्रीय माहितीवर आधारित पिकांच्या टप्प्यानुसार अचूक कृषी सल्ला.',
    iconName: 'BookOpen'
  },
  {
    id: 'farmer-needs',
    titleEn: 'Understanding Farmer Needs',
    titleMr: 'शेतकऱ्यांची गरज',
    descriptionEn: 'Deep comprehension of individual farm constraints, crop varieties, and local cultivation challenges.',
    descriptionMr: 'स्थानिक पिके, जमिनीचा पोत आणि शेतकऱ्यांच्या प्रत्यक्ष अडचणी समजून घेऊन आवश्यक तेच नियोजन.',
    iconName: 'Users'
  },
  {
    id: 'local-context',
    titleEn: 'Local Agricultural Context',
    titleMr: 'स्थानिक शेतीचा संदर्भ',
    descriptionEn: 'Advisory tuned directly to Marathwada & Kaij region\'s black cotton soil, rainfall variability, and climate.',
    descriptionMr: 'कैज परिसर व मराठवाड्यातील काळी जमीन, पावसाचे प्रमाण व स्थानिक हवामानानुसार पीक व्यवस्थापन.',
    iconName: 'MapPin'
  },
  {
    id: 'continued-guidance',
    titleEn: 'Continued Guidance',
    titleMr: 'सातत्यपूर्ण मार्गदर्शन',
    descriptionEn: 'Consistent partnership from sowing preparation through vegetative stages to final harvest.',
    descriptionMr: 'बियाणे निवडीपासून ते वाढीचे टप्पे, रोग नियंत्रण व काढणीपर्यंत संपूर्ण हंगामात सातत्यपूर्ण साथ.',
    iconName: 'Repeat'
  }
];
