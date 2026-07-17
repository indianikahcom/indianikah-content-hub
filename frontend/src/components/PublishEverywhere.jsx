import { useEffect, useState } from "react";
import { Globe2, RefreshCw, Send } from "lucide-react";
import { api } from "../services/api";

export default function PublishEverywhere({ post, showToast, onPublished }) {
  const [campaigns, setCampaigns] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!post?.id) return;
    try {
      const result = await api.getPostCampaigns(post.id);
      setCampaigns(result.data || []);
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => { load(); }, [post?.id]);

  const publish = async () => {
    setBusy(true);
    try {
      const result = await api.publishEverywhere(post.id);
      setCampaigns(items => [result.data, ...items]);
      showToast("Campaign completed", `Campaign #${result.data.id}: ${result.data.status}`);
      await onPublished?.();
    } catch (error) {
      showToast("Publishing failed", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const retry = async id => {
    setBusy(true);
    try {
      const result = await api.retryCampaign(id);
      setCampaigns(items => items.map(item => item.id === id ? result.data : item));
      showToast("Retry completed", `Campaign #${id}: ${result.data.status}`);
    } catch (error) {
      showToast("Retry failed", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const latest = campaigns[0];

  return (
    <section className="publish-everywhere">
      <div className="publish-everywhere-head">
        <div>
          <strong><Globe2 size={17} /> Publish everywhere</strong>
          <small>Publishes to every enabled platform.</small>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={busy || post?.status !== "APPROVED"}
          onClick={publish}
        >
          <Send size={16} />
          {busy ? "Publishing..." : "Publish everywhere"}
        </button>
      </div>

      {latest && (
        <div className="campaign-summary">
          <div>
            <span>Campaign #{latest.id}</span>
            <strong>{latest.status}</strong>
          </div>
          <div className="campaign-platforms">
            {(latest.publications || []).map(item => (
              <span key={item.id} className={`campaign-platform ${item.status.toLowerCase()}`}>
                {item.platform}: {item.status}
              </span>
            ))}
          </div>
          {(latest.publications || []).some(item => item.status === "FAILED") && (
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => retry(latest.id)}
            >
              <RefreshCw size={15} /> Retry failed
            </button>
          )}
        </div>
      )}
    </section>
  );
}
