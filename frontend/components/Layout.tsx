
import React, { useState, useRef, useEffect } from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, BookOpen, Library, Settings, Search, Plus, FileText, Book, Briefcase } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
  onAddAsset?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, onAddAsset }) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const navItems: { id: ViewState; label: string; icon: React.ReactNode }[] = [
    { id: 'opportunity-guide', label: 'Opportunity Guide', icon: <LayoutDashboard size={20} /> },
    { id: 'opportunity-board', label: 'Opportunity Playbooks', icon: <Briefcase size={20} /> },
    { id: 'catalog', label: 'Play Catalog', icon: <BookOpen size={20} /> },
    { id: 'assets', label: 'Asset Library', icon: <Library size={20} /> },
    { id: 'admin', label: 'Admin', icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAddAsset = () => {
    setIsAddMenuOpen(false);
    if (onAddAsset) onAddAsset();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white font-serif">B</div>
            BoxBrain
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                currentView === item.id || (item.id === 'opportunity-board' && currentView === 'opportunity-playbook')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          v1.0.0 &bull; Practice Architecture
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
            <div className="flex items-center text-slate-500 text-sm">
                <span className="font-semibold text-slate-800">
                    {currentView === 'opportunity-playbook' ? 'Opportunity Workspace' : 
                     currentView === 'add-asset' ? 'Create New Asset' :
                     navItems.find(n => n.id === currentView)?.label}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Global Search..." 
                        className="pl-9 pr-4 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 transition-all"
                    />
                </div>

                {/* Quick Add Dropdown */}
                <div className="relative" ref={addMenuRef}>
                    <button 
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        title="Quick Add"
                    >
                        <Plus size={18} />
                    </button>
                    
                    {isAddMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right z-20">
                            <button onClick={handleQuickAddAsset} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100">
                                <FileText size={16} className="text-indigo-600" />
                                <span>Add Asset</span>
                            </button>
                            <button className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                                <Book size={16} className="text-indigo-600" />
                                <span>Add Play</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    JD
                </div>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-0">
             {/* If current view is playbook or add-asset screen, we want full height, otherwise add padding container */}
            {['opportunity-playbook', 'add-asset'].includes(currentView) ? children : (
                <div className="p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};
