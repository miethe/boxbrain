import React, { useState } from 'react';
import { Search, PlusCircle, Compass, Settings, Shield, BarChart2, Database, ChevronDown, ChevronRight, Sliders } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: string;
}

type NavItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  subItems?: { label: string; href: string; icon: React.ElementType }[];
};

export const Layout: React.FC<LayoutProps> = ({ children, currentRoute }) => {
  const [adminExpanded, setAdminExpanded] = useState(true);

  const navItems: NavItem[] = [
    { label: 'Find Assets', icon: Search, href: '#/find' },
    { label: 'Contribute', icon: PlusCircle, href: '#/save' },
    { label: 'Deal Guide', icon: Compass, href: '#/deal-guide' },
  ];

  const adminSubItems = [
    { label: 'Analytics', href: '#/admin/analytics', icon: BarChart2 },
    { label: 'Metadata', href: '#/admin/metadata', icon: Database },
    { label: 'Governance', href: '#/admin/governance', icon: Shield },
    { label: 'Settings', href: '#/admin/settings', icon: Sliders },
  ];

  const isAdminRoute = currentRoute.startsWith('#/admin');

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
            const active = currentRoute === item.href || (item.href !== '#/find' && currentRoute.startsWith(item.href) && !item.href.startsWith('#/admin'));
            return (
              <a 
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </a>
            );
          })}

          {/* Nested Admin Section */}
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

             {adminExpanded && (
               <div className="mt-1 space-y-1 pl-3">
                  {adminSubItems.map(sub => {
                     const subActive = currentRoute === sub.href || (sub.href === '#/admin/analytics' && currentRoute === '#/admin');
                     return (
                        <a
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${subActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                           <sub.icon className="w-4 h-4 mr-3 opacity-75" />
                           {sub.label}
                        </a>
                     );
                  })}
               </div>
             )}
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

      <main className="flex-1 overflow-hidden flex flex-col h-full relative">
        {children}
        {/* Portal Target for FindPage sidebar */}
        <div id="sidebar-refine-portal" className="fixed inset-y-0 left-64 w-64 bg-white border-r border-slate-200 transform z-40 hidden empty:hidden"></div>
      </main>
    </div>
  );
};