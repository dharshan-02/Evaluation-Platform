import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineDocumentAdd, HiOutlineCollection, HiOutlineViewGrid, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm sm:px-0 px-4"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <HiOutlineSearch className="w-5 h-5 text-slate-400" />
          <Command.Input 
            placeholder="Type a command or search..." 
            className="w-full px-4 py-4 text-base bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

          <Command.Group heading="Navigation" className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/dashboard'))}
              className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
            >
              <HiOutlineViewGrid className="w-4 h-4" /> Go to Dashboard
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/projects'))}
              className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
            >
              <HiOutlineCollection className="w-4 h-4" /> Go to Projects
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/settings'))}
              className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
            >
              <HiOutlineCog className="w-4 h-4" /> Go to Settings
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions" className="px-2 py-1 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/projects/create'))}
              className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
            >
              <HiOutlineDocumentAdd className="w-4 h-4" /> Create New Project
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/assignments/create'))}
              className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm rounded-lg cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
            >
              <HiOutlineDocumentAdd className="w-4 h-4" /> Create Assignment
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(logout)}
              className="flex items-center gap-2 px-3 py-2.5 mt-1 text-sm rounded-lg cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 aria-selected:bg-red-50 dark:aria-selected:bg-red-900/20"
            >
              <HiOutlineLogout className="w-4 h-4" /> Log out
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
