import { useState } from 'react';
import { Bell } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Team } from '../types';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  user: User | null;
  currentTeam: Team | null;
  teams: Team[];
  currentTeamIndex: number;
  onSignOut: () => void;
  onSignInClick: () => void;
  onTeamSwitch: (index: number) => void;
  unreadNotifications?: number;
  onNotificationsClick?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header = ({ 
  user, 
  currentTeam, 
  teams,
  currentTeamIndex,
  onSignOut, 
  onSignInClick,
  onTeamSwitch,
  unreadNotifications = 0,
  onNotificationsClick,
  theme,
  onToggleTheme
}: HeaderProps) => {
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);

  // Calculate team tier based on problems solved (you can customize this logic)
  const getTeamTier = () => {
    if (!currentTeam) return null;
    // This is a placeholder - you'd calculate based on team performance
    const solvedCount = 0; // You'd pass this as a prop
    if (solvedCount >= 50) return { name: 'Platinum', color: 'text-cyan-400', icon: '💎' };
    if (solvedCount >= 30) return { name: 'Gold', color: 'text-yellow-400', icon: '🥇' };
    if (solvedCount >= 15) return { name: 'Silver', color: 'text-gray-400', icon: '🥈' };
    return { name: 'Bronze', color: 'text-orange-600', icon: '🥉' };
  };

  const tier = getTeamTier();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-800/50">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Logo + Team Context */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Logo with ICPC Trophy Icon */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <img 
                src="/icon.png" 
                alt="Silver Logo" 
                className="w-8 h-8 rounded-lg"
              />
              {/* {tier && (
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-white flex items-center justify-center text-[10px] ${tier.color}`}>
                  <Trophy size={10} strokeWidth={3} />
                </div>
              )} */}
            </div>
            <h1 className="text-xl font-extrabold tracking-tight header-title-shimmer">
              Silver
            </h1>
          </div>

          {/* Team Context Indicator */}
          {user && currentTeam && (
            <button
              onClick={() => setShowTeamSwitcher(!showTeamSwitcher)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700 min-w-0 max-w-[160px]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                  {currentTeam.name}
                </span>
                {tier && (
                  <span className="text-[10px] flex-shrink-0">{tier.icon}</span>
                )}
                {teams.length > 1 && (
                  <span className="text-[10px] text-gray-400 flex-shrink-0">
                    {currentTeamIndex + 1}/{teams.length}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Team Switcher Dropdown */}
          {showTeamSwitcher && teams.length > 1 && (
            <div className="absolute top-14 left-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 min-w-[200px] z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                Switch Team
              </div>
              {teams.map((team, index) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onTeamSwitch(index);
                    setShowTeamSwitcher(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                    index === currentTeamIndex ? 'bg-blue-50 dark:bg-slate-700' : ''
                  }`}
                >
                  <span className={`text-sm font-medium ${index === currentTeamIndex ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {team.name}
                  </span>
                  {index === currentTeamIndex && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && (
            <>
              {/* Notifications Bell */}
              <button 
                onClick={onNotificationsClick}
                className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* User Menu / Profile */}
              <UserMenu 
                user={user} 
                onSignOut={onSignOut}
                teams={teams}
                currentTeam={currentTeam}
                onTeamSwitch={onTeamSwitch}
                theme={theme}
                onToggleTheme={onToggleTheme}
              />
            </>
          )}

          {!user && (
            <button
              onClick={onSignInClick}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Click outside handler for team switcher */}
      {showTeamSwitcher && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowTeamSwitcher(false)}
        />
      )}
    </header>
  );
};
