import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineSearch, 
  HiOutlineDocumentAdd, 
  HiOutlineCollection, 
  HiOutlineViewGrid, 
  HiOutlineCog, 
  HiOutlineLogout,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineDocumentReport,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineClipboardList,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineCloudUpload,
  HiOutlineCode
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Toggle the menu when ⌘K or Ctrl+K is pressed, or listen to custom event
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    const handleOpenCommandPalette = () => setOpen(true);
    window.addEventListener('open-command-palette', handleOpenCommandPalette);
    document.addEventListener('keydown', down);

    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', handleOpenCommandPalette);
    };
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  const isFacultyOrAdmin = user && ['faculty', 'admin'].includes(user.role);
  const isAdmin = user && user.role === 'admin';

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[12vh] bg-slate-950/60 backdrop-blur-md sm:px-0 px-4"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-slide-down">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <HiOutlineSearch className="w-5 h-5 text-blue-500 dark:text-sky-400 shrink-0" />
          <Command.Input 
            placeholder="Type a page, command, or search action..." 
            className="w-full px-4 py-4 text-sm font-medium bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800/80 rounded border border-slate-300 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <Command.List className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <Command.Empty className="py-10 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
            <HiOutlineSearch className="w-8 h-8 text-slate-400 opacity-60" />
            <span>No matching commands found.</span>
          </Command.Empty>

          {/* Quick Actions */}
          <Command.Group heading="Quick Actions" className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Command.Item 
              onSelect={() => runCommand(toggleTheme)}
              className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <HiOutlineSun className="w-4 h-4 text-amber-500" /> : <HiOutlineMoon className="w-4 h-4 text-indigo-500" />}
                <span>Toggle Theme ({theme === 'dark' ? 'Light Mode' : 'Dark Mode'})</span>
              </div>
              <span className="text-[11px] text-slate-400">Ctrl+T</span>
            </Command.Item>

            {isFacultyOrAdmin && (
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/assignments/new'))}
                className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HiOutlineDocumentAdd className="w-4 h-4 text-blue-500" />
                  <span>Create New Assignment</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">Faculty</span>
              </Command.Item>
            )}

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/projects/new'))}
              className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HiOutlineCollection className="w-4 h-4 text-sky-500" />
                <span>Create Capstone Project</span>
              </div>
            </Command.Item>

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/collaboration'))}
              className="flex items-center justify-between px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HiOutlineUserGroup className="w-4 h-4 text-emerald-500" />
                <span>Join / Create Collaboration Room</span>
              </div>
            </Command.Item>
          </Command.Group>

          {/* Navigation */}
          <Command.Group heading="Navigation" className="px-2 py-1 mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/dashboard'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineViewGrid className="w-4 h-4 text-slate-400" /> Dashboard Overview
            </Command.Item>

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/assignments'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineCode className="w-4 h-4 text-slate-400" /> Assignments & Coding
            </Command.Item>

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/submissions'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineCloudUpload className="w-4 h-4 text-slate-400" /> Submissions & Grading
            </Command.Item>

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/projects'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineCollection className="w-4 h-4 text-slate-400" /> Capstone Projects
            </Command.Item>

            {isFacultyOrAdmin && (
              <>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate('/plagiarism'))}
                  className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
                >
                  <HiOutlineShieldCheck className="w-4 h-4 text-indigo-500" /> Plagiarism Detection Engine
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate('/analytics'))}
                  className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
                >
                  <HiOutlineChartBar className="w-4 h-4 text-cyan-500" /> Performance Analytics
                </Command.Item>
              </>
            )}

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/reports'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineDocumentReport className="w-4 h-4 text-slate-400" /> PDF Reports
            </Command.Item>

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/notifications'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineBell className="w-4 h-4 text-slate-400" /> Notifications & Alerts
            </Command.Item>

            <Command.Item 
              onSelect={() => runCommand(() => navigate('/profile'))}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
            >
              <HiOutlineUser className="w-4 h-4 text-slate-400" /> My Profile & Badges
            </Command.Item>

            {isAdmin && (
              <>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate('/users'))}
                  className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
                >
                  <HiOutlineUserGroup className="w-4 h-4 text-purple-500" /> User Management
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate('/audit-logs'))}
                  className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
                >
                  <HiOutlineClipboardList className="w-4 h-4 text-amber-500" /> Audit Compliance Logs
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate('/settings'))}
                  className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-sky-300 aria-selected:bg-blue-50 dark:aria-selected:bg-blue-950/40 aria-selected:text-blue-600 dark:aria-selected:text-sky-300 transition-colors"
                >
                  <HiOutlineCog className="w-4 h-4 text-slate-400" /> System Settings
                </Command.Item>
              </>
            )}
          </Command.Group>

          {/* Account */}
          <Command.Group heading="Account" className="px-2 py-1 mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <Command.Item 
              onSelect={() => runCommand(logout)}
              className="flex items-center gap-3 px-3 py-2.5 mt-1 text-sm rounded-xl cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 aria-selected:bg-rose-50 dark:aria-selected:bg-rose-950/30 transition-colors"
            >
              <HiOutlineLogout className="w-4 h-4 text-rose-500" /> Log out of {user?.name || 'Workspace'}
            </Command.Item>
          </Command.Group>
        </Command.List>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span>D's Evaluation Hub Pro</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
