import { useState } from 'react';
import MarkdownRenderer from '../common/MarkdownRenderer';

export default function MarkdownEditor({ value, onChange }) {
  const [mode, setMode] = useState('edit');

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-3">
        <button
          onClick={() => setMode('edit')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'edit'
              ? 'text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Edit
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'preview'
              ? 'text-amber-600 border-b-2 border-amber-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Preview
        </button>
      </div>

      {mode === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-forge-500 focus:border-transparent"
          placeholder="Write markdown here..."
        />
      ) : (
        <div className="min-h-[24rem] border border-gray-200 rounded-lg p-4 bg-white overflow-auto">
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-gray-400 text-sm italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
