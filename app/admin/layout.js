import './admin.css';

// The admin and the content plan. Their stylesheet is imported here, not in
// the root layout, so it never loads on the public site (and the site's never
// loads here): both use short class names like .panel and .btn.
export default function AdminLayout({ children }) {
  return children;
}
