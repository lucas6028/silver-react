import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Trash2, ChevronDown, UserPlus, Edit } from 'lucide-react';
import { PLATFORMS, BALLOON_COLORS } from '../constants';
import type { TeamMember } from '../types';
import { Balloon } from './Balloon';
import type { Problem } from '../types';

interface ProblemCardProps {
  problem: Problem;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (problem: Problem) => void;
  currentUserId?: string | null;
  onAssignToUser?: (problemId: string, userId: string) => Promise<void> | void;
  members?: TeamMember[] | null;
}

export const ProblemCard = ({ problem, onUpdateStatus, onDelete, onEdit, currentUserId, onAssignToUser, members }: ProblemCardProps) => {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const platformStyle = PLATFORMS.find(p => p.name === problem.platform) || PLATFORMS[3];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(event.target as Node)) {
        setIsAssigneeOpen(false);
      }
    };

    if (isStatusOpen || isAssigneeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusOpen, isAssigneeOpen]);
  
  // Mapping statuses to ICPC/OJ verdicts
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    'Todo': { label: 'New', color: 'text-gray-400', bg: 'bg-gray-100' },
    'InProgress': { label: 'Running', color: 'text-amber-500', bg: 'bg-amber-50' },
    'Review': { label: 'Review', color: 'text-blue-500', bg: 'bg-blue-50' },
    'Done': { label: 'AC', color: 'text-green-600', bg: 'bg-green-100' }
  };

  const currentStatus = statusConfig[problem.status] || statusConfig['Todo'];
  const balloonColor = problem.balloonColor || BALLOON_COLORS[problem.difficulty as keyof typeof BALLOON_COLORS] || '#999';

  const isOwner = !!(currentUserId && problem.createdBy && problem.createdBy === currentUserId);
  const isAssignee = !!(currentUserId && problem.assignees?.includes(currentUserId));
  const canEdit = isOwner || isAssignee;

  const handleStatusChange = (newStatus: string) => {
    if (!canEdit) return;
    onUpdateStatus(problem.id, newStatus);
    setIsStatusOpen(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 relative transition-all hover:shadow-md" style={{ zIndex: isStatusOpen ? 50 : 'auto' }}>
      {/* Balloon for AC problems */}
      {problem.status === 'Done' && (
        <div className="absolute -top-2 -right-2 animate-in slide-in-from-top-4 duration-500 z-10">
          <Balloon color={balloonColor} size={32} />
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 pr-12">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${platformStyle.color}`}>
              {problem.platform}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
              problem.difficulty === 'Hard' ? 'bg-red-50 text-red-600' :
              problem.difficulty === 'Medium' ? 'bg-orange-50 text-orange-600' :
              'bg-green-50 text-green-600'
            }`}>
              {problem.difficulty}
            </span>
            {problem.tags?.map((tag: string) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-semibold text-gray-900 leading-tight">{problem.title}</h3>
        </div>
        
        <div className="relative z-20" ref={statusMenuRef}>
          {canEdit ? (
            <button 
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl transition-all font-bold text-xs ${currentStatus.bg} ${currentStatus.color} min-w-[70px]`}
            >
            {currentStatus.label}
            <ChevronDown size={12} className={`transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <div className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl font-bold text-xs ${currentStatus.bg} ${currentStatus.color} min-w-[70px]`}>{currentStatus.label}</div>
          )}

          {isStatusOpen && canEdit && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
              {Object.entries(statusConfig).map(([status, config]) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                    problem.status === status 
                      ? `${config.bg} ${config.color}` 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
        <div className="flex -space-x-2">
           {problem.assignees?.map((userId: string) => {
             const member = members?.find(m => m.uid === userId);
               if (member) {
               const typedMember = member as TeamMember | { id: string; name: string; avatar?: string };
               const avatarClass = 'avatar' in typedMember && typedMember.avatar ? typedMember.avatar : 'bg-gray-400';
               let initial = '?';
               if ('displayName' in typedMember && typedMember.displayName) initial = typedMember.displayName[0];
               else if ('name' in typedMember && typedMember.name) initial = typedMember.name[0];
               else initial = userId[0] || '?';
               const titleText = 'displayName' in typedMember ? typedMember.displayName : (('name' in typedMember) ? typedMember.name : userId);
               const photoURL = 'photoURL' in typedMember ? typedMember.photoURL : undefined;
               return (
                 <div key={userId} title={titleText} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${avatarClass} relative overflow-hidden`}>
                   {photoURL ? (
                     <img src={photoURL} alt={titleText} className="w-full h-full object-cover" />
                   ) : (
                     initial
                   )}
                 </div>
               );
              }
              // If the assignee is current user (by UID) show a 'You' badge
              if (currentUserId && userId === currentUserId) {
                return (
                  <div key={userId} title={'You'} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white bg-blue-500 relative`}>
                    Y
                  </div>
                );
              }
              // If member info is not available but we have a UID, show a fallback initial
              const fallbackInitial = userId?.[0] || '?';
              return (
                <div key={userId} title={userId} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white bg-gray-300 relative`}>
                  {fallbackInitial}
                </div>
              );
           })}
           {canEdit && members && members.length > 0 && (
             <div className="relative" ref={assigneeMenuRef}>
               <button 
                 onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                 className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 text-[10px] relative z-10 cursor-pointer transition-colors"
                 title="Assign to teammate"
               >
                 <UserPlus size={12} />
               </button>
               {isAssigneeOpen && (
                 <div className="absolute left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                   {members
                     .filter(m => !problem.assignees?.includes(m.uid))
                     .map((member) => (
                       <button
                         key={member.uid}
                         onClick={() => {
                           onAssignToUser?.(problem.id, member.uid);
                           setIsAssigneeOpen(false);
                         }}
                         className="w-full px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                       >
                         <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-[9px] overflow-hidden">
                           {member.photoURL ? (
                             <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                           ) : (
                             member.displayName?.[0] || '?'
                           )}
                         </div>
                         <span>{member.displayName}</span>
                       </button>
                     ))}
                   {members.filter(m => !problem.assignees?.includes(m.uid)).length === 0 && (
                     <div className="px-3 py-2 text-xs text-gray-400 text-center">All teammates assigned</div>
                   )}
                 </div>
               )}
             </div>
           )}
        </div>
        
          <div className="flex gap-2">
          {problem.url && (
            <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
              <ExternalLink size={16} />
            </a>
          )}
          {canEdit && onEdit && (
            <button onClick={() => onEdit(problem)} className="text-gray-400 hover:text-blue-500">
              <Edit size={16} />
            </button>
          )}
          {canEdit && (
            <button onClick={() => onDelete(problem.id)} className="text-gray-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
