import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Layers3,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "../services/api";

function Stat({ icon: Icon, label, value, note }) {
  return (
    <article className="overview-stat">
      <span className="overview-stat-icon">
        <Icon size={20} />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value ?? 0}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}

function statusClass(status = "") {
  return String(status).toLowerCase().replaceAll("_", "-");
}

export default function AdminOverview({
  showToast,
  refreshToken = 0,
  onOpenPost,
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.getDashboardSummary();
      setSummary(result.data);
    } catch (error) {
      showToast("Could not load dashboard summary", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshToken]);

  if (loading && !summary) {
    return (
      <section className="panel overview-loading">
        <Loader2 className="spin" size={22} />
        Loading workspace summary...
      </section>
    );
  }

  const queue = summary?.queue || {};
  const posts = summary?.posts || {};
  const sources = summary?.sources || {};
  const campaigns = summary?.campaigns || {};

  return (
    <>
      <section className="overview-hero">
        <div>
          <p className="eyebrow">OPERATIONS OVERVIEW</p>
          <h2>Content production at a glance</h2>
          <p>
            Import, prepare, approve and publish from one workspace.
            Manual approval remains enabled.
          </p>
        </div>
        <div className="overview-health">
          <CheckCircle2 size={19} />
          <div>
            <strong>Campaign engine active</strong>
            <span>
              {campaigns.successfulToday || 0} successful campaign(s) today
            </span>
          </div>
        </div>
      </section>

      <div className="overview-stats">
        <Stat
          icon={Database}
          label="Content sources"
          value={sources.total}
          note={`${sources.new || 0} new`}
        />
        <Stat
          icon={FileText}
          label="Draft posts"
          value={posts.draft}
          note={`${posts.pendingApproval || 0} awaiting approval`}
        />
        <Stat
          icon={Layers3}
          label="Queue ready"
          value={queue.ready}
          note={`${queue.approved || 0} approved`}
        />
        <Stat
          icon={Send}
          label="Published today"
          value={queue.publishedToday}
          note={`${campaigns.today || 0} campaign(s)`}
        />
        <Stat
          icon={AlertTriangle}
          label="Needs attention"
          value={queue.failed}
          note={`${campaigns.failedToday || 0} failed today`}
        />
      </div>

      <div className="overview-detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT QUEUE</p>
              <h2>Latest prepared content</h2>
            </div>
          </div>

          {(summary?.recentQueue || []).length ? (
            <div className="overview-list">
              {summary.recentQueue.map((item) => (
                <button
                  className="overview-list-row"
                  type="button"
                  key={item.id}
                  onClick={() => onOpenPost?.(item.postId)}
                >
                  <div>
                    <strong>{item.post?.title || `Post #${item.postId}`}</strong>
                    <span>
                      {item.contentType} · Queue #{item.id}
                    </span>
                  </div>
                  <span className={`overview-status ${statusClass(item.status)}`}>
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="overview-empty">No queue activity yet.</div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CAMPAIGN HISTORY</p>
              <h2>Latest publishing results</h2>
            </div>
          </div>

          {(summary?.recentCampaigns || []).length ? (
            <div className="overview-list">
              {summary.recentCampaigns.map((campaign) => (
                <article className="overview-campaign" key={campaign.id}>
                  <div>
                    <strong>
                      {campaign.post?.title || `Post #${campaign.postId}`}
                    </strong>
                    <span>Campaign #{campaign.id}</span>
                  </div>
                  <span className={`overview-status ${statusClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <div className="overview-platforms">
                    {(campaign.publications || []).map((item) => (
                      <span
                        key={item.id}
                        className={statusClass(item.status)}
                        title={item.errorMessage || ""}
                      >
                        {item.platform}: {item.status}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overview-empty">No publishing campaigns yet.</div>
          )}
        </section>
      </div>

      {(summary?.platformStats || []).length > 0 && (
        <section className="panel platform-health-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PLATFORM HEALTH</p>
              <h2>Publishing success by platform</h2>
            </div>
          </div>

          <div className="platform-health-grid">
            {summary.platformStats.map((item) => {
              const rate = item.total
                ? Math.round((item.success / item.total) * 100)
                : 0;

              return (
                <article key={item.platform}>
                  <div>
                    <strong>{item.platform}</strong>
                    <span>{rate}% success</span>
                  </div>
                  <div className="platform-health-track">
                    <span style={{ width: `${rate}%` }} />
                  </div>
                  <small>
                    {item.success} success · {item.failed} failed
                  </small>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
