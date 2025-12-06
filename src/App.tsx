import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  ListTodo, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Circle, 
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Trash2,
  X,
  BarChart3,
  Trophy,
  Flame,
  Medal,
  Calendar,
  Timer
} from 'lucide-react';
import { auth, db, appId } from './lib/firebase';
import { 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';



// --- Constants & Styles ---
const COLORS = {
  primary: '#2196F3',
  primaryContainer: '#E3F2FD',
  onPrimaryContainer: '#1565C0',
  accent: '#4CAF50',
  accentContainer: '#E8F5E9',
  onAccentContainer: '#2E7D32',
  warning: '#FFC107',
  surface: '#FFFFFF',
  background: '#F5F7FA',
  text: '#1A1C1E',
  textSecondary: '#444746'
};

const PLATFORMS = [
  { name: 'Codeforces', color: 'bg-red-100 text-red-800' },
  { name: 'LeetCode', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'AtCoder', color: 'bg-slate-800 text-white' },
  { name: 'Other', color: 'bg-gray-100 text-gray-800' }
];

const TAGS = [
  { name: 'DP', color: 'bg-purple-100 text-purple-700' },
  { name: 'Graph', color: 'bg-blue-100 text-blue-700' },
  { name: 'Greedy', color: 'bg-green-100 text-green-700' },
  { name: 'Math', color: 'bg-orange-100 text-orange-700' },
  { name: 'Impl', color: 'bg-gray-100 text-gray-700' },
  { name: 'Strings', color: 'bg-pink-100 text-pink-700' }
];

const TEAM_MEMBERS = [
  { id: '1', name: 'You', avatar: 'bg-blue-500', role: 'Captain', solved: 142, penalty: 1240, status: 'Online' },
  { id: '2', name: 'Alice', avatar: 'bg-emerald-500', role: 'Coder', solved: 89, penalty: 980, status: '2m ago' },
  { id: '3', name: 'Bob', avatar: 'bg-indigo-500', role: 'Math', solved: 64, penalty: 1500, status: '1h ago' },
  { id: '4', name: 'Charlie', avatar: 'bg-amber-500', role: 'Tester', solved: 112, penalty: 1100, status: 'Online' }
];

const UPCOMING_CONTESTS = [
  { id: 1, name: 'Codeforces Round 992 (Div. 2)', time: '2h 30m', platform: 'Codeforces' },
  { id: 2, name: 'AtCoder Beginner Contest 334', time: '1d 4h', platform: 'AtCoder' }
];

// Map difficulty/tags to balloon colors for ICPC flair
const BALLOON_COLORS = {
  'Easy': '#4CAF50',   // Green
  'Medium': '#2196F3', // Blue
  'Hard': '#F44336',   // Red
  'Math': '#FFC107',   // Yellow
  'DP': '#9C27B0',     // Purple
  'Graph': '#FF5722',  // Orange
};

const MOCK_PROBLEMS = [
  {
    id: 'mock-1',
    title: '1899A. Game with Integers',
    platform: 'Codeforces',
    difficulty: 'Easy',
    status: 'Done',
    tags: ['Math', 'Impl'],
    assignees: ['1', '2'],
    url: 'https://codeforces.com/problemset/problem/1899/A',
    createdAt: { seconds: 1700000000 }
  },
  {
    id: 'mock-2',
    title: 'Two Sum',
    platform: 'LeetCode',
    difficulty: 'Easy',
    status: 'Done',
    tags: ['Impl', 'Hash'],
    assignees: ['3'],
    url: 'https://leetcode.com/problems/two-sum/',
    createdAt: { seconds: 1700100000 }
  },
  {
    id: 'mock-3',
    title: 'C - Vacation',
    platform: 'AtCoder',
    difficulty: 'Medium',
    status: 'InProgress',
    tags: ['DP'],
    assignees: ['1'],
    url: '#',
    createdAt: { seconds: 1700200000 }
  },
  {
    id: 'mock-4',
    title: 'Dijkstra Shortest Path',
    platform: 'Other',
    difficulty: 'Hard',
    status: 'Todo',
    tags: ['Graph', 'Greedy'],
    assignees: ['4'],
    url: '#',
    createdAt: { seconds: 1700300000 }
  },
  {
    id: 'mock-5',
    title: 'Longest Palindromic Substring',
    platform: 'LeetCode',
    difficulty: 'Medium',
    status: 'Review',
    tags: ['Strings', 'DP'],
    assignees: ['2', '3'],
    url: '#',
    createdAt: { seconds: 1700400000 }
  }
];

// --- Components ---

// ICPC Balloon Component
const Balloon = ({ color, size = 24, className = "" }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 24 32" fill="none" className={`drop-shadow-sm ${className}`}>
    {/* String */}
    <path d="M12 24V30" stroke="#999" strokeWidth="1.5" />
    <path d="M12 24L10 26M12 24L14 26" stroke="#999" strokeWidth="1.5" />
    {/* Balloon Body */}
    <path d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0Z" fill={color} />
    {/* Shine */}
    <ellipse cx="8" cy="8" rx="3" ry="4" fill="white" fillOpacity="0.3" transform="rotate(-30 8 8)" />
  </svg>
);

const ProgressBar = ({ progress, color = 'bg-blue-500' }) => (
  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
    <div 
      className={`h-full ${color} transition-all duration-500 ease-out`} 
      style={{ width: `${progress}%` }}
    />
  </div>
);

const Chip = ({ label, className, onClick, active }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      active 
        ? 'bg-blue-600 text-white border-blue-600' 
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    } ${className}`}
  >
    {label}
  </button>
);

const ProblemCard = ({ problem, onUpdateStatus, onDelete }) => {
  const platformStyle = PLATFORMS.find(p => p.name === problem.platform) || PLATFORMS[3];
  
  // Mapping statuses to ICPC/OJ verdicts
  const statusConfig = {
    'Todo': { label: 'New', color: 'text-gray-400', next: 'InProgress', bg: 'bg-gray-100' },
    'InProgress': { label: 'Running', color: 'text-amber-500', next: 'Review', bg: 'bg-amber-50' },
    'Review': { label: 'Testing', color: 'text-blue-500', next: 'Done', bg: 'bg-blue-50' },
    'Done': { label: 'AC', color: 'text-green-600', next: 'Todo', bg: 'bg-green-100' }
  };

  const currentStatus = statusConfig[problem.status] || statusConfig['Todo'];
  const balloonColor = BALLOON_COLORS[problem.difficulty] || '#999';

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
            {problem.tags?.map(tag => (
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
           {problem.assignees?.map((userId, idx) => {
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

const AddProblemSheet = ({ isOpen, onClose, onAdd }) => {
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    platform: 'Codeforces',
    difficulty: 'Easy',
    tags: [],
    assignees: ['1']
  });

  const handleUrlPaste = (e) => {
    const val = e.target.value;
    setUrl(val);
    if (val.length > 5) {
      setIsParsing(true);
      setTimeout(() => {
        let detectedPlatform = 'Other';
        let detectedTitle = '';
        
        if (val.includes('codeforces')) {
            detectedPlatform = 'Codeforces';
            detectedTitle = '1899A. Game with Integers';
        } else if (val.includes('leetcode')) {
            detectedPlatform = 'LeetCode';
            detectedTitle = 'Two Sum';
        } else if (val.includes('atcoder')) {
            detectedPlatform = 'AtCoder';
            detectedTitle = 'ABC 321 - D';
        }

        setForm(prev => ({
          ...prev,
          platform: detectedPlatform,
          title: detectedTitle || prev.title,
          url: val
        }));
        setIsParsing(false);
      }, 800);
    }
  };

  const toggleTag = (tagName) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName) 
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Problem</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Quick Import URL</label>
            <div className="relative">
              <input 
                type="text" 
                value={url}
                onChange={handleUrlPaste}
                placeholder="Paste Codeforces/LeetCode link..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              {isParsing && (
                <div className="absolute right-3 top-3.5">
                   <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
            <input 
              type="text" 
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              placeholder="Problem Name"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Platform</label>
              <select 
                value={form.platform}
                onChange={(e) => setForm({...form, platform: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLATFORMS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Difficulty</label>
              <select 
                value={form.difficulty}
                onChange={(e) => setForm({...form, difficulty: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag.name}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    form.tags.includes(tag.name)
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500 ring-offset-1'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              if(!form.title) return;
              onAdd({
                ...form,
                status: 'Todo',
                createdAt: serverTimestamp()
              });
              onClose();
            }}
            disabled={!form.title}
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            Add Problem
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function Silver() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('problems');
  const [problems, setProblems] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filter, setFilter] = useState('All');

  // --- Auth & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      await signInAnonymously(auth);
    };
    initAuth();
    
    return onAuthStateChanged(auth, setUser);
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
      }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProblems(data);
    }, (error) => {
      console.error("Firestore Error:", error);
      setProblems(MOCK_PROBLEMS);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const handleAddProblem = async (problemData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'problems'), problemData);
    } catch (e) {
      console.error("Add failed", e);
      const newProblem = { id: `local-${Date.now()}`, ...problemData, createdAt: { seconds: Date.now() / 1000 } };
      setProblems(prev => [newProblem, ...prev]);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
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

  const handleDelete = async (id) => {
    if (id.startsWith('mock-')) {
       if (confirm('Delete this mock problem?')) {
         setProblems(prev => prev.filter(p => p.id !== id));
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
    
    const tags = {};
    problems.forEach(p => {
      p.tags?.forEach(t => tags[t] = (tags[t] || 0) + 1);
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
                 <Balloon color={BALLOON_COLORS[p.difficulty] || '#4CAF50'} size={32} />
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
