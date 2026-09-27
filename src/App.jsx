import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Upload, FileText, AlertTriangle, CheckCircle,
  ArrowRight, Calendar, Shield, Search, GitCompare,
  Layers, Zap, ChevronRight, X, Loader2, MessageSquare,
  Clock, Tag, Info, TrendingUp, Eye, LayoutDashboard,
  Files, Trash2, RotateCcw,
} from "lucide-react";
import "./App.css";

// ─────────────────────────────────────────────────────────────
// DEMO DATA — shown when user clicks "Try Demo"
// ─────────────────────────────────────────────────────────────
const DEMO_ANALYSIS = {
  documentType: "employment_agreement",
  documentTitle: "Software Engineer Employment Agreement",
  summary:
    "This is a full-time employment agreement between TechCorp Ltd and the employee. It covers compensation, intellectual property assignment, a broad non-compete clause, and a notably short termination notice period of 7 days. Several standard employee protections appear to be absent.",

  keyPoints: [
    "Base salary: ₹12,00,000 per annum",
    "Probationary period: 6 months",
    "Notice period: 7 days (both parties)",
    "Non-compete duration: 2 years post-employment",
    "All intellectual property created during employment is assigned to TechCorp Ltd",
    "Governed by laws of the State of Karnataka",
  ],

  importantTopics: [
    "Compensation",
    "Non-Compete",
    "IP Assignment",
    "Termination",
    "Probation",
  ],

  risks: [
    {
      title: "Very Short Termination Notice",
      severity: "high",
      description:
        "The agreement allows either party to terminate employment with only 7 days' notice.",
      whyItMatters:
        "A 7-day notice period is significantly shorter than industry standard (typically 30–90 days). This could leave you with very little time to find alternative employment.",
      evidence:
        '"Either party may terminate this Agreement by providing seven (7) days written notice to the other party."',
      recommendation:
        "Consider negotiating a longer notice period — 30 to 60 days is more standard.",
    },

    {
      title: "Broad Non-Compete Clause",
      severity: "high",
      description:
        "The non-compete clause restricts working in any competing industry for 2 years after employment ends.",
      whyItMatters:
        "A 2-year restriction on an undefined 'competing industry' could significantly limit future employment opportunities.",
      evidence:
        '"Employee agrees not to engage in any activity competitive with TechCorp Ltd for a period of two (2) years following termination."',
      recommendation:
        "Review recommended — consider whether 'competing activity' is clearly defined and whether this scope is acceptable.",
    },

    {
      title: "Unlimited IP Assignment",
      severity: "medium",
      description:
        "All intellectual property created during employment, including outside work hours, is assigned to the company.",
      whyItMatters:
        "This could affect personal projects, side work, or freelance activities conducted outside office hours.",
      evidence:
        '"All inventions, works, or developments created by Employee during the term of employment shall be the exclusive property of TechCorp Ltd."',
      recommendation:
        "Clarify whether this applies only to company-related work or all personal projects.",
    },
  ],

  missingInformation: [
    {
      item: "Dispute resolution mechanism",
      reason:
        "Standard employment agreements typically include a process for resolving disputes",
      importance: "high",
      confidence: "high",
    },
    {
      item: "Annual leave entitlement",
      reason:
        "The agreement does not clearly specify number of annual leave days",
      importance: "high",
      confidence: "high",
    },
    {
      item: "Health benefits and insurance",
      reason: "No mention of health coverage or medical benefits",
      importance: "medium",
      confidence: "medium",
    },
    {
      item: "Performance review process",
      reason:
        "No mention of how performance will be evaluated or reviewed",
      importance: "medium",
      confidence: "medium",
    },
  ],

  actions: [
    {
      task: "Review and sign the employment agreement",
      deadline: null,
      deadlineText: "Before start date",
      responsibleParty: "Employee",
      priority: "high",
      evidence: "Signature required before commencement date.",
      completed: false,
    },
    {
      task: "Clarify non-compete scope with HR",
      deadline: null,
      deadlineText: null,
      responsibleParty: "Employee",
      priority: "high",
      evidence:
        "Non-compete clause is broad and may affect future employment.",
      completed: false,
    },
    {
      task: "Request clarification on IP assignment scope",
      deadline: null,
      deadlineText: null,
      responsibleParty: "Employee",
      priority: "medium",
      evidence:
        "IP clause applies to all work during employment period.",
      completed: false,
    },
    {
      task: "Negotiate notice period",
      deadline: null,
      deadlineText: "Before signing",
      responsibleParty: "Employee + HR",
      priority: "medium",
      evidence: "Current notice period is only 7 days.",
      completed: false,
    },
  ],

  importantDates: [
    {
      date: null,
      dateText: "January 15, 2025",
      event: "Employment Commencement",
      description: "First day of employment",
      importance: "high",
    },
    {
      date: null,
      dateText: "July 15, 2025",
      event: "End of Probationary Period",
      description: "6-month probation ends",
      importance: "high",
    },
    {
      date: null,
      dateText: "January 14, 2026",
      event: "First Salary Review",
      description: "Annual performance review",
      importance: "medium",
    },
  ],

  keyInformation: [
    { label: "Employee", value: "Arjun Sharma" },
    { label: "Employer", value: "TechCorp Ltd" },
    { label: "Position", value: "Senior Software Engineer" },
    { label: "Salary", value: "₹12,00,000 per annum" },
    { label: "Location", value: "Bangalore, Karnataka" },
    { label: "Probation", value: "6 months" },
  ],

  actionItems: [
    "Review non-compete clause",
    "Negotiate notice period",
    "Clarify IP ownership",
    "Confirm leave policy",
  ],

  availableActions: [
    "ask_document",
    "risk_scan",
    "find_gaps",
    "extract_actions",
  ],
};

// ─────────────────────────────────────────────────────────────
// SEVERITY / PRIORITY HELPERS
// ─────────────────────────────────────────────────────────────
const severityColor = (s) =>
  s === "high" ? "sev-high" : s === "medium" ? "sev-medium" : "sev-low";

const priorityColor = (p) =>
  p === "high" ? "pri-high" : p === "medium" ? "pri-medium" : "pri-low";

const importanceColor = (i) =>
  i === "high" ? "sev-high" : i === "medium" ? "sev-medium" : "sev-low";

const docTypeLabel = (t) => {
  const map = {
    contract: "Contract",
    employment_agreement: "Employment Agreement",
    rental_agreement: "Rental Agreement",
    invoice: "Invoice",
    academic_syllabus: "Academic Syllabus",
    assignment: "Assignment",
    research_paper: "Research Paper",
    policy_document: "Policy Document",
    legal_document: "Legal Document",
    financial_document: "Financial Document",
    resume: "Resume / CV",
    report: "Report",
    government_document: "Government Document",
    meeting_notes: "Meeting Notes",
    project_document: "Project Document",
    other: "Document",
  };

  return map[t] || t || "Document";
};

// ─────────────────────────────────────────────────────────────
// EVIDENCE PANEL
// ─────────────────────────────────────────────────────────────
function EvidencePanel({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="evidence-overlay" onClick={onClose}>
      <div
        className="evidence-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="evidence-panel-header">
          <div className="evidence-panel-title">
            <Eye size={18} />
            <span>Source Evidence</span>
          </div>

          <button className="evidence-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="evidence-panel-body">
          {item.title && (
            <h3 className="ep-finding-title">{item.title}</h3>
          )}

          {item.description && (
            <p className="ep-description">{item.description}</p>
          )}

          {item.evidence && (
            <div className="ep-evidence-block">
              <div className="ep-evidence-label">
                <Tag size={14} />
                Extracted Text
              </div>

              <blockquote className="ep-quote">
                {item.evidence}
              </blockquote>
            </div>
          )}

          {item.whyItMatters && (
            <div className="ep-why-block">
              <div className="ep-evidence-label">
                <Info size={14} />
                Why It Matters
              </div>

              <p>{item.whyItMatters}</p>
            </div>
          )}

          {item.recommendation && (
            <div className="ep-rec-block">
              <div className="ep-evidence-label">
                <CheckCircle size={14} />
                Recommendation
              </div>

              <p>{item.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  // ─────────────────────────────────────────────
  // VIEWS
  // ─────────────────────────────────────────────
  const [view, setView] = useState("home");
  const [activeTab, setActiveTab] = useState("overview");

  // ─────────────────────────────────────────────
  // MONGODB SAVED DOCUMENTS
  // ─────────────────────────────────────────────
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  // ─────────────────────────────────────────────
  // SINGLE DOCUMENT STATE
  // ─────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [analyzeSteps, setAnalyzeSteps] = useState([]);

  // ─────────────────────────────────────────────
  // COMPARE STATE
  // ─────────────────────────────────────────────
  const [cmpFile1, setCmpFile1] = useState(null);
  const [cmpFile2, setCmpFile2] = useState(null);
  const [cmpResult, setCmpResult] = useState(null);
  const [cmpError, setCmpError] = useState(null);
  const [cmpLoading, setCmpLoading] = useState(false);

  // ─────────────────────────────────────────────
  // Q&A STATE
  // ─────────────────────────────────────────────
  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [qaHistory, setQaHistory] = useState([]);

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
  const [actions, setActions] = useState([]);

  // ─────────────────────────────────────────────
  // EVIDENCE PANEL
  // ─────────────────────────────────────────────
  const [evidenceItem, setEvidenceItem] = useState(null);

  const fileInputRef = useRef(null);

  // ─────────────────────────────────────────────
  // LOAD SAVED DOCUMENTS FROM MONGODB
  // ─────────────────────────────────────────────
  const loadSavedDocuments = async () => {
    try {
      setDocumentsLoading(true);

      const res = await fetch(
        "http://localhost:5000/api/documents"
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load documents"
        );
      }

      setSavedDocuments(data.documents || []);

      console.log(
        "[FrestoDoc] ✓ Loaded saved documents:",
        data.documents?.length || 0
      );
    } catch (error) {
      console.error(
        "[FrestoDoc] Failed to load documents:",
        error
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Load saved documents when app starts
  useEffect(() => {
    loadSavedDocuments();
  }, []);

  // ─────────────────────────────────────────────
  // SYNC ACTIONS FROM ANALYSIS
  // ─────────────────────────────────────────────
  const syncActions = (analysis) => {
    const analysisActions = analysis?.actions || [];

    setActions(
      analysisActions.map((action, index) => ({
        ...action,
        id: index,
      }))
    );
  };

  
  // ─────────────────────────────────────────────
  // HANDLE FILE
  // ─────────────────────────────────────────────
  const handleFile = (e) => {
    const f = e.target.files[0];

    if (!f) return;

    // New document = new MongoDB document
    setDocumentId(null);

    setFile(f);
    setUploadResult(null);
    setAiAnalysis(null);
    setAnalyzeError(null);
    setQaHistory([]);
    setQaResult(null);
    setQuestion("");
    setActions([]);
    setEvidenceItem(null);
  };

  // ─────────────────────────────────────────────
  // UPLOAD + ANALYZE
  // ─────────────────────────────────────────────
  const handleAnalyze = async (useFile = file) => {
    if (!useFile) return;

    setView("analyzing");
    setAnalyzeError(null);

    setAnalyzeSteps([
      { label: "Reading document", done: false },
      { label: "Extracting information", done: false },
      { label: "Detecting risks", done: false },
      {
        label: "Checking for missing information",
        done: false,
      },
      {
        label: "Extracting actions and dates",
        done: false,
      },
      {
        label: "Generating findings",
        done: false,
      },
    ]);

    const tick = (i) =>
      setAnalyzeSteps((steps) =>
        steps.map((step, index) =>
          index === i
            ? { ...step, done: true }
            : step
        )
      );

    try {
      // ─────────────────────────────────────
      // STEP 1: UPLOAD
      // ─────────────────────────────────────
      console.log(
        "[FrestoDoc] Uploading:",
        useFile.name
      );

      const fd = new FormData();
      fd.append("document", useFile);

      const upRes = await fetch(
        "http://localhost:5000/api/upload",
        {
          method: "POST",
          body: fd,
        }
      );

      console.log(
        "[FrestoDoc] Upload status:",
        upRes.status
      );

      const upText = await upRes.text();

      let upData;

      try {
        upData = JSON.parse(upText);
      } catch {
        throw new Error(
          `Upload returned invalid response (${upRes.status}): ${upText.slice(
            0,
            300
          )}`
        );
      }

      console.log(
        "[FrestoDoc] Upload response:",
        upData
      );

      if (!upRes.ok) {
        throw new Error(
          upData.error ||
            `Upload failed (${upRes.status})`
        );
      }

      if (!upData.text) {
        throw new Error(
          "Backend uploaded the file but returned no extracted text."
        );
      }

      tick(0);
      tick(1);

      setUploadResult({
        filename: upData.filename,
        text: upData.text,
      });

      console.log(
        "[FrestoDoc] Extracted text length:",
        upData.text.length
      );

      // ─────────────────────────────────────
      // STEP 2: ANALYZE
      // ─────────────────────────────────────
      tick(2);

      console.log(
        "[FrestoDoc] Sending /api/analyze request..."
      );

      const aiRes = await fetch(
        "http://localhost:5000/api/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: upData.text,
            filename: upData.filename,
          }),
        }
      );

      console.log(
        "[FrestoDoc] Analyze status:",
        aiRes.status
      );

      const aiText = await aiRes.text();

      console.log(
        "[FrestoDoc] Analyze raw response:",
        aiText.slice(0, 1000)
      );

      let aiData;

      try {
        aiData = JSON.parse(aiText);
      } catch {
        throw new Error(
          `Analyze returned invalid JSON (${aiRes.status}): ${aiText.slice(
            0,
            500
          )}`
        );
      }

      console.log(
        "[FrestoDoc] Analyze response:",
        aiData
      );

      if (!aiRes.ok) {
        throw new Error(
          aiData.error ||
            `Analysis failed with HTTP ${aiRes.status}`
        );
      }

      if (!aiData.analysis) {
        throw new Error(
          "Backend responded successfully but no analysis was returned."
        );
      }

      tick(3);
      tick(4);
      tick(5);

      // ─────────────────────────────────────
      // SAVE ANALYSIS STATE
      // ─────────────────────────────────────
      setAiAnalysis(aiData.analysis);

      syncActions(aiData.analysis);

      // Save MongoDB document ID
      if (aiData.documentId) {
        setDocumentId(aiData.documentId);

        console.log(
          "[FrestoDoc] MongoDB document ID:",
          aiData.documentId
        );
      }

      // Refresh saved documents list
      await loadSavedDocuments();

      setView("results");
      setActiveTab("overview");

      console.log(
        "[FrestoDoc] ✓ Analysis complete",
        "Document ID:",
        aiData.documentId
      );
    } catch (err) {
      console.error(
        "[FrestoDoc] ERROR:",
        err
      );

      setAnalyzeError(
        err?.message ||
          "Something went wrong while communicating with the FrestoDoc backend."
      );

      setView("home");
    }
  };

  // ─────────────────────────────────────────────
  // OPEN SAVED DOCUMENT FROM MONGODB
  // ─────────────────────────────────────────────
  const openSavedDocument = async (id) => {
    try {
      console.log(
        "[FrestoDoc] Loading document:",
        id
      );

      const res = await fetch(
        `http://localhost:5000/api/documents/${id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to load document"
        );
      }

      const doc = data.document;

      // Set document ID first
      setDocumentId(doc._id);

      setUploadResult({
        filename: doc.filename,
        text: doc.text || "",
      });

      setAiAnalysis(doc.analysis);

      // Restore actions including completed state
      syncActions(doc.analysis);

      setQaResult(null);
      setQaHistory([]);
      setQuestion("");
      setEvidenceItem(null);
      setAnalyzeError(null);

      setActiveTab("overview");
      setView("results");

      console.log(
        "[FrestoDoc] ✓ Saved document opened"
      );
    } catch (error) {
      console.error(
        "[FrestoDoc] Failed to open document:",
        error
      );

      setAnalyzeError(error.message);
    }
  };

  // ─────────────────────────────────────────────
  // DEMO
  // ─────────────────────────────────────────────
  const handleDemo = () => {
    // IMPORTANT:
    // Demo is not connected to MongoDB.
    // Clear documentId so demo actions cannot
    // accidentally overwrite a real document.
    setDocumentId(null);

    setUploadResult({
      filename: "EmploymentAgreement_Demo.pdf",
      text: "",
    });

    setAiAnalysis(DEMO_ANALYSIS);

    syncActions(DEMO_ANALYSIS);

    setQaResult(null);
    setQaHistory([]);
    setQuestion("");
    setEvidenceItem(null);
    setAnalyzeError(null);

    setView("results");
    setActiveTab("overview");
  };

  // ─────────────────────────────────────────────
  // Q&A
  // ─────────────────────────────────────────────
  const handleAsk = async () => {
    if (
      !question.trim() ||
      !uploadResult?.text
    ) {
      return;
    }

    setQaLoading(true);
    setQaResult(null);

    try {
      const res = await fetch(
        "http://localhost:5000/api/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            text: uploadResult.text,
            filename: uploadResult.filename,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Q&A failed"
        );
      }

      const entry = {
        question,
        ...data.result,
      };

      setQaResult(entry);
      setQaHistory((history) => [
        entry,
        ...history,
      ]);

      setQuestion("");
    } catch (err) {
      setQaResult({
        answer: `Error: ${err.message}`,
        found: false,
        evidence: null,
      });
    } finally {
      setQaLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // COMPARE
  // ─────────────────────────────────────────────
  const handleCompare = async () => {
    if (!cmpFile1 || !cmpFile2) return;

    setCmpLoading(true);
    setCmpError(null);

    try {
      const fd = new FormData();

      fd.append("doc1", cmpFile1);
      fd.append("doc2", cmpFile2);

      const res = await fetch(
        "http://localhost:5000/api/compare",
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Comparison failed"
        );
      }

      setCmpResult(data.comparison);
      setView("compare-results");
    } catch (err) {
      setCmpError(err.message);
    } finally {
      setCmpLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // ACTION CENTER
  // ─────────────────────────────────────────────

  // Toggle action
const toggleAction = (id) =>
  setActions((actions) =>
    actions.map((action) =>
      action.id === id
        ? {
            ...action,
            completed: !action.completed,
          }
        : action
    )
  );

 // Delete action
const deleteAction = (id) =>
  setActions((actions) =>
    actions.filter((action) => action.id !== id)
  );

  // ─────────────────────────────────────────────
  // NAVBAR
  // ─────────────────────────────────────────────
  const Navbar = () => (
    <nav className="navbar">
      <button
        className="logo nav-logo-btn"
        onClick={() => setView("home")}
      >
        <Sparkles size={22} />
        <span>FrestoDoc</span>
      </button>

      <div className="nav-links">
        <button
          className={`nav-link ${
            view === "home"
              ? "nav-link-active"
              : ""
          }`}
          onClick={() => setView("home")}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>

        {aiAnalysis && (
          <button
            className={`nav-link ${
              view === "results"
                ? "nav-link-active"
                : ""
            }`}
            onClick={() => setView("results")}
          >
            <FileText size={16} />
            Analysis
          </button>
        )}

        {actions.length > 0 && (
          <button
            className={`nav-link ${
              view === "actions"
                ? "nav-link-active"
                : ""
            }`}
            onClick={() => setView("actions")}
          >
            <CheckCircle size={16} />
            Actions

            <span className="nav-badge">
              {
                actions.filter(
                  (action) => !action.completed
                ).length
              }
            </span>
          </button>
        )}

        <button
          className={`nav-link ${
            view === "compare" ||
            view === "compare-results"
              ? "nav-link-active"
              : ""
          }`}
          onClick={() => {
            setView("compare");
            setCmpResult(null);
            setCmpError(null);
          }}
        >
          <GitCompare size={16} />
          Compare
        </button>
      </div>
    </nav>
  );

  // ─────────────────────────────────────────────
  // HOME VIEW
  // ─────────────────────────────────────────────
  if (view === "home")
    return (
      <div className="app">
        <Navbar />

        <main>
          <section className="hero">
            <div className="glowing-arc" />

            <div className="hero-content">
              <div className="badge">
                <Sparkles size={16} />
                AI Document Intelligence Platform
              </div>

              <h1>
                Understand your documents.
                <span> Find what others miss.</span>
              </h1>

              <p>
                FrestoDoc uses AI to detect risks,
                missing information, contradictions
                and important changes — with
                evidence from your documents.
              </p>

              <div className="hero-actions">
                <label className="hero-cta-primary">
                  <Upload size={18} />
                  Analyze Document

                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      handleFile(e);

                      if (e.target.files[0]) {
                        handleAnalyze(
                          e.target.files[0]
                        );
                      }
                    }}
                    hidden
                    ref={fileInputRef}
                  />
                </label>

                <button
                  className="hero-cta-secondary"
                  onClick={() => {
                    setView("compare");
                    setCmpResult(null);
                  }}
                >
                  <GitCompare size={18} />
                  Compare Documents
                </button>

                <button
                  className="hero-cta-demo"
                  onClick={handleDemo}
                >
                  <Sparkles size={16} />
                  Try Demo
                </button>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────
              SAVED DOCUMENTS
          ───────────────────────────────────── */}
          <section className="saved-documents-section">
            <div className="saved-documents-header">
              <div>
                <h2>Recent Documents</h2>
              </div>

              <button
                className="btn-outline-sm"
                onClick={loadSavedDocuments}
                disabled={documentsLoading}
              >
                <RotateCcw
                  size={14}
                  className={
                    documentsLoading
                      ? "spin"
                      : ""
                  }
                />
                Refresh
              </button>
            </div>

            {documentsLoading ? (
              <div className="saved-documents-loading">
                <Loader2
                  size={24}
                  className="spin"
                />
                <span>
                  Loading saved documents...
                </span>
              </div>
            ) : savedDocuments.length === 0 ? (
              <div className="saved-documents-empty">
                <Files size={32} />

                <h3>
                  No documents analyzed yet
                </h3>

                <p>
                  Upload a document and FrestoDoc
                  will save the analysis here.
                </p>
              </div>
            ) : (
              <div className="saved-documents-grid">
                {savedDocuments.map((doc) => (
                  <button
                    key={doc._id}
                    className="saved-document-card"
                    onClick={() =>
                      openSavedDocument(
                        doc._id
                      )
                    }
                  >
                    <div className="saved-document-icon">
                      <FileText size={22} />
                    </div>

                    <div className="saved-document-info">
                      <h3>{doc.filename}</h3>

                      <p>
                        {doc.analysis
                          ?.documentTitle ||
                          doc.analysis
                            ?.documentType ||
                          "Analyzed document"}
                      </p>

                      <span>
                        {doc.createdAt
                          ? new Date(
                              doc.createdAt
                            ).toLocaleString()
                          : "Recently analyzed"}
                      </span>
                    </div>

                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            )}
          </section>

          {analyzeError && (
            <div className="home-error">
              <AlertTriangle size={18} />

              <div>
                <strong>
                  {analyzeError.includes(
                    "temporarily"
                  )
                    ? "AI Temporarily Unavailable"
                    : "Analysis failed:"}
                </strong>{" "}
                {analyzeError}

                {!analyzeError.includes(
                  "temporarily"
                ) && (
                  <>
                    <br />
                    <small>
                      Make sure the backend is
                      running on port 5000 and your
                      GEMINI_API_KEY is set.
                    </small>
                  </>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  marginLeft: "auto",
                }}
              >
                {file && (
                  <button
                    className="btn-outline-sm"
                    style={{
                      color: "#93c5fd",
                      borderColor:
                        "rgba(96,165,250,0.3)",
                      padding: "6px 12px",
                      fontSize: "12px",
                    }}
                    onClick={() => {
                      setAnalyzeError(null);
                      handleAnalyze(file);
                    }}
                  >
                    <RotateCcw size={13} />
                    Retry Analysis
                  </button>
                )}

                <button
                  onClick={() =>
                    setAnalyzeError(null)
                  }
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <section className="features-grid">
            {[
              {
                icon: <Shield size={26} />,
                title: "Risk Scanner",
                desc: "Identifies potentially risky clauses, unusual obligations, strict deadlines and financial penalties — with evidence.",
                color: "feat-red",
              },
              {
                icon: <Search size={26} />,
                title: "Missing Information",
                desc: "Detects information that would normally be expected for the document type but was not clearly found.",
                color: "feat-yellow",
              },
              {
                icon: <GitCompare size={26} />,
                title: "Contradiction Detector",
                desc: "Compares two documents and surfaces conflicting terms, dates, amounts and obligations with source references.",
                color: "feat-blue",
              },
              {
                icon: <TrendingUp size={26} />,
                title: "Version Comparison",
                desc: "Upload two versions of a document to see exactly what changed, was added or removed.",
                color: "feat-purple",
              },
              {
                icon: <Eye size={26} />,
                title: "Evidence-backed Findings",
                desc: "Every finding includes the source text. Verify every AI conclusion directly from your document.",
                color: "feat-teal",
              },
              {
                icon: <Zap size={26} />,
                title: "Action Center",
                desc: "Automatically extracts tasks, deadlines and responsibilities and converts them into trackable actions.",
                color: "feat-green",
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`feature-card ${f.color}`}
              >
                <div className="feat-icon">
                  {f.icon}
                </div>

                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </section>

          <section className="how-section">
            <h2>How FrestoDoc works</h2>

            <div className="steps">
              {[
                {
                  n: "01",
                  icon: <Upload />,
                  t: "Upload",
                  d: "Upload any PDF, DOCX or TXT document.",
                },
                {
                  n: "02",
                  icon: <Sparkles />,
                  t: "AI Analysis",
                  d: "FrestoDoc analyzes your document for risks, gaps and actions.",
                },
                {
                  n: "03",
                  icon: <Shield />,
                  t: "Review Findings",
                  d: "Review evidence-backed findings with source references.",
                },
                {
                  n: "04",
                  icon: <CheckCircle />,
                  t: "Take Action",
                  d: "Convert important findings into trackable tasks.",
                },
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="step-number">
                    {s.n}
                  </div>

                  {s.icon}

                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );

  // ─────────────────────────────────────────────
  // ANALYZING VIEW
  // ─────────────────────────────────────────────
  if (view === "analyzing")
    return (
      <div className="app">
        <Navbar />

        <div className="analyzing-screen">
          <div className="analyzing-card">
            <div className="analyzing-spinner">
              <Loader2
                size={40}
                className="spin"
              />
            </div>

            <h2>
              Analyzing your document…
            </h2>

            <p>
              FrestoDoc is inspecting your
              document for risks, gaps, and
              actionable insights.
            </p>

            <div className="analyze-steps">
              {analyzeSteps.map((s, i) => (
                <div
                  key={i}
                  className={`analyze-step ${
                    s.done
                      ? "step-done"
                      : "step-pending"
                  }`}
                >
                  {s.done ? (
                    <CheckCircle size={18} />
                  ) : (
                    <Loader2
                      size={18}
                      className="spin"
                    />
                  )}

                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  // ─────────────────────────────────────────────
  // RESULTS VIEW
  // ─────────────────────────────────────────────
  if (view === "results" && aiAnalysis) {
    const a = aiAnalysis;

    const risks = a.risks || [];
    const missing =
      a.missingInformation || [];
    const acts = actions;
    const dates =
      a.importantDates || [];

    const highRisks = risks.filter(
      (r) => r.severity === "high"
    ).length;

    const TABS = [
      {
        id: "overview",
        label: "Overview",
        icon: <LayoutDashboard size={15} />,
      },
      {
        id: "risks",
        label: `Risks (${risks.length})`,
        icon: <Shield size={15} />,
      },
      {
        id: "missing",
        label: `Missing (${missing.length})`,
        icon: <Search size={15} />,
      },
      {
        id: "actions",
        label: `Actions (${acts.length})`,
        icon: <CheckCircle size={15} />,
      },
      {
        id: "dates",
        label: `Dates (${dates.length})`,
        icon: <Calendar size={15} />,
      },
      {
        id: "ask",
        label: "Ask AI",
        icon: <MessageSquare size={15} />,
      },
    ];

    return (
      <div className="app">
        <Navbar />

        <EvidencePanel
          item={evidenceItem}
          onClose={() =>
            setEvidenceItem(null)
          }
        />

        <div className="results-header">
          <div className="results-header-inner">
            <div className="results-doc-info">
              <div className="results-doc-icon">
                <FileText size={22} />
              </div>

              <div>
                <h1 className="results-doc-title">
                  {uploadResult?.filename}
                </h1>

                <div className="results-meta-row">
                  <span className="doc-type-badge">
                    {docTypeLabel(
                      a.documentType
                    )}
                  </span>

                  <span className="results-meta-sep">
                    ·
                  </span>

                  <span className="results-meta-muted">
                    Analysis complete
                  </span>
                </div>
              </div>
            </div>

            <div className="results-counts">
              <div className="count-chip count-risk">
                <Shield size={14} />
                {risks.length} Risks{" "}
                {highRisks > 0 && (
                  <span className="chip-hi">
                    ({highRisks} high)
                  </span>
                )}
              </div>

              <div className="count-chip count-miss">
                <Search size={14} />
                {missing.length} Missing
              </div>

              <div className="count-chip count-act">
                <Zap size={14} />
                {acts.length} Actions
              </div>

              <div className="count-chip count-date">
                <Calendar size={14} />
                {dates.length} Dates
              </div>
            </div>

            <div className="results-header-btns">
              <label className="btn-outline-sm">
                <RotateCcw size={14} />
                Re-analyze

                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    handleFile(e);

                    if (e.target.files[0]) {
                      handleAnalyze(
                        e.target.files[0]
                      );
                    }
                  }}
                  hidden
                />
              </label>
            </div>
          </div>

          <div className="results-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`results-tab ${
                  activeTab === t.id
                    ? "tab-active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab(t.id)
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="results-body">
          {/* ─────────────────────────────
              OVERVIEW
          ───────────────────────────── */}
          {activeTab === "overview" && (
            <div className="tab-content">
              <div className="r-card">
                <div className="r-card-header">
                  <Sparkles size={18} />
                  <h3>Executive Summary</h3>
                </div>

                <p className="r-summary-text">
                  {a.summary}
                </p>
              </div>

              {a.keyInformation?.length >
                0 && (
                <div className="r-card">
                  <div className="r-card-header">
                    <Tag size={18} />
                    <h3>Key Information</h3>
                  </div>

                  <div className="key-info-grid">
                    {a.keyInformation.map(
                      (ki, i) => (
                        <div
                          key={i}
                          className="key-info-item"
                        >
                          <span className="ki-label">
                            {ki.label}
                          </span>

                          <span className="ki-value">
                            {ki.value}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="overview-counts-row">
                {[
                  {
                    label: "Potential Risks",
                    val: risks.length,
                    cls: "oc-risk",
                    icon: <Shield size={20} />,
                    tab: "risks",
                  },
                  {
                    label: "Missing Items",
                    val: missing.length,
                    cls: "oc-miss",
                    icon: <Search size={20} />,
                    tab: "missing",
                  },
                  {
                    label: "Actions",
                    val: acts.length,
                    cls: "oc-act",
                    icon: <Zap size={20} />,
                    tab: "actions",
                  },
                  {
                    label: "Important Dates",
                    val: dates.length,
                    cls: "oc-date",
                    icon: <Calendar size={20} />,
                    tab: "dates",
                  },
                ].map((oc, i) => (
                  <button
                    key={i}
                    className={`oc-card ${oc.cls}`}
                    onClick={() =>
                      setActiveTab(oc.tab)
                    }
                  >
                    {oc.icon}

                    <div className="oc-val">
                      {oc.val}
                    </div>

                    <div className="oc-lbl">
                      {oc.label}
                    </div>

                    <ChevronRight
                      size={14}
                      className="oc-arrow"
                    />
                  </button>
                ))}
              </div>

              {a.keyPoints?.length > 0 && (
                <div className="r-card">
                  <div className="r-card-header">
                    <CheckCircle size={18} />
                    <h3>Key Points</h3>
                  </div>

                  <ul className="r-list">
                    {a.keyPoints.map(
                      (p, i) => (
                        <li key={i}>{p}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {a.importantTopics?.length >
                0 && (
                <div className="r-card">
                  <div className="r-card-header">
                    <Layers size={18} />
                    <h3>
                      Important Topics
                    </h3>
                  </div>

                  <div className="topic-tags">
                    {a.importantTopics.map(
                      (t, i) => (
                        <span
                          key={i}
                          className="topic-tag"
                        >
                          {t}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────
              RISKS
          ───────────────────────────── */}
          {activeTab === "risks" && (
            <div className="tab-content">
              {risks.length === 0 ? (
                <div className="empty-state">
                  <Shield size={40} />

                  <h3>
                    No potential risks
                    identified
                  </h3>

                  <p>
                    FrestoDoc did not find
                    obvious risk indicators in
                    this document. This is not a
                    guarantee — always apply
                    professional judgement.
                  </p>
                </div>
              ) : (
                <>
                  <div className="section-note">
                    <Info size={15} />
                    These are potential issues
                    that may require attention.
                    They are AI-generated
                    observations, not professional
                    legal or financial advice.
                  </div>

                  {risks.map((risk, i) => (
                    <div
                      key={i}
                      className={`risk-card sev-border-${risk.severity}`}
                    >
                      <div className="risk-header">
                        <div className="risk-title-row">
                          <span
                            className={`sev-badge ${severityColor(
                              risk.severity
                            )}`}
                          >
                            {risk.severity.toUpperCase()}
                          </span>

                          <h3 className="risk-title">
                            {risk.title}
                          </h3>
                        </div>

                        <button
                          className="evidence-btn"
                          onClick={() =>
                            setEvidenceItem(
                              risk
                            )
                          }
                        >
                          <Eye size={14} />
                          View Evidence
                        </button>
                      </div>

                      <p className="risk-desc">
                        {risk.description}
                      </p>

                      {risk.whyItMatters && (
                        <div className="risk-why">
                          <span className="risk-why-label">
                            Why it matters:
                          </span>{" "}
                          {risk.whyItMatters}
                        </div>
                      )}

                      {risk.evidence && (
                        <blockquote className="risk-quote">
                          "{risk.evidence}"
                        </blockquote>
                      )}

                      {risk.recommendation && (
                        <div className="risk-rec">
                          <CheckCircle size={14} />
                          {risk.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────
              MISSING
          ───────────────────────────── */}
          {activeTab === "missing" && (
            <div className="tab-content">
              {missing.length === 0 ? (
                <div className="empty-state">
                  <Search size={40} />

                  <h3>
                    No missing information
                    detected
                  </h3>

                  <p>
                    The document appears to
                    contain the expected
                    information for its type.
                  </p>
                </div>
              ) : (
                <>
                  <div className="section-note">
                    <Info size={15} />
                    These items were not clearly
                    found in the document.
                    "Not found" does not mean
                    they definitely don't exist.
                  </div>

                  <div className="completeness-bar-wrap">
                    <div className="completeness-label">
                      Document Completeness
                    </div>

                    <div className="completeness-row">
                      <div className="completeness-stat">
                        <CheckCircle
                          size={14}
                          className="cs-green"
                        />
                        Found in document
                      </div>

                      <div className="completeness-stat">
                        <AlertTriangle
                          size={14}
                          className="cs-yellow"
                        />
                        {
                          missing.filter(
                            (m) =>
                              m.confidence ===
                              "medium"
                          ).length
                        }{" "}
                        Unclear
                      </div>

                      <div className="completeness-stat">
                        <X
                          size={14}
                          className="cs-red"
                        />
                        {
                          missing.filter(
                            (m) =>
                              m.importance ===
                              "high"
                          ).length
                        }{" "}
                        High-importance gaps
                      </div>
                    </div>
                  </div>

                  {missing.map((m, i) => (
                    <div
                      key={i}
                      className="missing-card"
                    >
                      <div className="missing-header">
                        <span
                          className={`imp-badge ${importanceColor(
                            m.importance
                          )}`}
                        >
                          {m.importance?.toUpperCase()}
                        </span>

                        <h3 className="missing-item">
                          {m.item}
                        </h3>
                      </div>

                      <p className="missing-reason">
                        {m.reason}
                      </p>

                      <div className="missing-confidence">
                        <Tag size={13} />
                        Confidence:{" "}
                        <strong>
                          {m.confidence}
                        </strong>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────
              ACTIONS
          ───────────────────────────── */}
          {activeTab === "actions" && (
            <div className="tab-content">
              {acts.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={40} />

                  <h3>
                    No actionable tasks
                    detected
                  </h3>

                  <p>
                    No specific tasks or
                    deadlines were found in
                    this document.
                  </p>
                </div>
              ) : (
                <>
                  <div className="action-center-header">
                    <div className="ac-count">
                      {
                        acts.filter(
                          (a) => !a.completed
                        ).length
                      }{" "}
                      pending ·{" "}
                      {
                        acts.filter(
                          (a) => a.completed
                        ).length
                      }{" "}
                      completed
                    </div>
                  </div>

                  {acts.map((act) => (
                    <div
                      key={act.id}
                      className={`action-item ${
                        act.completed
                          ? "action-done"
                          : ""
                      }`}
                    >
                      <button
                        className="action-check"
                        onClick={() =>
                          toggleAction(
                            act.id
                          )
                        }
                      >
                        <CheckCircle size={20} />
                      </button>

                      <div className="action-body">
                        <div className="action-task-row">
                          <span className="action-task">
                            {act.task}
                          </span>

                          <span
                            className={`pri-badge ${priorityColor(
                              act.priority
                            )}`}
                          >
                            {act.priority}
                          </span>
                        </div>

                        <div className="action-meta">
                          {act.deadlineText && (
                            <span className="action-deadline">
                              <Clock size={13} />
                              {act.deadlineText}
                            </span>
                          )}

                          {act.responsibleParty && (
                            <span className="action-party">
                              <Tag size={13} />
                              {
                                act.responsibleParty
                              }
                            </span>
                          )}

                          {act.evidence && (
                            <button
                              className="action-evidence-btn"
                              onClick={() =>
                                setEvidenceItem({
                                  title: act.task,
                                  evidence:
                                    act.evidence,
                                  description: `Responsible: ${
                                    act.responsibleParty ||
                                    "Not specified"
                                  }`,
                                })
                              }
                            >
                              <Eye size={13} />
                              Evidence
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        className="action-delete"
                        onClick={() =>
                          deleteAction(
                            act.id
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ─────────────────────────────
              DATES
          ───────────────────────────── */}
          {activeTab === "dates" && (
            <div className="tab-content">
              {dates.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={40} />

                  <h3>
                    No important dates found
                  </h3>

                  <p>
                    No specific dates or
                    deadlines were identified
                    in this document.
                  </p>
                </div>
              ) : (
                dates.map((d, i) => (
                  <div
                    key={i}
                    className="date-card"
                  >
                    <div className="date-icon-col">
                      <Calendar size={20} />
                    </div>

                    <div className="date-body">
                      <div className="date-event-row">
                        <h3 className="date-event">
                          {d.event}
                        </h3>

                        <span
                          className={`imp-badge ${importanceColor(
                            d.importance
                          )}`}
                        >
                          {d.importance}
                        </span>
                      </div>

                      <div className="date-date">
                        {d.dateText || d.date}
                      </div>

                      {d.description && (
                        <p className="date-desc">
                          {d.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ─────────────────────────────
              ASK AI
          ───────────────────────────── */}
          {activeTab === "ask" && (
            <div className="tab-content">
              <div className="qa-intro">
                <MessageSquare size={18} />

                <div>
                  <strong>
                    Ask FrestoDoc
                  </strong>

                  <p>
                    Ask any question about this
                    document. Answers include
                    source evidence from the
                    text.
                  </p>
                </div>
              </div>

              <div className="qa-input-row">
                <input
                  className="qa-input"
                  placeholder="e.g. What is the notice period? What are the payment terms?"
                  value={question}
                  onChange={(e) =>
                    setQuestion(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !qaLoading &&
                    handleAsk()
                  }
                  disabled={qaLoading}
                />

                <button
                  className="qa-submit"
                  onClick={handleAsk}
                  disabled={
                    qaLoading ||
                    !question.trim()
                  }
                >
                  {qaLoading ? (
                    <Loader2
                      size={18}
                      className="spin"
                    />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>

              {qaResult && (
                <div
                  className={`qa-result ${
                    qaResult.found === false
                      ? "qa-not-found"
                      : ""
                  }`}
                >
                  <div className="qa-answer">
                    {qaResult.answer}
                  </div>

                  {qaResult.evidence && (
                    <div className="qa-evidence">
                      <div className="qa-evidence-label">
                        <Tag size={13} />
                        Source Evidence
                      </div>

                      <blockquote className="ep-quote">
                        {qaResult.evidence}
                      </blockquote>
                    </div>
                  )}

                  <div className="qa-confidence">
                    Confidence:{" "}
                    {qaResult.confidence ||
                      "—"}
                  </div>
                </div>
              )}

              {qaHistory.length > 1 && (
                <div className="qa-history">
                  <div className="qa-history-label">
                    Previous questions
                  </div>

                  {qaHistory
                    .slice(1)
                    .map((h, i) => (
                      <div
                        key={i}
                        className="qa-history-item"
                      >
                        <div className="qa-hist-q">
                          {h.question}
                        </div>

                        <div className="qa-hist-a">
                          {h.answer}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // ACTIONS VIEW
  // ─────────────────────────────────────────────
  if (view === "actions")
    return (
      <div className="app">
        <Navbar />

        <div className="page-container">
          <div className="page-header">
            <h2>Action Center</h2>

            <p>
              {
                actions.filter(
                  (a) => !a.completed
                ).length
              }{" "}
              pending ·{" "}
              {
                actions.filter(
                  (a) => a.completed
                ).length
              }{" "}
              completed
            </p>
          </div>

          {actions.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={40} />

              <h3>No actions yet</h3>

              <p>
                Upload and analyze a document
                to extract actionable tasks.
              </p>

              <button
                className="btn-primary"
                onClick={() =>
                  setView("home")
                }
              >
                Analyze a Document
              </button>
            </div>
          ) : (
            <div>
              {["high", "medium", "low"].map(
                (prio) => {
                  const group =
                    actions.filter(
                      (a) =>
                        a.priority === prio
                    );

                  if (!group.length)
                    return null;

                  return (
                    <div
                      key={prio}
                      className="action-group"
                    >
                      <div className="action-group-label">
                        {prio === "high"
                          ? "🔴"
                          : prio === "medium"
                          ? "🟡"
                          : "🟢"}{" "}
                        {prio
                          .charAt(0)
                          .toUpperCase() +
                          prio.slice(1)}{" "}
                        Priority
                      </div>

                      {group.map((act) => (
                        <div
                          key={act.id}
                          className={`action-item ${
                            act.completed
                              ? "action-done"
                              : ""
                          }`}
                        >
                          <button
                            className="action-check"
                            onClick={() =>
                              toggleAction(
                                act.id
                              )
                            }
                          >
                            <CheckCircle
                              size={20}
                            />
                          </button>

                          <div className="action-body">
                            <div className="action-task-row">
                              <span className="action-task">
                                {act.task}
                              </span>
                            </div>

                            <div className="action-meta">
                              {act.deadlineText && (
                                <span className="action-deadline">
                                  <Clock size={13} />
                                  {
                                    act.deadlineText
                                  }
                                </span>
                              )}

                              {act.responsibleParty && (
                                <span className="action-party">
                                  <Tag size={13} />
                                  {
                                    act.responsibleParty
                                  }
                                </span>
                              )}

                              {uploadResult?.filename && (
                                <span className="action-source">
                                  <Files size={13} />
                                  {
                                    uploadResult.filename
                                  }
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            className="action-delete"
                            onClick={() =>
                              deleteAction(
                                act.id
                              )
                            }
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    );

  // ─────────────────────────────────────────────
  // COMPARE VIEW
  // ─────────────────────────────────────────────
  if (view === "compare")
    return (
      <div className="app">
        <Navbar />

        <div className="page-container">
          <div className="page-header">
            <h2>Compare Documents</h2>

            <p>
              Upload two documents to detect
              contradictions, conflicts and
              version changes.
            </p>
          </div>

          <div className="compare-upload-grid">
            {[
              {
                label: "Document A",
                file: cmpFile1,
                setFile: setCmpFile1,
              },
              {
                label: "Document B",
                file: cmpFile2,
                setFile: setCmpFile2,
              },
            ].map((side) => (
              <div
                key={side.label}
                className="compare-upload-card"
              >
                <div className="cmp-icon">
                  <FileText size={28} />
                </div>

                <h3>{side.label}</h3>

                <p className="cmp-filename">
                  {side.file
                    ? side.file.name
                    : "No file selected"}
                </p>

                <label className="btn-outline-sm cmp-btn">
                  <Upload size={14} />

                  {side.file
                    ? "Change"
                    : "Choose File"}

                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) =>
                      side.setFile(
                        e.target.files[0] ||
                          null
                      )
                    }
                    hidden
                  />
                </label>
              </div>
            ))}
          </div>

          {cmpError && (
            <div className="home-error">
              <AlertTriangle size={18} />

              <span>{cmpError}</span>

              <button
                onClick={() =>
                  setCmpError(null)
                }
              >
                <X size={16} />
              </button>
            </div>
          )}

          <button
            className="btn-primary compare-go-btn"
            disabled={
              !cmpFile1 ||
              !cmpFile2 ||
              cmpLoading
            }
            onClick={handleCompare}
          >
            {cmpLoading ? (
              <>
                <Loader2
                  size={18}
                  className="spin"
                />
                Comparing…
              </>
            ) : (
              <>
                <GitCompare size={18} />
                Compare Documents
              </>
            )}
          </button>
        </div>
      </div>
    );

  // ─────────────────────────────────────────────
  // COMPARE RESULTS VIEW
  // ─────────────────────────────────────────────
  if (
    view === "compare-results" &&
    cmpResult
  ) {
    const c = cmpResult;

    return (
      <div className="app">
        <Navbar />

        <EvidencePanel
          item={evidenceItem}
          onClose={() =>
            setEvidenceItem(null)
          }
        />

        <div className="page-container">
          <div className="page-header">
            <h2>Comparison Results</h2>

            <p>
              {c.doc1Name}{" "}
              <span className="vs-sep">
                vs
              </span>{" "}
              {c.doc2Name}
            </p>
          </div>

          {c.summary && (
            <div className="r-card">
              <div className="r-card-header">
                <Sparkles size={18} />
                <h3>Summary</h3>
              </div>

              <p className="r-summary-text">
                {c.summary}
              </p>
            </div>
          )}

          <div className="r-card">
            <div className="r-card-header">
              <AlertTriangle size={18} />

              <h3>
                Potential Contradictions (
                {c.contradictions
                  ?.length || 0}
                )
              </h3>
            </div>

            {!c.contradictions?.length ? (
              <p className="muted">
                No direct contradictions
                found.
              </p>
            ) : (
              c.contradictions.map(
                (ct, i) => (
                  <div
                    key={i}
                    className={`contradiction-item sev-border-${ct.severity}`}
                  >
                    <div className="ct-header">
                      <span
                        className={`sev-badge ${severityColor(
                          ct.severity
                        )}`}
                      >
                        {ct.severity.toUpperCase()}
                      </span>

                      <strong className="ct-topic">
                        {ct.topic}
                      </strong>

                      <button
                        className="evidence-btn"
                        onClick={() =>
                          setEvidenceItem({
                            title: ct.topic,
                            evidence: `Doc A: "${ct.doc1Evidence}"\n\nDoc B: "${ct.doc2Evidence}"`,
                            whyItMatters:
                              ct.whyItMatters,
                          })
                        }
                      >
                        <Eye size={13} />
                        Evidence
                      </button>
                    </div>

                    <div className="ct-values">
                      <div className="ct-val">
                        <div className="ct-doc-label">
                          {c.doc1Name}
                        </div>

                        <div className="ct-val-text">
                          {ct.doc1Value}
                        </div>
                      </div>

                      <div className="ct-arrow">
                        <ArrowRight size={16} />
                      </div>

                      <div className="ct-val">
                        <div className="ct-doc-label">
                          {c.doc2Name}
                        </div>

                        <div className="ct-val-text">
                          {ct.doc2Value}
                        </div>
                      </div>
                    </div>

                    {ct.whyItMatters && (
                      <p className="ct-why">
                        {ct.whyItMatters}
                      </p>
                    )}
                  </div>
                )
              )
            )}
          </div>

          {c.changes?.length > 0 && (
            <div className="r-card">
              <div className="r-card-header">
                <TrendingUp size={18} />

                <h3>
                  Changes (
                  {c.changes.length})
                </h3>
              </div>

              {c.changes.map(
                (ch, i) => (
                  <div
                    key={i}
                    className="change-item"
                  >
                    <div className="change-topic">
                      {ch.topic}
                    </div>

                    <div className="ct-values">
                      <div className="ct-val">
                        <div className="ct-doc-label">
                          Before
                        </div>

                        <div className="ct-val-text">
                          {ch.previousValue}
                        </div>
                      </div>

                      <div className="ct-arrow">
                        <span
                          className={`change-type-badge ctype-${ch.changeType}`}
                        >
                          {ch.changeType}
                        </span>
                      </div>

                      <div className="ct-val">
                        <div className="ct-doc-label">
                          After
                        </div>

                        <div className="ct-val-text">
                          {ch.currentValue}
                        </div>
                      </div>
                    </div>

                    {ch.significance && (
                      <p className="ct-why">
                        {ch.significance}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          <div className="compare-only-grid">
            {c.onlyInDoc1?.length > 0 && (
              <div className="r-card">
                <div className="r-card-header">
                  <FileText size={16} />

                  <h3>
                    Only in{" "}
                    {c.doc1Name}
                  </h3>
                </div>

                <ul className="r-list">
                  {c.onlyInDoc1.map(
                    (x, i) => (
                      <li key={i}>{x}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {c.onlyInDoc2?.length > 0 && (
              <div className="r-card">
                <div className="r-card-header">
                  <FileText size={16} />

                  <h3>
                    Only in{" "}
                    {c.doc2Name}
                  </h3>
                </div>

                <ul className="r-list">
                  {c.onlyInDoc2.map(
                    (x, i) => (
                      <li key={i}>{x}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>

          <button
            className="btn-outline-sm"
            style={{
              marginTop: "24px",
            }}
            onClick={() => {
              setView("compare");
              setCmpResult(null);
              setCmpFile1(null);
              setCmpFile2(null);
            }}
          >
            <RotateCcw size={14} />
            Compare Again
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // FALLBACK
  // ─────────────────────────────────────────────
  return (
    <div className="app">
      <Navbar />

      <div className="page-container">
        <button
          className="btn-primary"
          onClick={() => setView("home")}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}