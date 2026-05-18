import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

type StepPanel = {
  icon: string;
  title: string;
  sub: string;
  icon2: string;
  title2: string;
  sub2: string;
};

const HOW_PANELS: StepPanel[] = [
  {
    icon: "school",
    title: "School Registered",
    sub: "Principal has created 6 classes, enrolled 12 teachers. System is ready for term entry.",
    icon2: "manage_accounts",
    title2: "Teachers Invited",
    sub2: "Each teacher received an email invite and has set up their account.",
  },
  {
    icon: "edit_note",
    title: "Score Entry Open",
    sub: "Teachers entering CA1, CA2 & Exam scores for First Term 2024/25.",
    icon2: "calculate",
    title2: "Auto-Calculated",
    sub2: "Totals, grades, and class positions computed in real-time as scores are entered.",
  },
  {
    icon: "send",
    title: "Results Submitted",
    sub: "JSS 2A results submitted by Mr. Adewale. Pending principal review.",
    icon2: "approval",
    title2: "Awaiting Approval",
    sub2: "Principal has received a notification and can review all submitted entries.",
  },
  {
    icon: "verified",
    title: "Results Approved",
    sub: "Principal has approved all results for JSS 2A. No corrections needed.",
    icon2: "picture_as_pdf",
    title2: "PDFs Generated",
    sub2: "38 branded report cards ready to download and distribute to students.",
  },
];

const STEP_TITLES = [
  {
    title: "School & Class Setup",
    desc: "The principal registers the school, creates classes (JSS 1–3, SSS 1–3), and invites teachers via email. One-time, takes five minutes.",
  },
  {
    title: "Teachers Enter Scores",
    desc: "Each teacher logs into their class, enters CA1, CA2, and exam scores per subject per student. The system validates and totals automatically.",
  },
  {
    title: "Submit for Approval",
    desc: "When ready, teachers submit results. The principal receives a notification and can approve, comment, or request corrections.",
  },
  {
    title: "Print Report Cards",
    desc: "Approved results become print-ready. Download a branded PDF for every student in the class — with rank, grades, attendance, and behaviour.",
  },
];

const MARQUEE_ITEMS = [
  { icon: "grade", label: "Nigerian Grading (A–F)" },
  { icon: "psychology", label: "Psychometric Assessment" },
  { icon: "picture_as_pdf", label: "PDF Report Cards" },
  { icon: "wifi_off", label: "Fully Offline" },
  { icon: "approval", label: "Principal Approvals" },
  { icon: "leaderboard", label: "Position Ranking" },
  { icon: "groups", label: "Multi-class Management" },
  { icon: "checklist", label: "Attendance Tracking" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const userInteractedRef = useRef(false);

  // Nav scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fade-up on scroll
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>(".fade-up");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-cycle the "How it works" steps until the user clicks one
  useEffect(() => {
    const id = window.setInterval(() => {
      if (userInteractedRef.current) return;
      setActiveStep((s) => (s + 1) % HOW_PANELS.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  const handleStepClick = (idx: number) => {
    userInteractedRef.current = true;
    setActiveStep(idx);
  };

  const openApp = () => navigate("/login");

  // HashRouter would intercept <a href="#features"> as a route change, so we
  // scroll manually instead.
  const scrollToId = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const panel = HOW_PANELS[activeStep];

  return (
    <div className="landing-page" ref={rootRef}>
      {/* NAV */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          <div className="nav-logo-mark">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
          </div>
          <div>
            <span className="nav-wordmark">Skora <sub>RMS</sub></span>
          </div>
        </a>
        <ul className="nav-links">
          <li><a href="#features" onClick={scrollToId("features")}>Features</a></li>
          <li><a href="#how" onClick={scrollToId("how")}>How it works</a></li>
          <li><a href="#roles" onClick={scrollToId("roles")}>Roles</a></li>
          <li>
            <a
              href="#/login"
              className="nav-cta"
              onClick={(e) => { e.preventDefault(); openApp(); }}
            >
              Open App →
            </a>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero" style={{ paddingTop: 0 }}>
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            Built for Nigerian Secondary Schools
          </div>
          <h1 className="hero-h1">
            The Academic<br />
            <span className="accent-line">Ledger That<br />Schools Trust</span>
          </h1>
          <p className="hero-sub">
            Skora RMS digitises your school's entire result management workflow — from CA entry to PDF report cards — with precision, speed, and offline reliability.
          </p>
          <div className="hero-actions">
            <button type="button" className="lp-btn-primary" onClick={openApp}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
              Open Skora RMS
            </button>
            <a href="#how" className="lp-btn-ghost" onClick={scrollToId("how")}>
              See how it works
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
            </a>
          </div>
          <div className="hero-trust">
            <span>Offline-capable</span>
            <div className="trust-dot" />
            <span>Nigerian grading system</span>
            <div className="trust-dot" />
            <span>PDF report cards</span>
            <div className="trust-dot" />
            <span>Free to use</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-grid-bg" />
          <div className="hero-float-card card-main">
            <div className="ledger-card-title">JSS 2A · First Term Results</div>
            <div className="lp-ledger-row">
              <span className="ledger-row-name">ADEYEMI, FAVOUR</span>
              <span className="ledger-row-score score-a">87 · A</span>
            </div>
            <div className="lp-ledger-row">
              <span className="ledger-row-name">IBRAHIM, HASSAN</span>
              <span className="ledger-row-score score-a">82 · A</span>
            </div>
            <div className="lp-ledger-row">
              <span className="ledger-row-name">OKONKWO, CHIBUNDO</span>
              <span className="ledger-row-score score-b">74 · B</span>
            </div>
            <div className="lp-ledger-row">
              <span className="ledger-row-name">BELLO, AMINAT</span>
              <span className="ledger-row-score score-a">91 · A</span>
            </div>
            <div className="lp-ledger-row">
              <span className="ledger-row-name">EZE, CHUKWUEMEKA</span>
              <span className="ledger-row-score score-b">69 · B</span>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <span className="lp-badge lp-badge-green">Submitted</span>
              <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", alignSelf: "center" }}>
                · 34 students
              </span>
            </div>
          </div>
          <div className="hero-float-card card-top-right">
            <div className="card-stat-label">Approval Rate</div>
            <div className="card-stat-value">94%</div>
            <div className="card-stat-sub">This term</div>
          </div>
          <div className="hero-float-card card-bottom-left">
            <div className="card-stat-label">PDF Generated</div>
            <div
              className="card-stat-value"
              style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#91d78a" }}>check_circle</span>
              <span style={{ color: "#91d78a" }}>Ready</span>
            </div>
            <div className="card-stat-sub">38 report cards</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((m, i) => (
            <div className="marquee-item" key={`${m.icon}-${i}`}>
              <span className="material-symbols-outlined">{m.icon}</span>
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="fade-up">
          <div className="section-eyebrow">Core Capabilities</div>
          <h2 className="section-h2">Everything a Nigerian school<br />actually needs</h2>
          <p className="section-lead">
            Skora is purpose-built — not a generic platform retrofitted for local needs. Every feature reflects how Nigerian secondary schools actually work.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card fade-up fade-up-delay-1">
            <div className="feature-icon icon-blue">
              <span className="material-symbols-outlined">calculate</span>
            </div>
            <div className="feature-title">Nigerian Grading System</div>
            <p className="feature-desc">
              CA1 + CA2 + Exam scores aggregated automatically. Grades computed to A–F with local thresholds. Positions calculated per class with tie-breaking.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-2">
            <div className="feature-icon icon-green">
              <span className="material-symbols-outlined">picture_as_pdf</span>
            </div>
            <div className="feature-title">Branded PDF Report Cards</div>
            <p className="feature-desc">
              Classic, Modern, and Hybrid report card templates. School logo, principal signature, behavioural assessments — all printed to PDF in one click.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-3">
            <div className="feature-icon icon-amber">
              <span className="material-symbols-outlined">wifi_off</span>
            </div>
            <div className="feature-title">Offline-First Architecture</div>
            <p className="feature-desc">
              Built as a Progressive Web App. All data lives in IndexedDB locally. Work during power cuts and poor connectivity — sync when online.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-1">
            <div className="feature-icon icon-green">
              <span className="material-symbols-outlined">how_to_reg</span>
            </div>
            <div className="feature-title">Attendance Tracking</div>
            <p className="feature-desc">
              Mark attendance per class per term. Data feeds directly into each student's report card. Cumulative school days tracked automatically.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-2">
            <div className="feature-icon icon-blue">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div className="feature-title">Psychometric Assessments</div>
            <p className="feature-desc">
              8 behavioural metrics scored per student. Affective and cognitive domains evaluated with a clean, fast input interface for teachers.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-3">
            <div className="feature-icon icon-amber">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div className="feature-title">Principal Approval Workflow</div>
            <p className="feature-desc">
              Teachers submit results for review. Principals approve, reject with comments, or request revisions — giving schools full audit control.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="fade-up">
          <div className="section-eyebrow">Workflow</div>
          <h2 className="section-h2">From registration to<br />printed report card</h2>
          <p className="section-lead">Skora guides your school through a structured, predictable process every term.</p>
        </div>
        <div className="how-grid">
          <div className="steps-list fade-up">
            {STEP_TITLES.map((s, idx) => (
              <button
                type="button"
                key={s.title}
                className={`step${activeStep === idx ? " active" : ""}`}
                onClick={() => handleStepClick(idx)}
              >
                <div className="step-num">0{idx + 1}</div>
                <div>
                  <div className="step-title">{s.title}</div>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="how-visual fade-up fade-up-delay-2">
            <div className="how-visual-grid" />
            <div className="how-visual-content">
              <div className="how-step-panel">
                <div className="panel-icon material-symbols-outlined">{panel.icon}</div>
                <div className="panel-title">{panel.title}</div>
                <p className="panel-sub">{panel.sub}</p>
              </div>
              <div className="how-divider">
                <div className="how-divider-line" />
                <span className="material-symbols-outlined">arrow_downward</span>
                <div className="how-divider-line" />
              </div>
              <div className="how-step-panel" style={{ opacity: 0.55 }}>
                <div className="panel-icon material-symbols-outlined">{panel.icon2}</div>
                <div className="panel-title">{panel.title2}</div>
                <p className="panel-sub">{panel.sub2}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles">
        <div className="fade-up">
          <div className="section-eyebrow">User Roles</div>
          <h2 className="section-h2">Two roles, one system</h2>
          <p className="section-lead">
            Skora separates concerns cleanly. Principals oversee and approve; teachers focus on their class and subjects.
          </p>
        </div>
        <div className="roles-grid">
          <div className="role-card role-card-principal fade-up fade-up-delay-1">
            <div className="role-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>admin_panel_settings</span>
              Principal
            </div>
            <div className="role-title">Full Oversight,<br />Complete Control</div>
            <p className="role-desc">
              The principal is the school authority in Skora. Approve results, manage teachers, configure the school, and download all report cards.
            </p>
            <div className="role-features">
              <div className="role-feature"><div className="role-feature-dot" />Approve or reject submitted results</div>
              <div className="role-feature"><div className="role-feature-dot" />Invite and manage teachers</div>
              <div className="role-feature"><div className="role-feature-dot" />Create classes and assign subjects</div>
              <div className="role-feature"><div className="role-feature-dot" />Download all PDFs from one place</div>
              <div className="role-feature"><div className="role-feature-dot" />Configure school branding</div>
            </div>
          </div>
          <div className="role-card role-card-teacher fade-up fade-up-delay-2">
            <div className="role-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
              Teacher
            </div>
            <div className="role-title">Class-Focused,<br />Efficient Entry</div>
            <p className="role-desc">
              Teachers manage their assigned class and subjects. Enter scores, track attendance, write comments, and submit when complete.
            </p>
            <div className="role-features">
              <div className="role-feature"><div className="role-feature-dot" />Enter CA1, CA2 & Exam scores</div>
              <div className="role-feature"><div className="role-feature-dot" />Mark attendance per term</div>
              <div className="role-feature"><div className="role-feature-dot" />Rate behavioural metrics</div>
              <div className="role-feature"><div className="role-feature-dot" />Write end-of-term comments</div>
              <div className="role-feature"><div className="role-feature-dot" />Submit results for approval</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="stats">
        <div className="stats-grid">
          <div className="stat-block fade-up">
            <div className="stat-value">3<span>+</span></div>
            <div className="stat-label">Report Card Templates</div>
          </div>
          <div className="stat-block fade-up fade-up-delay-1">
            <div className="stat-value">8</div>
            <div className="stat-label">Behavioural Metrics</div>
          </div>
          <div className="stat-block fade-up fade-up-delay-2">
            <div className="stat-value">100<span>%</span></div>
            <div className="stat-label">Offline Capable</div>
          </div>
          <div className="stat-block fade-up fade-up-delay-3">
            <div className="stat-value">0<span>₦</span></div>
            <div className="stat-label">Cost to Schools</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="cta-card fade-up">
          <p className="cta-label">Ready to get started?</p>
          <h2 className="cta-h2">"Precision is the highest<br />form of professional trust."</h2>
          <p className="cta-sub">
            Join schools already managing their results the right way. It takes minutes to set up, and your first term results are waiting.
          </p>
          <div className="cta-actions">
            <button type="button" className="btn-cta-primary" onClick={openApp}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--lp-primary)" }}>rocket_launch</span>
              Open Skora RMS
            </button>
            <a href="#features" className="btn-cta-ghost" onClick={scrollToId("features")}>
              Explore features
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="footer-brand">
          <div className="footer-logo-mark">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
          </div>
          <div>
            <div className="footer-wordmark">Skora RMS</div>
            <div className="footer-tagline">Academic Ledger for Nigerian Schools</div>
          </div>
        </div>
        <ul className="footer-links">
          <li><a href="#features" onClick={scrollToId("features")}>Features</a></li>
          <li><a href="#how" onClick={scrollToId("how")}>How it works</a></li>
          <li><a href="#roles" onClick={scrollToId("roles")}>Roles</a></li>
        </ul>
        <div className="footer-copy">© {new Date().getFullYear()} Skora. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default LandingPage;
