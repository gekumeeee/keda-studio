// Central bilingual content model for the landing page.
// Language-neutral fields (siteName, email, social URLs, colors) are plain
// values. Localized text fields are { en, ar } objects. Arrays (heroWords,
// services) hold objects whose text sub-fields are { en, ar }.

import { pick } from './i18n';

export { pick };

export const WORD_COLORS = [
  { label: 'Orange', value: 'var(--orange-soft)' },
  { label: 'Green', value: 'var(--green)' },
  { label: 'Blue', value: 'var(--blue)' },
  { label: 'Gold', value: 'var(--gold)' },
  { label: 'Cream', value: 'var(--text)' },
];

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
  heroEyebrow: L('Brand & Creative Studio — Cairo, Egypt', 'استوديو علامات وإبداع — القاهرة، مصر'),
  heroHeading: L('', ''), // optional fixed headline; overrides the animation when filled
  heroLine1: L('Brands that feel', 'براندات تحسّها'),
  heroLine3: L('— keda.', '— كده.'),
  heroWords: [
    { text: L('distinct', 'مميزة'), color: 'var(--orange-soft)' },
    { text: L('timeless', 'خالدة'), color: 'var(--green)' },
    { text: L('unmistakable', 'لا تُنسى'), color: 'var(--blue)' },
    { text: L('exactly right', 'صح'), color: 'var(--gold)' },
  ],
  heroPara: L(
    'KEDA is a full-service brand and creative studio in Cairo. We build brands that stay distinct — not campaigns that expire. Premium, bold and timeless work for the Egyptian and MENA market.',
    'كده استوديو متكامل للعلامات والإبداع في القاهرة. بنبني براندات تفضل مميزة — مش حملات بتنتهي. شغل بريميوم وجريء وخالد للسوق المصري والعربي.'
  ),
  heroCtaLabel: L('Start a project →', 'ابدأ مشروعك ←'),

  // ---- clients ----
  clientsEyebrow: L('Selected Clients', 'عملاؤنا'),
  clientsHeading: L('Our\nClients', 'عملاؤنا\nوشركاؤنا'),

  // ---- services ("What We Do") ----
  servicesEyebrow: L('What We Do', 'بنعمل إيه'),
  servicesHeading: L('One studio,\nevery creative need.', 'استوديو واحد،\nكل اللي البراند محتاجه.'),
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
  aboutHeading: L('The studio\nbehind the work.', 'الاستوديو\nاللي ورا الشغل.'),
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
  footerNote: L('© 2026 KEDA — Brand & Creative Studio, Cairo', '© 2026 كده — استوديو علامات وإبداع، القاهرة'),
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
            color: typeof w?.color === 'string' && w.color ? w.color : 'var(--orange-soft)',
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
