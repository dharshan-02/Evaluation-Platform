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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">Create Capstone Project</h1>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium shadow-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-8 space-y-6 animate-slide-up">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-4 tracking-tight">
            Project Details
          </h2>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Project Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input-field w-full px-4 py-2.5 outline-none"
              placeholder="e.g. AI-based Medical Diagnosis System"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Description <span className="text-rose-500">*</span></label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field w-full px-4 py-3 outline-none resize-y"
              placeholder="Brief overview of the project objectives..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)] flex items-center gap-2">
                <HiOutlineUser className="w-4 h-4" /> Select Faculty Guide <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.guideId}
                onChange={(e) => setFormData({...formData, guideId: e.target.value})}
                className="input-field w-full px-4 py-2.5 outline-none"
              >
                <option value="">-- Choose Guide --</option>
                {faculty.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">GitHub Repository URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                className="input-field w-full px-4 py-2.5 outline-none"
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-[var(--color-text-secondary)]">Source (e.g. Existing codebase, research paper)</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                className="input-field w-full px-4 py-2.5 outline-none"
                placeholder="Reference source or codebase"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 shadow-md disabled:opacity-70"
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
