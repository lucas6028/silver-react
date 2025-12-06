import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  Search, 
  CheckCircle2, 
  Medal, 
  Calendar,
  BarChart3,
  Trophy
} from 'lucide-react';
import { auth, db, appId } from './lib/firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  query
} from 'firebase/firestore';

import { 
  TEAM_MEMBERS, 
  UPCOMING_CONTESTS, 
  BALLOON_COLORS, 
  MOCK_PROBLEMS 
} from './constants';

import { Balloon } from './components/Balloon';
import { ProgressBar } from './components/ProgressBar';
import { Chip } from './components/Chip';
import { ProblemCard } from './components/ProblemCard';
import { AddProblemSheet } from './components/AddProblemSheet';
import type { Problem } from './types';

export default function Silver() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('problems');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  // --- Auth & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();
    
    return onAuthStateChanged(auth, (user) => setUser(user));
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'problems'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProblems(MOCK_PROBLEMS);
        return;
      }

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Problem[];
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProblems(data);
    }, (error) => {
      console.error("Firestore Error:", error);
      setProblems(MOCK_PROBLEMS as Problem[]);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const handleAddProblem = async (problemData: Omit<Problem, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'problems'), problemData);
    } catch (e) {
      console.error("Add failed", e);
      const newProblem: Problem = { id: `local-${Date.now()}`, ...problemData, createdAt: { seconds: Date.now() / 1000 } };
      setProblems(prev => [newProblem, ...prev]);
    }
  };

  interface UpdateStatusFn {
    (id: string, newStatus: string): Promise<void>;
  }

  const handleUpdateStatus: UpdateStatusFn = async (id, newStatus) => {
    if (id.startsWith('mock-')) {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      return;
    }
    if (!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'problems', id), {
        status: newStatus
      });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (id.startsWith('mock-')) {
       if (confirm('Delete this mock problem?')) {
         setProblems((prev) => prev.filter((p) => p.id !== id));
       }
       return;
    }
     if (!user) return;
     if (confirm('Delete this problem?')) {
       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'problems', id));
     }
  };

  // --- Derived State ---
  const stats = useMemo(() => {
    const total = problems.length;
    const completed = problems.filter(p => p.status === 'Done').length;
    const inProgress = problems.filter(p => p.status === 'InProgress' || p.status === 'Review').length;
    const pending = problems.filter(p => p.status === 'Todo').length;
    
    const tags: { [key: string]: number } = {};
    problems.forEach(p => {
      p.tags?.forEach((t: string) => tags[t] = (tags[t] || 0) + 1);
    });

    return { total, completed, inProgress, pending, tags };
  }, [problems]);

  const filteredProblems = problems.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Done') return p.status === 'Done';
    if (filter === 'Active') return p.status === 'InProgress' || p.status === 'Review';
    return true;
  });

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Contest Countdown Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-300">
              <Calendar size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Next Contest</span>
            </div>
            <h2 className="text-xl font-bold leading-tight mb-1">{UPCOMING_CONTESTS[0].name}</h2>
            <div className="text-sm text-slate-400">{UPCOMING_CONTESTS[0].platform}</div>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl text-center min-w-[80px] border border-slate-700">
            <div className="text-lg font-mono font-bold text-blue-400">{UPCOMING_CONTESTS[0].time}</div>
            <div className="text-[10px] text-slate-500 uppercase">Starts In</div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <CheckCircle2 size={18} />
            <span className="text-xs font-medium uppercase tracking-wider">Accepted</span>
          </div>
          <div className="text-3xl font-bold">{stats.completed}</div>
          <div className="text-xs opacity-75 mt-1">Problems Solved</div>
        </div>
        
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2 text-amber-500 relative z-10">
            <Medal size={18} />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Balloons</span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
            <div className="text-xs text-gray-400 mt-1">Collected</div>
          </div>
          {/* Decorative Balloons */}
          <div className="absolute -right-2 top-8 flex gap-1 opacity-20">
             <Balloon color="#F44336" size={40} />
             <Balloon color="#2196F3" size={40} className="-ml-4 mt-2" />
          </div>
        </div>
      </div>

      {/* Balloon Collection Shelf */}
      {stats.completed > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            My Collection
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {problems.filter(p => p.status === 'Done').map((p, idx) => (
               <div key={idx} className="flex flex-col items-center gap-1 min-w-[50px]">
                 <Balloon color={BALLOON_COLORS[p.difficulty as keyof typeof BALLOON_COLORS] || '#4CAF50'} size={32} />
                 <span className="text-[9px] text-gray-400 font-mono truncate w-full text-center">{p.platform[0]}</span>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Distribution */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-500"/>
          Topic Coverage
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.tags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 4)
            .map(([tag, count]) => (
            <div key={tag}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{tag}</span>
                <span className="text-gray-500">{count} AC</span>
              </div>
              <ProgressBar progress={(count / stats.total) * 100} color={
                tag === 'DP' ? 'bg-purple-500' : 
                tag === 'Graph' ? 'bg-blue-500' : 'bg-green-500'
              } />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans selection:bg-blue-100">
      {/* Mobile Wrapper */}
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative pb-24 shadow-2xl">
        
        {/* Top App Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-600 flex items-center gap-2">
              Sil<span className="text-gray-900 font-bold">ver</span>
            </h1>
          </div>
          <div className="flex gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <Search size={20} />
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-blue-200 shadow-md">
              Y
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4">
          {view === 'dashboard' && renderDashboard()}
          
          {view === 'problems' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <Chip label="All" active={filter === 'All'} onClick={() => setFilter('All')} />
                <Chip label="Active" active={filter === 'Active'} onClick={() => setFilter('Active')} />
                <Chip label="Accepted" active={filter === 'Done'} onClick={() => setFilter('Done')} />
              </div>
              
              <div className="space-y-1">
                {filteredProblems.map(problem => (
                  <ProblemCard 
                    key={problem.id} 
                    problem={problem} 
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                  />
                ))}
                
                {filteredProblems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <ListTodo size={48} strokeWidth={1} className="mb-4 opacity-50" />
                    <p>No problems found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'team' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <Trophy size={18} className="text-amber-500" />
                     Scoreboard
                   </h3>
                   <span className="text-[10px] font-mono bg-gray-200 px-2 py-1 rounded text-gray-600">FROZEN</span>
                 </div>
                 
                 <div className="divide-y divide-gray-50">
                   {TEAM_MEMBERS.sort((a,b) => b.solved - a.solved).map((member, idx) => (
                     <div key={member.id} className="p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                           idx === 0 ? 'bg-yellow-400 text-white shadow-md shadow-yellow-200' : 'bg-gray-100 text-gray-500'
                         }`}>
                           {idx + 1}
                         </div>
                         <div>
                           <div className="font-bold text-sm text-gray-900">{member.name}</div>
                           <div className="text-[10px] text-gray-400">{member.role}</div>
                         </div>
                       </div>
                       
                       <div className="text-right">
                         <div className="font-bold text-blue-600 text-sm">{member.solved} <span className="text-[10px] text-gray-400 font-normal">AC</span></div>
                         <div className="text-[10px] text-gray-400 font-mono">{member.penalty} min</div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                 <h4 className="font-bold text-blue-900 text-sm mb-2">Team Statistics</h4>
                 <div className="flex justify-between text-xs text-blue-800 mb-1">
                   <span>Rank (World)</span>
                   <span className="font-mono font-bold">#421</span>
                 </div>
                 <div className="flex justify-between text-xs text-blue-800">
                   <span>Rank (Region)</span>
                   <span className="font-mono font-bold">#12</span>
                 </div>
              </div>
            </div>
          )}
        </main>

        {/* FAB (Floating Action Button) */}
        {view === 'problems' && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40"
          >
            <Plus size={28} />
          </button>
        )}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 pb-6 z-40 max-w-md mx-auto">
          <div className="flex justify-around items-center">
            <button 
              onClick={() => setView('dashboard')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutDashboard size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Home</span>
            </button>
            <button 
              onClick={() => setView('problems')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${view === 'problems' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <ListTodo size={24} strokeWidth={view === 'problems' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Problems</span>
            </button>
            <button 
              onClick={() => setView('team')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${view === 'team' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Users size={24} strokeWidth={view === 'team' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Team</span>
            </button>
          </div>
        </nav>

        {/* Modals */}
        <AddProblemSheet 
          isOpen={isAddOpen} 
          onClose={() => setIsAddOpen(false)} 
          onAdd={handleAddProblem}
        />
        
      </div>
    </div>
  );
}
