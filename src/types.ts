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
  teamId?: string;
  displayName: string;
  email: string;
  photoURL?: string;
}
