import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { FindPage } from './pages/FindPage';
import { SavePage } from './pages/SavePage';
import { DealGuidePage } from './pages/DealGuidePage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { GovernancePage } from './pages/admin/GovernancePage';
import { MetadataPage } from './pages/admin/MetadataPage';
import { SettingsPage } from './pages/admin/SettingsPage';

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash || '#/find');

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#/find');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let Component = FindPage;
  
  // Simple Router Logic
  if (route.startsWith('#/save')) Component = SavePage;
  else if (route.startsWith('#/deal-guide')) Component = DealGuidePage;
  
  // Admin Routes
  else if (route === '#/admin' || route === '#/admin/analytics') Component = AnalyticsPage;
  else if (route === '#/admin/governance') Component = GovernancePage;
  else if (route === '#/admin/metadata') Component = MetadataPage;
  else if (route === '#/admin/settings') Component = SettingsPage;
  
  return (
    <Layout currentRoute={route}>
      <Component />
    </Layout>
  );
};

export default App;