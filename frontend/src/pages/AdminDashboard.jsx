import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, LogOut, Calendar, CheckCircle, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const stats = [
    { label: 'Total Resources', value: '25', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Users', value: '150', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Pending Bookings', value: '5', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Active Check-ins', value: '8', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="h-6 w-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
                <p className="text-sm text-slate-400">Welcome back, {user?.name}!</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Welcome to Admin Dashboard!</h2>
          <p className="text-slate-400">You have full system access.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;