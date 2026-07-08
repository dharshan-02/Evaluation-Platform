import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { HiOutlineSave, HiOutlineUser } from 'react-icons/hi';

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [faculty, setFaculty] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    guideId: '',
    githubUrl: '',
    source: ''
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        const users = res.data.users || [];
        setFaculty(users.filter(u => u.role === 'faculty' || u.role === 'admin'));
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/projects', formData);
      navigate('/projects');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Capstone Project</h1>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-3 mb-4">
            Project Details
          </h2>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Project Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              placeholder="e.g. AI-based Medical Diagnosis System"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Description <span className="text-rose-500">*</span></label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-y"
              placeholder="Brief overview of the project objectives..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <HiOutlineUser className="w-4 h-4" /> Select Faculty Guide <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.guideId}
                onChange={(e) => setFormData({...formData, guideId: e.target.value})}
                className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none bg-white dark:bg-slate-900"
              >
                <option value="">-- Choose Guide --</option>
                {faculty.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">GitHub Repository URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Source (e.g. Existing codebase, research paper)</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="input-field w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                placeholder="Reference source or codebase"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-70"
            style={{ background: 'var(--gradient-brand)', boxShadow: 'var(--shadow-md)' }}
          >
            {loading ? 'Creating...' : 'Create Project'}
            {!loading && <HiOutlineSave className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
