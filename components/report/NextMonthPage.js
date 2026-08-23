import ReportPage from './ReportPage';
import { renewalAlert } from '@/lib/reportMath';

export default function NextMonthPage({ client, report }) {
  const alert = renewalAlert(client.renewalDate);
  const plan = report.nextMonthPlan || {};
  return (
    <ReportPage pageNumber={6} className="report-next-month">
      <h2 className="report-section-title">الشهر الجاي</h2>
      <div className="report-pillars">
        {(plan.pillars || []).map((p, i) => <div className="report-pillar" key={i}>{p}</div>)}
      </div>
      <div className="report-events">
        {(plan.events || []).map((ev, i) => <div className="report-event" key={i}>{ev}</div>)}
      </div>
      {client.renewalDate ? (
        <div className={`report-renewal ${alert ? 'alert' : ''}`}>
          {/* ar-EG-u-nu-latn: Arabic month names, Western digits — matches
              every other number on the report (metrics, tables, posts) so
              the date doesn't switch to Arabic-Indic numerals on its own. */}
          تجديد الباقة: {new Date(client.renewalDate).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      ) : null}
    </ReportPage>
  );
}
