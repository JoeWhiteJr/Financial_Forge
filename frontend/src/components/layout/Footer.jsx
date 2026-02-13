import { Flame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forge-800 text-forge-300 py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2 text-sm">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Flame size={18} className="text-amber-400" />
          Financial Forge
        </div>
        <p className="text-forge-400">Built for independent finance research teams</p>
        <p className="text-forge-500 text-xs">&copy; {new Date().getFullYear()} Financial Forge</p>
      </div>
    </footer>
  );
}
