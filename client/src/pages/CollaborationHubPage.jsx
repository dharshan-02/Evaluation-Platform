import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlinePlus, HiOutlineLogin, HiOutlineKey, HiOutlineArchive, HiOutlineClock, HiOutlineUsers } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';

const CollaborationHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({ projectName: '', topic: '', hostName: user?.name || '' });
  const [joinForm, setJoinForm] = useState({ joinCode: '', pin: '', userName: user?.name || '' });
  const [createdRoom, setCreatedRoom] = useState({ roomId: '', pin: '' });
  
  // Saved Workspaces state
  const [savedWorkspaces, setSavedWorkspaces] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  useEffect(() => {
    fetchSavedWorkspaces();
  }, []);

  const fetchSavedWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces/saved');
      setSavedWorkspaces(res.data.workspaces);
    } catch (err) {
      console.error('Failed to load saved workspaces', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!socket) {
      toast.error('Not connected to real-time server');
      return;
    }

    if (!createForm.projectName.trim() || !createForm.hostName.trim()) {
      toast.error('Project Name and Your Name are required');
      return;
    }

    socket.emit('create-adhoc-room', createForm, (response) => {
      if (response.success) {
        setCreatedRoom({ roomId: response.roomId, pin: response.pin });
        setShowCreateModal(false);
        setShowSuccessModal(true);
      } else {
        toast.error(response.message || 'Failed to create room');
      }
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const { joinCode, pin, userName } = joinForm;
    if (!joinCode.trim() || joinCode.length !== 6) {
      toast.error('Room Code must be exactly 6 characters');
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (!userName.trim()) {
      toast.error('Your Name is required');
      return;
    }

    navigate(`/collaboration/${joinCode.toUpperCase()}?pin=${pin}&name=${encodeURIComponent(userName)}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <HiOutlineUserGroup className="text-indigo-500" />
            Collaboration Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Create or join an ad-hoc workspace for real-time pair programming, video, and chat.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Room Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center text-center group cursor-pointer hover:border-indigo-500/30 transition-colors"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HiOutlinePlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Start a New Room</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 flex-1">
            Generate a secure, private room code and password to share with peers instantly.
          </p>
          <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20">
            Create Quick Room
          </button>
        </motion.div>

        {/* Join Room Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex flex-col items-center text-center group cursor-pointer hover:border-emerald-500/30 transition-colors"
          onClick={() => setShowJoinModal(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <HiOutlineLogin className="w-8 h-8 -ml-1" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Join a Room</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 flex-1">
            Enter a 6-character room code and 4-digit PIN provided by your peer to join.
          </p>
          <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20">
            Join a Room
          </button>
        </motion.div>
      </div>
      


      {/* Saved Codes Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
          <HiOutlineArchive className="text-indigo-500" />
          Saved Codes
        </h2>
        
        {loadingSaved ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : savedWorkspaces.length === 0 ? (
          <div className="glass p-8 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-center">
            <HiOutlineArchive className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-slate-500">You haven't saved any collaborative workspaces yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {savedWorkspaces.map(workspace => (
              <div key={workspace._id} className="glass p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:border-indigo-500/30 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{workspace.projectName}</h3>
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 flex items-center gap-1">
                    <HiOutlineClock /> {new Date(workspace.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{workspace.reason}</p>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <HiOutlineUsers className="text-slate-400 w-4 h-4" />
                  {workspace.teamMembers.length > 0 ? workspace.teamMembers.map((member, idx) => (
                    <span key={idx} className="text-xs font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                      {member}
                    </span>
                  )) : <span className="text-xs text-slate-400">Just you</span>}
                </div>
                <div className="flex justify-end border-t border-slate-200 dark:border-slate-700 pt-3">
                  <button className="text-sm font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                    View Files <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">{workspace.files?.length || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Ad-Hoc Room</h3>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Project Name</label>
                <input type="text" required value={createForm.projectName} onChange={e => setCreateForm({...createForm, projectName: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm" placeholder="e.g., Auth Implementation" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Topic (Optional)</label>
                <input type="text" value={createForm.topic} onChange={e => setCreateForm({...createForm, topic: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm" placeholder="e.g., Bug fixing" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Your Name</label>
                <input type="text" required value={createForm.hostName} onChange={e => setCreateForm({...createForm, hostName: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">Generate Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-center p-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlinePlus className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Room Created!</h3>
            <p className="text-slate-500 mb-6">Share these credentials securely with your peer.</p>
            
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
              <div className="mb-4">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Room Code</span>
                <span className="text-3xl font-mono font-bold text-indigo-500 tracking-widest">{createdRoom.roomId}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Room Password (PIN)</span>
                <span className="text-3xl font-mono font-bold text-emerald-500 tracking-widest">{createdRoom.pin}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate(`/collaboration/${createdRoom.roomId}?pin=${createdRoom.pin}&name=${encodeURIComponent(createForm.hostName)}`)}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              Enter Workspace Now
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Join Ad-Hoc Room</h3>
            </div>
            <form onSubmit={handleJoinSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Room Code</label>
                <input type="text" required maxLength={6} value={joinForm.joinCode} onChange={e => setJoinForm({...joinForm, joinCode: e.target.value.toUpperCase()})} className="input-field w-full px-3 py-2 rounded-xl text-sm font-mono tracking-widest uppercase font-bold" placeholder="6-CHAR CODE" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Password (4-digit PIN)</label>
                <input type="text" required maxLength={4} value={joinForm.pin} onChange={e => setJoinForm({...joinForm, pin: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm font-mono tracking-widest font-bold" placeholder="1234" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Your Name</label>
                <input type="text" required value={joinForm.userName} onChange={e => setJoinForm({...joinForm, userName: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">Join Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CollaborationHubPage;
