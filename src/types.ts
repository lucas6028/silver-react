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
  balloonColor?: string;
}
