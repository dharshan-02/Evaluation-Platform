import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineUserGroup, 
  HiOutlinePlus, 
  HiOutlineLogin, 
  HiOutlineKey, 
  HiOutlineArchive, 
  HiOutlineClock, 
  HiOutlineUsers,
  HiOutlineClipboardCopy,
  HiOutlineX,
  HiOutlineTerminal,
  HiOutlineVideoCamera
} from 'react-icons/hi';
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
      setSavedWorkspaces(res.data.workspaces || []);
    } catch (err) {
      console.error('Failed to load saved workspaces', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!socket) {
      toast.error('Real-time socket server is still connecting. Please wait a moment.');
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

  const copyRoomInvite = () => {
    const inviteText = `Join my pair programming session on D's Evaluation Hub!\nRoom Code: ${createdRoom.roomId}\nPIN: ${createdRoom.pin}`;
    navigator.clipboard.writeText(inviteText);
    toast.success('Room credentials copied to clipboard!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center shadow-sm">
              <HiOutlineUserGroup className="w-6 h-6" />
            </div>
            Real-Time Collaboration Hub
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)] mt-2">
            Ad-hoc collaborative IDE rooms with Monaco editor syncing, multi-peer WebRTC video/audio, live chat, and isolated code execution.
          </p>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Room Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="card-pro p-8 flex flex-col items-center text-center group cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-xs">
            <HiOutlinePlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">Start a Collaboration Room</h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-6 flex-1 leading-relaxed">
            Generate a secure 6-character room code and 4-digit PIN to pair program and debug code in real time with classmates.
          </p>
          <button className="btn-primary w-full py-3 text-xs sm:text-sm font-bold shadow-sm cursor-pointer">
            Create Instant Room
          </button>
        </motion.div>

        {/* Join Room Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="card-pro p-8 flex flex-col items-center text-center group cursor-pointer"
          onClick={() => setShowJoinModal(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-xs">
            <HiOutlineLogin className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">Join an Existing Room</h3>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-6 flex-1 leading-relaxed">
            Enter the 6-character room code and 4-digit security PIN provided by your peer to connect instantly to their IDE session.
          </p>
          <button className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer">
            Join Room Session
          </button>
        </motion.div>
      </div>

      {/* Saved Workspaces Section */}
      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2 tracking-tight">
          <HiOutlineArchive className="text-blue-500 w-5 h-5" />
          Archived Collaborative Workspaces
        </h2>
        
        {loadingSaved ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : savedWorkspaces.length === 0 ? (
          <div className="card-pro p-10 text-center">
            <HiOutlineArchive className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No archived workspaces found.</p>
            <p className="text-xs text-slate-400 mt-1">When in a collaboration room, click "Save Workspace" to archive multi-file snapshots.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {savedWorkspaces.map(workspace => (
              <div key={workspace._id} className="card-pro p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] truncate pr-2">{workspace.projectName}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 shrink-0 flex items-center gap-1">
                    <HiOutlineClock className="w-3.5 h-3.5" /> {new Date(workspace.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3 line-clamp-2">{workspace.reason || 'Team Pair Programming Session'}</p>
                <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                  <HiOutlineUsers className="text-slate-400 w-3.5 h-3.5" />
                  {workspace.teamMembers?.length > 0 ? workspace.teamMembers.map((member, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-300 rounded border border-blue-200 dark:border-blue-800">
                      {member}
                    </span>
                  )) : <span className="text-[11px] text-slate-400">Solo workspace</span>}
                </div>
                <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3 text-xs">
                  <span className="text-slate-400 font-medium">Files: <strong className="text-[var(--color-text-primary)]">{workspace.files?.length || 0}</strong></span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-sky-400">Snapshot Preserved</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
            >
              <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Start Collaboration Room</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--color-text-secondary)]">Project Name</label>
                  <input 
                    type="text" 
                    required 
                    value={createForm.projectName} 
                    onChange={e => setCreateForm({...createForm, projectName: e.target.value})} 
                    className="input-field w-full px-3.5 py-2.5 text-xs sm:text-sm" 
                    placeholder="e.g. Binary Search Tree Implementation" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--color-text-secondary)]">Topic / Note (Optional)</label>
                  <input 
                    type="text" 
                    value={createForm.topic} 
                    onChange={e => setCreateForm({...createForm, topic: e.target.value})} 
                    className="input-field w-full px-3.5 py-2.5 text-xs sm:text-sm" 
                    placeholder="e.g. Unit tests debugging" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--color-text-secondary)]">Host Display Name</label>
                  <input 
                    type="text" 
                    required 
                    value={createForm.hostName} 
                    onChange={e => setCreateForm({...createForm, hostName: e.target.value})} 
                    className="input-field w-full px-3.5 py-2.5 text-xs sm:text-sm" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)} 
                    className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary text-xs px-4 py-2 cursor-pointer"
                  >
                    Generate Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS CREATED MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-[var(--color-border)] p-6 text-center space-y-5"
            >
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <HiOutlineTerminal className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--color-text-primary)] tracking-tight">Room Successfully Created!</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Share these access credentials with your teammate to join.</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 text-left border border-[var(--color-border)] space-y-3">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Room Code</span>
                  <span className="text-2xl font-mono font-black text-blue-600 dark:text-sky-400 tracking-widest">{createdRoom.roomId}</span>
                </div>
                <div className="border-t border-[var(--color-border)] pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Security PIN</span>
                  <span className="text-2xl font-mono font-black text-emerald-500 tracking-widest">{createdRoom.pin}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyRoomInvite}
                  className="btn-secondary flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HiOutlineClipboardCopy className="w-4 h-4" />
                  Copy Invite
                </button>
                <button 
                  onClick={() => navigate(`/collaboration/${createdRoom.roomId}?pin=${createdRoom.pin}&name=${encodeURIComponent(createForm.hostName)}`)}
                  className="btn-primary flex-1 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Enter Workspace
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN MODAL */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
            >
              <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Join Collaboration Room</h3>
                <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleJoinSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--color-text-secondary)]">Room Code</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={6} 
                    value={joinForm.joinCode} 
                    onChange={e => setJoinForm({...joinForm, joinCode: e.target.value.toUpperCase()})} 
                    className="input-field w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono tracking-widest uppercase font-bold" 
                    placeholder="e.g. A9B2C4" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--color-text-secondary)]">Security PIN (4 digits)</label>
                  <input 
                    type="text" 
                    required 
                    maxLength={4} 
                    value={joinForm.pin} 
                    onChange={e => setJoinForm({...joinForm, pin: e.target.value})} 
                    className="input-field w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono tracking-widest font-bold" 
                    placeholder="1234" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-[var(--color-text-secondary)]">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={joinForm.userName} 
                    onChange={e => setJoinForm({...joinForm, userName: e.target.value})} 
                    className="input-field w-full px-3.5 py-2.5 text-xs sm:text-sm" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                  <button 
                    type="button" 
                    onClick={() => setShowJoinModal(false)} 
                    className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary text-xs px-4 py-2 cursor-pointer"
                  >
                    Connect
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

export default CollaborationHubPage;
