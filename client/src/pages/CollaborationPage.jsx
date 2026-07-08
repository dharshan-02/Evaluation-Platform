import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../lib/api';
import AITutorWidget from '../components/AITutorWidget';
import ReactMarkdown from 'react-markdown';
import {
  HiOutlineSparkles,
  HiOutlineFolder,
  HiOutlineDocumentAdd,
  HiOutlineDownload,
  HiOutlineDocument,
  HiOutlineSearch,
  HiOutlineArrowsExpand,
  HiOutlineMenuAlt3,
  HiOutlineArrowLeft,
  HiOutlineVideoCamera,
  HiOutlineUsers,
  HiOutlineSave,
  HiOutlineX,
  HiOutlineMicrophone,
  HiOutlinePhoneMissedCall,
  HiOutlineChatAlt,
  HiOutlinePaperAirplane,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineMoon,
  HiOutlineCheckCircle,
  HiOutlineFolderAdd,
  HiOutlineDotsVertical,
  HiOutlinePlay,
  HiOutlineViewBoards,
  HiOutlineTerminal,
  HiOutlineRefresh
} from 'react-icons/hi';

import {
  VscFiles,
  VscSearch,
  VscSourceControl,
  VscDebugAlt,
  VscExtensions,
  VscSettingsGear,
  VscChromeClose,
  VscPlay,
  VscChevronRight,
  VscChevronDown,
  VscClose,
  VscAdd,
  VscLayoutSidebarLeft,
  VscFolder,
  VscFile,
  VscFileCode
} from 'react-icons/vsc';

import toast from 'react-hot-toast';

// Helper component for rendering a video stream
const VideoPlayer = ({ stream, isLocal, userName }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video shadow-md border border-slate-700/50 group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local video to avoid echo
          onLoadedMetadata={handleLoadedMetadata}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isLocal ? 'scale-x-[-1] group-hover:-scale-x-105' : ''}`}
        />
      </div>
      <div className="flex items-center gap-2 px-1">
        <div className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]'} animate-pulse`}></div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
          {userName} {isLocal && <span className="text-slate-400 font-normal">(You)</span>}
        </span>
      </div>
    </div>
  );
};


// Helper for VS Code Tree
const buildFileTree = (fileList) => {
  const tree = { name: 'root', path: '', children: {}, files: [] };
  fileList.forEach(file => {
    if (file.name === '.gitkeep' || file.name.endsWith('/.gitkeep')) return;
    const parts = file.name.split('/');
    const fileName = parts.pop();
    let current = tree;
    let currentPath = '';
    parts.forEach(part => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!current.children[part]) {
        current.children[part] = { name: part, path: currentPath, children: {}, files: [] };
      }
      current = current.children[part];
    });
    current.files.push({ ...file, fileName });
  });
  return tree;
};

const CollaborationPage = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const socket = useSocket();

  const [project, setProject] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // File System State
  const [files, setFiles] = useState([
    { id: '1', name: 'main.js', content: '// Welcome to the Sandbox!\n// Start typing to sync with your peers!\n\nconsole.log("Hello World");\n', language: 'javascript' }
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
    const [isCommPanelOpen, setIsCommPanelOpen] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ projectName: '', reason: '' });

  // Inline file/folder creation state
  const [isCreating, setIsCreating] = useState(null); // 'file' | 'folder' | null
  const [creatingInFolder, setCreatingInFolder] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const newItemRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); // { fileId, x, y }
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef(null);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [openTabs, setOpenTabs] = useState(['1']); // array of file IDs that are open as tabs

  // Execution and Layout State
          const [isExecuting, setIsExecuting] = useState(false);
  const [terminalResult, setTerminalResult] = useState(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  

  // Tab management
  const openFileInTab = (fileId) => {
    setActiveFileId(fileId);
    setOpenTabs(prev => prev.includes(fileId) ? prev : [...prev, fileId]);
  };

  const closeTab = (e, fileId) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(id => id !== fileId);
    setOpenTabs(newTabs);
    if (activeFileId === fileId) {
      setActiveFileId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : files[0]?.id);
    }
  };

  const {
    localStream,
    remoteStreams,
    error: rtcError,
    startMedia,
    stopMedia,
    toggleVideo,
    toggleAudio,
    isVideoEnabled,
    isAudioEnabled,
    isMediaActive
  } = useWebRTC(socket, projectId, user);

  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const chatEndRef = useRef(null);

  // Idle detection state
  const idleTimeoutRef = useRef(null);
  const isIdle = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const editorRef = useRef(null);
  const isUpdatingFromSocket = useRef(false);

  // Auto-idle detector
  useEffect(() => {
    if (!socket || !project) return;

    const resetIdle = () => {
      if (isIdle.current) {
        isIdle.current = false;
        socket.emit('user-status-change', { projectId, status: 'online' });
      }
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        isIdle.current = true;
        socket.emit('user-status-change', { projectId, status: 'idle' });
      }, 60000); // 1 minute of inactivity = idle
    };

    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      clearTimeout(idleTimeoutRef.current);
    };
  }, [socket, projectId, project]);

  // 1. Fetch project details
  useEffect(() => {
    const isAdhoc = location.pathname.startsWith('/collaboration');
    if (isAdhoc) {
      setProject({ title: `Ad-Hoc Room: ${projectId}` });
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${projectId}`);
        setProject(res.data.project);
      } catch (err) {
        toast.error('Failed to load project details');
        navigate('/projects');
      }
    };
    fetchProject();
  }, [projectId, navigate, location.pathname]);

  // 2. Setup Socket Rooms and Listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Get PIN and Type from URL
    const params = new URLSearchParams(location.search);
    const pin = params.get('pin');
    const guestName = params.get('name');
    const isAdhoc = location.pathname.startsWith('/collaboration');

    if (!isAdhoc && !pin) {
      toast.error('Missing Collaboration PIN');
      navigate(`/projects/${projectId}`);
      return;
    }

    if (isAdhoc && (!pin || !guestName)) {
      toast.error('Please join the room through the Hub with a valid PIN and Name.');
      navigate('/collaboration');
      return;
    }

    const userNameToUse = isAdhoc ? guestName : user.name;

    socket.emit('join-collab-room', { projectId, userName: userNameToUse, pin, type: isAdhoc ? 'adhoc' : 'project' });

    socket.on('join-collab-success', (payload) => {
      setIsAuthorized(true);
      if (isAdhoc && payload && payload.projectName) {
        setProject({ title: `Ad-Hoc Room: ${payload.projectName}` });
      }
    });

    socket.on('join-collab-error', ({ message }) => {
      toast.error(message || 'Access Denied');
      navigate(isAdhoc ? '/collaboration' : `/projects/${projectId}`);
    });

    socket.on('user-joined-collab', ({ userName }) => {
      toast(`${userName} joined the room`, { icon: '👋' });
    });

    socket.on('user-left-collab', ({ userName }) => {
      toast(`${userName} left the room`, { icon: '🚪' });
    });

    socket.on('file-system-sync', (incomingFiles) => {
      isUpdatingFromSocket.current = true;
      setFiles(incomingFiles);
    });

    socket.on('file-content-change', ({ fileId, content }) => {
      isUpdatingFromSocket.current = true;
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f));
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('chat-edit-message', ({ id, text }) => {
      setChatMessages(prev => prev.map(msg => msg.id === id ? { ...msg, text, isEdited: true } : msg));
    });

    socket.on('chat-delete-message', ({ id, userName: deletedBy }) => {
      setChatMessages(prev => prev.map(msg =>
        msg.id === id ? { ...msg, isDeleted: true, deletedBy } : msg
      ));
    });

    socket.on('room-participants', (users) => {
      setParticipants(users);
    });

    return () => {
      socket.emit('leave-collab-room', { projectId, userName: user.name });
      socket.off('join-collab-success');
      socket.off('join-collab-error');
      socket.off('user-joined-collab');
      socket.off('user-left-collab');
      socket.off('file-system-sync');
      socket.off('file-content-change');
      socket.off('chat-message');
      socket.off('chat-edit-message');
      socket.off('chat-delete-message');
      socket.off('room-participants');
    };
  }, [socket, projectId, user, location.search, navigate]);

  // 3. Handle Editor Changes
  const handleEditorChange = (value) => {
    if (isUpdatingFromSocket.current) {
      isUpdatingFromSocket.current = false;
      return;
    }

    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: value || '' } : f));

    // Broadcast to peers
    if (socket) {
      socket.emit('file-content-change', { projectId, fileId: activeFileId, content: value });
    }
  };

  // Language detection helper
  const detectLanguage = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'javascript',
      ts: 'typescript', tsx: 'typescript',
      py: 'python',
      java: 'java',
      c: 'c', h: 'c',
      cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
      go: 'go',
      rb: 'ruby',
      rs: 'rust',
      html: 'html', htm: 'html',
      css: 'css', scss: 'scss', less: 'less',
      json: 'json',
      xml: 'xml',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell', bash: 'shell',
      yaml: 'yaml', yml: 'yaml',
      php: 'php',
      swift: 'swift',
      kt: 'kotlin',
      dart: 'dart',
    };
    return langMap[ext] || 'plaintext';
  };

  // Inline creation handlers
  const startCreating = (type, folderPath = null) => {
    let targetFolder = folderPath;
    if (!targetFolder && activeFileId) {
       const active = files.find(f => f.id === activeFileId);
       if (active) {
         const parts = active.name.split('/');
         if (parts.length > 1) {
           targetFolder = parts.slice(0, -1).join('/');
         }
       }
    }
    setIsCreating(type);
    setCreatingInFolder(targetFolder);
    if (targetFolder && collapsedFolders[targetFolder]) toggleFolder(targetFolder);
    setNewItemName('');
    setTimeout(() => newItemRef.current?.focus(), 50);
  };

  const confirmCreate = () => {
    const name = newItemName.trim();
    if (!name) { setIsCreating(null); setCreatingInFolder(null); return; }

    const finalPath = creatingInFolder ? `${creatingInFolder}/${name}` : name;

    if (isCreating === 'folder') {
      const folderPath = finalPath.endsWith('/') ? finalPath : finalPath + '/';
      const placeholder = { id: crypto.randomUUID(), name: folderPath + '.gitkeep', content: '', language: 'plaintext' };
      const newFiles = [...files, placeholder];
      setFiles(newFiles);
      if (socket) socket.emit('file-system-sync', { projectId, files: newFiles });
      toast.success(`Folder "${name}" created`);
    } else {
      const lang = detectLanguage(finalPath);
      const newFile = { id: crypto.randomUUID(), name: finalPath, content: '', language: lang };
      const newFiles = [...files, newFile];
      setFiles(newFiles);
      setActiveFileId(newFile.id);
      if (socket) socket.emit('file-system-sync', { projectId, files: newFiles });
    }
    setIsCreating(null);
    setCreatingInFolder(null);
    setNewItemName('');
  };

  const handleCreationKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmCreate(); }
    if (e.key === 'Escape') { setIsCreating(null); setCreatingInFolder(null); setNewItemName(''); }
  };

  // Delete item (file or folder)
  const handleDeleteItem = () => {
    if (!contextMenu) return;
    let newFiles = [];
    if (contextMenu.type === 'file') {
      newFiles = files.filter(f => f.id !== contextMenu.id);
    } else {
      const folderPath = contextMenu.id + '/';
      newFiles = files.filter(f => !f.name.startsWith(folderPath));
    }
    setFiles(newFiles);
    if (activeFileId && !newFiles.find(f => f.id === activeFileId) && newFiles.length > 0) setActiveFileId(newFiles[0].id);
    if (socket) socket.emit('file-system-sync', { projectId, files: newFiles });
    toast.success(contextMenu.type === 'file' ? 'File deleted' : 'Folder deleted');
    setContextMenu(null);
  };

  // Rename item
  const startRename = () => {
    if (!contextMenu) return;
    setRenamingFileId(contextMenu.id);
    if (contextMenu.type === 'file') {
      setRenameValue(contextMenu.name.split('/').pop());
    } else {
      setRenameValue(contextMenu.name);
    }
    setContextMenu(null);
    setTimeout(() => renameRef.current?.focus(), 50);
  };

  const confirmRename = () => {
    const name = renameValue.trim();
    if (!name || !renamingFileId) { setRenamingFileId(null); return; }
    
    let newFiles = files;
    const file = files.find(f => f.id === renamingFileId);
    
    if (file) {
      // Renaming file
      const pathParts = file.name.split('/');
      pathParts[pathParts.length - 1] = name;
      const newName = pathParts.join('/');
      const lang = detectLanguage(name);
      newFiles = files.map(f => f.id === renamingFileId ? { ...f, name: newName, language: lang } : f);
    } else {
      // Renaming folder
      const oldPath = renamingFileId + '/';
      const newPath = name + '/';
      newFiles = files.map(f => {
        if (f.name.startsWith(oldPath)) {
          return { ...f, name: f.name.replace(oldPath, newPath) };
        }
        return f;
      });
    }
    setFiles(newFiles);
    if (socket) socket.emit('file-system-sync', { projectId, files: newFiles });
    setRenamingFileId(null);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') setRenamingFileId(null);
  };

  // Toggle folder collapse
  const toggleFolder = (folder) => {
    setCollapsedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(file.name, file.content);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${project?.title || 'workspace'}.zip`);
      toast.success('Workspace downloaded!');
    } catch (error) {
      toast.error('Failed to generate zip');
    }
  };

  const handleAIReview = async () => {
    if (!activeFile || !activeFile.content.trim()) return;
    try {
      setIsReviewing(true);
      setShowReviewModal(true);
      setAiReview('Analyzing your code...');
      const res = await api.post('/ai/review', { code: activeFile.content, language: activeFile.language });
      if (res.data.success) {
        setAiReview(res.data.review);
      }
    } catch (err) {
      setAiReview('Failed to generate AI Review. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRunCode = async () => {
    if (!activeFile) return;

    // HTML/CSS/JS preview for frontend languages
    if (['html', 'css', 'javascript', 'typescript'].includes(activeFile.language) && activeFile.name.endsWith('.html')) {
      setTerminalResult({ isHtml: true, content: activeFile.content });
      setIsTerminalOpen(true);
      return;
    }

    setIsExecuting(true);
    setIsTerminalOpen(true);
    setTerminalResult(null);

    try {
      const res = await api.post('/execute/test/playground', {
        code: activeFile.content,
        language: activeFile.language,
      });

      if (res.data.success) {
        setTerminalResult({
          isHtml: false,
          output: res.data.result.output,
          error: res.data.result.error,
          executionTime: res.data.result.executionTime,
          memoryUsed: res.data.result.memoryUsed,
          exitCode: res.data.result.exitCode
        });
      }
    } catch (err) {
      setTerminalResult({
        isHtml: false,
        error: err.response?.data?.message || 'Failed to execute code'
      });
      toast.error('Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    if (editingMessageId) {
      socket.emit('chat-edit-message', { projectId, messageId: editingMessageId, text: newMessage });
      setEditingMessageId(null);
    } else {
      socket.emit('chat-message', { projectId, userName: user.name, text: newMessage, messageId: crypto.randomUUID() });
    }
    setNewMessage('');
  };

  const handleEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setNewMessage(msg.text);
  };

  const handleDeleteMessage = (id) => {
    if (!socket) return;
    socket.emit('chat-delete-message', { projectId, messageId: id, userName: user.name });
  };

  // 4. Save Code to DB and Local System
  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!saveForm.projectName || !saveForm.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSaving(true);
      const teamMembers = participants.map(p => p.userName);

      // Save to database
      await api.post('/workspaces/save', {
        projectName: saveForm.projectName,
        reason: saveForm.reason,
        teamMembers,
        files
      });

      // Download ZIP locally
      await handleDownloadZip();

      toast.success('Workspace saved to Hub and downloaded locally!');
      setShowSaveModal(false);
      setSaveForm({ projectName: '', reason: '' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save workspace');
    } finally {
      setIsSaving(false);
    }
  };

  if (!project || !isAuthorized) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(location.pathname.startsWith('/collaboration') ? '/collaboration' : `/projects/${projectId}`)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Collaboration Room
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {project.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-2 mr-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <HiOutlineUsers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {participants.length} Online
              </span>
            </button>

            {/* Participants Dropdown */}
            {showParticipants && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">In Room</h4>
                <div className="flex flex-col gap-1">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      {p.status === 'online' ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                      ) : (
                        <HiOutlineMoon className="w-3 h-3 text-amber-500" />
                      )}
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {p.name} {p.id === user.id && '(You)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isMediaActive ? (
            <>
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-xl text-white shadow-md transition-all active:scale-95 ${isAudioEnabled ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
                  }`}
                title={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
              >
                {isAudioEnabled ? <HiOutlineMicrophone className="w-5 h-5" /> : <HiOutlineX className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-xl text-white shadow-md transition-all active:scale-95 ${isVideoEnabled ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30' : 'bg-slate-700 hover:bg-slate-800 shadow-slate-900/30'
                  }`}
                title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isVideoEnabled ? <HiOutlineVideoCamera className="w-5 h-5" /> : <HiOutlineX className="w-5 h-5" />}
              </button>
              <button
                onClick={stopMedia}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/30 transition-all active:scale-95"
              >
                <HiOutlinePhoneMissedCall className="w-5 h-5" />
                Leave Call
              </button>
            </>
          ) : (
            <button
              onClick={startMedia}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/30 transition-all active:scale-95"
            >
              <HiOutlineVideoCamera className="w-5 h-5" />
              Join Call
            </button>
          )}

          <button
            onClick={() => setIsCommPanelOpen(!isCommPanelOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${isCommPanelOpen ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20' : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 border-indigo-200 dark:border-indigo-500/30'}`}
          >
            <HiOutlineUsers className="w-4 h-4" />
            Communication
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <HiOutlineSave className="w-4 h-4" />
            )}
            Save Code
          </button>
        </div>
      </div>

      {rtcError && (
        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-800 text-sm font-medium">
          {rtcError}
        </div>
      )}

      
      {contextMenu && (
        <div 
          className="fixed z-[200] bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 w-36 text-xs"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'folder' && (
            <>
              <button onClick={() => { startCreating('file', contextMenu.id); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <HiOutlineDocumentAdd className="w-3.5 h-3.5" /> New File
              </button>
              <button onClick={() => { startCreating('folder', contextMenu.id); setContextMenu(null); }} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <HiOutlineFolderAdd className="w-3.5 h-3.5" /> New Folder
              </button>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            </>
          )}
          <button onClick={startRename} className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <HiOutlinePencil className="w-3.5 h-3.5" /> Rename
          </button>
          <button onClick={handleDeleteItem} className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 text-rose-600">
            <HiOutlineTrash className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
      
      {/* Main Workspace */}
      <div className="flex-1 flex gap-4 min-h-0">

        
        {/* File Explorer Pane */}
        <div className="w-64 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[24px] flex flex-col border border-white/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden shrink-0">
          <div className="px-5 py-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineFolder className="w-4 h-4" /> Explorer
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => startCreating('file')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="New File">
                  <HiOutlineDocumentAdd className="w-4 h-4" />
                </button>
                <button onClick={() => startCreating('folder')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="New Folder">
                  <HiOutlineFolderAdd className="w-4 h-4" />
                </button>
                <button onClick={handleDownloadZip} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title="Download ZIP">
                  <HiOutlineDownload className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Search Input */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-shadow"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 relative scrollbar-hide" onClick={() => setContextMenu(null)}>
            {/* Inline creation input */}
            {isCreating && !creatingInFolder && (
              <div className="flex items-center gap-2 px-3 py-2">
                {isCreating === 'folder'
                  ? <HiOutlineFolder className="w-4 h-4 text-amber-500 shrink-0" />
                  : <HiOutlineDocument className="w-4 h-4 text-indigo-500 shrink-0" />
                }
                <input
                  ref={newItemRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={handleCreationKeyDown}
                  onBlur={confirmCreate}
                  placeholder={isCreating === 'folder' ? 'folder name' : 'filename.ext'}
                  className="flex-1 w-0 bg-white dark:bg-slate-800 border border-indigo-500 rounded-lg px-2 py-1 text-xs outline-none text-slate-800 dark:text-white shadow-sm"
                />
              </div>
            )}

            {/* File Tree */}
            {(() => {
              const filtered = files.filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));
              // Group by folder
              const folders = {};
              const rootFiles = [];
              filtered.forEach(f => {
                const parts = f.name.split('/');
                if (parts.length > 1) {
                  const folder = parts.slice(0, -1).join('/');
                  if (!folders[folder]) folders[folder] = [];
                  folders[folder].push(f);
                } else {
                  rootFiles.push(f);
                }
              });

              return (
                <>
                  {/* Folders */}
                  {Object.keys(folders).sort().map(folder => (
                    <div key={folder} className="mb-1">
                      <button
                        onClick={() => toggleFolder(folder)}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ type: 'folder', id: folder, name: folder, x: e.clientX, y: e.clientY }); }}
                        className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <span className={`text-[10px] text-slate-400 transition-transform ${collapsedFolders[folder] ? '' : 'rotate-90'}`}>▶</span>
                        <HiOutlineFolder className="w-4 h-4 text-amber-500" />
                        {renamingFileId === folder ? (
                          <input
                            ref={renameRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={confirmRename}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 w-0 bg-white dark:bg-slate-800 border border-indigo-500 rounded px-1.5 py-0.5 text-xs outline-none shadow-sm"
                          />
                        ) : (
                          <span className="truncate">{folder}</span>
                        )}
                      </button>
                      {!collapsedFolders[folder] && (
                        <div className="pl-3 mt-1 space-y-1">
                          {isCreating && creatingInFolder === folder && (
                            <div className="flex items-center gap-2 pl-6 pr-3 py-2.5">
                              {isCreating === 'folder'
                                ? <HiOutlineFolder className="w-4 h-4 text-amber-500 shrink-0" />
                                : <HiOutlineDocument className="w-4 h-4 text-indigo-500 shrink-0" />
                              }
                              <input
                                ref={newItemRef}
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={handleCreationKeyDown}
                                onBlur={confirmCreate}
                                placeholder={isCreating === 'folder' ? 'folder name' : 'filename.ext'}
                                className="flex-1 w-0 bg-white dark:bg-slate-800 border border-indigo-500 rounded px-1.5 py-0.5 text-xs outline-none shadow-sm"
                              />
                            </div>
                          )}
                          {folders[folder].map(f => {
                            const fileName = f.name.split('/').pop();
                            if (fileName === '.gitkeep') return null;
                            const isActive = activeFileId === f.id;
                            return (
                              <div
                                key={f.id}
                                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ type: 'file', id: f.id, name: f.name, x: e.clientX, y: e.clientY }); }}
                                onClick={() => openFileInTab(f.id)}
                                className={`w-full text-left pl-6 pr-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                                  isActive
                                    ? 'bg-[#ede9fe] dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <HiOutlineDocument className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                                {renamingFileId === f.id ? (
                                  <input
                                    ref={renameRef}
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={handleRenameKeyDown}
                                    onBlur={confirmRename}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 w-0 bg-white dark:bg-slate-800 border border-indigo-500 rounded px-1.5 py-0.5 text-xs outline-none shadow-sm"
                                  />
                                ) : (
                                  <span className="truncate">{fileName}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Root-level files */}
                  {rootFiles.map(f => {
                    const isActive = activeFileId === f.id;
                    return (
                      <div
                        key={f.id}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ type: 'file', id: f.id, name: f.name, x: e.clientX, y: e.clientY }); }}
                        onClick={() => openFileInTab(f.id)}
                        className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#ede9fe] dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <HiOutlineDocument className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`} />
                        {renamingFileId === f.id ? (
                          <input
                            ref={renameRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={confirmRename}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 w-0 bg-white dark:bg-slate-800 border border-indigo-500 rounded px-1.5 py-0.5 text-xs outline-none shadow-sm"
                          />
                        ) : (
                          <span className="truncate">{f.name}</span>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </div>

        {/* Editor Pane (Matches Screenshot perfectly) */}
        <div className="flex-1 bg-[#1e1e1e] rounded-[24px] overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 dark:border-slate-700/50">
          {/* Top Header of Editor */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></div>
              <span className="text-[13px] font-bold text-slate-800 dark:text-white tracking-wide">{activeFile?.name.split('/').pop()}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-full capitalize">
                {activeFile?.language || 'Javascript'}
              </span>
              <button onClick={handleAIReview} disabled={isReviewing} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 rounded-full text-[11px] font-bold uppercase transition-colors disabled:opacity-50">
                <HiOutlineSparkles className={`w-3.5 h-3.5 ${isReviewing ? 'animate-pulse' : ''}`} /> {isReviewing ? 'Reviewing...' : 'AI Review'}
              </button>
              <button onClick={handleRunCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-full text-[11px] font-bold uppercase transition-colors">
                {isExecuting ? <HiOutlineRefresh className="w-4 h-4 animate-spin" /> : <HiOutlinePlay className="w-4 h-4" />}
                Run
              </button>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1" title="Expand">
                <HiOutlineArrowsExpand className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={activeFile?.language || 'javascript'}
              theme="vs-dark"
              value={activeFile?.content || ''}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 1.6,
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                formatOnPaste: true,
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true
              }}
            />
            
            {/* Sliding Terminal Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: isTerminalOpen ? 0 : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#0d0d0d] border-t border-slate-700/50 z-10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center justify-between px-5 py-3 bg-[#161616] border-b border-slate-700/50 shrink-0">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <HiOutlineTerminal className="w-4 h-4 text-emerald-500" /> Terminal Output
                </span>
                <button onClick={() => setIsTerminalOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded">
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed">
                {isExecuting ? (
                  <div className="text-emerald-500 flex items-center gap-2">
                    <HiOutlineRefresh className="animate-spin w-4 h-4" /> Executing code...
                  </div>
                ) : terminalResult ? (
                  terminalResult.isHtml ? (
                    <iframe
                      title="preview"
                      srcDoc={terminalResult.content}
                      className="w-full h-full bg-white rounded-lg"
                      sandbox="allow-scripts"
                    />
                  ) : (
                    <div className={terminalResult.error ? 'text-rose-400' : 'text-slate-300'} style={{ whiteSpace: 'pre-wrap' }}>
                      {terminalResult.output || terminalResult.error || 'Program exited with no output.'}
                    </div>
                  )
                ) : (
                  <div className="text-slate-500 italic">Ready. Click Run to execute code.</div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        {/* Slide-in Overlay for Chat/Video */}
        <div 
          className={`flex flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden transition-all duration-300 ${isCommPanelOpen ? 'w-80 p-4 gap-4 opacity-100' : 'w-0 p-0 gap-0 opacity-0 border-none'}`}
        >
          <div className="flex justify-between items-center shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <HiOutlineUsers className="w-5 h-5 text-indigo-500"/> Communication
            </h2>
            <button onClick={() => setIsCommPanelOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
          
          {/* Video Call Section */}
          {(isMediaActive || Object.keys(remoteStreams).length > 0) && (
            <div className="glass rounded-2xl p-4 flex flex-col gap-4 border border-slate-200/50 dark:border-slate-700/50 shrink-0 max-h-[50%] overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Video Call</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Local Stream */}
                {isMediaActive && (
                  <VideoPlayer stream={localStream} isLocal={true} userName={user?.name} />
                )}
                {/* Remote Streams */}
                {Object.entries(remoteStreams).map(([socketId, data]) => (
                  <VideoPlayer key={socketId} stream={data.stream} isLocal={false} userName={data.userName} />
                ))}
              </div>
            </div>
          )}

          {/* Chat Section */}
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="p-3 border-b border-slate-200 dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/30">
               <HiOutlineChatAlt className="w-4 h-4 text-slate-500"/>
               <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Room Chat</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {chatMessages.length === 0 ? (
                 <div className="text-center text-slate-500 text-xs py-8 opacity-50">
                   No messages yet. Start the conversation!
                 </div>
               ) : (
                 chatMessages.map((msg, i) => {
                   const isMe = msg.userId === user?.id;
                   return (
                     <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                       <div className="flex items-baseline gap-2 mb-1">
                         <span className="text-[10px] font-bold text-slate-500">{msg.userName}</span>
                         {msg.isEdited && <span className="text-[9px] text-slate-400 italic">(edited)</span>}
                       </div>
                       
                       {msg.isDeleted ? (
                         <div className="px-3 py-1.5 rounded-xl text-xs italic text-slate-400 bg-slate-100 dark:bg-slate-800">
                           This message was deleted
                         </div>
                       ) : (
                         <div className={`group relative px-3 py-2 rounded-xl text-sm max-w-[85%] ${isMe ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
                           {msg.text}
                           
                           {isMe && (
                             <div className="absolute top-1 right-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                               <button onClick={() => handleEditMessage(msg)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500">
                                 <HiOutlinePencil className="w-3 h-3" />
                               </button>
                               <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded text-rose-500">
                                 <HiOutlineTrash className="w-3 h-3" />
                               </button>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   );
                 })
               )}
               <div ref={chatEndRef} />
             </div>
             
             <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 backdrop-blur-md">
               <div className="relative">
                 <input
                   type="text"
                   value={newMessage}
                   onChange={e => setNewMessage(e.target.value)}
                   placeholder="Type a message..."
                   className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                 />
                 <button type="submit" disabled={!newMessage.trim()} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-lg transition-colors">
                   <HiOutlinePaperAirplane className="w-3.5 h-3.5 rotate-90" />
                 </button>
               </div>
             </form>
          </div>
        </div>

        {/* Save Workspace Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HiOutlineSave className="text-indigo-500" /> Save Workspace
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="text-slate-400 hover:text-slate-500">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveWorkspace} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Project Name</label>
                  <input type="text" required value={saveForm.projectName} onChange={e => setSaveForm({...saveForm, projectName: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm" placeholder="e.g., Auth Implementation" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-300">Description / Reason</label>
                  <textarea required value={saveForm.reason} onChange={e => setSaveForm({...saveForm, reason: e.target.value})} className="input-field w-full px-3 py-2 rounded-xl text-sm resize-none" rows="3" placeholder="Why are you saving this workspace?"></textarea>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30 mt-4 flex gap-3">
                   <HiOutlineCheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                   <div className="text-sm text-emerald-700 dark:text-emerald-400">
                     Saving will sync all current files to the Hub database AND download a <b>.zip</b> backup to your local machine!
                   </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={() => setShowSaveModal(false)} className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <HiOutlineSave className="w-4 h-4" />}
                    Save & Download
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* AI Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <HiOutlineSparkles className="text-indigo-500" /> AI Code Review
                </h2>
                <button onClick={() => setShowReviewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <HiOutlineX className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 prose prose-sm sm:prose dark:prose-invert max-w-none">
                {isReviewing && aiReview === 'Analyzing your code...' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p>Analyzing code structure and time complexity...</p>
                  </div>
                ) : (
                  <ReactMarkdown>{aiReview}</ReactMarkdown>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AITutorWidget />
    </div>
  );
};

export default CollaborationPage;
