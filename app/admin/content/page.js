import { redirect } from 'next/navigation';
import { getSessionUser, hasPermission } from '@/lib/auth';
import ContentTab from '@/components/admin/ContentTab';

export const metadata = {
  title: 'Content plan',
  robots: { index: false, follow: false },
};

// The content plan as a page of its own, opened from the admin's sidebar in a
// new browser tab. The admin signs people in, so anyone who isn't (or has no
// "content" permission) is sent back there; the data routes check it again.
export default async function ContentPlanPage() {
  const user = await getSessionUser();
  if (!user || !hasPermission(user, 'content')) redirect('/admin');
  return <ContentTab username={user.username} />;
}
