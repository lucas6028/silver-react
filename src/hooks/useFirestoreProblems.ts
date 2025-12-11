import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove, query, where, getDoc } from 'firebase/firestore';
import type { Problem, Notification } from '../types';
import type { User } from 'firebase/auth';

export const useFirestoreProblems = (
  user: User | null, 
  onCreateNotification?: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>
) => {
  const [problems, setProblems] = useState<Problem[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'problems'),
      where('assignees', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setProblems([]);
        return;
      }

      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Problem[];
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProblems(data);
    }, (error) => {
      console.error('Firestore Error:', error);
      setProblems([]);
    });

    return () => unsubscribe();
  }, [user]);

  const addProblem = async (problemData: Omit<Problem, 'id'>) => {
    if (!user) return;
    const assignees = problemData.assignees && problemData.assignees.length > 0
      ? [...new Set([user.uid, ...problemData.assignees])]
      : [user.uid];
    try {
      const localId = `local-${Date.now()}`;
      const optimisticProblem: Problem = { id: localId, ...problemData, assignees, createdBy: user.uid } as Problem;
      setProblems(prev => [optimisticProblem, ...prev]);

      await addDoc(
        collection(db, 'problems'),
        { ...problemData, assignees, createdAt: problemData.createdAt || serverTimestamp(), createdBy: user.uid }
      );

      setProblems(prev => prev.filter(p => p.id !== localId));
    } catch (e) {
      console.error('Add failed', e);
      const newProblem: Problem = { id: `local-${Date.now()}`, ...problemData, assignees, createdAt: { seconds: Date.now() / 1000 }, createdBy: user.uid };
      setProblems(prev => [newProblem, ...prev]);
    }
  };

  const updateStatus = async (id: string, newStatus: string, balloonColor?: string) => {
    const updateData: Partial<Problem> = { status: newStatus };
    if (newStatus === 'Done' && balloonColor) updateData.balloonColor = balloonColor;

    setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updateData } : p));

    if (id.startsWith('local-')) return;
    if (!user) return;

    try {
      await updateDoc(doc(db, 'problems', id), updateData);
    } catch (e) { console.error(e); }
  };

  const deleteProblem = async (id: string) => {
    if (id.startsWith('local-')) return setProblems(prev => prev.filter(p => p.id !== id));
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'problems', id));
    } catch (e) { console.error(e); }
  };

  const assignToMe = async (id: string) => {
    if (!user) return;
    if (id.startsWith('local-')) {
      setProblems(prev => prev.map(p => p.id === id ? { ...p, assignees: Array.from(new Set([...(p.assignees || []), user.uid])) } : p));
      return;
    }
    try {
      await updateDoc(doc(db, 'problems', id), {
        assignees: arrayUnion(user.uid)
      });
    } catch (e) { console.error(e); }
  };

  const updateProblem = async (id: string, updateData: Partial<Omit<Problem, 'id'>>) => {
    setProblems(prev => prev.map(p => p.id === id ? { ...p, ...updateData } : p));

    if (id.startsWith('local-')) return;
    if (!user) return;

    try {
      await updateDoc(doc(db, 'problems', id), updateData);
    } catch (e) { console.error(e); }
  };

  const toggleAssignee = async (id: string, uid: string, assign: boolean) => {
    // Optimistic UI update
    setProblems(prev => prev.map(p => p.id === id ? { ...p, assignees: assign ? Array.from(new Set([...(p.assignees || []), uid])) : (p.assignees || []).filter(a => a !== uid) } : p));
    if (id.startsWith('local-')) {
      return;
    }
    if (!user) return;

    try {
      if (assign) {
        await updateDoc(doc(db, 'problems', id), { assignees: arrayUnion(uid) });
        
        // Create notification only when assigning (not unassigning) and not assigning to self
        if (user.uid !== uid && onCreateNotification) {
          // Get problem details for notification
          const problemDoc = await getDoc(doc(db, 'problems', id));
          if (problemDoc.exists()) {
            const problemData = problemDoc.data() as Problem;
            await onCreateNotification({
              userId: uid,
              problemId: id,
              problemTitle: problemData.title,
              assignedBy: user.uid,
              assignedByName: user.displayName || user.email || 'Someone'
            });
          }
        }
      } else {
        await updateDoc(doc(db, 'problems', id), { assignees: arrayRemove(uid) });
      }
    } catch (e) { console.error(e); }
  };

  return {
    problems,
    addProblem,
    updateStatus,
    updateProblem,
    deleteProblem,
    assignToMe,
    toggleAssignee,
    setProblems,
  };
};
