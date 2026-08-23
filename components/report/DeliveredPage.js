import ReportPage from './ReportPage';
import { deliveryRows } from '@/lib/reportMath';

export default function DeliveredPage({ client, report }) {
  const rows = deliveryRows(client.packageJson, report.deliveredCounts);
  return (
    <ReportPage pageNumber={3} className="report-delivered">
      <h2 className="report-section-title">التسليمات</h2>
      <table className="report-table">
        <thead>
          <tr><th>النوع</th><th>المتفق عليه</th><th>الفعلي</th><th>الحالة</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4}>لا يوجد باقة محددة لهذا العميل</td></tr>
          ) : (
            rows.map((r) => (
              <tr key={r.type}>
                <td>{r.type}</td><td>{r.agreed}</td><td>{r.delivered}</td><td>{r.status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ReportPage>
  );
}
