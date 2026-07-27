'use client';

import { useRouter } from 'next/navigation';
import { LANG_COOKIE } from '@/lib/i18n';

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
      className="lang-toggle"
      onClick={switchLang}
      aria-label={next === 'ar' ? 'التبديل إلى العربية' : 'Switch to English'}
      title={next === 'ar' ? 'العربية' : 'English'}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
      </svg>
      <span className="lang-toggle-label">{next === 'ar' ? 'ع' : 'EN'}</span>
    </button>
  );
}
