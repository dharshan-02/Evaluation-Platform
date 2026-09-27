import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { HiOutlinePlus, HiOutlineClipboardList, HiOutlineUser } from 'react-icons/hi';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data.projects || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const isStudent = user?.role === 'student';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse-subtle flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-text-primary)] rounded-full animate-spin"></div>
          <p className="mt-4 text-[var(--color-text-secondary)] font-medium tracking-wide">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 pb-6 border-b border-[var(--color-border)] mb-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">Capstone Projects</h1>
          <p className="text-[var(--color-text-secondary)] mt-2 font-medium">Manage academic projects and scheduled reviews</p>
        </div>
        {isStudent && (
          <button
            onClick={() => navigate('/projects/new')}
            className="btn-primary flex items-center gap-2 shadow-sm"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Create Project
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-medium shadow-xs">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border)] border-dashed">
          <HiOutlineClipboardList className="w-16 h-16 mx-auto text-[var(--color-text-muted)] mb-4" />
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">No Projects Found</h3>
          <p className="text-[var(--color-text-secondary)] font-medium mt-2">
            {isStudent ? 'Create a new project to get started.' : 'No students have assigned you as a guide yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="h-full"
            >
              <Link 
                to={`/projects/${project._id}`}
                className="relative overflow-hidden rounded-xl p-5 bg-[var(--color-bg-elevated)] group flex flex-col h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2 tracking-tight group-hover:text-indigo-500 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-6 flex-grow">
                    {project.description}
                  </p>
                  
                  <div className="space-y-4 mb-4">
                    {!isStudent ? (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <HiOutlineUser className="w-4 h-4" />
                        <span className="font-semibold text-[var(--color-text-primary)]">{project.student?.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <HiOutlineUser className="w-4 h-4" />
                        Guide: <span className="font-semibold text-[var(--color-text-primary)]">{project.guide?.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)] mt-auto">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      <div className={`w-2 h-2 rounded-full ${project.reviews?.length > 0 ? 'bg-indigo-500' : 'bg-[var(--color-text-muted)]'}`} />
                      {project.reviews?.length || 0} Reviews
                    </div>
                    <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider bg-[var(--color-bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--color-border)]">
                      {format(new Date(project.createdAt), 'MMM dd')}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
