import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, LogOut, ChevronDown, Users } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Team } from '../types';

interface UserMenuProps {
  user: User;
  onSignOut: () => void;
  teams?: Team[];
  currentTeam?: Team | null;
  onTeamSwitch?: (index: number) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const UserMenu = ({ user, onSignOut, teams = [], currentTeam, onTeamSwitch, theme, onToggleTheme }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = () => {
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 pr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm overflow-hidden border-2 border-white dark:border-slate-700">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
        </div>
        <ChevronDown size={14} className={`text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-50">
          {/* User Info */}
          <div className="p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 dark:text-gray-100 truncate">
                  {user.displayName || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Current Team Badge */}
          {currentTeam && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Current Team</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{currentTeam.name}</div>
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onToggleTheme?.();
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors text-left"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Team Switcher in dropdown if multiple teams */}
            {teams.length > 1 && onTeamSwitch && (
              <>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Switch Team
                </div>
                {teams.map((team, index) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      onTeamSwitch(index);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${
                      currentTeam?.id === team.id ? 'bg-blue-50 dark:bg-slate-700' : ''
                    }`}
                  >
                    <span className={`text-sm ${currentTeam?.id === team.id ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {team.name}
                    </span>
                    {currentTeam?.id === team.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                    )}
                  </button>
                ))}
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-2"></div>
              </>
            )}
            
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-left"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
