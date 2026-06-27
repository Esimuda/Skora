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
    title: "School & Class Setup",
    sub: "Principal registers the school, creates classes, and invites teachers by email. One-time setup — takes five minutes.",
    icon2: "manage_accounts",
    title2: "Teachers Onboarded",
    sub2: "Each teacher receives an email invite, sets up their account, and is assigned to their class immediately.",
  },
  {
    icon: "edit_note",
    title: "Score Entry Open",
    sub: "Teachers enter CA1, CA2 & Exam scores for each student per subject. Totals, grades, and class positions computed instantly.",
    icon2: "calculate",
    title2: "Auto-Calculated",
    sub2: "Positions, percentages, and grade remarks are updated in real-time as teachers type. No manual calculation needed.",
  },
  {
    icon: "send",
    title: "Results Submitted",
    sub: "Teacher submits their class results for principal review. Principal receives a notification to review entries.",
    icon2: "verified",
    title2: "Principal Approves",
    sub2: "Principal reviews, writes comments, and approves. Results are locked and ready for distribution.",
  },
  {
    icon: "style",
    title: "Scratch Cards Issued",
    sub: "School purchases a batch of scratch cards from Skora. Parents buy cards from the school bursar to access results.",
    icon2: "phone_iphone",
    title2: "Parents Check Online",
    sub2: "Parent visits the Skora portal, scratches the card, enters the PIN, and views their child's result sheet instantly.",
  },
  {
    icon: "sim_card_download",
    title: "Physical Reports (Optional)",
    sub: "School pays to unlock ZIP download for a class or the entire school — one PDF per student, ready to print.",
    icon2: "print",
    title2: "Printed & Distributed",
    sub2: "Principal prints result sheets and distributes on closing day. Both channels can run simultaneously.",
  },
];

const STEP_TITLES = [
  {
    title: "School & Class Setup",
    desc: "Principal registers the school, creates classes, and invites teachers by email. One-time setup — takes five minutes.",
  },
  {
    title: "Teachers Enter Scores",
    desc: "Each teacher logs into their class, enters CA1, CA2, and exam scores per subject. The system validates, totals, and ranks automatically.",
  },
  {
    title: "Submit & Approve",
    desc: "Teachers submit for review. Principals approve, comment, or request corrections — giving full audit control over every result.",
  },
  {
    title: "Scratch Cards for Parents",
    desc: "School purchases scratch card batches from Skora and sells them to parents. Parents use the PIN to view results online via the Skora Parent Portal.",
  },
  {
    title: "Physical Reports (Optional)",
    desc: "Schools that prefer to print and distribute physically can unlock ZIP downloads — a PDF per student, per class or whole school — paid once per term.",
  },
];

const MARQUEE_ITEMS = [
  { icon: "style", label: "Scratch Card Revenue" },
  { icon: "phone_iphone", label: "Parent Portal Access" },
  { icon: "sim_card_download", label: "ZIP Physical Reports" },
  { icon: "psychology", label: "Psychometric Assessment" },
  { icon: "approval", label: "Principal Approvals" },
  { icon: "leaderboard", label: "Position Ranking" },
  { icon: "picture_as_pdf", label: "3 Report Templates" },
  { icon: "checklist", label: "Attendance Tracking" },
  { icon: "groups", label: "Multi-class Management" },
  { icon: "grade", label: "Nigerian Grading (A–F)" },
];

export function LandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            <a href="/login" className="nav-cta" onClick={(e) => { e.preventDefault(); openApp(); }}>
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
            Results Management<br />
            <span className="accent-line">Schools Can Earn From</span>
          </h1>
          <p className="hero-sub">
            Skora RMS handles your entire result workflow — from CA entry to parent delivery. Schools generate revenue by selling scratch card access to parents, or distribute printed PDFs with a single download.
          </p>
          <div className="hero-actions">
            <button type="button" className="lp-btn-primary" onClick={openApp}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
              Open Skora RMS
            </button>
            <a href="#how" className="lp-btn-ghost" onClick={scrollToId("how")}>
              See how it works
            </a>
          </div>
          <div className="hero-trust">
            <div className="trust-item">
              <span className="material-symbols-outlined trust-icon">style</span>
              <span>Schools earn from scratch cards</span>
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="material-symbols-outlined trust-icon">phone_iphone</span>
              <span>Parents check results online</span>
            </div>
            <div className="trust-sep" />
            <div className="trust-item">
              <span className="material-symbols-outlined trust-icon">sim_card_download</span>
              <span>Physical ZIP reports available</span>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-card-stack">
            <div className="hero-card hero-card-back">
              <div className="hc-label">JSS 2A · First Term 2024/25</div>
              <div className="hc-student">Okonkwo, Chukwuemeka</div>
              <div className="hc-score-row">
                <span className="hc-score">87.4%</span>
                <span className="hc-pos">1st Position</span>
              </div>
            </div>
            <div className="hero-card hero-card-front">
              <div className="hc-chip">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>style</span>
                Scratch Card Sold
              </div>
              <div className="hc-label">Parent Portal Access</div>
              <div className="hc-student">PIN: ● ● ● ● ● ●</div>
              <div className="hc-row">
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--lp-accent)" }}>check_circle</span>
                <span style={{ fontSize: 12 }}>3 of 5 views remaining</span>
              </div>
              <div className="hc-row" style={{ marginTop: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--lp-accent)" }}>phone_iphone</span>
                <span style={{ fontSize: 12 }}>Viewed on mobile · 2h ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div className="marquee-item" key={i}>
              <span className="material-symbols-outlined marquee-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="fade-up">
          <div className="section-eyebrow">Features</div>
          <h2 className="section-h2">Everything your school needs,<br />nothing it doesn't</h2>
          <p className="section-lead">Built specifically for the Nigerian school calendar, grading system, and result distribution culture.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card fade-up">
            <div className="feature-icon icon-primary">
              <span className="material-symbols-outlined">style</span>
            </div>
            <div className="feature-title">Scratch Card Revenue Model</div>
            <p className="feature-desc">
              Schools purchase batches of scratch cards from Skora and sell them to parents at a markup. Parents use the PIN to access their child's results online via the Skora Parent Portal — a revenue stream built into the product.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-1">
            <div className="feature-icon icon-accent">
              <span className="material-symbols-outlined">phone_iphone</span>
            </div>
            <div className="feature-title">Parent Portal</div>
            <p className="feature-desc">
              Parents visit the Skora portal, enter their scratch card PIN, and view their child's full result sheet — with grades, position, teacher comments, and behavioural ratings. Up to 5 views per card.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-2">
            <div className="feature-icon icon-blue">
              <span className="material-symbols-outlined">sim_card_download</span>
            </div>
            <div className="feature-title">Physical ZIP Downloads</div>
            <p className="feature-desc">
              Schools that prefer physical distribution pay once per term to unlock ZIP downloads — one clean PDF per student, per class or whole school. Re-download as many times as needed. Both channels can run side by side.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-3">
            <div className="feature-icon icon-green">
              <span className="material-symbols-outlined">picture_as_pdf</span>
            </div>
            <div className="feature-title">3 Report Card Templates</div>
            <p className="feature-desc">
              Classic, Modern, and Hybrid layouts — each displaying the principal's and teacher's name, student grades, position, psychometric scores, attendance, and comments. Fully branded with the school's name.
            </p>
          </div>
          <div className="feature-card fade-up">
            <div className="feature-icon icon-amber">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div className="feature-title">Principal Approval Workflow</div>
            <p className="feature-desc">
              Teachers submit results for review. Principals approve, reject with comments, or request revisions — full audit control over every result before anything is distributed to parents.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-1">
            <div className="feature-icon icon-green">
              <span className="material-symbols-outlined">how_to_reg</span>
            </div>
            <div className="feature-title">Attendance Tracking</div>
            <p className="feature-desc">
              Mark attendance per class per term. Cumulative school days tracked automatically and printed directly on each student's result sheet.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-2">
            <div className="feature-icon icon-blue">
              <span className="material-symbols-outlined">psychology</span>
            </div>
            <div className="feature-title">Psychometric Assessments</div>
            <p className="feature-desc">
              8 behavioural and cognitive metrics scored per student. Affective and psychomotor domains evaluated with a clean, fast input interface for teachers — appears on every result sheet.
            </p>
          </div>
          <div className="feature-card fade-up fade-up-delay-3">
            <div className="feature-icon icon-amber">
              <span className="material-symbols-outlined">qr_code_scanner</span>
            </div>
            <div className="feature-title">Card Usage Tracker</div>
            <p className="feature-desc">
              Principals can see exactly which scratch cards have been used, which parent used them, how many of their 5 views remain, and when they last accessed results — all from the Online Reports tab.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <div className="fade-up">
          <div className="section-eyebrow">Workflow</div>
          <h2 className="section-h2">From score entry to<br />parent's hands</h2>
          <p className="section-lead">Skora guides your school through a structured, repeatable process every term — with two distribution channels built in.</p>
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
          <h2 className="section-h2">Three roles, one system</h2>
          <p className="section-lead">
            Skora separates concerns cleanly. Principals oversee and distribute; teachers manage their class; parents access results on demand.
          </p>
        </div>
        <div className="roles-grid">
          <div className="role-card role-card-principal fade-up fade-up-delay-1">
            <div className="role-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>admin_panel_settings</span>
              Principal
            </div>
            <div className="role-title">Full Oversight,<br />Two Revenue Channels</div>
            <p className="role-desc">
              The principal is the school authority in Skora. Approve results, issue scratch cards to parents, download physical ZIP reports, and track which cards have been used.
            </p>
            <div className="role-features">
              <div className="role-feature"><div className="role-feature-dot" />Approve or reject submitted results</div>
              <div className="role-feature"><div className="role-feature-dot" />Request and manage scratch card batches</div>
              <div className="role-feature"><div className="role-feature-dot" />Track card usage per student</div>
              <div className="role-feature"><div className="role-feature-dot" />Unlock and download ZIP physical reports</div>
              <div className="role-feature"><div className="role-feature-dot" />Invite teachers and configure school branding</div>
            </div>
          </div>
          <div className="role-card role-card-teacher fade-up fade-up-delay-2">
            <div className="role-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
              Teacher
            </div>
            <div className="role-title">Class-Focused,<br />Efficient Entry</div>
            <p className="role-desc">
              Teachers manage their assigned class. Enter scores, track attendance, write comments, fill psychometric assessments, and submit for approval.
            </p>
            <div className="role-features">
              <div className="role-feature"><div className="role-feature-dot" />Enter CA1, CA2 & Exam scores</div>
              <div className="role-feature"><div className="role-feature-dot" />Mark attendance per term</div>
              <div className="role-feature"><div className="role-feature-dot" />Rate 8 behavioural metrics per student</div>
              <div className="role-feature"><div className="role-feature-dot" />Write end-of-term comments</div>
              <div className="role-feature"><div className="role-feature-dot" />Submit results for principal approval</div>
            </div>
          </div>
          <div className="role-card role-card-teacher fade-up fade-up-delay-3">
            <div className="role-badge">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>phone_iphone</span>
              Parent
            </div>
            <div className="role-title">On-Demand Access,<br />No App Needed</div>
            <p className="role-desc">
              Parents buy a scratch card from the school bursar, visit the Skora Parent Portal on any device, enter their PIN, and view their child's full result sheet instantly.
            </p>
            <div className="role-features">
              <div className="role-feature"><div className="role-feature-dot" />Access results from any phone or browser</div>
              <div className="role-feature"><div className="role-feature-dot" />Up to 5 views per card</div>
              <div className="role-feature"><div className="role-feature-dot" />See grades, position, and teacher comments</div>
              <div className="role-feature"><div className="role-feature-dot" />Psychometric and attendance data included</div>
              <div className="role-feature"><div className="role-feature-dot" />No account or download required</div>
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
            <div className="stat-value">5</div>
            <div className="stat-label">Views Per Scratch Card</div>
          </div>
          <div className="stat-block fade-up fade-up-delay-2">
            <div className="stat-value">2</div>
            <div className="stat-label">Distribution Channels</div>
          </div>
          <div className="stat-block fade-up fade-up-delay-3">
            <div className="stat-value">8</div>
            <div className="stat-label">Behavioural Metrics</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta">
        <div className="cta-card fade-up">
          <p className="cta-label">Ready to get started?</p>
          <h2 className="cta-h2">Your school should earn<br />from its own results.</h2>
          <p className="cta-sub">
            Register your school, invite your teachers, and run your first term on Skora. Scratch cards sell themselves — parents already expect to pay to access results.
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
