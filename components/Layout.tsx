import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, PlusCircle, Compass, Settings, Shield, BarChart2, Database, ChevronDown, ChevronRight, Sliders, Upload, PenTool, Layers } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  // currentRoute prop is deprecated in favor of useLocation
  currentRoute?: string;
}

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Initialize state based on current route to keep sections open
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [contributeExpanded, setContributeExpanded] = useState(false);

  useEffect(() => {
    if (currentPath.startsWith('/admin')) setAdminExpanded(true);
    if (currentPath.startsWith('/save')) setContributeExpanded(true);
  }, [currentPath]);

  const navItems: NavItem[] = [
    { label: 'Find Assets', icon: Search, path: '/find' },
    { label: 'Deal Guide', icon: Compass, path: '/deal-guide' },
  ];

  const contributeSubItems = [
    { label: 'Import & Inbox', path: '/save/import', icon: Upload },
    { label: 'Author New', path: '/save/create', icon: PenTool },
  ];

  const adminSubItems = [
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart2 },
    { label: 'Metadata', path: '/admin/metadata', icon: Database },
    { label: 'Governance', path: '/admin/governance', icon: Shield },
    { label: 'GTM Plays', path: '/admin/plays', icon: Layers },
    { label: 'Settings', path: '/admin/settings', icon: Sliders },
  ];

  const isAdminRoute = currentPath.startsWith('/admin');
  const isContributeRoute = currentPath.startsWith('/save');

  const renderSubItems = (items: typeof adminSubItems) => (
    <div className="mt-1 space-y-1 pl-3 animate-in slide-in-from-top-1 duration-200">
      {items.map(sub => {
        const subActive = currentPath === sub.path || (sub.path === '/admin/analytics' && currentPath === '/admin');
        return (
          <Link
            key={sub.path}
            to={sub.path}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${subActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <sub.icon className="w-4 h-4 mr-3 opacity-75" />
            {sub.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded">KB</span>
            GitKB
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = currentPath === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}

          {/* Contribute Section */}
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              onClick={() => setContributeExpanded(!contributeExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isContributeRoute ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center">
                <PlusCircle className="w-5 h-5 mr-3" />
                Contribute
              </div>
              {contributeExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {contributeExpanded && renderSubItems(contributeSubItems)}
          </div>

          {/* Admin Section */}
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isAdminRoute ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-3" />
                Admin
              </div>
              {adminExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {adminExpanded && renderSubItems(adminSubItems)}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              JD
            </div>
            <div>
              <div className="text-sm font-medium text-white">John Doe</div>
              <div className="text-xs text-slate-500">Admin</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col h-full relative">
        {children}
        {/* Portal Target for FindPage sidebar */}
        <div id="sidebar-refine-portal" className="fixed inset-y-0 left-64 w-64 bg-white border-r border-slate-200 transform z-40 hidden empty:hidden"></div>
      </main>
    </div>
  );
};
