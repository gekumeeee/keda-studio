// Pure, client-safe i18n helpers. No server-only imports here so both
// server and client components can use it.

export const LANGS = ['en', 'ar'];
export const DEFAULT_LANG = 'en';
export const LANG_COOKIE = 'lang';

export function normalizeLang(v) {
  return v === 'ar' ? 'ar' : 'en';
}

// Pick a localized value. Accepts either a plain string (language-neutral)
// or a { en, ar } object.
export function pick(value, lang) {
  if (value && typeof value === 'object' && !Array.isArray(value) && ('en' in value || 'ar' in value)) {
    return value[lang] ?? value.en ?? '';
  }
  return value ?? '';
}

// Fixed UI chrome strings (not editable from the admin).
export const UI = {
  en: {
    dir: 'ltr',
    site: {
      menu: 'Menu',
      theme: 'Switch between dark and light',
      home: 'KEDA — home',
      all: 'All',
      works: 'works',
      moreWork: 'More work',
      filterBy: 'Filter by client',
      preview: 'Work preview',
      close: 'Close',
      prev: 'Previous',
      next: 'Next',
      play: 'Play video',
    },
    nav: { home: 'Home', portfolio: 'Portfolio', about: 'About', contact: 'Contact us' },
    switchTo: 'العربية',
    filters: {
      All: 'All',
      Branding: 'Branding',
      Video: 'Video',
      'Social Media': 'Social Media',
      Motion: 'Motion',
      Campaigns: 'Campaigns',
    },
    clientsAdd: '+ Add Yours',
    clientsTag: 'Clients & Partners',
    clientPlaceholder: 'Your brand here',
    showcaseClient: 'Client:',
    showcaseWork: 'Work:',
    viewProject: 'View project →',
    foot: {
      pages: 'Pages',
      utility: 'Utility',
      home: 'Home',
      portfolio: 'Portfolio',
      about: 'About',
      contact: 'Contact Us',
    },
    contact: {
      eyebrow: 'Get In Touch',
      heading: 'Tell us about your project',
      sub: "Fill in the form below and we'll get back to you shortly — no chatbots, just the agency.",
      name: 'Name',
      email: 'Email',
      phone: 'Phone number',
      contactMethodLabel: 'Preferred contact method',
      methodWhatsapp: 'WhatsApp',
      methodEmail: 'Email',
      methodCall: 'Phone call',
      message: 'Message',
      send: 'Send message →',
      sending: 'Sending…',
      success: "Thanks — your message has been sent. We'll get back to you soon.",
      error: 'Something went wrong — please try again.',
      emailNote: 'Or email us directly at',
      copyEmail: 'Copy',
      copiedEmail: 'Copied!',
    },
    portfolio: {
      viewCase: 'View case →',
      liveTag: 'Live',
      draftTag: 'Draft',
      empty: 'Projects added from the admin will show up here.',
    },
    notFound: {
      heading: "This page isn't here.",
      sub: 'The link may be old, or the page has moved. Everything we make is a click away from the home page.',
      home: 'Back to home →',
    },
  },
  ar: {
    dir: 'rtl',
    site: {
      menu: 'القائمة',
      theme: 'التبديل بين الوضع الداكن والفاتح',
      home: 'كده — الرئيسية',
      all: 'الكل',
      works: 'عمل',
      moreWork: 'أعمال أخرى',
      filterBy: 'فلترة حسب العميل',
      preview: 'معاينة العمل',
      close: 'إغلاق',
      prev: 'السابق',
      next: 'التالي',
      play: 'تشغيل الفيديو',
    },
    nav: { home: 'الرئيسية', portfolio: 'الأعمال', about: 'من نحن', contact: 'تواصل معنا' },
    switchTo: 'EN',
    filters: {
      All: 'الكل',
      Branding: 'براندينج',
      Video: 'فيديو',
      'Social Media': 'سوشيال ميديا',
      Motion: 'موشن',
      Campaigns: 'حملات',
    },
    clientsAdd: '+ ضيف براندك',
    clientsTag: 'عملاء وشركاء',
    clientPlaceholder: 'براندك هنا',
    showcaseClient: 'العميل:',
    showcaseWork: 'الشغل:',
    viewProject: 'شوف المشروع ←',
    foot: {
      pages: 'صفحات',
      utility: 'روابط',
      home: 'الرئيسية',
      portfolio: 'الأعمال',
      about: 'من نحن',
      contact: 'تواصل معنا',
    },
    contact: {
      eyebrow: 'تواصل معنا',
      heading: 'كلّمنا عن مشروعك',
      sub: 'املأ الفورم وهنرد عليك في أقرب وقت — مفيش بوتات، الوكالة نفسها.',
      name: 'الاسم',
      email: 'الإيميل',
      phone: 'رقم الموبايل',
      contactMethodLabel: 'تحب نتواصل معاك إزاي؟',
      methodWhatsapp: 'واتساب',
      methodEmail: 'إيميل',
      methodCall: 'مكالمة تليفونية',
      message: 'رسالتك',
      send: 'ابعت الرسالة ←',
      sending: 'بيتبعت…',
      success: 'تمام — رسالتك اتبعتت، وهنرد عليك قريب.',
      error: 'حصل خطأ — جرّب تاني.',
      emailNote: 'أو راسلنا على',
      copyEmail: 'نسخ',
      copiedEmail: 'اتنسخ!',
    },
    portfolio: {
      viewCase: 'شوف المشروع ←',
      liveTag: 'شغّال',
      draftTag: 'مسودة',
      empty: 'المشاريع اللي بتضيفها من الأدمن هتظهر هنا.',
    },
    notFound: {
      heading: 'الصفحة دي مش موجودة.',
      sub: 'ممكن اللينك يكون قديم أو الصفحة اتنقلت — كل شغلنا على بُعد ضغطة من الرئيسية.',
      home: 'ارجع للرئيسية ←',
    },
  },
};

// Copy for the public site's fixed sections (process, audiences, FAQ, the
// about dictionary card, footer columns…) that the admin's Site Content
// editor doesn't cover. Everything the admin does cover comes from settings.
export const SITE_COPY = {
  en: {
    seeWork: "See our work",
    servicesLead: "Pick a lane or mix them all — everything your brand needs under one roof.",
    workLead: "Real work for real clients — tap any piece to see it big.",
    clientsLead: "Brands we build with, month after month — tap one to see the work.",
    process: {
      eyebrow: "How we work",
      heading: "From brief to brand in four steps",
      lead: "No jargon, no black boxes. You always know what we're making, why, and what happens next.",
      button: "Book a call",
      steps: [
        {
          tag: "Step 01",
          title: "Brief & discovery",
          body: "We listen first — your goals, audience and market — then sharpen the brief together."
        },
        {
          tag: "Step 02",
          title: "Strategy & concept",
          body: "Positioning, big idea and creative direction, presented clearly before any pixel is polished."
        },
        {
          tag: "Step 03",
          title: "Design & production",
          body: "Identity, content, motion and photography — crafted in-house with constant check-ins."
        },
        {
          tag: "Step 04",
          title: "Launch & grow",
          body: "Handover, guidelines and support so the brand keeps feeling right long after launch."
        }
      ]
    },
    audiences: {
      eyebrow: "Who we work with",
      heading: "Startups. Scale‑ups. Icons.",
      items: [
        {
          tag: "Startups",
          title: "Launching and need a brand people remember?",
          body: "Get a complete identity that looks established from day one."
        },
        {
          tag: "Growing brands",
          title: "Growing, but the look no longer matches the ambition?",
          body: "Level up your identity and content without losing what works."
        },
        {
          tag: "Established brands",
          title: "Established and ready for a sharper edge?",
          body: "Fresh campaigns and consistent creative across every channel."
        }
      ]
    },
    faq: {
      eyebrow: "FAQ",
      heading: "Questions? Answers.",
      items: [
        {
          q: "What's included in a branding project?",
          a: "Naming and strategy when needed, logo and visual identity, guidelines, and ready-to-use assets for print and digital."
        },
        {
          q: "Do you work in Arabic and English?",
          a: "Yes — both languages, designed together, so a brand feels native in each."
        },
        {
          q: "How long does a project take?",
          a: "It depends on scope. After the brief we share a clear timeline and milestones, so you always know what's next."
        },
        {
          q: "How do we get started?",
          a: "Send us a message or book a call. We'll reply quickly, learn about your brand, and propose the right plan."
        }
      ]
    },
    about: {
      pills: [
        "Cairo, Egypt",
        "Arabic & English",
        "Brand · Content · Motion"
      ],
      kind: "Egyptian Arabic",
      def: "Exactly that — the moment something finally feels right.",
      defTag: "adj.",
      pageSub: "A Cairo brand & creative agency — the people behind the work."
    },
    cta: {
      eyebrow: "Ready when you are",
      lead: "Tell us about your project — we'll reply fast."
    },
    footer: {
      tagline: "Brands that feel exactly right.",
      explore: "Explore",
      follow: "Follow",
      contact: "Contact",
      city: "Cairo, Egypt",
      small: "Brand & creative studio — Cairo, Egypt"
    },
    nav: {
      services: "Services",
      process: "Process",
      faq: "FAQ"
    }
  },
  ar: {
    seeWork: "شوف أعمالنا",
    servicesLead: "اختار مجال واحد أو اخلطهم كلهم — كل اللي براندك محتاجه تحت سقف واحد.",
    workLead: "شغل حقيقي لعملاء حقيقيين — دوس على أي تصميم تشوفه كبير.",
    clientsLead: "براندات بنكبر معاها شهر ورا شهر — دوس على أي واحد تشوف الشغل.",
    process: {
      eyebrow: "طريقة شغلنا",
      heading: "من البريف للبراند في أربع خطوات",
      lead: "من غير تعقيد ولا صناديق سودا. دايمًا عارف إحنا بنعمل إيه وليه وإيه الخطوة الجاية.",
      button: "احجز مكالمة",
      steps: [
        {
          tag: "خطوة 01",
          title: "البريف والاستكشاف",
          body: "بنسمع الأول — أهدافك وجمهورك وسوقك — وبعدين نظبط البريف سوا."
        },
        {
          tag: "خطوة 02",
          title: "الاستراتيجية والفكرة",
          body: "تمركز البراند والفكرة الكبيرة والاتجاه الإبداعي بنعرضهم بوضوح قبل ما نلمّع أي تصميم."
        },
        {
          tag: "خطوة 03",
          title: "التصميم والإنتاج",
          body: "هوية ومحتوى وموشن وتصوير — بنصنعهم جوه الاستوديو مع متابعة مستمرة معاك."
        },
        {
          tag: "خطوة 04",
          title: "الإطلاق والنمو",
          body: "تسليم ودليل استخدام ومتابعة عشان البراند يفضل مظبوط بعد الإطلاق بفترة طويلة."
        }
      ]
    },
    audiences: {
      eyebrow: "بنشتغل مع مين",
      heading: "ستارتابس. براندات بتكبر. أسماء راسخة.",
      items: [
        {
          tag: "ستارتابس",
          title: "بتطلق ومحتاج براند الناس تفتكره؟",
          body: "هوية كاملة تبان راسخة من أول يوم."
        },
        {
          tag: "براندات بتكبر",
          title: "بتكبر بس شكلك مبقاش على قد طموحك؟",
          body: "طوّر الهوية والمحتوى من غير ما تخسر اللي شغال."
        },
        {
          tag: "براندات راسخة",
          title: "راسخ وعايز لمسة أحدّ؟",
          body: "حملات جديدة وإبداع متسق على كل القنوات."
        }
      ]
    },
    faq: {
      eyebrow: "أسئلة",
      heading: "أسئلة؟ إجابات.",
      items: [
        {
          q: "إيه اللي في مشروع الهوية؟",
          a: "تسمية واستراتيجية لو محتاج، لوجو وهوية بصرية، دليل استخدام، وملفات جاهزة للطباعة والديجيتال."
        },
        {
          q: "بتشتغلوا عربي وإنجليزي؟",
          a: "أيوه — اللغتين بنصمّمهم سوا، فالبراند يبان أصلي في الاتنين."
        },
        {
          q: "المشروع بياخد قد إيه؟",
          a: "حسب حجم الشغل. بعد البريف بنبعتلك جدول واضح بالمراحل، فتعرف الخطوة الجاية دايمًا."
        },
        {
          q: "نبدأ إزاي؟",
          a: "ابعتلنا رسالة أو احجز مكالمة. هنرد بسرعة ونتعرف على براندك ونقترح الخطة المناسبة."
        }
      ]
    },
    about: {
      pills: [
        "القاهرة، مصر",
        "عربي وإنجليزي",
        "براند · محتوى · موشن"
      ],
      kind: "عامية مصرية",
      def: "بالظبط كده — اللحظة اللي الحاجة تحس فيها إنها مظبوطة.",
      defTag: "صفة.",
      pageSub: "وكالة علامات وإبداع في القاهرة — الناس اللي ورا الشغل."
    },
    cta: {
      eyebrow: "جاهزين لما تكون جاهز",
      lead: "احكيلنا عن مشروعك — هنرد بسرعة."
    },
    footer: {
      tagline: "براندات تحسّها مظبوطة.",
      explore: "استكشف",
      follow: "تابعنا",
      contact: "تواصل",
      city: "القاهرة، مصر",
      small: "استوديو علامات وإبداع — القاهرة، مصر"
    },
    nav: {
      services: "خدماتنا",
      process: "طريقة الشغل",
      faq: "أسئلة"
    }
  }
};
