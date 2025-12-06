import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Circle, 
  Users,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { PLATFORMS, TEAM_MEMBERS } from '../constants';

interface ProblemCardProps {
  problem: any;
  onUpdateStatus: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onUpdateStatus, onDelete }) => {
  const platformStyle = PLATFORMS.find(p => p.name === problem.platform) || PLATFORMS[3];
  
  const statusConfig: any = {
    'Todo': { icon: Circle, color: 'text-gray-400', next: 'InProgress' },
    'InProgress': { icon: Clock, color: 'text-amber-500', next: 'Review' },
    'Review': { icon: Users, color: 'text-blue-500', next: 'Done' },
    'Done': { icon: CheckCircle2, color: 'text-green-500', next: 'Todo' }
  };

  const currentStatus = statusConfig[problem.status] || statusConfig['Todo'];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
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
          className={`p-2 rounded-full hover:bg-gray-50 transition-colors ${currentStatus.color}`}
        >
          <StatusIcon size={20} />
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
