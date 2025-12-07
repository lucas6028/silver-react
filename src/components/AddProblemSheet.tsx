import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// Remove direct dependency on firestore sentinel here; App will set timestamps.
import { PLATFORMS, TAGS, TEAM_MEMBERS } from '../constants';
import type { TeamMember } from '../types';
import type { Problem } from '../types';
import { scrapeProblemDetails } from '../lib/problemScraper';

interface AddProblemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (problemData: Omit<Problem, 'id'>) => void;
  currentUserId?: string | null;
  members?: TeamMember[] | null;
}

interface ToggleTagFn {
  (tagName: string): void;
}

export const AddProblemSheet = ({ isOpen, onClose, onAdd, currentUserId, members }: AddProblemSheetProps) => {
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  type ProblemForm = {
    title: string;
    platform: string;
    difficulty: string;
    tags: string[];
    assignees: string[];
    url?: string;
  };

  const [form, setForm] = useState<ProblemForm>({
    title: '',
    platform: 'Codeforces',
    difficulty: 'Easy',
    tags: [],
    assignees: currentUserId ? [currentUserId] : []
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: '',
        platform: 'Codeforces',
        difficulty: 'Easy',
        tags: [],
        assignees: currentUserId ? [currentUserId] : []
      });
      setUrl('');
      setIsParsing(false);
      setParseError(null);
    }
  }, [isOpen, currentUserId]);

  const handleUrlPaste = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const val = e.target.value;
    setUrl(val);
    setParseError(null);
    
    if (val.length > 10) {
      setIsParsing(true);
      
      try {
        const problemData = await scrapeProblemDetails(val);
        
        if (problemData) {
          setForm((prev) => ({
            ...prev,
            title: problemData.title,
            platform: problemData.platform,
            difficulty: problemData.difficulty || prev.difficulty,
            tags: problemData.tags || prev.tags,
            url: val
          }));
        } else {
          setParseError('Unable to fetch problem details. Please enter manually.');
          // Still try to detect platform from URL
          let detectedPlatform = 'Other';
          if (val.includes('leetcode')) detectedPlatform = 'LeetCode';
          else if (val.includes('codeforces')) detectedPlatform = 'Codeforces';
          else if (val.includes('atcoder')) detectedPlatform = 'AtCoder';
          
          setForm((prev) => ({
            ...prev,
            platform: detectedPlatform,
            url: val
          }));
        }
      } catch (error) {
        console.error('Error scraping problem:', error);
        setParseError('Failed to fetch problem details. Please check your connection.');
      } finally {
        setIsParsing(false);
      }
    }
  };

  const toggleTag: ToggleTagFn = (tagName) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const toggleAssignee = (assigneeId: string) => {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(assigneeId)
        ? prev.assignees.filter((id) => id !== assigneeId)
        : [...prev.assignees, assigneeId],
    }));
  };

  type AnyMember = TeamMember | (typeof TEAM_MEMBERS)[number];
  const memberList = (members && members.length > 0 ? members : TEAM_MEMBERS) as AnyMember[];

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
            {parseError && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <span>⚠️</span>
                {parseError}
              </p>
            )}
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

          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {memberList.map((member) => {
                let id: string;
                let label: string;
                type MockMember = (typeof TEAM_MEMBERS)[number];
                if ('uid' in member) {
                  id = (member as TeamMember).uid;
                  label = (member as TeamMember).displayName;
                } else {
                  id = (member as MockMember).id;
                  label = (member as MockMember).name;
                }
                return (
                  <button
                    key={id}
                    onClick={() => toggleAssignee(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.assignees.includes(id)
                        ? 'bg-green-100 text-green-800 ring-2 ring-green-500 ring-offset-1'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <button 
              onClick={() => {
              if(!form.title) return;
              onAdd({
                ...form,
                status: 'Todo'
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
