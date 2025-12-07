import { useEffect, useState } from 'react';
import { db, appId } from '../lib/firebase';
import { doc, onSnapshot, addDoc, collection, query, where, getDocs, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import type { Team, TeamMember, UserProfile } from '../types';
import type { User } from 'firebase/auth';
import { generateTeamCode } from '../lib/utils';

export const useTeams = (_user: User | null, userProfile: UserProfile | null) => {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!userProfile?.teamIds || userProfile.teamIds.length === 0) {
      setTeams([]);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    userProfile.teamIds.forEach((teamId) => {
      const teamDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamId);
      const unsubscribe = onSnapshot(teamDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const teamData = { id: docSnap.id, ...docSnap.data() } as Team;
          setTeams(prev => {
            const filtered = prev.filter(t => t.id !== teamId);
            return [...filtered, teamData];
          });
        } else {
          setTeams(prev => prev.filter(t => t.id !== teamId));
        }
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      setTeams([]);
    };
  }, [userProfile?.teamIds]);

  const createTeam = async (teamName: string, user: User) => {
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
      createdAt: Date.now(),
      createdBy: user.uid
    } as Omit<Team, 'id'>;

    try {
      const teamRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), newTeam);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), { teamIds: arrayUnion(teamRef.id) });
    } catch (error) {
      console.error('Error creating team:', error);
      throw new Error('Failed to create team.');
    }
  };

  const joinTeam = async (teamCode: string, user: User) => {
    try {
      const teamsRef = collection(db, 'artifacts', appId, 'public', 'data', 'teams');
      const q = query(teamsRef, where('code', '==', teamCode));
      const snapshot = await getDocs(q);

      if (snapshot.empty) throw new Error('Team not found');

      const teamDoc = snapshot.docs[0];
      const teamData = teamDoc.data() as Team;
      if (teamData.members.some(m => m.uid === user.uid)) throw new Error('Already a member');

      const now = Date.now();
      const teamMember: TeamMember = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        joinedAt: now,
        role: 'Member'
      };

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamDoc.id), {
        members: arrayUnion(teamMember)
      });

      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
        teamIds: arrayUnion(teamDoc.id)
      });
    } catch (err) {
      console.error('Error joining team', err);
      throw err;
    }
  };

  const leaveTeam = async (teamId: string, user: User, userProfile: UserProfile | null) => {
    if (!user || !userProfile) throw new Error('Missing user/userProfile');
    const currentTeam = teams.find(t => t.id === teamId);
    if (!currentTeam) return;

    const updatedMembers = currentTeam.members.filter(m => m.uid !== user.uid);
    try {
      if (updatedMembers.length === 0) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamId));
      } else {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', teamId), {
          members: updatedMembers
        });
      }

      const updatedTeamIds = (userProfile.teamIds || []).filter(id => id !== teamId);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
        teamIds: updatedTeamIds
      });
    } catch (err) {
      console.error('Error leaving team', err);
      throw err;
    }
  };

  return {
    teams,
    createTeam,
    joinTeam,
    leaveTeam
  };
};
