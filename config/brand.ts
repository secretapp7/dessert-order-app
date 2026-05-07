export const brand = {
  name: "Dessert Studio",
  city: "Muscat",
  whatsappNumber: "+96879297772",
  instagramHandle: "@dessertstudio.om",
  currency: "OMR",
  fulfillmentLabels: {
    pickup: "Pickup",
    delivery: "Delivery",
  },
  heroTagline: "Premium home desserts, crafted fresh for your special moments.",
  heroDescription:
    "Order handcrafted tiramisu and jelly cheesecake in a few taps, then send your request directly on WhatsApp.",
  headerNote: "Pre-orders open daily",
  whatsappCtaLabel: "Order on WhatsApp",
  orderConfirmationNote:
    "Every order is confirmed on WhatsApp after we review date and availability.",
  importantNotes: [
    "Made fresh by pre-order.",
    "Best served chilled.",
    "Order is confirmed only after our WhatsApp reply.",
    "Delivery availability depends on your area.",
  ],
  howItWorks: [
    {
      title: "Choose dessert",
      description: "Pick between Tiramisu or Jelly Cheesecake from our signature menu.",
    },
    {
      title: "Pick size and date",
      description: "Select serving size, quantity, and the date you need your order.",
    },
    {
      title: "Send WhatsApp order",
      description: "Review details and send your order directly on WhatsApp in one tap.",
    },
  ],
} as const;
