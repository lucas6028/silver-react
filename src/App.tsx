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
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  setDoc,
  getDocs
} from 'firebase/firestore';

import { 
  UPCOMING_CONTESTS, 
  BALLOON_COLORS, 
  ALL_BALLOON_COLORS
} from './constants';

import { Balloon } from './components/Balloon';
import { ProgressBar } from './components/ProgressBar';
import { Chip } from './components/Chip';
import { ProblemCard } from './components/ProblemCard';
import { AddProblemSheet } from './components/AddProblemSheet';
import { SignInModal } from './components/SignInModal';
import { UserMenu } from './components/UserMenu';
import { FlyingBalloons } from './components/FlyingBalloons';
import { TeamModal } from './components/TeamModal';
import type { FlyingBalloon } from './components/FlyingBalloons';
import type { Problem, Team, UserProfile, TeamMember } from './types';
export default function Silver() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [view, setView] = useState('problems');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [flyingBalloons, setFlyingBalloons] = useState<FlyingBalloon[]>([]);

  const chooseColorForProblem = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % ALL_BALLOON_COLORS.length;
    return ALL_BALLOON_COLORS[idx];
  };

  // --- Auth & Data Sync ---
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsSignInOpen(true);
        setUserProfile(null);
        setTeam(null);
      }
    });
  }, []);

  // Sync user profile
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const profile = { uid: user.uid, ...docSnap.data() } as UserProfile;
        setUserProfile(profile);
      } else {
        // Create user profile if it doesn't exist
        const newProfile: Omit<UserProfile, 'uid'> = {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
        };
        try {
          await setDoc(userDocRef, newProfile);
          setUserProfile({ uid: user.uid, ...newProfile });
        } catch (error) {
          console.error('Error creating user profile:', error);
          // Fallback: set profile without saving to Firestore
          setUserProfile({ uid: user.uid, ...newProfile });
        }
      }
    }, (error) => {
      console.error("Error syncing user profile:", error);
      // Fallback: create a local-only profile
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
      };
      setUserProfile(fallbackProfile);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync team data
  useEffect(() => {
    if (!userProfile?.teamId) {
      return;
    }

    const teamDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'teams', userProfile.teamId);
    
    const unsubscribe = onSnapshot(teamDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setTeam({ id: docSnap.id, ...docSnap.data() } as Team);
      } else {
        setTeam(null);
      }
    });

    return () => {
      unsubscribe();
      setTeam(null);
    };
  }, [userProfile?.teamId]);

  useEffect(() => {
    if (!user) return;
    
    // Query only documents where user is in assignees array
    // (creator is automatically added to assignees on creation)
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'problems'),
      where('assignees', 'array-contains', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProblems([]);
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
      setProblems([]);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const handleAddProblem = async (problemData: Omit<Problem, 'id'>) => {
    if (!user) return;
    // Always include creator in assignees array for security rules compatibility
    const assignees = problemData.assignees && problemData.assignees.length > 0 
      ? [...new Set([user.uid, ...problemData.assignees])] // Ensure creator is always included
      : [user.uid];
    
    try {
      // Optimistic UI: add a local placeholder so users see the new item immediately
      const localId = `local-${Date.now()}`;
      const optimisticProblem: Problem = { id: localId, ...problemData, assignees, createdBy: user.uid } as Problem;
      setProblems(prev => [optimisticProblem, ...prev]);

      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'problems'),
        { ...problemData, assignees, createdAt: problemData.createdAt || serverTimestamp(), createdBy: user.uid }
      );

      // Once Firestore returns the doc id we can remove the optimistic local placeholder
      setProblems(prev => prev.filter(p => p.id !== localId));
      // The new doc will be picked up by the realtime listener and appear in the list
    } catch (e) {
      console.error("Add failed", e);
      const newProblem: Problem = { id: `local-${Date.now()}`, ...problemData, assignees, createdAt: { seconds: Date.now() / 1000 }, createdBy: user.uid };
      setProblems(prev => [newProblem, ...prev]);
    }
  };

  interface UpdateStatusFn {
    (id: string, newStatus: string): Promise<void>;
  }

  const handleUpdateStatus: UpdateStatusFn = async (id, newStatus) => {
    // Prepare update payload
    const updateData: Partial<Problem> = { status: newStatus };
    if (newStatus === 'Done') {
      const chosenColor = chooseColorForProblem(id);
      updateData.balloonColor = chosenColor;
    }

    // Optimistic UI update and immediate celebration
    setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updateData } : p));
    if (newStatus === 'Done' && updateData.balloonColor) {
      spawnFlyingBalloons(updateData.balloonColor as string);
    }

    if (id.startsWith('local-')) {
      return;
    }
    if (!user) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'problems', id), updateData);
    } catch (e) { console.error(e); }
  };

  const spawnFlyingBalloons = (color: string, amount = 4) => {
    const now = Date.now();
    const newBalloons: FlyingBalloon[] = Array.from({ length: amount }).map((_, idx) => ({
      id: `${now}-${Math.round(Math.random()*1e6)}-${idx}`,
      color,
      left: Math.random() * 80 + 10,
      size: 28 + Math.random() * 24,
      duration: 4 + Math.random() * 3,
      delay: Math.random()*0.6
    }));
    setFlyingBalloons(prev => [...prev, ...newBalloons]);
  };

  const handleFlyingBalloonComplete = (id: string) => {
    setFlyingBalloons(prev => prev.filter(b => b.id !== id));
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (id.startsWith('local-')) {
       if (confirm('Delete this local (unsaved) problem?')) {
         setProblems((prev) => prev.filter((p) => p.id !== id));
       }
       return;
    }
     if (!user) return;
     const problemToDelete = problems.find(p => p.id === id);
     if (!problemToDelete) return;
     const isOwner = problemToDelete.createdBy === user.uid;
     const isAssignee = problemToDelete.assignees?.includes(user.uid);
     if (!isOwner && !isAssignee) {
       alert('You are not the owner or assignee of this problem.');
       return;
     }
     if (confirm('Delete this problem?')) {
       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'problems', id));
     }
  };

  const handleAssignToMe = async (id: string): Promise<void> => {
    if (!user) return;
    if (id.startsWith('local-')) {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, assignees: Array.from(new Set([...(p.assignees || []), user.uid])) } : p));
      return;
    }
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'problems', id), {
        assignees: arrayUnion(user.uid)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsSignInOpen(false);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleGithubSignIn = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsSignInOpen(false);
    } catch (error) {
      console.error('GitHub sign-in error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // --- Team Management ---
  const generateTeamCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateTeam = async (teamName: string) => {
    if (!user || !userProfile) throw new Error('You must be signed in to create a team');
    if (userProfile.teamId) throw new Error('You are already in a team');

    const teamCode = generateTeamCode();
    const now = Date.now();
    
    const teamMember: TeamMember = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      joinedAt: now,
      role: 'Captain'
    };

    const newTeam = {
      name: teamName,
      code: teamCode,
      members: [teamMember],
      createdAt: serverTimestamp(),
      createdBy: user.uid
    };

    try {
      const teamRef = await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'teams'),
        newTeam
      );

      // Update user profile with team ID
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
        teamId: teamRef.id
      });
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team. Please check your Firebase security rules.');
    }
  };

  const handleJoinTeam = async (teamCode: string) => {
    if (!user || !userProfile) throw new Error('You must be signed in to join a team');
    if (userProfile.teamId) throw new Error('You are already in a team. Leave your current team first.');

    // Find team by code
    const teamsRef = collection(db, 'artifacts', appId, 'public', 'data', 'teams');
    const q = query(teamsRef, where('code', '==', teamCode));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Team not found. Please check the code and try again.');
    }

    const teamDoc = snapshot.docs[0];
    const teamData = teamDoc.data() as Team;

    // Check if user is already a member
    if (teamData.members.some(m => m.uid === user.uid)) {
      throw new Error('You are already a member of this team');
    }

    const now = Date.now();
    const teamMember: TeamMember = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      joinedAt: now,
      role: 'Member'
    };

    // Add user to team members
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamDoc.id), {
      members: arrayUnion(teamMember)
    });

    // Update user profile with team ID
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
      teamId: teamDoc.id
    });
  };

  const handleLeaveTeam = async () => {
    if (!user || !userProfile || !team) return;

    if (confirm('Are you sure you want to leave this team?')) {
      // Remove user from team members
      const updatedMembers = team.members.filter(m => m.uid !== user.uid);
      
      if (updatedMembers.length === 0) {
        // Delete team if no members left
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', team.id));
      } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', team.id), {
          members: updatedMembers
        });
      }

      // Remove team ID from user profile
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
        teamId: null
      });
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
    if (filter === 'All') return !!user && (p.createdBy === user.uid || p.assignees?.includes(user.uid));
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
                 <Balloon color={p.balloonColor || BALLOON_COLORS[p.difficulty as keyof typeof BALLOON_COLORS] || '#4CAF50'} size={32} />
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
          <div className="flex gap-3 items-center">
            <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <Search size={20} />
            </button>
            {user ? (
              <UserMenu user={user} onSignOut={handleSignOut} />
            ) : (
              <button 
                onClick={() => setIsSignInOpen(true)}
                className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Sign In
              </button>
            )}
            {/* dev button removed */}
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
                    currentUserId={user?.uid}
                    onAssignToMe={handleAssignToMe}
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
              {!team ? (
                // No team - show create/join options
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Team Yet</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Create a team or join an existing one to collaborate with others
                    </p>
                    <button
                      onClick={() => setIsTeamModalOpen(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Create or Join Team
                    </button>
                  </div>
                </div>
              ) : (
                // Has team - show team info
                <>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{team.name}</h2>
                        <div className="flex items-center gap-2 text-blue-100">
                          <Users size={14} />
                          <span className="text-sm">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleLeaveTeam}
                        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Leave
                      </button>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                      <div className="text-xs text-blue-100 mb-1">Team Code</div>
                      <div className="font-mono text-2xl font-bold tracking-widest">{team.code}</div>
                      <div className="text-xs text-blue-100 mt-1">Share this code with others to invite them</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Trophy size={18} className="text-amber-500" />
                        Team Members
                      </h3>
                    </div>
                    
                    <div className="divide-y divide-gray-50">
                      {team.members.map((member) => {
                        const memberProblems = problems.filter(p => p.assignees?.includes(member.uid));
                        const solved = memberProblems.filter(p => p.status === 'Done').length;
                        const total = memberProblems.length;
                        
                        return (
                          <div key={member.uid} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                {member.photoURL ? (
                                  <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{member.displayName[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                  {member.displayName}
                                  {member.uid === user?.uid && (
                                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">You</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400">{member.role || 'Member'}</div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-blue-600 text-sm">
                                {solved}/{total} <span className="text-[10px] text-gray-400 font-normal">AC</span>
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {total > 0 ? Math.round((solved / total) * 100) : 0}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <h4 className="font-bold text-blue-900 text-sm mb-2">Team Statistics</h4>
                    <div className="flex justify-between text-xs text-blue-800 mb-1">
                      <span>Total Problems</span>
                      <span className="font-mono font-bold">{problems.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-blue-800">
                      <span>Solved</span>
                      <span className="font-mono font-bold">{problems.filter(p => p.status === 'Done').length}</span>
                    </div>
                  </div>
                </>
              )}
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
          currentUserId={user?.uid}
        />

        <SignInModal 
          isOpen={isSignInOpen}
          onClose={() => setIsSignInOpen(false)}
          onGoogleSignIn={handleGoogleSignIn}
          onGithubSignIn={handleGithubSignIn}
        />

        <TeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          onCreateTeam={handleCreateTeam}
          onJoinTeam={handleJoinTeam}
        />
        
        <FlyingBalloons balloons={flyingBalloons} onComplete={handleFlyingBalloonComplete} />
        
      </div>
    </div>
  );
}
