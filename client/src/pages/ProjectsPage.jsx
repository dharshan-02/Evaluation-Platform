import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { HiOutlinePlus, HiOutlineClipboardList, HiOutlineUser } from 'react-icons/hi';
import { format } from 'date-fns';

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
      <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
            <HiOutlineClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Capstone Projects</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage academic projects and scheduled reviews</p>
          </div>
        </div>
        {isStudent && (
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Create Project
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-xl font-medium">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <HiOutlineClipboardList className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Projects Found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isStudent ? 'Create a new project to get started.' : 'No students have assigned you as a guide yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link 
              key={project._id}
              to={`/projects/${project._id}`}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all group"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors mb-2">
                {project.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {project.description}
              </p>
              
              <div className="space-y-2 mb-4">
                {!isStudent ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <HiOutlineUser className="w-4 h-4" />
                    Student: <span className="font-semibold text-slate-900 dark:text-slate-200">{project.student?.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <HiOutlineUser className="w-4 h-4" />
                    Guide: <span className="font-semibold text-slate-900 dark:text-slate-200">{project.guide?.name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {project.reviews?.length || 0} Reviews Scheduled
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                  Created {format(new Date(project.createdAt), 'MMM dd')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
