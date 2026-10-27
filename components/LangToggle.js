'use client';

import { useRouter } from 'next/navigation';
import { LANG_COOKIE } from '@/lib/i18n';

// The language lives in the `lang` cookie so the server renders the right
// copy and direction; switching flips <html> straight away and re-renders.
export default function LangToggle({ lang }) {
  const router = useRouter();
  const next = lang === 'ar' ? 'en' : 'ar';

  function switchLang() {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // optimistic flip so direction changes instantly
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    router.refresh();
  }

  return (
    <button
      type="button"
      className="lang"
      onClick={switchLang}
      aria-label={next === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}
      title={next === 'ar' ? 'العربية' : 'English'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
      </svg>
      <span lang={next}>{next === 'ar' ? 'ع' : 'EN'}</span>
    </button>
  );
}
