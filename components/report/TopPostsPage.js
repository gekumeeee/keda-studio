import ReportPage from './ReportPage';

export default function TopPostsPage({ report }) {
  return (
    <ReportPage pageNumber={4} className="report-top-posts">
      <h2 className="report-section-title">أفضل 3 منشورات</h2>
      <div className="report-posts-grid">
        {(report.topPosts || []).map((p, i) => (
          <div className="report-post-card" key={i}>
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="report-post-image" />
            ) : (
              <div className="report-post-image-fallback" />
            )}
            <div className="report-post-stats">
              <span>الوصول: {Number(p.reach || 0).toLocaleString('en-US')}</span>
              <span>التفاعل: {Number(p.engagement || 0).toLocaleString('en-US')}</span>
            </div>
            <p className="report-post-why">{p.whyItWorked || '—'}</p>
          </div>
        ))}
      </div>
    </ReportPage>
  );
}
