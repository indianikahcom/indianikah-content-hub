import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit3, RefreshCw, RotateCcw, Save } from "lucide-react";
import { api } from "../services/api";

const PLATFORM_LABELS = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  X: "X",
  LINKEDIN: "LinkedIn",
  TELEGRAM: "Telegram",
  WHATSAPP: "WhatsApp",
  YOUTUBE: "YouTube",
};

export default function PlatformVariants({ postId, showToast }) {
  const [variants, setVariants] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = useMemo(
    () => variants.find((variant) => variant.id === activeId) || variants[0],
    [variants, activeId]
  );

  const syncForm = (variant) => {
    setForm({
      title: variant?.title || "",
      content: variant?.content || "",
    });
  };

  const load = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const payload = await api.getPostVariants(postId);
      const items = payload.data || [];
      setVariants(items);
      const first = items[0] || null;
      setActiveId(first?.id || null);
      syncForm(first);
    } catch (error) {
      showToast?.("Could not load platform variants", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const compose = async () => {
    setLoading(true);
    try {
      const payload = await api.composePost(postId);
      const items = payload.data?.variants || [];
      setVariants(items);
      const first = items[0] || null;
      setActiveId(first?.id || null);
      syncForm(first);
      showToast?.("Platform variants ready", payload.message);
    } catch (error) {
      showToast?.("Composer failed", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const chooseVariant = (variant) => {
    setActiveId(variant.id);
    syncForm(variant);
  };

  const save = async () => {
    if (!active) return;
    setSaving(true);
    try {
      const payload = await api.updatePostVariant(active.id, {
        title: form.title || null,
        content: form.content,
      });
      setVariants((items) =>
        items.map((item) => item.id === active.id ? payload.data : item)
      );
      showToast?.("Variant saved", `${active.platform} variant updated.`);
    } catch (error) {
      showToast?.("Could not save variant", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    if (!active) return;
    setSaving(true);
    try {
      const payload = await api.updatePostVariantStatus(active.id, status);
      setVariants((items) =>
        items.map((item) => item.id === active.id ? payload.data : item)
      );
      showToast?.(
        status === "READY" ? "Variant ready" : "Variant returned to draft",
        `${active.platform} moved to ${status}.`
      );
    } catch (error) {
      showToast?.("Could not change variant status", error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  useEffect(() => {
    syncForm(active);
  }, [activeId]);

  return (
    <section className="variant-panel">
      <div className="variant-heading">
        <div>
          <p className="eyebrow">Platform composer</p>
          <h3>Platform-ready variants</h3>
        </div>
        <button className="button button-secondary" onClick={compose} disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Composing..." : variants.length ? "Recompose all" : "Compose variants"}
        </button>
      </div>

      {!variants.length ? (
        <div className="variant-empty">
          <p>No platform variants yet.</p>
          <button className="button button-primary" onClick={compose} disabled={loading}>
            Compose variants
          </button>
        </div>
      ) : (
        <>
          <div className="variant-tabs">
            {variants.map((variant) => (
              <button
                key={variant.id}
                className={variant.id === active?.id ? "variant-tab active" : "variant-tab"}
                onClick={() => chooseVariant(variant)}
              >
                <span>{PLATFORM_LABELS[variant.platform] || variant.platform}</span>
                <small className={variant.status === "READY" ? "ready" : ""}>
                  {variant.status}
                </small>
              </button>
            ))}
          </div>

          {active ? (
            <div className="variant-editor">
              <div className="variant-editor-header">
                <div>
                  <strong>{PLATFORM_LABELS[active.platform] || active.platform}</strong>
                  <span>{form.content.length} characters</span>
                </div>
                <span className={`variant-status ${active.status.toLowerCase()}`}>
                  {active.status}
                </span>
              </div>

              <label>
                Platform title
                <input
                  value={form.title}
                  onChange={(event) => setForm((value) => ({
                    ...value,
                    title: event.target.value,
                  }))}
                  placeholder="Optional title"
                  disabled={active.status === "PUBLISHED"}
                />
              </label>

              <label>
                Platform content
                <textarea
                  rows="12"
                  value={form.content}
                  onChange={(event) => setForm((value) => ({
                    ...value,
                    content: event.target.value,
                  }))}
                  disabled={active.status === "PUBLISHED"}
                />
              </label>

              <div className="variant-actions">
                <button className="button button-secondary" onClick={save} disabled={saving}>
                  <Save size={16} /> {saving ? "Saving..." : "Save"}
                </button>

                {active.status === "DRAFT" ? (
                  <button
                    className="button button-primary"
                    onClick={() => changeStatus("READY")}
                    disabled={saving}
                  >
                    <CheckCircle2 size={16} /> Mark READY
                  </button>
                ) : null}

                {active.status === "READY" ? (
                  <button
                    className="button button-secondary"
                    onClick={() => changeStatus("DRAFT")}
                    disabled={saving}
                  >
                    <RotateCcw size={16} /> Return to DRAFT
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
