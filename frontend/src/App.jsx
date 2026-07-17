import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Database,
  Gauge,
  Layers3,
  Settings,
  Menu,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { api } from "./services/api";
import StatusBadge from "./components/StatusBadge";
import Modal from "./components/Modal";
import Toast from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";
import RandomDraftPanel from "./components/RandomDraftPanel";
import ContentQueuePanel from "./components/ContentQueuePanel";
import PromptSettings from "./components/PromptSettings";
import PublishEverywhere from "./components/PublishEverywhere";
import AdminOverview from "./components/AdminOverview";

const SOURCE_STATUSES = ["", "NEW", "PROCESSING", "PROCESSED", "REJECTED", "ARCHIVED"];
const POST_STATUSES = ["", "DRAFT", "PENDING_APPROVAL", "APPROVED"];
const SOURCE_TYPES = ["", "PROFILE", "BOOK", "GUIDELINE", "BLOG", "VIDEO", "NEWS", "ISLAMIC", "OTHER"];

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DashboardCard({ label, value, icon: Icon, hint }) {
  return (
    <article className="metric-card">
      <div className="metric-icon"><Icon size={21} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{hint}</span>
      </div>
    </article>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <FileText size={38} />
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sources, setSources] = useState([]);
  const [posts, setPosts] = useState([]);
  const [importRuns, setImportRuns] = useState([]);
  const [importing, setImporting] = useState(false);
  const [sourcePagination, setSourcePagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [sourceFilters, setSourceFilters] = useState({ search: "", type: "", status: "", page: 1, limit: 20 });
  const [postStatus, setPostStatus] = useState("");
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", content: "" });
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);

  const showToast = (title, message = "", type = "success") => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadSources = async (overrides = {}) => {
    setLoadingSources(true);
    try {
      const filters = { ...sourceFilters, ...overrides };
      const payload = await api.getSources(filters);
      setSources(normalizeListResponse(payload));
      setSourcePagination(payload.pagination || {
        page: filters.page || 1,
        totalPages: 1,
        total: payload.count || 0,
        limit: filters.limit || 20,
      });
    } catch (error) {
      showToast("Could not load sources", error.message, "error");
    } finally {
      setLoadingSources(false);
    }
  };

  const loadPosts = async (status = postStatus) => {
    setLoadingPosts(true);
    try {
      const payload = await api.getPosts(status ? { status } : {});
      setPosts(normalizeListResponse(payload));
    } catch (error) {
      showToast("Could not load posts", error.message, "error");
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadImports = async () => {
    try {
      const payload = await api.getImports({ limit: 5 });
      setImportRuns(normalizeListResponse(payload));
    } catch (error) {
      showToast("Could not load import history", error.message, "error");
    }
  };

  const importAllProductionContent = async () => {
    setImporting(true);
    try {
      const payload = await api.importAll({
        profileHours: 24,
        blogHours: 8760,
        generateSummary: true,
      });

      const data = payload.data || {};
      const imported =
        (data.profiles?.run?.importedCount || 0) +
        (data.books?.run?.importedCount || 0) +
        (data.guidelines?.run?.importedCount || 0) +
        (data.blogs?.run?.importedCount || 0);

      await Promise.all([
        loadSources({ page: 1 }),
        loadPosts(),
        loadImports(),
      ]);

      setDashboardRefreshToken((value) => value + 1);

      showToast(
        "Production import completed",
        `${imported} new record(s) imported across all content types.`
      );
    } catch (error) {
      showToast("Production import failed", error.message, "error");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    loadSources();
    loadPosts();
    loadImports();
  }, []);

  const stats = useMemo(() => ({
    totalSources: sourcePagination.total || sources.length,
    newSources: sources.filter((item) => item.status === "NEW").length,
    drafts: posts.filter((item) => item.status === "DRAFT").length,
    approvals: posts.filter((item) => item.status === "PENDING_APPROVAL").length,
    approved: posts.filter((item) => item.status === "APPROVED").length,
  }), [sources, posts, sourcePagination.total]);

  const refreshAll = async () => {
    await Promise.all([loadSources(), loadPosts(), loadImports()]);
    setDashboardRefreshToken((value) => value + 1);
    showToast("Dashboard refreshed");
  };

  const openSource = async (id) => {
    try {
      const payload = await api.getSource(id);
      setSelectedSource(payload.data || payload);
    } catch (error) {
      showToast("Could not open source", error.message, "error");
    }
  };

  const openPost = async (id) => {
    try {
      const payload = await api.getPost(id);
      setSelectedPost(payload.data || payload);
    } catch (error) {
      showToast("Could not open post", error.message, "error");
    }
  };

  const submitSourceFilters = (event) => {
    event.preventDefault();
    const updated = { ...sourceFilters, page: 1 };
    setSourceFilters(updated);
    loadSources(updated);
  };

  const changeSourcePage = (page) => {
    if (page < 1 || page > sourcePagination.totalPages) return;
    const updated = { ...sourceFilters, page };
    setSourceFilters(updated);
    loadSources(updated);
  };

  const generatePost = async (source) => {
    setBusy(true);
    try {
      await api.generatePostFromSource(source.id);
      setSelectedSource(null);
      await Promise.all([loadSources(), loadPosts()]);
      showToast("Draft generated", `A draft post was created from source #${source.id}.`);
    } catch (error) {
      showToast("Could not generate draft", error.message, "error");
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const updateSourceStatus = async (source, status) => {
    setBusy(true);
    try {
      await api.updateSourceStatus(source.id, status);
      setSelectedSource(null);
      await loadSources();
      showToast("Source updated", `Source moved to ${status}.`);
    } catch (error) {
      showToast("Could not update source", error.message, "error");
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const startEditPost = (post) => {
    setEditingPost(post);
    setPostForm({ title: post.title || "", content: post.content || "" });
    setSelectedPost(null);
  };

  const savePost = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingPost) {
        await api.updatePost(editingPost.id, postForm);
        showToast("Post updated");
      } else {
        await api.createPost(postForm);
        showToast("Draft created");
      }
      setEditingPost(null);
      setNewPostOpen(false);
      setPostForm({ title: "", content: "" });
      await loadPosts();
    } catch (error) {
      showToast("Could not save post", error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const updatePostStatus = async (post, status) => {
    setBusy(true);
    try {
      await api.updatePostStatus(post.id, status);
      setSelectedPost(null);
      await loadPosts();
      showToast("Post status updated", `Post moved to ${status}.`);
    } catch (error) {
      showToast("Could not update post", error.message, "error");
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const publishToTelegram = async (post) => {
    setBusy(true);
    try {
      const payload = await api.publishPostToTelegram(post.id);
      const publication = payload.data;
      const refreshed = await api.getPost(post.id);
      setSelectedPost(refreshed.data || refreshed);
      await loadPosts();
      showToast(
        "Published to Telegram",
        `Telegram message #${publication.externalMessageId} was published successfully.`
      );
    } catch (error) {
      showToast("Telegram publishing failed", error.message, "error");
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: Gauge },
    { id: "queue", label: "Content Queue", icon: Layers3 },
    { id: "sources", label: "Content Sources", icon: Sparkles },
    { id: "posts", label: "Posts & Approval", icon: FileText },
    { id: "prompts", label: "Prompt Settings", icon: Settings },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">IN</div>
          <div><strong>IndiaNikah</strong><span>AI Content Hub</span></div>
        </div>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeView === id ? "nav-item active" : "nav-item"}
              onClick={() => { setActiveView(id); setSidebarOpen(false); }}
            >
              <Icon size={19} /> {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <strong>Manual approval first</strong>
          <span>Nothing is published without review.</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen((value) => !value)}><Menu size={22} /></button>
          <div>
            <p className="eyebrow">Admin workspace</p>
            <h1>{navigation.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <button className="button button-primary" onClick={importAllProductionContent} disabled={importing}><Database size={17} /> {importing ? "Importing..." : "Import all"}</button>
          <button className="button button-secondary" onClick={refreshAll}><RefreshCw size={17} /> Refresh</button>
        </header>

        {activeView === "dashboard" && (
          <section className="page-section">
            <AdminOverview
              showToast={showToast}
              refreshToken={dashboardRefreshToken}
              onOpenPost={async (postId) => {
                await openPost(postId);
                setActiveView("posts");
              }}
            />

            <RandomDraftPanel
              showToast={showToast}
              onRefresh={async () => {
                await Promise.all([loadSources(), loadPosts()]);
              }}
              onDraftReady={async (postId) => {
                await openPost(postId);
                setActiveView("posts");
              }}
            />

            <ContentQueuePanel
              showToast={showToast}
              onReviewPost={async (postId) => {
                await openPost(postId);
                setActiveView("posts");
              }}
            />

            <section className="panel import-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Production importer</p><h2>Read-only MySQL profile import</h2></div>
                <button className="button button-primary" onClick={importAllProductionContent} disabled={importing}><Database size={17} /> {importing ? "Importing..." : "Import all missing"}</button>
              </div>
              {importRuns.length ? (
                <div className="import-runs">
                  {importRuns.map((run) => (
                    <div className="import-run" key={run.id}>
                      <div><strong>{run.status}</strong><span>{formatDate(run.startedAt)}</span></div>
                      <span>Fetched {run.fetchedCount} · Imported {run.importedCount} · Skipped {run.skippedCount}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No production imports yet" message="Use Import now to read safe public profile fields from the production database." />}
            </section>

            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-heading"><div><p className="eyebrow">Recent activity</p><h2>Latest content sources</h2></div><button className="text-button" onClick={() => setActiveView("sources")}>View all</button></div>
                {sources.length ? sources.slice(0, 5).map((source) => (
                  <button className="activity-row" key={source.id} onClick={() => openSource(source.id)}>
                    <div><strong>{source.title || `${source.type} source #${source.id}`}</strong><span>{source.type} · {formatDate(source.createdAt)}</span></div>
                    <StatusBadge status={source.status} />
                  </button>
                )) : <EmptyState title="No sources yet" message="Create or import a source to begin." />}
              </section>

              <section className="panel">
                <div className="panel-heading"><div><p className="eyebrow">Approval queue</p><h2>Posts needing attention</h2></div><button className="text-button" onClick={() => setActiveView("posts")}>Open queue</button></div>
                {posts.filter((post) => post.status !== "APPROVED").length ? posts.filter((post) => post.status !== "APPROVED").slice(0, 5).map((post) => (
                  <button className="activity-row" key={post.id} onClick={() => openPost(post.id)}>
                    <div><strong>{post.title}</strong><span>Post #{post.id} · {formatDate(post.updatedAt)}</span></div>
                    <StatusBadge status={post.status} />
                  </button>
                )) : <EmptyState title="Queue is clear" message="No drafts or pending approvals right now." />}
              </section>
            </div>
          </section>
        )}

        {activeView === "queue" && (
          <section className="page-section">
            <ContentQueuePanel
              showToast={showToast}
              refreshToken={dashboardRefreshToken}
              onReviewPost={async (postId) => {
                await openPost(postId);
                setActiveView("posts");
              }}
            />
          </section>
        )}

        {activeView === "prompts" && (
          <section className="page-section">
            <PromptSettings showToast={showToast} />
          </section>
        )}

        {activeView === "sources" && (
          <section className="page-section">
            <form className="filter-bar" onSubmit={submitSourceFilters}>
              <label className="search-field"><Search size={18} /><input value={sourceFilters.search} onChange={(event) => setSourceFilters({ ...sourceFilters, search: event.target.value })} placeholder="Search title, content or external ID" /></label>
              <select value={sourceFilters.type} onChange={(event) => setSourceFilters({ ...sourceFilters, type: event.target.value })}>{SOURCE_TYPES.map((value) => <option key={value || "all"} value={value}>{value || "All types"}</option>)}</select>
              <select value={sourceFilters.status} onChange={(event) => setSourceFilters({ ...sourceFilters, status: event.target.value })}>{SOURCE_STATUSES.map((value) => <option key={value || "all"} value={value}>{value || "All statuses"}</option>)}</select>
              <button className="button button-primary" type="submit">Apply filters</button>
            </form>

            <section className="panel table-panel">
              <div className="panel-heading"><div><p className="eyebrow">Source inbox</p><h2>{sourcePagination.total} content sources</h2></div></div>
              {loadingSources ? <div className="loading-state"><RefreshCw className="spin" /> Loading sources...</div> : sources.length ? (
                <div className="table-wrap"><table><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Linked post</th><th>Created</th><th></th></tr></thead><tbody>
                  {sources.map((source) => <tr key={source.id}><td><strong>{source.title || `Untitled source #${source.id}`}</strong><span className="table-subtext">{source.externalId || `ID ${source.id}`}</span></td><td>{source.type}</td><td><StatusBadge status={source.status} /></td><td>{source.post ? `Post #${source.post.id}` : "—"}</td><td>{formatDate(source.createdAt)}</td><td><button className="text-button" onClick={() => openSource(source.id)}>Open</button></td></tr>)}
                </tbody></table></div>
              ) : <EmptyState title="No matching sources" message="Adjust the filters or import new content." />}
              <div className="pagination"><span>Page {sourcePagination.page} of {sourcePagination.totalPages}</span><div><button className="icon-button" onClick={() => changeSourcePage(sourcePagination.page - 1)} disabled={sourcePagination.page <= 1}><ChevronLeft size={18} /></button><button className="icon-button" onClick={() => changeSourcePage(sourcePagination.page + 1)} disabled={sourcePagination.page >= sourcePagination.totalPages}><ChevronRight size={18} /></button></div></div>
            </section>
          </section>
        )}

        {activeView === "posts" && (
          <section className="page-section">
            <div className="filter-bar post-filter-bar">
              <select value={postStatus} onChange={(event) => { const status = event.target.value; setPostStatus(status); loadPosts(status); }}>{POST_STATUSES.map((value) => <option key={value || "all"} value={value}>{value || "All post statuses"}</option>)}</select>
              <button className="button button-primary" onClick={() => { setNewPostOpen(true); setPostForm({ title: "", content: "" }); }}><Plus size={17} /> New manual post</button>
            </div>

            <section className="panel table-panel">
              <div className="panel-heading"><div><p className="eyebrow">Content workflow</p><h2>{posts.length} posts</h2></div></div>
              {loadingPosts ? <div className="loading-state"><RefreshCw className="spin" /> Loading posts...</div> : posts.length ? (
                <div className="table-wrap"><table><thead><tr><th>Post</th><th>Status</th><th>Source</th><th>Updated</th><th></th></tr></thead><tbody>
                  {posts.map((post) => <tr key={post.id}><td><strong>{post.title}</strong><span className="table-subtext">{(post.content || "").slice(0, 90)}{post.content?.length > 90 ? "…" : ""}</span></td><td><StatusBadge status={post.status} /></td><td>{post.sourceId ? `Source #${post.sourceId}` : "Manual"}</td><td>{formatDate(post.updatedAt)}</td><td><button className="text-button" onClick={() => openPost(post.id)}>Review</button></td></tr>)}
                </tbody></table></div>
              ) : <EmptyState title="No posts found" message="Generate a post from a source or create one manually." />}
            </section>
          </section>
        )}
      </main>

      {selectedSource && (
        <Modal title={`Source #${selectedSource.id}`} onClose={() => setSelectedSource(null)} footer={
          <>
            {selectedSource.status === "NEW" && !selectedSource.post ? <button className="button button-primary" onClick={() => setAction({ type: "generate", source: selectedSource })}><Sparkles size={17} /> Generate draft</button> : null}
            {selectedSource.status !== "REJECTED" && selectedSource.status !== "ARCHIVED" ? <button className="button button-danger" onClick={() => setAction({ type: "sourceStatus", source: selectedSource, status: "REJECTED" })}><XCircle size={17} /> Reject</button> : null}
            {selectedSource.status === "PROCESSED" || selectedSource.status === "REJECTED" ? <button className="button button-secondary" onClick={() => setAction({ type: "sourceStatus", source: selectedSource, status: "ARCHIVED" })}><Archive size={17} /> Archive</button> : null}
          </>
        }>
          <div className="detail-grid"><div><span>Type</span><strong>{selectedSource.type}</strong></div><div><span>Status</span><StatusBadge status={selectedSource.status} /></div><div><span>External ID</span><strong>{selectedSource.externalId || "—"}</strong></div><div><span>Created</span><strong>{formatDate(selectedSource.createdAt)}</strong></div></div>
          <h3>{selectedSource.title || "Untitled source"}</h3>
          <div className="content-preview">{selectedSource.rawContent || "No raw content provided."}</div>
          {selectedSource.sourceUrl ? <a className="source-link" href={selectedSource.sourceUrl} target="_blank" rel="noreferrer">Open original source</a> : null}
          {selectedSource.metadata ? <><h4>Metadata</h4><pre>{JSON.stringify(selectedSource.metadata, null, 2)}</pre></> : null}
          {selectedSource.post ? <div className="linked-card"><span>Linked post</span><strong>#{selectedSource.post.id} · {selectedSource.post.title}</strong><StatusBadge status={selectedSource.post.status} /></div> : null}
        </Modal>
      )}

      {selectedPost && (
        <Modal title={`Review post #${selectedPost.id}`} onClose={() => setSelectedPost(null)} footer={
          <>
            {selectedPost.status !== "APPROVED" ? <button className="button button-secondary" onClick={() => startEditPost(selectedPost)}><PenLine size={17} /> Edit</button> : null}
            {selectedPost.status === "DRAFT" ? <button className="button button-primary" onClick={() => setAction({ type: "postStatus", post: selectedPost, status: "PENDING_APPROVAL" })}>Submit for approval</button> : null}
            {selectedPost.status === "PENDING_APPROVAL" ? <button className="button button-primary" onClick={() => setAction({ type: "postStatus", post: selectedPost, status: "APPROVED" })}><CheckCircle2 size={17} /> Approve</button> : null}
            {selectedPost.status !== "DRAFT" ? <button className="button button-secondary" onClick={() => setAction({ type: "postStatus", post: selectedPost, status: "DRAFT" })}>Return to draft</button> : null}
          </>
        }>
          <div className="detail-grid"><div><span>Status</span><StatusBadge status={selectedPost.status} /></div><div><span>Source</span><strong>{selectedPost.sourceId ? `#${selectedPost.sourceId}` : "Manual"}</strong></div><div><span>Created</span><strong>{formatDate(selectedPost.createdAt)}</strong></div><div><span>Updated</span><strong>{formatDate(selectedPost.updatedAt)}</strong></div></div>
          <h3>{selectedPost.title}</h3>
          <div className="content-preview post-preview">{selectedPost.content}</div>
          <PublishEverywhere
            post={selectedPost}
            showToast={showToast}
            onPublished={async () => {
              const refreshed = await api.getPost(selectedPost.id);
              setSelectedPost(refreshed.data || refreshed);
              await loadPosts();
              setDashboardRefreshToken((value) => value + 1);
            }}
          />
          {selectedPost.publications?.length ? <>
            <h4>Publication history</h4>
            {selectedPost.publications.map((publication) => (
              <div className="linked-card" key={publication.id}>
                <span>{publication.platform}</span>
                <strong>{publication.status}{publication.externalMessageId ? ` · Message #${publication.externalMessageId}` : ""}</strong>
                <span>{publication.publishedAt ? formatDate(publication.publishedAt) : publication.errorMessage || "Not published yet"}</span>
              </div>
            ))}
          </> : null}
        </Modal>
      )}

      {(editingPost || newPostOpen) && (
        <Modal title={editingPost ? `Edit post #${editingPost.id}` : "Create manual post"} onClose={() => { setEditingPost(null); setNewPostOpen(false); }} footer={
          <><button className="button button-secondary" onClick={() => { setEditingPost(null); setNewPostOpen(false); }}>Cancel</button><button className="button button-primary" form="post-form" type="submit" disabled={busy}>{busy ? "Saving..." : "Save draft"}</button></>
        }>
          <form id="post-form" className="form-stack" onSubmit={savePost}><label>Title<input required maxLength={255} value={postForm.title} onChange={(event) => setPostForm({ ...postForm, title: event.target.value })} /></label><label>Content<textarea required rows={12} value={postForm.content} onChange={(event) => setPostForm({ ...postForm, content: event.target.value })} /></label></form>
        </Modal>
      )}

      {action?.type === "generate" && <ConfirmDialog title="Generate draft post?" message="This source will be marked as PROCESSED and linked to a new DRAFT post." confirmLabel="Generate draft" onClose={() => setAction(null)} onConfirm={() => generatePost(action.source)} busy={busy} />}
      {action?.type === "sourceStatus" && <ConfirmDialog title={`Move source to ${action.status}?`} message="The source status will be updated immediately." confirmLabel={`Move to ${action.status}`} danger={action.status === "REJECTED"} onClose={() => setAction(null)} onConfirm={() => updateSourceStatus(action.source, action.status)} busy={busy} />}
      {action?.type === "postStatus" && <ConfirmDialog title={`Move post to ${action.status}?`} message="The post workflow status will be updated immediately." confirmLabel={`Move to ${action.status}`} onClose={() => setAction(null)} onConfirm={() => updatePostStatus(action.post, action.status)} busy={busy} />}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
