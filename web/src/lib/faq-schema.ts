/**
 * FAQ Schema Generator
 * Generates Schema.org FAQPage structured data
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generate FAQPage schema for FAQ sections
 */
export function generateFAQSchema(faqs: FAQItem[], pageUrl: string, pageName?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(pageName && { name: pageName }),
    url: pageUrl,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Example FAQ data for common farm questions
 */
export const commonFarmFAQs: FAQItem[] = [
  {
    question: "What does 'pick-your-own' mean?",
    answer:
      "Pick-your-own (U-Pick) means you can harvest fresh produce directly from the farm. You pay for what you pick, often at a lower price than store-bought produce. It's a fun, family-friendly activity that lets you enjoy fresh, seasonal fruits and vegetables.",
  },
  {
    question: 'When is the best time to visit a pick-your-own farm?',
    answer:
      'The best time depends on what you want to pick. Strawberries are typically available in June-July, blueberries in July-August, apples in September-October, and pumpkins in October. Christmas trees are available November-December. Always call ahead to confirm availability and hours.',
  },
  {
    question: 'What should I bring to a u-pick farm?',
    answer:
      "Bring sunscreen, water, comfortable shoes suitable for walking on uneven terrain, and containers for your produce (many farms provide containers). Consider bringing hats, bug spray, and hand sanitizer. Check the farm's website for specific recommendations.",
  },
  {
    question: 'Are pick-your-own farms suitable for young children?',
    answer:
      'Yes! Most u-pick farms are family-friendly and welcome children. Many offer additional activities like playgrounds, farm animals, hay rides, and picnic areas. Supervise young children closely, especially around farm equipment and animals.',
  },
  {
    question: 'Do I need to make a reservation?',
    answer:
      "It depends on the farm. Some farms require reservations, especially during peak seasons, while others welcome walk-ins. Check the farm's website or call ahead to confirm their policy and ensure they have produce available for picking.",
  },
];

/**
 * Generate FAQ schema for homepage
 */
export function generateHomepageFAQSchema() {
  return generateFAQSchema(
    commonFarmFAQs,
    'https://pickafarm.com/',
    'Frequently Asked Questions About Pick-Your-Own Farms'
  );
}
