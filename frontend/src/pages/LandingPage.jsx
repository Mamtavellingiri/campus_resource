import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, BookOpen, CheckCircle, Users, ArrowRight, Leaf, QrCode, Brain, BarChart } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-slate-950" />
              </div>
              <span className="text-2xl font-bold text-slate-100">CampusHub</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="px-4 py-2 text-slate-400 hover:text-slate-100 transition-colors">Sign In</Link>
              <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-300 transition-all duration-200 shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6">
              Smart Campus
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Resource Management
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-10">
              AI-powered booking, QR check-in, and green energy analytics for Bannari Amman Institute of Technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold rounded-xl hover:from-emerald-400 hover:to-teal-300 transition-all duration-200 shadow-lg flex items-center justify-center">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/login" className="px-8 py-3 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-100 text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 text-center hover:border-emerald-500/30 transition-colors">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">AI Recommendations</h3>
              <p className="text-sm text-slate-400">Smart resource suggestions based on your needs</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 text-center hover:border-emerald-500/30 transition-colors">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">QR Check-in</h3>
              <p className="text-sm text-slate-400">Easy check-in with QR codes and auto no-show</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 text-center hover:border-emerald-500/30 transition-colors">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Green Analytics</h3>
              <p className="text-sm text-slate-400">Track energy consumption and eco scores</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 text-center hover:border-emerald-500/30 transition-colors">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Smart Analytics</h3>
              <p className="text-sm text-slate-400">Real-time insights and usage reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          © 2026 Bannari Amman Institute of Technology — Smart Campus Resource Management
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;