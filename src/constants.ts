export const COLORS = {
  primary: '#2196F3', // Vibrant Blue
  primaryContainer: '#E3F2FD',
  onPrimaryContainer: '#1565C0',
  accent: '#4CAF50', // Green
  accentContainer: '#E8F5E9',
  onAccentContainer: '#2E7D32',
  warning: '#FFC107', // Amber
  surface: '#FFFFFF',
  background: '#F5F7FA',
  text: '#1A1C1E',
  textSecondary: '#444746'
};

export const PLATFORMS = [
  { name: 'Codeforces', color: 'bg-red-100 text-red-800' },
  { name: 'LeetCode', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'AtCoder', color: 'bg-slate-800 text-white' },
  { name: 'Other', color: 'bg-gray-100 text-gray-800' }
];

export const TAGS = [
  { name: 'DP', color: 'bg-purple-100 text-purple-700' },
  { name: 'Graph', color: 'bg-blue-100 text-blue-700' },
  { name: 'Greedy', color: 'bg-green-100 text-green-700' },
  { name: 'Math', color: 'bg-orange-100 text-orange-700' },
  { name: 'Impl', color: 'bg-gray-100 text-gray-700' },
  { name: 'Strings', color: 'bg-pink-100 text-pink-700' }
];

export const TEAM_MEMBERS = [
  { id: '1', name: 'You', avatar: 'bg-blue-500', role: 'Captain', solved: 142, penalty: 1240, status: 'Online' },
  { id: '2', name: 'Alice', avatar: 'bg-emerald-500', role: 'Coder', solved: 89, penalty: 980, status: '2m ago' },
  { id: '3', name: 'Bob', avatar: 'bg-indigo-500', role: 'Math', solved: 64, penalty: 1500, status: '1h ago' },
  { id: '4', name: 'Charlie', avatar: 'bg-amber-500', role: 'Tester', solved: 112, penalty: 1100, status: 'Online' }
];

export const UPCOMING_CONTESTS = [
  { id: 1, name: 'Codeforces Round 992 (Div. 2)', time: '2h 30m', platform: 'Codeforces' },
  { id: 2, name: 'AtCoder Beginner Contest 334', time: '1d 4h', platform: 'AtCoder' }
];

export const BALLOON_COLORS = {
  'Easy': '#4CAF50',   // Green
  'Medium': '#2196F3', // Blue
  'Hard': '#F44336',   // Red
  'Math': '#FFC107',   // Yellow
  'DP': '#9C27B0',     // Purple
  'Graph': '#FF5722',  // Orange
};

export const MOCK_PROBLEMS = [
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
