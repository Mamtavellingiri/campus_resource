import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, UserPlus, GraduationCap, Briefcase, CheckCircle2, AlertCircle, Trash2, ArrowRightLeft } from 'lucide-react';

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export default function AdminUserMgmtPage() {
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [mappingForm, setMappingForm] = useState({ facultyId: '', studentId: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    department: 'Computer Science',
    phone: '',
    year: '1st Year',
    section: 'A',
    subjectIds: [],
    enrolledSubjectIds: [],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [subjectsRes, usersRes, mappingsRes] = await Promise.all([
          api.get('/admin/subjects'),
          api.get('/admin/users'),
          api.get('/admin/faculty-student-map')
        ]);
        if (subjectsRes.data.success) setSubjects(subjectsRes.data.subjects || []);
        if (usersRes.data.success) setUsers(usersRes.data.users || []);
        if (mappingsRes.data.success) setMappings(mappingsRes.data.mappings || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data.');
      }
    };

    fetchAdminData();
  }, []);

  const refreshMappings = async () => {
    const [usersRes, mappingsRes] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/faculty-student-map')
    ]);
    setUsers(usersRes.data.users || []);
    setMappings(mappingsRes.data.mappings || []);
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.put('/admin/faculty-student-map', mappingForm);
      setMessage('Faculty-student mapping saved.');
      await refreshMappings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save faculty-student mapping.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMapping = async (studentId) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await api.delete(`/admin/faculty-student-map/${studentId}`);
      setMessage('Faculty-student mapping removed.');
      await refreshMappings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove faculty-student mapping.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subjectId) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
      enrolledSubjectIds: prev.role === 'STUDENT'
        ? (prev.enrolledSubjectIds.includes(subjectId)
          ? prev.enrolledSubjectIds.filter((id) => id !== subjectId)
          : [...prev.enrolledSubjectIds, subjectId])
        : prev.enrolledSubjectIds
    }));
  };

  const toggleYear = (yearValue) => {
    setForm((prev) => ({
      ...prev,
      years: prev.years.includes(yearValue)
        ? prev.years.filter((item) => item !== yearValue)
        : [...prev.years, yearValue]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...form,
        role: form.role,
        subjectIds: form.role === 'FACULTY' ? form.subjectIds : [],
        years: form.role === 'FACULTY' ? form.years : [],
        enrolledSubjectIds: form.role === 'STUDENT' ? form.enrolledSubjectIds : []
      };

      const res = await api.post('/admin/users', payload);
      if (res.data.success) {
        setMessage(`${form.role === 'FACULTY' ? 'Teacher' : 'Student'} created successfully.`);
        setForm({
          name: '',
          email: '',
          password: '',
          role: 'STUDENT',
          department: 'Computer Science',
          phone: '',
          year: '1st Year',
          section: 'A',
          subjectIds: [],
          enrolledSubjectIds: [],
          years: ['1st Year', '2nd Year', '3rd Year', '4th Year']
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
          <Users className="w-4 h-4" /> Admin User Management
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">Add Teachers & Students</h1>
        <p className="text-xs text-slate-400 mt-1">Create accounts manually and assign teacher subjects by year.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <section className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            Faculty ↔ Student Mapping
          </h2>
          <p className="text-xs text-slate-400 mt-1">Each student is assigned to one faculty member and sees only that faculty member&apos;s approved classes.</p>
        </div>

        <form onSubmit={handleMappingSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <label className="block text-xs font-semibold text-slate-300">
            Faculty
            <select
              required
              value={mappingForm.facultyId}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, facultyId: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="">Select faculty</option>
              {users.filter((item) => item.role === 'FACULTY').map((faculty) => (
                <option key={faculty.id} value={faculty.id}>{faculty.name} · {faculty.department || 'No department'}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-300">
            Student
            <select
              required
              value={mappingForm.studentId}
              onChange={(e) => setMappingForm((prev) => ({ ...prev, studentId: e.target.value }))}
              className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="">Select student</option>
              {users.filter((item) => item.role === 'STUDENT').map((student) => (
                <option key={student.id} value={student.id}>{student.name} · {student.year || 'Year not set'}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Assign'}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 pr-4 font-semibold">Faculty</th>
                <th className="py-3 pr-4 font-semibold">Student</th>
                <th className="py-3 text-right font-semibold">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {mappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="py-3 pr-4 text-slate-200">{mapping.faculty.name} <span className="text-slate-500">· {mapping.faculty.department}</span></td>
                  <td className="py-3 pr-4 text-slate-200">{mapping.student.name} <span className="text-slate-500">· {mapping.student.year}</span></td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleRemoveMapping(mapping.studentId)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
              {mappings.length === 0 && (
                <tr><td colSpan="3" className="py-5 text-center text-slate-500">No faculty-student mappings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              placeholder="name@campus.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            >
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Teacher</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
            <input
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              placeholder="Computer Science"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              placeholder="+1 555 000 0000"
            />
          </div>
        </div>

        {form.role === 'STUDENT' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
                <select
                  value={form.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  {years.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                <input
                  value={form.section}
                  onChange={(e) => handleChange('section', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  placeholder="A"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" /> Enrolled Subjects
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjects.map((subject) => (
                  <button
                    type="button"
                    key={subject.id}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        enrolledSubjectIds: prev.enrolledSubjectIds.includes(subject.id)
                          ? prev.enrolledSubjectIds.filter((id) => id !== subject.id)
                          : [...prev.enrolledSubjectIds, subject.id]
                      }));
                    }}
                    className={`text-left px-3 py-2 rounded-xl border text-xs ${
                      form.enrolledSubjectIds.includes(subject.id)
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {form.role === 'FACULTY' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-400" /> Teacher Subjects
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjects.map((subject) => (
                  <button
                    type="button"
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`text-left px-3 py-2 rounded-xl border text-xs ${
                      form.subjectIds.includes(subject.id)
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" /> Applicable Years
              </label>
              <div className="flex flex-wrap gap-2">
                {years.map((yearValue) => (
                  <button
                    type="button"
                    key={yearValue}
                    onClick={() => toggleYear(yearValue)}
                    className={`px-3 py-2 rounded-xl border text-[11px] ${
                      form.years.includes(yearValue)
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    {yearValue}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs"
        >
          <span className="flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating...' : `Add ${form.role === 'FACULTY' ? 'Teacher' : 'Student'}`}
          </span>
        </button>
      </form>
    </div>
  );
}
