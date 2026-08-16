// Central bilingual content model for the landing page.
// Language-neutral fields (siteName, email, social URLs, colors) are plain
// values. Localized text fields are { en, ar } objects. Arrays (heroWords,
// services) hold objects whose text sub-fields are { en, ar }.

import { pick } from './i18n';

export { pick };

// Palette offered for the rotating hero word — the one place colour is
// allowed to touch type. Everything else on the site keeps colour to flat
// fills.
export const WORD_COLORS = [
  { label: 'Acid', value: 'var(--acid)' },
  { label: 'Magenta', value: 'var(--magenta)' },
  { label: 'Aqua', value: 'var(--aqua)' },
  { label: 'Tangerine', value: 'var(--tangerine)' },
  { label: 'Violet', value: 'var(--violet)' },
  { label: 'Cobalt', value: 'var(--cobalt)' },
  { label: 'Paper', value: 'var(--paper)' },
];

// Colours saved before the palette change point at token names that now all
// resolve to --paper inside .site, which would silently render every hero
// word white. Map them onto their nearest new accent instead.
const LEGACY_WORD_COLORS = {
  'var(--orange-soft)': 'var(--acid)',
  'var(--orange)': 'var(--tangerine)',
  'var(--green)': 'var(--aqua)',
  'var(--blue)': 'var(--cobalt)',
  'var(--gold)': 'var(--magenta)',
  'var(--text)': 'var(--paper)',
};
export function resolveWordColor(value) {
  if (typeof value !== 'string' || !value) return 'var(--acid)';
  return LEGACY_WORD_COLORS[value] || value;
}

const L = (en, ar) => ({ en, ar });

export const DEFAULTS = {
  // ---- language-neutral ----
  siteName: 'Keda Agency',
  contactEmail: '',
  facebookUrl: '',
  behanceUrl: '',
  instagramUrl: '',
  xUrl: '',

  // ---- hero ----
  heroEyebrow: L('Brand & Creative Agency — Cairo, Egypt', 'وكالة علامات وإبداع — القاهرة، مصر'),
  heroHeading: L('', ''), // optional fixed headline; overrides the animation when filled
  heroLine1: L('Brands that feel', 'براندات تحسّها'),
  heroLine3: L('— keda.', '— كده.'),
  // Defaults stick to the four brightest accents — the hero sits on --ink, and
  // these clear it comfortably at display size. Cobalt and violet are darker;
  // they're still offered in the admin picker, just not defaulted to.
  heroWords: [
    { text: L('distinct', 'مميزة'), color: 'var(--acid)' },
    { text: L('timeless', 'خالدة'), color: 'var(--magenta)' },
    { text: L('unmistakable', 'لا تُنسى'), color: 'var(--aqua)' },
    { text: L('exactly right', 'صح'), color: 'var(--tangerine)' },
  ],
  heroPara: L(
    'KEDA is a full-service brand and creative agency in Cairo. We build brands that stay distinct — not campaigns that expire. Premium, bold and timeless work for the Egyptian and MENA market.',
    'كده وكالة متكاملة للعلامات والإبداع في القاهرة. بنبني براندات تفضل مميزة — مش حملات بتنتهي. شغل بريميوم وجريء وخالد للسوق المصري والعربي.'
  ),
  heroCtaLabel: L('Start a project →', 'ابدأ مشروعك ←'),

  // ---- clients ----
  clientsEyebrow: L('Selected Clients', 'عملاؤنا'),
  clientsHeading: L('Our\nClients', 'عملاؤنا\nوشركاؤنا'),

  // ---- services ("What We Do") ----
  servicesEyebrow: L('What We Do', 'بنعمل إيه'),
  servicesHeading: L('One agency,\nevery creative need.', 'وكالة واحدة،\nكل اللي البراند محتاجه.'),
  services: [
    {
      title: L('Branding & Identity', 'الهوية والعلامة'),
      desc: L('Naming, visual identity systems, and creative direction built to last a decade.', 'تسمية، أنظمة هوية بصرية، وإدارة إبداعية بتفضل سنين.'),
      stat: '50+',
      image: '',
    },
    {
      title: L('Marketing & Campaigns', 'التسويق والحملات'),
      desc: L('Brand strategy, advertising, and campaigns that stay distinct.', 'استراتيجية، إعلانات، وحملات بتفضل مميزة.'),
      stat: '120+',
      image: '',
    },
    {
      title: L('Social & Content', 'سوشيال ومحتوى'),
      desc: L('Editorial-grade content and social-native creative for every platform.', 'محتوى بمستوى تحريري وإبداع مخصص لكل منصة.'),
      stat: '300+',
      image: '',
    },
    {
      title: L('Motion, Video & Photo', 'موشن وفيديو وتصوير'),
      desc: L('Motion graphics, video production, and product photography, end to end.', 'موشن جرافيك، إنتاج فيديو، وتصوير منتجات من الألف للياء.'),
      stat: '80+',
      image: '',
    },
  ],

  // ---- selected work ----
  workEyebrow: L('Selected Work', 'أعمال مختارة'),
  workHeading: L('Our projects\nhighlight.', 'مشاريعنا\nالمميزة.'),

  // ---- portfolio page ----
  portfolioEyebrow: L('Selected Work', 'أعمال مختارة'),
  portfolioHeading: L('Our\nPortfolio', 'أعمالنا\nومشاريعنا'),

  // ---- our impact ----
  impactEyebrow: L('Our Impact', 'أثرنا'),
  impactHeading: L('Numbers that\nspeak for us.', 'أرقام\nبتتكلم عننا.'),
  impact: [
    { value: '700M+', color: 'var(--green)', label: L('Views Gained', 'مشاهدة'), sub: L('Views gained on all platforms', 'مشاهدات على كل المنصات') },
    { value: '45%', color: 'var(--orange)', label: L('Engagement Boost', 'زيادة تفاعل'), sub: L('Average increase in engagement for our clients', 'متوسط الزيادة في التفاعل لعملائنا') },
    { value: '120+', color: 'var(--blue)', label: L('Projects Delivered', 'مشروع اتسلّم'), sub: L('Successful projects completed', 'مشاريع ناجحة اكتملت') },
    { value: '40+', color: 'var(--gold)', label: L('Clients', 'عميل'), sub: L('Clients worked with us', 'عملاء اشتغلنا معاهم') },
  ],

  // ---- about ----
  aboutEyebrow: L('About KEDA', 'عن كده'),
  aboutHeading: L('The agency\nbehind the work.', 'الوكالة\nاللي ورا الشغل.'),
  aboutBody: L(
    '"Keda" is the everyday Egyptian word for "exactly that" — the moment something finally feels right. That reaction is what we design for. KEDA is a Cairo-based creative partner building premium, timeless brands for the Egyptian and MENA market — bold, minimal and confident, never loud.',
    '«كده» كلمة مصرية معناها «بالظبط كده» — اللحظة اللي الحاجة تحس فيها إنها مظبوطة. الإحساس ده هو اللي بنصمّم عشانه. كده شريك إبداعي في القاهرة بيبني براندات بريميوم وخالدة للسوق المصري والعربي — جريء، بسيط، وواثق من غير مبالغة.'
  ),

  // ---- about page (dedicated page panel) ----
  aboutPanelHeading: L('Who are we?', 'إحنا مين؟'),
  aboutImage: '',
  aboutSideLabel: L('KEDA', 'كده'),

  // ---- contact page ----
  contactHeadingLine1: L("Let's start", 'يلا نبدأ'),
  contactHeadingLine2: L('the project.', 'مشروعك.'),
  contactDropLabel: L('Drop a line', 'راسلنا على'),

  // ---- call to action ----
  ctaLine1: L("Let's make it", 'خلّيها'),
  ctaLine2: L('keda.', 'كده.'),
  ctaButton: L('Start a project', 'ابدأ مشروعك'),

  // ---- footer ----
  footerNote: L('© 2026 KEDA — Brand & Creative Agency, Cairo', '© 2026 كده — وكالة علامات وإبداع، القاهرة'),
};

// ---- merge helpers ----
function isLoc(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'ar' in v);
}
function mergeLoc(saved, def) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const en = typeof s.en === 'string' && s.en.trim() !== '' ? s.en : def.en;
  const ar = typeof s.ar === 'string' && s.ar.trim() !== '' ? s.ar : def.ar;
  // allow intentionally-empty heroHeading (both blank) to pass through
  return { en: s.en === '' && def.en === '' ? '' : en, ar: s.ar === '' && def.ar === '' ? '' : ar };
}

export function mergeSettings(saved = {}) {
  const out = {};
  for (const key of Object.keys(DEFAULTS)) {
    const def = DEFAULTS[key];
    const val = saved[key];

    if (key === 'heroWords') {
      out[key] = Array.isArray(val) && val.length > 0
        ? val.map((w) => ({
            text: mergeLoc(w?.text, { en: '', ar: '' }),
            color: resolveWordColor(w?.color),
          }))
        : def;
    } else if (key === 'services') {
      out[key] = Array.isArray(val) && val.length > 0
        ? val.map((s) => ({
            title: mergeLoc(s?.title, { en: '', ar: '' }),
            desc: mergeLoc(s?.desc, { en: '', ar: '' }),
            stat: typeof s?.stat === 'string' ? s.stat : '',
            image: typeof s?.image === 'string' ? s.image : '',
          }))
        : def;
    } else if (key === 'impact') {
      out[key] = Array.isArray(val) && val.length > 0
        ? val.map((it) => ({
            value: typeof it?.value === 'string' ? it.value : '',
            color: typeof it?.color === 'string' && it.color ? it.color : 'var(--green)',
            label: mergeLoc(it?.label, { en: '', ar: '' }),
            sub: mergeLoc(it?.sub, { en: '', ar: '' }),
          }))
        : def;
    } else if (isLoc(def)) {
      out[key] = mergeLoc(val, def);
    } else if (typeof val === 'string' && val.trim() !== '') {
      out[key] = val;
    } else {
      out[key] = def;
    }
  }
  return out;
}
