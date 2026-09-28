import type { FieldVisitItem } from '../types/index.ts';

export type { FieldVisitItem };

/**
 * Data-driven array of verified field visit photographs.
 * New photos can easily be added to assets/visit/ and appended to this list.
 * Neutral, authentic descriptions matching verified visual context.
 */
export const fieldVisitItems: FieldVisitItem[] = [
  {
    id: 'visit-1',
    titleEn: 'Field Guidance',
    titleMr: 'शेतातील प्रत्यक्ष मार्गदर्शन',
    imageSrc: '/assets/visit/visit1.png',
    altEn: 'Founder of Baliraja providing on-field guidance to farmers',
    altMr: 'बळीराजाचे संस्थापक प्रत्यक्ष शेतात शेतकर्‍यांना मार्गदर्शन करताना',
    tagEn: 'Field Guidance',
    tagMr: 'शेतातील मार्गदर्शन'
  },
  {
    id: 'visit-2',
    titleEn: 'Farmer Interaction',
    titleMr: 'शेतकरी संवाद व चर्चा',
    imageSrc: '/assets/visit/visit2.png',
    altEn: 'Interactive discussion with local farmers in crop field',
    altMr: 'शेतकरी बांधवांशी प्रत्यक्ष शेतात संवाद व सल्ला',
    tagEn: 'Farmer Interaction',
    tagMr: 'शेतकरी संवाद'
  },
  {
    id: 'visit-3',
    titleEn: 'Crop Inspection',
    titleMr: 'पीक पाहणी व निरीक्षण',
    imageSrc: '/assets/visit/visit3.png',
    altEn: 'On-site crop inspection and growth assessment',
    altMr: 'शेतातील पिकांची प्रत्यक्ष पाहणी व वाढीचे सखोल निरीक्षण',
    tagEn: 'Crop Visit',
    tagMr: 'पीक पाहणी'
  },
  {
    id: 'visit-4',
    titleEn: 'Field Visit',
    titleMr: 'प्रत्यक्ष शेत भेट',
    imageSrc: '/assets/visit/visit4.png',
    altEn: 'Routine field visit evaluating crop condition',
    altMr: 'पिकांच्या सुदृढतेसाठी प्रत्यक्ष शेत भेट',
    tagEn: 'Field Visit',
    tagMr: 'शेत भेट'
  },
  {
    id: 'visit-5',
    titleEn: 'Agronomic Advisory',
    titleMr: 'शेतातील तंत्रज्ञान सल्ला',
    imageSrc: '/assets/visit/visit5.png',
    altEn: 'Direct agronomic consultation and field-tested advice',
    altMr: 'शेतातील प्रत्यक्ष कृषी सल्ला व शास्त्रशुद्ध मार्गदर्शन',
    tagEn: 'Field Advisory',
    tagMr: 'तंत्रज्ञान सल्ला'
  }
];
