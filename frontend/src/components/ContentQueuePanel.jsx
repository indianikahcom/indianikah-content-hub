import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ListChecks,
  Loader2,
  Send,
  Shuffle,
  X,
} from "lucide-react";
import { api } from "../services/api";

const TYPES = ["BOOK", "GUIDELINE", "BLOG"];

export default function ContentQueuePanel({
  showToast,
  onReviewPost,
  refreshToken = 0,
}) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const payload = await api.getQueue({ limit: 20 });
      setItems(payload.data || []);
    } catch (error) {
      showToast("Could not load content queue", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshToken]);

  const addRandom = async (type) => {
    setBusy(`add-${type}`);
    try {
      const payload = await api.addRandomQueueItem({
        type,
        platform: "ALL",
      });
      showToast(
        "Added to content queue",
        `${payload.data.queueItem.post.title} · ${type}`
      );
      await load();
    } catch (error) {
      showToast("Could not add content", error.message, "error");
    } finally {
      setBusy("");
    }
  };

  const approvePublish = async (item) => {
    setBusy(`publish-${item.id}`);
    try {
      const payload = await api.publishQueueItem(item.id);
      showToast(
        "Publishing completed",
        `${item.post.title} · ${payload.data.status}`
      );
      await load();
    } catch (error) {
      showToast("Publishing failed", error.message, "error");
    } finally {
      setBusy("");
    }
  };

  const cancel = async (id) => {
    setBusy(`cancel-${id}`);
    try {
      await api.cancelQueueItem(id);
      showToast("Queue item cancelled");
      await load();
    } catch (error) {
      showToast("Could not cancel queue item", error.message, "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="panel content-queue-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">READY CONTENT</p>
          <h2>Content Queue</h2>
          <p>
            Prepare content in advance. Manual approval remains the default.
          </p>
        </div>
        <div className="queue-heading-icon">
          <ListChecks size={22} />
        </div>
      </div>

      <div className="queue-add-actions">
        {TYPES.map((type) => (
          <button
            type="button"
            className="button button-secondary"
            key={type}
            disabled={Boolean(busy)}
            onClick={() => addRandom(type)}
          >
            {busy === `add-${type}` ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Shuffle size={16} />
            )}
            Add random {type.toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="queue-loading">
          <Loader2 className="spin" size={20} /> Loading queue...
        </div>
      ) : items.length === 0 ? (
        <div className="queue-empty">
          No queued content yet. Add a random book, guideline or blog.
        </div>
      ) : (
        <div className="queue-list">
          {items.map((item) => (
            <article className="queue-item" key={item.id}>
              <div className="queue-item-main">
                <span className={`queue-status ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
                <div>
                  <strong>{item.post?.title || `Post #${item.postId}`}</strong>
                  <small>
                    {item.contentType} · Post #{item.postId}
                    {item.scheduledAt
                      ? ` · ${new Date(item.scheduledAt).toLocaleString("en-IN")}`
                      : ""}
                  </small>
                </div>
              </div>

              <div className="queue-item-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => onReviewPost?.(item.postId)}
                >
                  Review
                </button>

                {["READY", "APPROVED", "FAILED", "PARTIAL_SUCCESS"].includes(
                  item.status
                ) && (
                  <button
                    type="button"
                    className="primary-button"
                    disabled={Boolean(busy)}
                    onClick={() => approvePublish(item)}
                  >
                    {busy === `publish-${item.id}` ? (
                      <Loader2 className="spin" size={15} />
                    ) : item.status === "READY" ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <Send size={15} />
                    )}
                    Approve & publish
                  </button>
                )}

                {!["PUBLISHED", "PUBLISHING", "CANCELLED"].includes(
                  item.status
                ) && (
                  <button
                    type="button"
                    className="queue-cancel"
                    disabled={Boolean(busy)}
                    onClick={() => cancel(item.id)}
                    aria-label="Cancel queue item"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
