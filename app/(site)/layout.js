import './site.css';
import SiteChrome from '@/components/site/SiteChrome';

// The public pages: home, portfolio, about and contact. Their stylesheet is
// imported here rather than in the root layout so it never loads on the
// admin, which has its own (app/admin/admin.css) using the same class names.
export default function SiteLayout({ children }) {
  return (
    <>
      {/* without scripts nothing would ever reveal the .rv blocks */}
      <noscript>
        <style>{'.rv{opacity:1 !important;transform:none !important}'}</style>
      </noscript>
      <SiteChrome>{children}</SiteChrome>
    </>
  );
}
