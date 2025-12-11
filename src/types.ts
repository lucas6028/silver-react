export interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  status: string;
  tags: string[];
  assignees: string[];
  url?: string;
  createdAt?: any;
  createdBy?: string;
  balloonColor?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  members: TeamMember[];
  createdAt: any;
  createdBy: string;
}

export interface TeamMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  joinedAt: number;
  role?: string;
}

export interface UserProfile {
  uid: string;
  teamIds?: string[];
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface Contest {
  id: number;
  name: string;
  platform: string;
  startTimeSeconds?: number;
  durationSeconds?: number;
  time?: string; // formatted time until start
}

export interface Notification {
  id: string;
  userId: string;           // Who receives the notification
  problemId: string;        // Related problem
  problemTitle: string;     // Cached for display
  assignedBy: string;       // Who assigned the problem
  assignedByName: string;   // Cached for display
  isRead: boolean;
  createdAt: any;
}
