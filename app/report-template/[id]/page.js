import { notFound } from 'next/navigation';
import { getReports, getReportClients } from '@/lib/store';
import { prevMonthKey } from '@/lib/reportMath';
import { getSessionUser, hasPermission, verifyReportPass } from '@/lib/auth';
import CoverPage from '@/components/report/CoverPage';
import SummaryPage from '@/components/report/SummaryPage';
import DeliveredPage from '@/components/report/DeliveredPage';
import TopPostsPage from '@/components/report/TopPostsPage';
import AnalysisPage from '@/components/report/AnalysisPage';
import NextMonthPage from '@/components/report/NextMonthPage';
import '../report.css';

export const metadata = { robots: { index: false, follow: false } };

// A client's monthly report, laid out for print. Opened by the admin's
// "Preview report" link (signed in, with the reports permission) and by the
// PDF export, whose headless browser (lib/pdf.js) carries no cookie and gets
// a short-lived signed pass in the URL instead (lib/auth.js). Anyone else
// gets a 404, the same as for an id that doesn't exist, so the ids — which
// are only partly random — can't be walked to read clients' numbers.
export default async function ReportTemplatePage({ params, searchParams }) {
  const { id } = await params;
  const { pass } = await searchParams;
  const allowed = (await verifyReportPass(id, pass)) || hasPermission(await getSessionUser(), 'reports');
  if (!allowed) notFound();
  const [reports, clients] = await Promise.all([getReports(), getReportClients()]);
  const report = reports.find((r) => r.id === id);
  if (!report) notFound();
  const client = clients.find((c) => c.id === report.clientId);
  if (!client) notFound();
  const previousReport = reports.find((r) => r.clientId === client.id && r.month === prevMonthKey(report.month)) || null;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
      <div
        className="report-root"
        dir="rtl"
        style={{ '--rpt-primary': client.primaryColor || '#2F3A44', '--rpt-secondary': client.secondaryColor || '#8791A0' }}
      >
        <CoverPage client={client} month={report.month} />
        <SummaryPage report={report} previousReport={previousReport} />
        <DeliveredPage client={client} report={report} />
        <TopPostsPage report={report} />
        <AnalysisPage report={report} />
        <NextMonthPage client={client} report={report} />
      </div>
    </>
  );
}
