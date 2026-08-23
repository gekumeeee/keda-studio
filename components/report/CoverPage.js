import ReportPage from './ReportPage';
import { monthLabelAr } from '@/lib/reportMath';

export default function CoverPage({ client, month }) {
  return (
    <ReportPage pageNumber={1} className="report-cover">
      {client.logoUrl ? (
        <img src={client.logoUrl} alt={client.name} className="report-cover-logo" />
      ) : (
        <div className="report-cover-logo-fallback">{client.name}</div>
      )}
      <h1 className="report-cover-title">تقرير الأداء الشهري</h1>
      <div className="report-cover-month">{monthLabelAr(month)}</div>
    </ReportPage>
  );
}
