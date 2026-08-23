import { notFound } from 'next/navigation';
import { getReports, getReportClients } from '@/lib/store';
import { prevMonthKey } from '@/lib/reportMath';
import CoverPage from '@/components/report/CoverPage';
import SummaryPage from '@/components/report/SummaryPage';
import DeliveredPage from '@/components/report/DeliveredPage';
import TopPostsPage from '@/components/report/TopPostsPage';
import AnalysisPage from '@/components/report/AnalysisPage';
import NextMonthPage from '@/components/report/NextMonthPage';
import '../report.css';

// Deliberately outside /admin's auth: the PDF export step (lib/pdf.js) has
// Playwright navigate straight to this URL, and per SPEC.md §8 it also
// doubles as a plain-browser preview link from the admin. Nothing here is
// sensitive in a way a stray visit would expose — same tier of "unlisted, not
// secret" as everything else with a random id in this app.
export default async function ReportTemplatePage({ params }) {
  const { id } = await params;
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
