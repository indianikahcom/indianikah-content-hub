import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, BookOpen, Bot, Boxes, CalendarClock, CheckCircle2,
  ChevronDown, Database, FileCheck2, FileText, Gauge, HeartHandshake,
  Library, ListChecks, Menu, MessageSquareQuote, MoonStar, Newspaper,
  PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Search, Send, Settings,
  ShieldCheck, Sparkles, Users, WandSparkles, Workflow, X
} from "lucide-react";
import { api } from "./services/api";
import AdminOverview from "./components/AdminOverview";
import ContentQueuePanel from "./components/ContentQueuePanel";
import KnowledgeLibraryPanel from "./components/KnowledgeLibraryPanel";
import PromptSettings from "./components/PromptSettings";
import PublishEverywhere from "./components/PublishEverywhere";
import StatusBadge from "./components/StatusBadge";
import Modal from "./components/Modal";
import Toast from "./components/Toast";

const STUDIO_TYPES = [
  { id: "QURAN", title: "Quran", description: "Create reflective posts grounded in approved Quran knowledge.", icon: BookOpen, pack: "QURAN_CONTENT" },
  { id: "HADITH", title: "Hadith", description: "Prepare referenced Hadith posts from authenticated entries.", icon: MessageSquareQuote, pack: "HADITH_CONTENT" },
  { id: "DUA", title: "Dua", description: "Generate clear, useful dua reminders with meaning and context.", icon: MoonStar, pack: "DUA_CONTENT" },
  {
    id: "MARRIAGE_GUIDE",
    title: "Marriage guidance",
    description: "Practical Islamic guidance for spouse selection and married life.",
    icon: HeartHandshake,
    automation: "GUIDELINE"
  },
  { id: "BOOK", title: "Books", description: "Promote an unpublished book from the IndiaNikah library.", icon: Library, automation: "BOOK" },
  { id: "BLOG", title: "Blogs", description: "Turn an unpublished blog into a social-ready draft.", icon: FileText, automation: "BLOG" },
  {
    id: "NEWS",
    title: "News",
    description: "Select a random imported blog and create an AI-generated post.",
    icon: Newspaper,
    automation: "BLOG"
  },
  {
    id: "PROFILE",
    title: "24-hour profile summary",
    description: "One privacy-safe summary per India calendar day; reopening it never creates a duplicate.",
    icon: Users,
    automation: "PROFILE"
  },
  { id: "CUSTOM", title: "Custom AI content", description: "Start a manual brief and use your approved context.", icon: WandSparkles }
];

const NAV_GROUPS = [
  { label: "Workspace", items: [
    { id: "dashboard", label: "Dashboard", icon: Gauge },
    { id: "studio", label: "AI Content Studio", icon: Sparkles },
  ]},
  { label: "Content", items: [
    { id: "queue", label: "Content Queue", icon: ListChecks },
    { id: "posts", label: "Posts & Approval", icon: FileCheck2 },
    { id: "sources", label: "Content Sources", icon: Database },
  ]},
  { label: "Knowledge", items: [
    { id: "knowledge", label: "Knowledge Library", icon: BookOpen },
    { id: "packs", label: "Knowledge Packs", icon: Boxes },
    { id: "prompts", label: "Prompt Settings", icon: Bot },
  ]},
  { label: "Operations", items: [
    { id: "publishing", label: "Publishing", icon: Send },
    { id: "automation", label: "Automation", icon: Workflow },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ]},
];

const allNavigation = NAV_GROUPS.flatMap((group) => group.items);

function normalize(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function EmptyState({ title, message }) {
  return <div className="workspace-empty"><FileText size={34}/><strong>{title}</strong><span>{message}</span></div>;
}

function PageHeading({ eyebrow, title, description, actions }) {
  return <div className="page-heading">
    <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
    {actions ? <div className="page-actions">{actions}</div> : null}
  </div>;
}

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compactSidebar, setCompactSidebar] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [posts, setPosts] = useState([]);
  const [sources, setSources] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [postFilter, setPostFilter] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ title: "", content: "" });
  const [studioBrief, setStudioBrief] = useState(null);
  const [contextPreview, setContextPreview] = useState(null);
  const [studioBusy, setStudioBusy] = useState("");

  const showToast = (title, message = "", type = "success") => {
    setToast({ title, message, type });
    window.setTimeout(() => setToast(null), 4200);
  };

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const [postPayload, sourcePayload, importPayload] = await Promise.all([
        api.getPosts(postFilter ? { status: postFilter } : {}),
        api.getSources({ limit: 50, search: sourceSearch }),
        api.getImports({ limit: 8 }),
      ]);
      setPosts(normalize(postPayload));
      setSources(normalize(sourcePayload));
      setImports(normalize(importPayload));
    } catch (error) {
      showToast("Could not refresh workspace", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWorkspace(); }, []);

  const refreshAll = async () => {
    await loadWorkspace();
    setRefreshToken((value) => value + 1);
    showToast("Workspace refreshed");
  };

  const importAll = async () => {
    setImporting(true);
    try {
      await api.importAll({ profileHours: 24, blogHours: 8760, generateSummary: true });
      await refreshAll();
      showToast("Production import completed", "New read-only content is ready for review.");
    } catch (error) {
      showToast("Production import failed", error.message, "error");
    } finally {
      setImporting(false);
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

  const saveManualPost = async (event) => {
    event.preventDefault();
    try {
      await api.createPost(manualForm);
      setManualOpen(false);
      setManualForm({ title: "", content: "" });
      await loadWorkspace();
      showToast("Draft created", "The post is waiting in manual approval.");
    } catch (error) {
      showToast("Could not create draft", error.message, "error");
    }
  };

  const updatePostStatus = async (post, status) => {
    try {
      await api.updatePostStatus(post.id, status);
      const refreshed = await api.getPost(post.id);
      setSelectedPost(refreshed.data || refreshed);
      await loadWorkspace();
      showToast("Workflow updated", `Post moved to ${status}.`);
    } catch (error) {
      showToast("Could not update workflow", error.message, "error");
    }
  };

  const startStudio = async (item) => {
    if (["QURAN", "HADITH", "DUA"].includes(item.id)) {
      setStudioBusy(item.id);
      try {
        const payload = await api.generateKnowledgePost(item.id);
        const result = payload.data || payload;
        await loadWorkspace();
        showToast(
          `${item.title} draft generated`,
          "Created from approved knowledge with its stored reference."
        );
        if (result?.post?.id) await openPost(result.post.id);
      } catch (error) {
        showToast(
          `Could not generate ${item.title} post`,
          error.message,
          "error"
        );
      } finally {
        setStudioBusy("");
      }
      return;
    }

    if (item.id === "PROFILE") {
      setStudioBusy(item.id);
      try {
        const payload = await api.generateProfileSummary();
        const result = payload.data || payload;
        await loadWorkspace();
        showToast(
          result.repairedCorruptedExisting
            ? "Profile summary repaired"
            : result.reusedExistingPost
            ? "Today's profile summary opened"
            : "Profile summary generated",
          result.repairedCorruptedExisting
            ? "Corrupted characters were removed from today's draft."
            : result.reusedExistingPost
            ? "The existing privacy-safe draft was preserved."
            : "A privacy-safe aggregate draft is ready for review."
        );
        if (result?.post?.id) await openPost(result.post.id);
      } catch (error) {
        showToast(
          "Could not prepare profile summary",
          error.message,
          "error"
        );
      } finally {
        setStudioBusy("");
      }
      return;
    }

    if (item.automation) {
      setStudioBusy(item.id);
      try {
        const payload = await api.createRandomDraft({ type: item.automation, platform: "ALL" });
        const result = payload.data;
        await loadWorkspace();
        showToast(result?.generated ? "AI draft generated" : "Existing draft selected", result?.selectedSource?.title || item.title);
        if (result?.post?.id) await openPost(result.post.id);
      } catch (error) {
        showToast(`Could not prepare ${item.title}`, error.message, "error");
      } finally {
        setStudioBusy("");
      }
      return;
    }

    if (item.id === "CUSTOM") {
      setStudioBrief(item);
      return;
    }

    setStudioBusy(item.id);
    try {
      const payload = await api.buildKnowledgeContext({
        packKey: item.pack,
        query: `${item.title} social media content for IndiaNikah`,
        maxItems: 8,
        maxCharacters: 12000
      });
      setContextPreview({ item, data: payload.data || payload });
    } catch (error) {
      showToast(`Could not build ${item.title} context`, error.message, "error");
    } finally {
      setStudioBusy("");
    }
  };

  const createStudioDraft = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.createPost({
        title: form.get("title"),
        content: form.get("content")
      });
      setStudioBrief(null);
      await loadWorkspace();
      showToast("Studio draft created", "Review it under Posts & Approval.");
    } catch (error) {
      showToast("Could not create studio draft", error.message, "error");
    }
  };

  const title = allNavigation.find((item) => item.id === activeView)?.label || "Workspace";
  const postStats = useMemo(() => ({
    drafts: posts.filter((post) => post.status === "DRAFT").length,
    pending: posts.filter((post) => post.status === "PENDING_APPROVAL").length,
    approved: posts.filter((post) => post.status === "APPROVED").length,
  }), [posts]);

  return <div className={`workspace-shell ${compactSidebar ? "sidebar-compact" : ""}`}>
    <aside className={`workspace-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="workspace-brand">
        <div className="workspace-logo">IN</div>
        <div><strong>IndiaNikah</strong><span>AI Content Hub</span></div>
        <button className="sidebar-close" onClick={() => setMobileOpen(false)}><X size={20}/></button>
      </div>

      <nav className="workspace-nav">
        {NAV_GROUPS.map((group) => <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map(({ id, label, icon: Icon }) => <button
            key={id}
            title={label}
            className={activeView === id ? "workspace-nav-item active" : "workspace-nav-item"}
            onClick={() => { setActiveView(id); setMobileOpen(false); }}
          ><Icon size={18}/><span>{label}</span></button>)}
        </div>)}
      </nav>

      <div className="approval-policy">
        <ShieldCheck size={20}/>
        <div><strong>Manual approval first</strong><span>No content publishes without review.</span></div>
      </div>
    </aside>

    <main className="workspace-main">
      <header className="workspace-topbar">
        <div className="topbar-title">
          <button className="mobile-trigger" onClick={() => setMobileOpen(true)}><Menu size={21}/></button>
          <button className="compact-trigger" onClick={() => setCompactSidebar((value) => !value)}>
            {compactSidebar ? <PanelLeftOpen size={19}/> : <PanelLeftClose size={19}/>}
          </button>
          <div><p>Admin workspace</p><h1>{title}</h1></div>
        </div>
        <div className="topbar-actions">
          <button className="button button-secondary" onClick={refreshAll} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""}/> Refresh</button>
          <button className="button button-primary" onClick={importAll} disabled={importing}><Database size={16}/> {importing ? "Importing..." : "Import all"}</button>
        </div>
      </header>

      <div className="workspace-content">
        {activeView === "dashboard" && <div className="workspace-page">
          <section className="hero-banner">
            <div><p className="eyebrow">Content intelligence</p><h2>One workspace for knowledge, generation, approval and publishing.</h2><p>IndiaNikah context is now connected to the editorial workflow. Manual approval remains the default.</p></div>
            <button className="hero-action" onClick={() => setActiveView("studio")}><Sparkles size={19}/> Open AI Studio</button>
          </section>
          <AdminOverview showToast={showToast} refreshToken={refreshToken} onOpenPost={async (id) => { await openPost(id); setActiveView("posts"); }}/>
          <div className="quick-grid">
            {STUDIO_TYPES.slice(0,4).map(({ id, title, description, icon: Icon }) => <button key={id} className="quick-card" onClick={() => setActiveView("studio")}><span><Icon size={20}/></span><div><strong>{title}</strong><p>{description}</p></div></button>)}
          </div>
          <div className="two-column">
            <section className="workspace-panel">
              <div className="panel-title"><div><p className="eyebrow">Recent posts</p><h3>Approval activity</h3></div><button onClick={() => setActiveView("posts")}>View all</button></div>
              {posts.length ? posts.slice(0,6).map((post) => <button className="record-row" key={post.id} onClick={() => openPost(post.id)}><div><strong>{post.title}</strong><span>{formatDate(post.updatedAt)}</span></div><StatusBadge status={post.status}/></button>) : <EmptyState title="No posts yet" message="Use AI Studio or create a manual draft."/>}
            </section>
            <section className="workspace-panel">
              <div className="panel-title"><div><p className="eyebrow">Imports</p><h3>Production activity</h3></div><button onClick={importAll}>Run import</button></div>
              {imports.length ? imports.slice(0,6).map((run) => <div className="record-row static" key={run.id}><div><strong>{run.importType || "Import"}</strong><span>{formatDate(run.startedAt)}</span></div><span className="run-count">{run.importedCount || 0} imported</span></div>) : <EmptyState title="No import history" message="Run a safe read-only import."/>}
            </section>
          </div>
        </div>}

        {activeView === "studio" && <div className="workspace-page">
          <PageHeading eyebrow="AI content studio" title="Choose what you want to create" description="Each workflow uses approved IndiaNikah knowledge, brand context and manual review." actions={<button className="button button-secondary" onClick={() => setManualOpen(true)}><Plus size={16}/> Manual post</button>}/>
          <div className="studio-grid">
            {STUDIO_TYPES.map((item) => {
              const Icon = item.icon;
              return <article className="studio-card" key={item.id}>
                <div className="studio-icon"><Icon size={24}/></div>
                <div className="studio-card-copy"><h3>{item.title}</h3><p>{item.description}</p></div>
                <div className="studio-card-footer"><span>{item.pack ? `Pack: ${item.pack}` : item.id === "PROFILE" ? "Daily · Asia/Kolkata" : item.automation ? "Automatic source selection" : "Your own brief"}</span><button onClick={() => startStudio(item)} disabled={studioBusy === item.id}>{studioBusy === item.id ? "Preparing..." : item.id === "PROFILE" ? "Create / open today" : "Create"}</button></div>
              </article>;
            })}
          </div>
        </div>}

        {activeView === "queue" && <div className="workspace-page"><PageHeading eyebrow="Editorial workflow" title="Content Queue" description="Prepare items in advance, approve them and publish only when ready."/><ContentQueuePanel showToast={showToast} refreshToken={refreshToken} onReviewPost={async (id) => { await openPost(id); setActiveView("posts"); }}/></div>}

        {activeView === "posts" && <div className="workspace-page">
          <PageHeading eyebrow="Manual approval" title="Posts & Approval" description="Review generated and manual drafts before anything reaches social media." actions={<button className="button button-primary" onClick={() => setManualOpen(true)}><Plus size={16}/> New draft</button>}/>
          <div className="workflow-summary">
            <button onClick={() => { setPostFilter("DRAFT"); api.getPosts({status:"DRAFT"}).then((p)=>setPosts(normalize(p))); }}><span>Drafts</span><strong>{postStats.drafts}</strong></button>
            <button onClick={() => { setPostFilter("PENDING_APPROVAL"); api.getPosts({status:"PENDING_APPROVAL"}).then((p)=>setPosts(normalize(p))); }}><span>Pending approval</span><strong>{postStats.pending}</strong></button>
            <button onClick={() => { setPostFilter("APPROVED"); api.getPosts({status:"APPROVED"}).then((p)=>setPosts(normalize(p))); }}><span>Approved</span><strong>{postStats.approved}</strong></button>
          </div>
          <section className="workspace-panel">
            <div className="panel-title"><div><p className="eyebrow">Post records</p><h3>{posts.length} items</h3></div><button onClick={() => { setPostFilter(""); loadWorkspace(); }}>Clear filter</button></div>
            {posts.length ? <div className="responsive-table"><table><thead><tr><th>Post</th><th>Status</th><th>Source</th><th>Updated</th><th></th></tr></thead><tbody>{posts.map((post)=><tr key={post.id}><td><strong>{post.title}</strong><span>{(post.content || "").slice(0,100)}{post.content?.length>100?"…":""}</span></td><td><StatusBadge status={post.status}/></td><td>{post.sourceId ? `#${post.sourceId}` : "Manual"}</td><td>{formatDate(post.updatedAt)}</td><td><button onClick={() => openPost(post.id)}>Review</button></td></tr>)}</tbody></table></div> : <EmptyState title="No posts found" message="Create a draft from AI Studio."/>}
          </section>
        </div>}

        {activeView === "sources" && <div className="workspace-page">
          <PageHeading eyebrow="Source inbox" title="Content Sources" description="Imported profiles, books, blogs, guidelines and other raw material." actions={<div className="inline-search"><Search size={16}/><input value={sourceSearch} onChange={(e)=>setSourceSearch(e.target.value)} placeholder="Search sources"/><button onClick={loadWorkspace}>Search</button></div>}/>
          <section className="workspace-panel">{sources.length ? <div className="responsive-table"><table><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Created</th></tr></thead><tbody>{sources.map((source)=><tr key={source.id}><td><strong>{source.title || `Source #${source.id}`}</strong><span>{source.externalId || ""}</span></td><td>{source.type}</td><td><StatusBadge status={source.status}/></td><td>{formatDate(source.createdAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No sources found" message="Run an import or adjust your search."/>}</section>
        </div>}

        {activeView === "knowledge" && <div className="workspace-page"><PageHeading eyebrow="Domain context" title="Knowledge Library" description="Manage approved Quran, Hadith, dua, marriage guidance, brand and editorial knowledge."/><KnowledgeLibraryPanel showToast={showToast}/></div>}
        {activeView === "packs" && <div className="workspace-page"><PageHeading eyebrow="Context assembly" title="Knowledge Packs" description="Reusable bundles determine which approved knowledge is supplied to each content workflow."/><KnowledgeLibraryPanel showToast={showToast}/></div>}
        {activeView === "prompts" && <div className="workspace-page"><PageHeading eyebrow="AI instructions" title="Prompt Settings" description="Control permanent brand context and content-type instructions without editing code."/><PromptSettings showToast={showToast}/></div>}

        {activeView === "publishing" && <div className="workspace-page">
          <PageHeading eyebrow="Multi-platform delivery" title="Publishing" description="Publish only approved content and review campaign-level outcomes."/>
          <div className="platform-grid">
            {["Telegram","Facebook Page","LinkedIn","Instagram"].map((name, index)=><article className="platform-card" key={name}><span className={`platform-status ${index<3?"online":"planned"}`}></span><div><strong>{name}</strong><p>{index<3?"Configured publishing workflow":"Integration deferred until API setup is complete"}</p></div><span>{index<3?"Ready":"Planned"}</span></article>)}
          </div>
          <section className="workspace-panel"><div className="panel-title"><div><p className="eyebrow">Approved content</p><h3>Ready to publish</h3></div><button onClick={() => setActiveView("posts")}>Open approvals</button></div>{posts.filter((p)=>p.status==="APPROVED").length ? posts.filter((p)=>p.status==="APPROVED").map((post)=><button className="record-row" key={post.id} onClick={()=>openPost(post.id)}><div><strong>{post.title}</strong><span>Approved · {formatDate(post.updatedAt)}</span></div><Send size={17}/></button>) : <EmptyState title="Nothing approved" message="Approve a post before publishing."/>}</section>
        </div>}

        {activeView === "automation" && <div className="workspace-page">
          <PageHeading eyebrow="Controlled automation" title="Automation" description="Schedulers remain approval-first while the platform is being stabilised."/>
          <div className="automation-grid">
            {[["Profile import","Daily read-only production profile import",true],["Content queue","Prepare scheduled content for review",false],["Auto approval","Automatically approve generated content",false],["Auto publishing","Publish without manual action",false]].map(([name,desc,enabled])=><article className="automation-card" key={name}><div><CalendarClock size={21}/><div><strong>{name}</strong><p>{desc}</p></div></div><span className={enabled?"automation-state active":"automation-state"}>{enabled?"Configured":"Disabled"}</span></article>)}
          </div>
          <section className="notice-panel"><ShieldCheck size={22}/><div><strong>Current operating mode: MANUAL_APPROVAL</strong><p>Generated content enters the queue and must be reviewed before publishing. Full automation can be enabled later after stable testing.</p></div></section>
        </div>}

        {activeView === "analytics" && <div className="workspace-page">
          <PageHeading eyebrow="Performance" title="Analytics" description="Operational metrics are available now; social engagement analytics will expand as platform APIs are connected."/>
          <div className="analytics-grid">
            {[["Total sources",sources.length,Database],["Draft posts",postStats.drafts,FileText],["Pending approval",postStats.pending,Activity],["Approved",postStats.approved,CheckCircle2]].map(([label,value,Icon])=><article className="analytics-card" key={label}><Icon size={21}/><span>{label}</span><strong>{value}</strong></article>)}
          </div>
          <section className="workspace-panel"><div className="panel-title"><div><p className="eyebrow">Coming next</p><h3>Engagement intelligence</h3></div></div><div className="feature-list"><span>Platform reach and engagement</span><span>Approval and rejection rates</span><span>Best-performing knowledge packs</span><span>Prompt version comparison</span></div></section>
        </div>}

        {activeView === "settings" && <div className="workspace-page">
          <PageHeading eyebrow="Configuration" title="Settings" description="Environment secrets stay in the backend. This workspace exposes safe operational preferences only."/>
          <div className="settings-grid">
            <section className="workspace-panel"><h3>Editorial policy</h3><label className="setting-row"><div><strong>Manual approval required</strong><span>Prevent automatic publishing.</span></div><input type="checkbox" checked readOnly/></label><label className="setting-row"><div><strong>Email publishing reports</strong><span>Send a Microsoft email after each campaign.</span></div><input type="checkbox" checked readOnly/></label></section>
            <section className="workspace-panel"><h3>Brand identity</h3><div className="readonly-field"><span>Product</span><strong>IndiaNikah AI Content Hub</strong></div><div className="readonly-field"><span>Promise</span><strong>100% free forever</strong></div><div className="readonly-field"><span>Operating principle</span><strong>Privacy-first, trust-first</strong></div></section>
          </div>
        </div>}
      </div>
    </main>

    {selectedPost && <Modal title={`Review post #${selectedPost.id}`} onClose={()=>setSelectedPost(null)} footer={<>
      {selectedPost.status === "DRAFT" && <button className="button button-primary" onClick={()=>updatePostStatus(selectedPost,"PENDING_APPROVAL")}>Submit for approval</button>}
      {selectedPost.status === "PENDING_APPROVAL" && <button className="button button-primary" onClick={()=>updatePostStatus(selectedPost,"APPROVED")}><CheckCircle2 size={16}/> Approve</button>}
      {selectedPost.status !== "DRAFT" && <button className="button button-secondary" onClick={()=>updatePostStatus(selectedPost,"DRAFT")}>Return to draft</button>}
    </>}>
      <div className="post-modal-meta"><StatusBadge status={selectedPost.status}/><span>{formatDate(selectedPost.updatedAt)}</span></div>
      <h3>{selectedPost.title}</h3><div className="content-preview post-preview">{selectedPost.content}</div>
      <PublishEverywhere post={selectedPost} showToast={showToast} onPublished={async()=>{ await openPost(selectedPost.id); await loadWorkspace(); }}/>
    </Modal>}

    {manualOpen && <Modal title="Create manual draft" onClose={()=>setManualOpen(false)} footer={<button className="button button-primary" form="manual-post-form" type="submit">Save draft</button>}>
      <form id="manual-post-form" className="form-stack" onSubmit={saveManualPost}><label>Title<input required maxLength="255" value={manualForm.title} onChange={(e)=>setManualForm({...manualForm,title:e.target.value})}/></label><label>Content<textarea required rows="12" value={manualForm.content} onChange={(e)=>setManualForm({...manualForm,content:e.target.value})}/></label></form>
    </Modal>}

    {studioBrief && <Modal title="Custom AI content brief" onClose={()=>setStudioBrief(null)} footer={<button className="button button-primary" form="studio-brief-form" type="submit">Create draft</button>}>
      <form id="studio-brief-form" className="form-stack" onSubmit={createStudioDraft}><label>Title<input name="title" required placeholder="Post title"/></label><label>Draft content<textarea name="content" required rows="12" placeholder="Write or paste the initial content. AI generation can be connected to this brief in the next backend milestone."/></label></form>
    </Modal>}

    {contextPreview && <Modal title={`${contextPreview.item.title} context preview`} onClose={()=>setContextPreview(null)} footer={<button className="button button-primary" onClick={()=>{setContextPreview(null);setManualOpen(true);}}>Use context in draft</button>}>
      <div className="context-summary"><strong>{contextPreview.data?.selectedItems?.length || contextPreview.data?.items?.length || 0} approved items selected</strong><span>Pack: {contextPreview.item.pack}</span></div>
      <pre className="context-preview">{contextPreview.data?.context || contextPreview.data?.compiledContext || JSON.stringify(contextPreview.data,null,2)}</pre>
    </Modal>}

    <Toast toast={toast} onClose={()=>setToast(null)}/>
  </div>;
}
