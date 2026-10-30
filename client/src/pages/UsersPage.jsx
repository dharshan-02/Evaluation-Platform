import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { 
  HiOutlineUsers,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationCircle,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineUserAdd,
  HiOutlineShieldCheck
} from 'react-icons/hi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const UsersPage = () => {
  const { user } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    department: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await api.put(`/users/${id}`, { isActive: !currentStatus });
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/users', createFormData);
      setUsers([res.data.user, ...users]);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        name: '', email: '', password: '', role: 'student', studentId: '', department: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="card-pro p-8 text-center text-rose-500 max-w-2xl mx-auto mt-10 animate-fade-in">
        <HiOutlineExclamationCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Access Restricted</h2>
        <p className="mt-2 text-rose-500/80 font-medium">Administrator privileges are required to manage users and access control lists.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-sm">
              <HiOutlineUsers className="w-6 h-6" />
            </div>
            User Directory & Access Controls
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Manage students, faculty advisors, and system administrators across the evaluation platform.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 text-xs sm:text-sm shadow-sm cursor-pointer"
        >
          <HiOutlineUserAdd className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-pro p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['all', 'student', 'faculty', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                filterRole === role
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-[var(--color-text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {role === 'all' ? `All (${users.length})` : `${role}s`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80 group">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-10 pr-4 py-2 text-xs sm:text-sm outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card-pro overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-[var(--color-text-secondary)]">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <HiOutlineUsers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">No users matched</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <th className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">User</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Department / ID</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-[var(--color-bg-hover)] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center font-bold text-xs">
                          {u.name?.substring(0, 2)?.toUpperCase() || 'UN'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--color-text-primary)]">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        u.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                        u.role === 'faculty' ? 'bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--color-text-secondary)] font-medium">
                      {u.department || 'General'} {u.studentId && `• ${u.studentId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'Recently'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleUserStatus(u._id, u.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          u.isActive 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        {u.isActive ? <HiOutlineCheckCircle className="w-3.5 h-3.5" /> : <HiOutlineXCircle className="w-3.5 h-3.5" />}
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {u._id !== user.id && (
                        <button
                          onClick={() => deleteUser(u._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[var(--color-border)]"
            >
              <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Add New Account</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Full Name</label>
                  <input 
                    type="text" required
                    value={createFormData.name} 
                    onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                    className="input-field w-full px-3.5 py-2 text-xs sm:text-sm"
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Email Address</label>
                  <input 
                    type="email" required
                    value={createFormData.email} 
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    className="input-field w-full px-3.5 py-2 text-xs sm:text-sm"
                    placeholder="jane@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Initial Password</label>
                  <input 
                    type="password" required minLength="6"
                    value={createFormData.password} 
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                    className="input-field w-full px-3.5 py-2 text-xs sm:text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Role</label>
                    <select 
                      value={createFormData.role} 
                      onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                      className="input-field w-full px-3 py-2 text-xs sm:text-sm"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Department</label>
                    <input 
                      type="text"
                      placeholder="e.g. CS"
                      value={createFormData.department} 
                      onChange={(e) => setCreateFormData({...createFormData, department: e.target.value})}
                      className="input-field w-full px-3 py-2 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {createFormData.role === 'student' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1">Student ID / Roll No</label>
                    <input 
                      type="text" required
                      placeholder="e.g. 24CS1092"
                      value={createFormData.studentId} 
                      onChange={(e) => setCreateFormData({...createFormData, studentId: e.target.value})}
                      className="input-field w-full px-3.5 py-2 text-xs sm:text-sm"
                    />
                  </div>
                )}

                <div className="pt-3 flex justify-end gap-2 border-t border-[var(--color-border)]">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)} 
                    className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating} 
                    className="btn-primary text-xs px-4 py-2 cursor-pointer disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
