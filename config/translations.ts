export type AppLanguage = "en" | "ar";

type Translation = {
  languageLabel: string;
  nav: {
    home: string;
    menu: string;
    order: string;
    contact: string;
  };
  header: {
    waAria: string;
  };
  home: {
    welcomeTitle: string;
    brandTagline: string;
    heroSubtitle: string;
    signaturesTitle: string;
    featuredDessertLabel: string;
    browseMenu: string;
    orderNow: string;
    pillPreorder: string;
    pillChilled: string;
    pillWhatsappConfirm: string;
    searchPlaceholder: string;
    emptyCategory: string;
    categories: {
      cakes: string;
      cups: string;
      trays: string;
      offers: string;
      all: string;
    };
  };
  offers: {
    launchBoxTitle: string;
    launchBoxBody: string;
    browseOffers: string;
  };
  reviews: {
    lovedByCustomers: string;
    customerRatingCaption: string;
    reviewsWord: string;
    verifiedOrder: string;
    whatCustomersSay: string;
    noReviewsYet: string;
  };
  orderReview: {
    pageTitle: string;
    pageIntro: string;
    nameLabel: string;
    productLabel: string;
    ratingLabel: string;
    commentLabel: string;
    commentPlaceholder: string;
    submit: string;
    successTitle: string;
    successBody: string;
    invalidTitle: string;
    invalidBody: string;
    invalidLink: string;
    alreadyReviewedTitle: string;
    alreadyReviewed: string;
  };
  menu: {
    screenTitle: string;
  };
  contactPage: {
    screenTitle: string;
    locationLine: string;
    whatsappCta: string;
    instagramLabel: string;
    noteOrders: string;
    noteDelivery: string;
    whatsappPrefill: string;
    trustWhatsappTitle: string;
    trustWhatsappBody: string;
    trustInstagramTitle: string;
    trustInstagramBody: string;
    trustDeliveryTitle: string;
    trustDeliveryBody: string;
    trustPreorderTitle: string;
    trustPreorderBody: string;
    openInstagramProfile: string;
  };
  /** Short policy lines shown across order/contact/product/WhatsApp footers */
  businessNotes: {
    preorder24h: string;
    deliveryFeeWhatsApp: string;
    paymentWhatsApp: string;
  };
  faqSection: {
    title: string;
    items: readonly { readonly q: string; readonly a: string }[];
  };
  productCard: {
    startingFrom: string;
    view: string;
    soldOut: string;
  };
  productPage: {
    backToMenu: string;
    notFoundTitle: string;
    notFoundDescription: string;
    soldOutBadge: string;
    soldOutMessage: string;
    orderThisDessert: string;
    preorderNote: string;
    trustBadge: string;
    total: string;
    favoriteAria: string;
    shareAria: string;
    galleryHint: string;
    photoComingSoon: string;
  };
  form: {
    title: string;
    subtitle: string;
    summaryTitle: string;
    sectionCustomer: string;
    sectionDessert: string;
    sectionFulfillment: string;
    sectionDeliveryLocation: string;
    sectionNotes: string;
    customerName: string;
    phone: string;
    dessert: string;
    size: string;
    quantity: string;
    dateNeeded: string;
    fulfillment: string;
    deliveryLocation: string;
    pickupLocationOptional: string;
    deliveryPlaceholder: string;
    pickupPlaceholder: string;
    pickupDetailsWhatsappNote: string;
    useCurrentLocation: string;
    detectingLocation: string;
    locationAddedSuccess: string;
    openMap: string;
    googleMapsLinkLabel: string;
    pasteGoogleMapsLinkHint: string;
    addressDetailsLabel: string;
    addressDetailsPlaceholder: string;
    locationGpsLine: string;
    locationPastedLine: string;
    summaryLocationAdded: string;
    summaryFulfillmentLabel: string;
    notes: string;
    notesPlaceholder: string;
    estimatedTotal: string;
    sendWhatsapp: string;
    fallback: string;
    copyMessage: string;
    copied: string;
    pickupLocationShared: string;
    orderConfirmationNote: string;
    summarySizeLabel: string;
    summaryQtyLabel: string;
    fulfillmentOptions: {
      pickup: string;
      delivery: string;
    };
    summaryDessertSubtotal: string;
    summaryDeliveryFeeLabel: string;
    summaryDeliveryFeeConfirmed: string;
    summaryFulfillmentInline: string;
    summaryPickupLine: string;
    availabilityChecking: string;
    availabilityPickDate: string;
    availabilityBlockedSubmit: string;
    productUnavailable: string;
    chooseAnotherProduct: string;
  };
  validation: {
    fullName: string;
    phone: string;
    date: string;
    quantity: string;
    deliveryLocation: string;
    addressDetailsRequired: string;
    deliveryNeedMapOrDetail: string;
    mapsLinkInvalid: string;
    productRequired: string;
    sizeRequired: string;
    fulfillmentRequired: string;
  };
  footer: {
    location: string;
    preorder: string;
    igLine: string;
  };
  whatsappTemplate: {
    unspecified: string;
    none: string;
    newOrderHeading: string;
    name: string;
    phone: string;
    dessert: string;
    size: string;
    quantity: string;
    dateNeeded: string;
    orderType: string;
    location: string;
    notes: string;
    estimatedTotal: string;
  };
  whatsappOrder: {
    title: string;
    customerDetails: string;
    orderDetails: string;
    deliveryDetails: string;
    labelName: string;
    labelPhone: string;
    labelDessert: string;
    labelSize: string;
    labelQuantity: string;
    labelDateNeeded: string;
    labelOrderType: string;
    labelLocationLink: string;
    labelAddressDetails: string;
    labelNotes: string;
    labelEstimatedTotal: string;
    labelDessertSubtotal: string;
    pickupNote: string;
    locationGpsPrefix: string;
    locationPastedPrefix: string;
    none: string;
  };
  geolocation: {
    permissionDenied: string;
    positionError: string;
    notSupported: string;
    unknownError: string;
  };
  waPrefill: {
    hello: string;
  };
  orderSave: {
    saving: string;
    savedOpeningWhatsapp: string;
    saveFailed: string;
    whatsappWithoutSave: string;
  };
};

export const translations: Record<AppLanguage, Translation> = {
  en: {
    languageLabel: "العربية",
    nav: {
      home: "Home",
      menu: "Menu",
      order: "Order",
      contact: "Contact",
    },
    header: {
      waAria: "Open WhatsApp",
    },
    home: {
      welcomeTitle: "Coco Treats — home",
      brandTagline: "Fresh homemade treats in Muscat.",
      heroSubtitle: "Crafted for gifting, gatherings, and sweet moments.",
      signaturesTitle: "Today's signatures",
      featuredDessertLabel: "Featured dessert",
      browseMenu: "Browse menu",
      orderNow: "Order now",
      pillPreorder: "Pre-order",
      pillChilled: "Chilled",
      pillWhatsappConfirm: "WhatsApp confirmation",
      searchPlaceholder: "Search desserts…",
      emptyCategory: "Nothing here yet — try another category.",
      categories: {
        all: "All",
        cakes: "Cakes",
        cups: "Cups",
        trays: "Trays",
        offers: "Offers",
      },
    },
    offers: {
      launchBoxTitle: "Launch Box",
      launchBoxBody: "Mix Tiramisu and Jelly Cheesecake in your first Coco Treats box.",
      browseOffers: "Browse offers",
    },
    reviews: {
      lovedByCustomers: "Loved by customers",
      customerRatingCaption: "Customer rating",
      reviewsWord: "reviews",
      verifiedOrder: "Verified order",
      whatCustomersSay: "What customers say",
      noReviewsYet: "Customer reviews will appear here soon.",
    },
    orderReview: {
      pageTitle: "Share your experience",
      pageIntro: "Thank you for choosing Coco Treats. Your feedback helps us grow.",
      nameLabel: "Your name",
      productLabel: "Which dessert?",
      ratingLabel: "Your rating",
      commentLabel: "Your review",
      commentPlaceholder: "Tell us what you loved…",
      submit: "Submit review",
      successTitle: "Thank you!",
      successBody: "Your review was submitted and will appear soon.",
      invalidTitle: "Link not available",
      invalidBody: "This review link is invalid or has expired. If you need help, contact us on WhatsApp.",
      invalidLink: "We could not submit your review. Please check the link or contact us.",
      alreadyReviewedTitle: "Thank you",
      alreadyReviewed: "We already received your review.",
    },
    menu: {
      screenTitle: "Menu",
    },
    contactPage: {
      screenTitle: "Contact",
      locationLine: "Muscat",
      whatsappCta: "Order on WhatsApp",
      instagramLabel: "Instagram",
      noteOrders: "Orders are confirmed by WhatsApp reply.",
      noteDelivery: "Delivery depends on area and availability.",
      whatsappPrefill: "Hello Coco Treats, I would like to place an order.",
      trustWhatsappTitle: "WhatsApp orders",
      trustWhatsappBody: "At Coco Treats we confirm every treat on chat so timing and handoff stay clear.",
      trustInstagramTitle: "Instagram",
      trustInstagramBody: "Follow Coco Treats for new drops, behind-the-scenes trays, and sweet specials.",
      trustDeliveryTitle: "Delivery by area",
      trustDeliveryBody: "Fees and slots depend on distance and how busy the kitchen is.",
      trustPreorderTitle: "Pre-order helps",
      trustPreorderBody: "Prefer 24 hours’ notice when you can—we need that window to bake, chill, and finish beautifully.",
      openInstagramProfile: "Open Instagram",
    },
    businessNotes: {
      preorder24h: "Please order at least 24 hours in advance.",
      deliveryFeeWhatsApp: "Delivery fee will be confirmed on WhatsApp depending on the area.",
      paymentWhatsApp: "Payment method will be confirmed on WhatsApp.",
    },
    faqSection: {
      title: "Quick answers",
      items: [
        {
          q: "How early should I order?",
          a: "Preferably at least 24 hours ahead so we have time to prepare, chill, and pack everything nicely.",
        },
        {
          q: "Do you deliver?",
          a: "Yes across Muscat when slots allow. The route and timing are confirmed together on WhatsApp, with the fee quoted for your area.",
        },
        {
          q: "How do I pay?",
          a: "We’ll agree the easiest option quietly on WhatsApp once your order looks good — nothing complicated.",
        },
        {
          q: "How should I store the dessert?",
          a: "Keep it refrigerated and serve chilled unless we tell you otherwise. Best eaten within the first day or two.",
        },
        {
          q: "Can I customize my order?",
          a: "Mention tweaks in WhatsApp notes or in your message thread — small changes are fine when timing allows.",
        },
      ],
    },
    productCard: {
      startingFrom: "From",
      view: "View",
      soldOut: "Sold out",
    },
    productPage: {
      backToMenu: "Menu",
      notFoundTitle: "Dessert not found",
      notFoundDescription: "This item is not available right now.",
      soldOutBadge: "Sold out",
      soldOutMessage: "This dessert is currently sold out.",
      orderThisDessert: "Order this dessert",
      preorderNote: "Pre-order only",
      trustBadge: "Fresh by pre-order",
      total: "Total",
      favoriteAria: "Save to favorites",
      shareAria: "Share",
      galleryHint: "Gallery",
      photoComingSoon: "Photo coming soon",
    },
    form: {
      title: "Checkout",
      subtitle: "Review your order and send it on WhatsApp to Coco Treats.",
      summaryTitle: "Your selection",
      sectionCustomer: "Your details",
      sectionDessert: "Dessert",
      sectionFulfillment: "Pickup or delivery",
      sectionDeliveryLocation: "Delivery location",
      sectionNotes: "Notes",
      customerName: "Full name",
      phone: "Phone",
      dessert: "Dessert",
      size: "Size",
      quantity: "Quantity",
      dateNeeded: "Date needed",
      fulfillment: "How to receive",
      deliveryLocation: "Delivery address",
      pickupLocationOptional: "Pickup notes (optional)",
      deliveryPlaceholder: "Area, building, street",
      pickupPlaceholder: "Optional pickup details",
      pickupDetailsWhatsappNote: "Pickup details will be confirmed on WhatsApp.",
      useCurrentLocation: "Use my current location",
      detectingLocation: "Detecting location…",
      locationAddedSuccess: "Location added successfully.",
      openMap: "Open map",
      googleMapsLinkLabel: "Google Maps link",
      pasteGoogleMapsLinkHint: "Paste Google Maps link",
      addressDetailsLabel: "Address details",
      addressDetailsPlaceholder: "Area, building, street, nearby landmark…",
      locationGpsLine: "GPS link",
      locationPastedLine: "Shared Maps link",
      summaryLocationAdded: "Location added",
      summaryFulfillmentLabel: "Receive",
      notes: "Notes",
      notesPlaceholder: "Allergies, timing, sweetness…",
      estimatedTotal: "Est. total",
      sendWhatsapp: "Send order on WhatsApp",
      fallback: "WhatsApp did not open? Copy your order text below.",
      copyMessage: "Copy order text",
      copied: "Copied.",
      pickupLocationShared: "Pickup location to be shared",
      orderConfirmationNote: "Coco Treats will confirm on WhatsApp after we check the date.",
      summarySizeLabel: "Size",
      summaryQtyLabel: "Qty",
      fulfillmentOptions: {
        pickup: "Pickup",
        delivery: "Delivery",
      },
      summaryDessertSubtotal: "Desserts",
      summaryDeliveryFeeLabel: "Delivery fee",
      summaryDeliveryFeeConfirmed: "Confirmed on WhatsApp",
      summaryFulfillmentInline: "Fulfillment",
      summaryPickupLine: "Pickup • details on WhatsApp",
      availabilityChecking: "Checking date availability…",
      availabilityPickDate: "Pick a date to see if we still have capacity.",
      availabilityBlockedSubmit: "Choose an available date before sending to WhatsApp.",
      productUnavailable: "This dessert is not available for ordering right now.",
      chooseAnotherProduct: "Please choose another dessert from the menu.",
    },
    validation: {
      fullName: "Please enter your full name.",
      phone: "Please enter a valid phone number.",
      date: "Please choose a date.",
      quantity: "Quantity must be at least 1.",
      deliveryLocation: "Add enough detail to confirm your area.",
      addressDetailsRequired: "Please describe your delivery address.",
      deliveryNeedMapOrDetail:
        "Add a map link using the button above, paste a Maps link, or write a fuller address.",
      mapsLinkInvalid: "Please paste a valid link starting with http:// or https://",
      productRequired: "Please choose a dessert.",
      sizeRequired: "Please choose a size.",
      fulfillmentRequired: "Please choose pickup or delivery.",
    },
    footer: {
      location: "Location",
      preorder: "Coco Treats pre-orders",
      igLine: "Instagram",
    },
    whatsappTemplate: {
      unspecified: "Not specified",
      none: "None",
      newOrderHeading: "New order",
      name: "Name",
      phone: "Phone",
      dessert: "Dessert",
      size: "Size",
      quantity: "Qty",
      dateNeeded: "Date needed",
      orderType: "Order type",
      location: "Location",
      notes: "Notes",
      estimatedTotal: "Est. total",
    },
    whatsappOrder: {
      title: "New Coco Treats Order",
      customerDetails: "Customer Details",
      orderDetails: "Order Details",
      deliveryDetails: "Delivery Details",
      labelName: "Name",
      labelPhone: "Phone",
      labelDessert: "Dessert",
      labelSize: "Size",
      labelQuantity: "Quantity",
      labelDateNeeded: "Date needed",
      labelOrderType: "Order type",
      labelLocationLink: "Location link",
      labelAddressDetails: "Address details",
      labelNotes: "Notes",
      labelEstimatedTotal: "Estimated dessert total",
      labelDessertSubtotal: "Dessert subtotal",
      pickupNote: "Pickup details will be confirmed on WhatsApp.",
      locationGpsPrefix: "GPS:",
      locationPastedPrefix: "Shared link:",
      none: "—",
    },
    geolocation: {
      permissionDenied: "Location permission was denied. You can paste a Google Maps link instead.",
      positionError: "We could not detect your location. Please paste a map link or type your address.",
      notSupported: "We could not detect your location. Please paste a map link or type your address.",
      unknownError: "We could not detect your location. Please paste a map link or type your address.",
    },
    waPrefill: {
      hello: "Hello Coco Treats, I have a question about my order.",
    },
    orderSave: {
      saving: "Saving order...",
      savedOpeningWhatsapp: "Order saved. Opening WhatsApp…",
      saveFailed:
        "We could not save your order. Please try again or contact us on WhatsApp.",
      whatsappWithoutSave: "Send on WhatsApp anyway",
    },
  },
  ar: {
    languageLabel: "EN",
    nav: {
      home: "الرئيسية",
      menu: "القائمة",
      order: "الطلب",
      contact: "تواصل",
    },
    header: {
      waAria: "فتح واتساب",
    },
    home: {
      welcomeTitle: "كوكو تريتس — الرئيسية",
      brandTagline: "حلويات منزلية طازجة في مسقط.",
      heroSubtitle: "تُحضّر بعناية للهدايا والضيافة والمناسبات الجميلة.",
      signaturesTitle: "اختيارات اليوم",
      featuredDessertLabel: "الحلوى المميزة",
      browseMenu: "تصفح القائمة",
      orderNow: "اطلب الآن",
      pillPreorder: "طلب مسبق",
      pillChilled: "مبردة",
      pillWhatsappConfirm: "تأكيد عبر واتساب",
      searchPlaceholder: "ابحث في القائمة…",
      emptyCategory: "لا يوجد في هذا التصنيف حالياً — جرّب تصنيفاً آخر.",
      categories: {
        all: "الكل",
        cakes: "كيك",
        cups: "أكواب",
        trays: "صواني",
        offers: "عروض",
      },
    },
    offers: {
      launchBoxTitle: "صندوق التجربة",
      launchBoxBody: "جرّب التيراميسو وجيلي تشيز كيك في طلبك الأول من كوكو تريتس.",
      browseOffers: "تصفح العروض",
    },
    reviews: {
      lovedByCustomers: "آراء العملاء",
      customerRatingCaption: "تقييم العملاء",
      reviewsWord: "تقييم",
      verifiedOrder: "طلب موثّق",
      whatCustomersSay: "ماذا يقول العملاء",
      noReviewsYet: "ستظهر تقييمات العملاء هنا قريباً.",
    },
    orderReview: {
      pageTitle: "شاركينا تجربتك",
      pageIntro: "شكراً لاختيارك كوكو تريتس. رأيك يساعدنا نكبر.",
      nameLabel: "اسمك",
      productLabel: "أي حلى؟",
      ratingLabel: "تقييمك",
      commentLabel: "تعليقك",
      commentPlaceholder: "احكيلنا شنو عجبك…",
      submit: "إرسال التقييم",
      successTitle: "شكراً لك!",
      successBody: "تم إرسال تقييمك وسيظهر قريباً.",
      invalidTitle: "الرابط غير متاح",
      invalidBody: "رابط التقييم غير صالح أو منتهي. للمساعدة تواصلي معنا على واتساب.",
      invalidLink: "تعذر إرسال التقييم. تأكدي من الرابط أو تواصلي معنا.",
      alreadyReviewedTitle: "شكراً لك",
      alreadyReviewed: "لقد استلمنا تقييمك مسبقاً.",
    },
    menu: {
      screenTitle: "القائمة",
    },
    contactPage: {
      screenTitle: "التواصل",
      locationLine: "مسقط",
      whatsappCta: "الطلب عبر واتساب",
      instagramLabel: "إنستغرام",
      noteOrders: "يتم تأكيد الطلب عبر الرد في واتساب.",
      noteDelivery: "التوصيل يعتمد على المنطقة والتوفر.",
      whatsappPrefill: "مرحباً كوكو تريتس، أرغب في تقديم طلب.",
      trustWhatsappTitle: "طلبات واتساب",
      trustWhatsappBody: "في كوكو تريتس نؤكد كل طلب عبر المحادثة لنوضح الموعد وطريقة التسليم.",
      trustInstagramTitle: "إنستغرام",
      trustInstagramBody: "تابعوا كوكو تريتس لآخر الإضافات، لقطات التحضير، والعروض المميزة.",
      trustDeliveryTitle: "التوصيل حسب المنطقة",
      trustDeliveryBody: "المواعيد والتكلفة تعتمد على البعد وحجز الدفعة اليومية.",
      trustPreorderTitle: "نوصي بطلب مسبق",
      trustPreorderBody: "نُفضل يوماً قبل (24 ساعة على الأقل) إن أمكن؛ لنمنح أنفسنا وقتاً كافياً للخبز والتبريد والتغليف بحب.",
      openInstagramProfile: "فتح إنستغرام",
    },
    businessNotes: {
      preorder24h: "يرجى الطلب قبل 24 ساعة على الأقل.",
      deliveryFeeWhatsApp: "سيتم تأكيد رسوم التوصيل عبر واتساب حسب المنطقة.",
      paymentWhatsApp: "سيتم تأكيد طريقة الدفع عبر واتساب.",
    },
    faqSection: {
      title: "أسئلة سريعة",
      items: [
        {
          q: "متى يجب أن أطلب؟",
          a: "مفضلًا قبل يوم واحد على الأقل، عشان وقت كافي للتحضير والتبريد والتغليف بشكل أنيق.",
        },
        {
          q: "هل يوجد توصيل؟",
          a: "نعم ضمن مسقط حسب المواعيد والمنطقة. ننسّق الموعد والرسوم سويًا بالواتساب قبل تأكيد الطلب.",
        },
        {
          q: "كيف يتم الدفع؟",
          a: "بنحدّد الطريقة المناسبة ببساطة على الواتساب بعد مراجعة تفاصيل طلبكم.",
        },
        {
          q: "كيف أحفظ الحلى؟",
          a: "يُفضل البرادة والتقديم بارد؛ يُستهلك أفضل خلال اليوم الأول أو اليوم الثاني.",
        },
        {
          q: "هل يمكن تخصيص الطلب؟",
          a: "اذكرونا التعديل أو الفكرة في الملاحظات أو رسالة الواتساب، وبنقلكم إذا توافق مع التوقيت.",
        },
      ],
    },
    productCard: {
      startingFrom: "من",
      view: "عرض",
      soldOut: "غير متوفر حالياً",
    },
    productPage: {
      backToMenu: "القائمة",
      notFoundTitle: "الصنف غير متوفر",
      notFoundDescription: "هذا الصنف غير متاح حالياً.",
      soldOutBadge: "غير متوفر",
      soldOutMessage: "هذه الحلوى غير متوفرة حالياً.",
      orderThisDessert: "اطلب هذه الحلوى",
      preorderNote: "طلب مسبق فقط",
      trustBadge: "طازج حسب الطلب المسبق",
      total: "المجموع",
      favoriteAria: "إضافة إلى المفضلة",
      shareAria: "مشاركة",
      galleryHint: "معرض الصور",
      photoComingSoon: "الصورة قريباً",
    },
    form: {
      title: "إتمام الطلب",
      subtitle: "راجع طلبك وأرسله إلى كوكو تريتس عبر واتساب.",
      summaryTitle: "اختيارك",
      sectionCustomer: "بياناتك",
      sectionDessert: "الحلوى",
      sectionFulfillment: "الاستلام أو التوصيل",
      sectionDeliveryLocation: "موقع التوصيل",
      sectionNotes: "ملاحظات",
      customerName: "الاسم الكامل",
      phone: "الهاتف",
      dessert: "الحلوى",
      size: "الحجم",
      quantity: "الكمية",
      dateNeeded: "تاريخ الطلب",
      fulfillment: "طريقة الاستلام",
      deliveryLocation: "عنوان التوصيل",
      pickupLocationOptional: "ملاحظات الاستلام (اختياري)",
      deliveryPlaceholder: "المنطقة، المبنى، الشارع",
      pickupPlaceholder: "تفاصيل اختيارية للاستلام",
      pickupDetailsWhatsappNote: "سيتم تأكيد تفاصيل الاستلام عبر واتساب.",
      useCurrentLocation: "استخدام موقعي الحالي",
      detectingLocation: "جاري تحديد الموقع…",
      locationAddedSuccess: "تم إضافة الموقع بنجاح.",
      openMap: "فتح الخريطة",
      googleMapsLinkLabel: "رابط خرائط جوجل",
      pasteGoogleMapsLinkHint: "لصق رابط خرائط جوجل",
      addressDetailsLabel: "تفاصيل العنوان",
      addressDetailsPlaceholder: "المنطقة، المبنى، الشارع، أقرب علامة واضحة…",
      locationGpsLine: "رابط GPS",
      locationPastedLine: "رابط مشاركة",
      summaryLocationAdded: "تم إضافة الموقع",
      summaryFulfillmentLabel: "طريقة الاستلام",
      notes: "ملاحظات",
      notesPlaceholder: "حساسية، التوقيت، مستوى الحلاوة…",
      estimatedTotal: "المجموع التقديري",
      sendWhatsapp: "إرسال الطلب عبر واتساب",
      fallback: "لم يُفتح واتساب؟ انسخ نص الطلب أدناه.",
      copyMessage: "نسخ نص الطلب",
      copied: "تم النسخ.",
      pickupLocationShared: "يُحدَّد مكان الاستلام لاحقاً",
      orderConfirmationNote: "تؤكد كوكو تريتس الطلب على واتساب بعد مراجعة التاريخ.",
      summarySizeLabel: "الحجم",
      summaryQtyLabel: "الكمية",
      fulfillmentOptions: {
        pickup: "استلام",
        delivery: "توصيل",
      },
      summaryDessertSubtotal: "الحلوى",
      summaryDeliveryFeeLabel: "رسوم التوصيل",
      summaryDeliveryFeeConfirmed: "تُحدَّد عبر واتساب",
      summaryFulfillmentInline: "التسليم",
      summaryPickupLine: "استلام • التفاصيل على واتساب",
      availabilityChecking: "جاري التحقق من توفر التاريخ…",
      availabilityPickDate: "اختر تاريخًا لمعرفة ما إذا كان هناك طاقة استيعاب.",
      availabilityBlockedSubmit: "اختر تاريخًا متاحًا قبل الإرسال إلى واتساب.",
      productUnavailable: "هذه الحلوى غير متاحة للطلب حالياً.",
      chooseAnotherProduct: "يرجى اختيار حلوى أخرى من القائمة.",
    },
    validation: {
      fullName: "يرجى إدخال الاسم الكامل.",
      phone: "يرجى إدخال رقم هاتف صحيح.",
      date: "يرجى اختيار التاريخ.",
      quantity: "الكمية يجب أن تكون 1 على الأقل.",
      deliveryLocation: "أدخل تفاصيل كافية لتأكيد منطقة التوصيل.",
      addressDetailsRequired: "يرجى كتابة تفاصيل عنوان التوصيل.",
      deliveryNeedMapOrDetail:
        "أضِف الرابط بالزر أعلاه أو الصق رابط خرائط جوجل، أو زِد من تفاصيل العنوان.",
      mapsLinkInvalid: "يرجى لصق رابط يبدأ بـ http:// أو https://",
      productRequired: "يرجى اختيار الحلوى.",
      sizeRequired: "يرجى اختيار الحجم.",
      fulfillmentRequired: "يرجى اختيار الاستلام أو التوصيل.",
    },
    footer: {
      location: "الموقع",
      preorder: "طلب مسبق — كوكو تريتس",
      igLine: "إنستغرام",
    },
    whatsappTemplate: {
      unspecified: "غير محدد",
      none: "لا يوجد",
      newOrderHeading: "طلب جديد",
      name: "الاسم",
      phone: "الهاتف",
      dessert: "الحلوى",
      size: "الحجم",
      quantity: "الكمية",
      dateNeeded: "التاريخ",
      orderType: "طريقة الاستلام",
      location: "الموقع",
      notes: "ملاحظات",
      estimatedTotal: "المجموع التقريبي",
    },
    whatsappOrder: {
      title: "طلب جديد من كوكو تريتس",
      customerDetails: "بيانات العميل",
      orderDetails: "تفاصيل الطلب",
      deliveryDetails: "تفاصيل التوصيل",
      labelName: "الاسم",
      labelPhone: "رقم الهاتف",
      labelDessert: "الحلوى",
      labelSize: "الحجم",
      labelQuantity: "الكمية",
      labelDateNeeded: "تاريخ الطلب",
      labelOrderType: "طريقة الاستلام",
      labelLocationLink: "رابط الموقع",
      labelAddressDetails: "تفاصيل العنوان",
      labelNotes: "ملاحظات",
      labelEstimatedTotal: "المجموع التقديري للحلوى",
      labelDessertSubtotal: "مجموع الحلوى",
      pickupNote: "سيتم تأكيد تفاصيل الاستلام عبر واتساب.",
      locationGpsPrefix: "GPS:",
      locationPastedPrefix: "رابط مشاركة:",
      none: "—",
    },
    geolocation: {
      permissionDenied: "تم رفض إذن الموقع. يمكنك لصق رابط خرائط جوجل بدلاً من ذلك.",
      positionError: "لم نتمكن من تحديد موقعك. يرجى لصق رابط الموقع أو كتابة العنوان.",
      notSupported: "لم نتمكن من تحديد موقعك. يرجى لصق رابط الموقع أو كتابة العنوان.",
      unknownError: "لم نتمكن من تحديد موقعك. يرجى لصق رابط الموقع أو كتابة العنوان.",
    },
    waPrefill: {
      hello: "مرحباً كوكو تريتس، عندي استفسار بخصوص الطلب.",
    },
    orderSave: {
      saving: "جاري حفظ الطلب...",
      savedOpeningWhatsapp: "تم حفظ الطلب. سيتم فتح واتساب…",
      saveFailed:
        "لم نتمكن من حفظ طلبك. يرجى المحاولة مرة أخرى أو التواصل معنا عبر واتساب.",
      whatsappWithoutSave: "الإرسال عبر واتساب بدون حفظ",
    },
  },
};
