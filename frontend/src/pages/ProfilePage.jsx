import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building2, Phone, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto mb-3 shadow-xl">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-emerald-400 font-extrabold text-3xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">{user?.name}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
        <div className="mt-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Role: {user?.role}
          </span>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-100 border-b border-slate-800 pb-2">Account Profile Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-400">Department</span>
            <div className="font-bold text-slate-200 mt-1">{user?.department || 'General'}</div>
          </div>

          <div>
            <span className="text-slate-400">Contact Phone</span>
            <div className="font-bold text-slate-200 mt-1">{user?.phone || 'Not configured'}</div>
          </div>

          <div>
            <span className="text-slate-400">Member Since</span>
            <div className="font-bold text-slate-200 mt-1">2026 Academic Term</div>
          </div>

          <div>
            <span className="text-slate-400">Authentication</span>
            <div className="font-bold text-emerald-400 mt-1">JWT Verified</div>
          </div>
        </div>
      </div>

    </div>
  );
}
