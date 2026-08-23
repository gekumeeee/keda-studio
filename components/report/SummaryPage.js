import ReportPage from './ReportPage';
import { changePct, formatPct } from '@/lib/reportMath';

const CARDS = [
  { key: 'reach', label: 'الوصول' },
  { key: 'engagement', label: 'التفاعل' },
  { key: 'newFollowers', label: 'متابعين جدد' },
  { key: 'messages', label: 'الرسائل' },
];

export default function SummaryPage({ report, previousReport }) {
  return (
    <ReportPage pageNumber={2} className="report-summary">
      <h2 className="report-section-title">ملخص الأداء</h2>
      <div className="report-metric-grid">
        {CARDS.map(({ key, label }) => {
          const pct = changePct(report[key], previousReport?.[key]);
          return (
            <div className="report-metric-card" key={key}>
              <div className="report-metric-label">{label}</div>
              <div className="report-metric-value">{Number(report[key] || 0).toLocaleString('en-US')}</div>
              <div className={`report-metric-change ${pct === null ? '' : pct >= 0 ? 'up' : 'down'}`}>
                {pct === null ? 'أول شهر — خط الأساس' : `${pct >= 0 ? '▲' : '▼'} ${formatPct(pct)}`}
              </div>
            </div>
          );
        })}
      </div>
      <p className="report-summary-text">{report.summaryText || '—'}</p>
    </ReportPage>
  );
}
