import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I find pick-your-own farms near me?',
    answer:
      "Use our interactive map to discover farms near your location. Simply allow location access or enter your city, and we'll show you all nearby u-pick farms with distances, ratings, and available produce. You can filter by farm type and adjust the search radius to find exactly what you're looking for.",
  },
  {
    question: 'What types of farms can I find on PickAFarm?',
    answer:
      'PickAFarm features a wide variety of farms including Christmas tree farms, pumpkin patches, apple orchards, berry farms (strawberries, blueberries, raspberries), corn mazes, sunflower fields, vegetable farms, and maple syrup producers. Each farm listing includes details about available activities, seasonal offerings, and visitor amenities.',
  },
  {
    question: 'Are the farm hours and availability up to date?',
    answer:
      "Farm information is regularly updated by farm owners and our team. Each farm page shows current hours, seasonal availability, and opening/closing dates. We recommend calling ahead or checking the farm's website before visiting, especially during peak seasons or holidays, as hours may vary based on weather and crop availability.",
  },
  {
    question: 'Can I save farms to visit later?',
    answer:
      "Yes! Click the heart icon on any farm card to save it to your account. You'll need to sign up (it's free!) to save farms. Saved farms appear in your dashboard, and you'll receive notifications when farms update their hours, add new activities, or announce special events.",
  },
  {
    question: 'Do I need to make a reservation to visit a farm?',
    answer:
      "Reservation requirements vary by farm. Some farms accept walk-ins during open hours, while others require advance booking, especially during peak seasons like fall harvest or Christmas tree season. Check each farm's listing for their reservation policy, and look for farms marked with booking information.",
  },
  {
    question: 'How are farms verified on PickAFarm?',
    answer:
      'Farms with a verification badge have been confirmed by our team to be active, legitimate pick-your-own operations. We verify contact information, location, and operating status. Featured farms are highlighted businesses that maintain up-to-date information and provide exceptional visitor experiences based on reviews.',
  },
  {
    question: 'Can farm owners add or update their listing?',
    answer:
      "Absolutely! Farm owners can claim or add their farm for free. Use the 'List Your Farm' link in the navigation to get started. You'll be able to manage your farm's details, hours, photos, and communicate directly with visitors. It's a great way to reach families looking for agritourism experiences.",
  },
  {
    question: 'What should I bring when visiting a u-pick farm?',
    answer:
      "Most farms provide containers for picking, but bringing your own basket or bag can be helpful. Wear comfortable, weather-appropriate clothing and closed-toe shoes. Bring sunscreen, water, and cash (some farms don't accept cards). Check the farm's website or call ahead to confirm what to bring and any specific guidelines they have.",
  },
];

export function FAQSection() {
  // Generate Schema.org FAQPage markup
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Everything you need to know about finding and visiting pick-your-own farms
        </p>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Schema.org markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}
