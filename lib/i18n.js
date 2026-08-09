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
    clientPlaceholder: 'Your brand here',
    showcaseClient: 'Client:',
    showcaseWork: 'Work:',
    viewProject: 'View project →',
    statProjects: 'Projects delivered',
    statClients: 'Clients served',
    foot: {
      pages: 'Pages',
      utility: 'Utility',
      home: 'Home',
      portfolio: 'Portfolio',
      about: 'About',
      privacy: 'Privacy Policy',
      contact: 'Contact Us',
      imprint: 'Imprint',
    },
    contact: {
      eyebrow: 'Get In Touch',
      heading: 'Tell us about your project',
      sub: "Fill in the form below and we'll get back to you shortly — no chatbots, just the studio.",
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
      projectOne: 'project',
      projectMany: 'projects',
    },
    about: {
      statProjects: 'Projects delivered',
      statClients: 'Clients served',
    },
  },
  ar: {
    dir: 'rtl',
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
    clientPlaceholder: 'براندك هنا',
    showcaseClient: 'العميل:',
    showcaseWork: 'الشغل:',
    viewProject: 'شوف المشروع ←',
    statProjects: 'مشروع اتسلّم',
    statClients: 'عميل اشتغلنا معاه',
    foot: {
      pages: 'صفحات',
      utility: 'روابط',
      home: 'الرئيسية',
      portfolio: 'الأعمال',
      about: 'من نحن',
      privacy: 'سياسة الخصوصية',
      contact: 'تواصل معنا',
      imprint: 'بيانات النشر',
    },
    contact: {
      eyebrow: 'تواصل معنا',
      heading: 'كلّمنا عن مشروعك',
      sub: 'املأ الفورم وهنرد عليك في أقرب وقت — مفيش بوتات، الاستوديو نفسه.',
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
      projectOne: 'مشروع',
      projectMany: 'مشاريع',
    },
    about: {
      statProjects: 'مشروع اتسلّم',
      statClients: 'عميل اشتغلنا معاه',
    },
  },
};
