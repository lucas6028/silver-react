import { ExternalLink, Trash2 } from 'lucide-react';
import { PLATFORMS, BALLOON_COLORS, TEAM_MEMBERS } from '../constants';
import { Balloon } from './Balloon';
import type { Problem } from '../types';

interface ProblemCardProps {
  problem: Problem;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export const ProblemCard = ({ problem, onUpdateStatus, onDelete }: ProblemCardProps) => {
  const platformStyle = PLATFORMS.find(p => p.name === problem.platform) || PLATFORMS[3];
  
  // Mapping statuses to ICPC/OJ verdicts
  const statusConfig: Record<string, { label: string; color: string; next: string; bg: string }> = {
    'Todo': { label: 'New', color: 'text-gray-400', next: 'InProgress', bg: 'bg-gray-100' },
    'InProgress': { label: 'Running', color: 'text-amber-500', next: 'Review', bg: 'bg-amber-50' },
    'Review': { label: 'Testing', color: 'text-blue-500', next: 'Done', bg: 'bg-blue-50' },
    'Done': { label: 'AC', color: 'text-green-600', next: 'Todo', bg: 'bg-green-100' }
  };

  const currentStatus = statusConfig[problem.status] || statusConfig['Todo'];
  const balloonColor = BALLOON_COLORS[problem.difficulty as keyof typeof BALLOON_COLORS] || '#999';

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 relative overflow-hidden transition-all hover:shadow-md">
      {/* Balloon for AC problems */}
      {problem.status === 'Done' && (
        <div className="absolute top-0 right-12 animate-in slide-in-from-top-4 duration-500">
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
        
        <button 
          onClick={() => onUpdateStatus(problem.id, currentStatus.next)}
          className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all font-bold text-xs ${currentStatus.bg} ${currentStatus.color}`}
        >
          {currentStatus.label}
        </button>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
        <div className="flex -space-x-2">
           {problem.assignees?.map((userId: string, idx: number) => {
             const member = TEAM_MEMBERS.find(m => m.id === userId);
             return member ? (
               <div key={idx} className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${member.avatar}`}>
                 {member.name[0]}
               </div>
             ) : null;
           })}
           <button className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 text-[10px]">
             +
           </button>
        </div>
        
        <div className="flex gap-2">
          {problem.url && (
            <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500">
              <ExternalLink size={16} />
            </a>
          )}
          <button onClick={() => onDelete(problem.id)} className="text-gray-400 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
