import type { BusinessContactInfo, CropCalculatorProfile } from '../types';

export const cropCalculatorProfiles: CropCalculatorProfile[] = [
  {
    crop: 'सोयाबीन (Soybean)',
    recommendedNPKPerAcre: { n: 12, p: 24, k: 12 }, // kg/acre
    ureaBags: 0.5,
    dapBags: 1.0,
    mopBags: 0.4,
    avgYieldPerAcre: 10, // quintals
    avgPrice: 4700,
    costPerAcre: 16000
  },
  {
    crop: 'कापूस (Cotton)',
    recommendedNPKPerAcre: { n: 40, p: 20, k: 20 },
    ureaBags: 1.8,
    dapBags: 1.0,
    mopBags: 0.7,
    avgYieldPerAcre: 12,
    avgPrice: 7500,
    costPerAcre: 28000
  },
  {
    crop: 'कांदा (Onion)',
    recommendedNPKPerAcre: { n: 40, p: 20, k: 20 },
    ureaBags: 1.6,
    dapBags: 1.0,
    mopBags: 0.7,
    avgYieldPerAcre: 80,
    avgPrice: 2200,
    costPerAcre: 45000
  },
  {
    crop: 'गहू (Wheat)',
    recommendedNPKPerAcre: { n: 48, p: 24, k: 16 },
    ureaBags: 2.0,
    dapBags: 1.2,
    mopBags: 0.5,
    avgYieldPerAcre: 18,
    avgPrice: 2900,
    costPerAcre: 18000
  },
  {
    crop: 'ऊस (Sugarcane)',
    recommendedNPKPerAcre: { n: 100, p: 45, k: 45 },
    ureaBags: 4.5,
    dapBags: 2.2,
    mopBags: 1.5,
    avgYieldPerAcre: 60, // tons
    avgPrice: 3200, // per ton
    costPerAcre: 60000
  },
  {
    crop: 'आले / अद्रक (Ginger)',
    recommendedNPKPerAcre: { n: 75, p: 50, k: 50 },
    ureaBags: 3.2,
    dapBags: 2.5,
    mopBags: 1.8,
    avgYieldPerAcre: 100, // quintals
    avgPrice: 5500,
    costPerAcre: 85000
  }
];

export const businessPlaceholderInfo: BusinessContactInfo = {
  name: 'Baliraja Krishi Seva Kendra',
  nameMr: 'बळीराजा कृषी सेवा केंद्र',
  phonePlaceholder: '+91 9XXXXXXXXX',
  whatsappPlaceholder: '+91 9XXXXXXXXX',
  addressPlaceholder: 'Main Road, Taluka / District, Maharashtra',
  addressPlaceholderMr: 'मुख्य रस्ता, तालुका / जिल्हा, महाराष्ट्र',
  timingPlaceholder: 'Mon - Sat: 8:00 AM - 8:00 PM',
  timingPlaceholderMr: 'सोम - शनि: सकाळी ८:०० ते रात्री ८:००'
};
