
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { FindPage } from './pages/FindPage';
import { SavePage } from './pages/SavePage';
import { CreatePage } from './pages/CreatePage';
import { DealGuidePage } from './pages/DealGuidePage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { GovernancePage } from './pages/admin/GovernancePage';
import { MetadataPage } from './pages/admin/MetadataPage';
import { SettingsPage } from './pages/admin/SettingsPage';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/find');

  useEffect(() => {
    const handleHashChange = () => {
      let hash = window.location.hash || '#/find';
      // Redirect base /save to /save/import
      if (hash === '#/save') {
        window.location.hash = '#/save/import';
        return;
      }
      setRoute(hash);
    }
    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let Component = FindPage;
  
  // Route Matching
  if (route.startsWith('#/save/import')) Component = SavePage;
  else if (route.startsWith('#/save/create')) Component = CreatePage;
  else if (route.startsWith('#/deal-guide')) Component = DealGuidePage;
  
  // Admin Routes
  else if (route === '#/admin' || route === '#/admin/analytics') Component = AnalyticsPage;
  else if (route === '#/admin/governance') Component = GovernancePage;
  else if (route === '#/admin/metadata') Component = MetadataPage;
  else if (route === '#/admin/settings') Component = SettingsPage;
  
  return (
    <Layout currentRoute={route}>
      {/* key={route} forces a complete unmount/remount when the route changes, 
          cleaning up any side effects or portal targets from the previous page */}
      <Component key={route} />
    </Layout>
  );
};

export default App;
