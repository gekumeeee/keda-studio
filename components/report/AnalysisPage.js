import ReportPage from './ReportPage';

export default function AnalysisPage({ report }) {
  return (
    <ReportPage pageNumber={5} className="report-analysis">
      <h2 className="report-section-title">التحليل</h2>
      <div className="report-analysis-block"><h3>اللي اشتغل</h3><p>{report.worked || '—'}</p></div>
      <div className="report-analysis-block"><h3>اللي مأداش</h3><p>{report.didntWork || '—'}</p></div>
      <div className="report-analysis-block"><h3>يحتاج قرار منك</h3><p>{report.needsDecision || '—'}</p></div>
    </ReportPage>
  );
}
