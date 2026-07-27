import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  CheckCircle,
  FileText,
  BarChart,
  UserCheck,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "What is FormCraft?",
      a: "FormCraft is a low-code enterprise smart-form builder. You can build advanced surveys, feedback sheets, or contact forms with full server-side validations, conditional logic flows, and live analytics dashboards without coding.",
    },
    {
      q: "Can I use conditional show/hide rules?",
      a: "Yes! FormCraft features a full-featured visual Rule Builder where you can create complex logic (e.g., show field B only if dropdown A equals 'yes'). These rules are enforced live in the browser and verified on the server for security.",
    },
    {
      q: "Is there file upload support?",
      a: "Absolutely. You can add File Upload fields to your forms, define type/size constraints, and respondents can upload files directly with live progress feedback. All files are securely kept with access protection.",
    },
    {
      q: "How does versioning work?",
      a: "When you publish a form, a version snapshot is frozen. If you make edits later, they save as drafts. Once published again, a new version is created. Historical submissions remain tied to the specific version they were submitted under.",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-brand-500/30 selection:text-brand-300">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-surface-950/70 border-b border-surface-900 px-6 py-4 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-100 tracking-tight leading-none block">
                FormCraft
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">
                SaaS Form Engine
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-colors">
              Features
            </a>
            <a href="#why-choose" className="hover:text-slate-200 transition-colors">
              Why Choose Us
            </a>
            <a href="#pricing" className="hover:text-slate-200 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-200 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-slate-100 px-3 py-1.5 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white px-4 py-2 rounded-lg shadow-glow hover:shadow-glow-hover transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="relative z-10 space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-400 uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Milestone 2 Active Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-400">
            Build Smart Forms. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-violet-400">
              Collect Validated Data.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Design dynamic forms with complex conditional rules, advanced server-side
            validations, secure file uploads, and historical version snapshots—all in a unified multi-user space.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200 group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-surface-850 hover:bg-surface-900 text-slate-300 font-semibold transition-all duration-200"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ── Statistics Section ─────────────────────────────────────────── */}
      <section className="border-y border-surface-900 bg-surface-950/40 relative z-10 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              100%
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">
              No-Code Setup
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              &lt; 2s
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">
              Instant Validation
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              11
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">
              Field Types Supported
            </p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
              Zero
            </p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">
              Data Mismatch
            </p>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
            Powering Secure & Structured Data Collection
          </h2>
          <p className="text-slate-400">
            A robust backend engineered with FastAPI and PostgreSQL, combined with a highly responsive, modern React admin dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-surface-900/40 border border-surface-850 space-y-4 hover:border-brand-500/20 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Rule Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Define conditional actions (show, hide, require, or disable) based on triggers. The server filters matching values automatically during response submission.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-900/40 border border-surface-850 space-y-4 hover:border-brand-500/20 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Validation Service</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enforce constraints directly in database schemas: limit string lengths, restrict date ranges, validate emails, checkboxes, or options list.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-900/40 border border-surface-850 space-y-4 hover:border-brand-500/20 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Versioning Snapshot</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Lock form versions to protect historical data integrity. New drafts let you publish schemas safely without losing original responses.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ──────────────────────────────────────────────── */}
      <section id="why-choose" className="bg-surface-900/20 border-y border-surface-900 px-6 py-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
              Why Teams Choose FormCraft
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Traditional forms break easily when requirements shift, leading to bad data submissions and broken databases. FormCraft enforces rules on the database and code boundaries for 100% confidence.
            </p>
            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
                Atomic, clean single-transaction PostgreSQL saves
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
                Idempotency token headers prevent duplicate submit records
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
                Secure local storage file uploads with path-traversal blocks
              </li>
            </ul>
          </div>

          <div className="relative group rounded-2xl border border-surface-850 bg-surface-950 overflow-hidden shadow-2xl">
            {/* Visual illustration of database schema relations */}
            <div className="p-8 space-y-6 font-mono text-xs text-slate-500">
              <div className="flex items-center justify-between border-b border-surface-850 pb-3">
                <span className="text-brand-400 font-semibold uppercase">ORM DATABASE SHEETS</span>
                <span className="text-[10px] bg-surface-850 px-2 py-0.5 rounded text-slate-400">ACTIVE</span>
              </div>
              <div className="space-y-4">
                <div className="p-3.5 rounded bg-surface-900/50 border border-surface-850">
                  <span className="text-violet-400 block font-bold">table conditional_rules</span>
                  <span className="block mt-1">id: UUID PRIMARY_KEY</span>
                  <span className="block">source_field_id: UUID FK</span>
                  <span className="block text-slate-400">operator: String("equals", "greater_than")</span>
                  <span className="block text-slate-400">action: String("show", "require", "hide")</span>
                </div>
                <div className="p-3.5 rounded bg-surface-900/50 border border-surface-850">
                  <span className="text-emerald-400 block font-bold">table submissions</span>
                  <span className="block mt-1">id: UUID PRIMARY_KEY</span>
                  <span className="block">session_id: String(255)</span>
                  <span className="block text-slate-400">completion_time_seconds: Integer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials (Dummy) ───────────────────────────────────────── */}
      <section className="px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Trusted by Builders & Researchers
          </h2>
          <p className="text-slate-400">
            Hear from managers utilizing our schemas to accelerate operational forms.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-surface-900/30 border border-surface-850 space-y-4">
            <p className="text-slate-300 italic leading-relaxed text-sm">
              "We migrated all user survey modules to FormCraft's dynamic backend and immediately cut down dev setup times by 90%. Being able to version publish schemas is massive."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
                SC
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Sarah Connor</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Product Lead, Cyberdyne Systems
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-surface-900/30 border border-surface-850 space-y-4">
            <p className="text-slate-300 italic leading-relaxed text-sm">
              "The server-side hidden response stripping and dynamic validation ensure we never end up with corrupted submissions. FormCraft is incredibly stable."
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
                MK
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">Marcus Wright</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Lead QA Engineer, Resistance HQ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400">
            Everything you need to know about the platform rules and setup.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-surface-850 bg-surface-900/10 rounded-xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-semibold text-slate-200 hover:text-slate-100 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    activeFaq === idx ? "rotate-180 text-brand-400" : ""
                  }`}
                />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out ${
                  activeFaq === idx ? "max-h-40 border-t border-surface-850/50" : "max-h-0 overflow-hidden"
                }`}
              >
                <p className="px-6 py-4 text-sm text-slate-400 leading-relaxed bg-surface-950/20">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-surface-900 bg-surface-950 px-6 py-12 text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-brand-500" />
            <span className="font-bold text-slate-300">FormCraft</span>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} FormCraft Team. All rights reserved. Springboard Internship Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
