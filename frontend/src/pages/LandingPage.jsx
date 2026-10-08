import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Leaf,
  QrCode,
  ShieldCheck,
  Zap,
  Calendar,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Top Banner Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Campus<span className="text-emerald-400 font-semibold">Hub</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 transition-colors">
            Sign In
          </Link>
          <Link
            to="/register"
            className="subtle-button-primary"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Smart Campus Ecosystem
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight mb-5 text-slate-100">
          Book Campus Resources. <br />
          <span className="text-emerald-400 font-semibold">
            Optimize Energy. Prevent Conflicts.
          </span>
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
          Intelligent campus resource booking with AI suitability scoring, encrypted QR check-ins with 15-minute auto-release, and Green Campus Eco energy analytics.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <Link
            to="/login"
            className="subtle-button-primary flex items-center gap-2 px-6 py-3"
          >
            Explore Platform Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="subtle-button-secondary px-6 py-3"
          >
            Create Free Account
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto text-left">
          
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1.5">1. AI Smart Recommendation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scores room capacity, facilities, time availability, and Eco ratings to suggest optimal match candidates.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-teal-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1.5">2. QR Check-In & Auto Release</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates secure digital QR passes. Releases unused rooms as NO_SHOW after 15-minute grace period expirations.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-1.5">3. Green Campus Eco Score</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tracks kWh energy load per booking, rates efficiency (0-100), and presents building energy analytics.
            </p>
          </div>

        </div>
      </section>

      {/* STATS SECTION */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-400 mb-0.5">15+</div>
            <div className="text-[11px] text-slate-400 font-medium">Campus Resources</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-teal-400 mb-0.5">94/100</div>
            <div className="text-[11px] text-slate-400 font-medium">Avg Eco Rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400 mb-0.5">18.4%</div>
            <div className="text-[11px] text-slate-400 font-medium">Energy Saved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 mb-0.5">100%</div>
            <div className="text-[11px] text-slate-400 font-medium">Double-Booking Guard</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-xs text-slate-500 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 Campus Resource Booking & Management System.</p>
        </div>
      </footer>

    </div>
  );
}
