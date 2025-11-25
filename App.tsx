import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FindPage } from './pages/FindPage';
import { SavePage } from './pages/SavePage';
import { CreatePage } from './pages/CreatePage';
import { DealGuidePage } from './pages/DealGuidePage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { GovernancePage } from './pages/admin/GovernancePage';
import { MetadataPage } from './pages/admin/MetadataPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { GTMPlayBuilder } from './pages/GTMPlayBuilder';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout currentRoute={window.location.hash}>
        <Routes>
          <Route path="/" element={<Navigate to="/find" replace />} />
          <Route path="/find" element={<FindPage />} />

          {/* Save Routes */}
          <Route path="/save" element={<Navigate to="/save/import" replace />} />
          <Route path="/save/import" element={<SavePage />} />
          <Route path="/save/create" element={<CreatePage />} />

          <Route path="/deal-guide" element={<DealGuidePage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
          <Route path="/admin/governance" element={<GovernancePage />} />
          <Route path="/admin/metadata" element={<MetadataPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
          <Route path="/admin/plays" element={<GTMPlayBuilder />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
