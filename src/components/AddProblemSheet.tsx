import { useState } from 'react';
import { X } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { PLATFORMS, TAGS } from '../constants';
import type { Problem } from '../types';

interface AddProblemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (problemData: Omit<Problem, 'id'>) => void;
}

interface ToggleTagFn {
  (tagName: string): void;
}

export const AddProblemSheet = ({ isOpen, onClose, onAdd }: AddProblemSheetProps) => {
  const [url, setUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);
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
    assignees: ['1']
  });

  const handleUrlPaste = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setUrl(val);
    if (val.length > 5) {
      setIsParsing(true);
      setTimeout(() => {
        let detectedPlatform: string = 'Other';
        let detectedTitle: string = '';
        
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

        setForm((prev: typeof form) => ({
          ...prev,
          platform: detectedPlatform,
          title: detectedTitle || prev.title,
          url: val
        }));
        setIsParsing(false);
      }, 800);
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
