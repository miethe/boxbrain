
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { OpportunityWizard } from './components/OpportunityWizard';
import { PlayCatalog } from './components/PlayCatalog';
import { AssetLibrary } from './components/AssetLibrary';
import { OpportunityBoard } from './components/OpportunityBoard';
import { OpportunityPlaybook } from './components/OpportunityPlaybook';
import { PlayDetailModal } from './components/PlayDetailModal';
import { AssetDetailModal } from './components/AssetDetailModal';
import { AddAssetModal } from './components/AddAssetModal';
import { AddAssetScreen } from './components/AddAssetScreen';
import { AddPlayModal } from './components/AddPlayModal';
import { AddOpportunityModal } from './components/AddOpportunityModal';
import { AdminPage } from './components/AdminPage';
import { Modal } from './components/ui/Modal';
import { ViewState, Play, Asset, Opportunity } from './types';
import { getDictionary, getPlays, getAssets, getPlayById, getAssetById, getOpportunities, getOpportunityById } from './services/dataService';

export default function App() {
  const [view, setView] = useState<ViewState>('opportunity-guide');
  const [dictionary, setDictionary] = useState<any>({}); // TODO: Type properly
  const [plays, setPlays] = useState<Play[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const fetchData = async () => {
    try {
      const [dictData, playsData, assetsData, oppsData] = await Promise.all([
        getDictionary(),
        getPlays(),
        getAssets(),
        getOpportunities()
      ]);
      setDictionary(dictData);
      setPlays(playsData);
      setAssets(assetsData);
      setOpportunities(oppsData);
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal State
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Add Asset Modal State
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddPlayModalOpen, setIsAddPlayModalOpen] = useState(false);
  const [isAddOppModalOpen, setIsAddOppModalOpen] = useState(false);

  // Edit State
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingPlay, setEditingPlay] = useState<Play | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  // Opportunity Selection
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);

  // Handle Hash Routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash.startsWith('opportunity-playbook/')) {
        const oppId = hash.split('/')[1];
        setSelectedOppId(oppId);
        setView('opportunity-playbook');
        return;
      }

      if (hash === 'add-asset') {
        setView('add-asset');
        return;
      }

      if (['opportunity-guide', 'catalog', 'assets', 'admin', 'opportunity-board'].includes(hash)) {
        setView(hash as ViewState);
        setSelectedOppId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    // Init
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const changeView = (newView: ViewState) => {
    window.location.hash = newView;
    setView(newView);
  };

  const handleViewPlay = (playId: string) => {
    setSelectedPlayId(playId);
    setSelectedAssetId(null);
  };

  const handleViewAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    // Keep context if we are in a playbook, but close Play modal if it's open
    if (selectedPlayId) setSelectedPlayId(null);
  };

  const handleCloseModal = () => {
    setSelectedPlayId(null);
    setSelectedAssetId(null);
  };

  const handleSelectOpportunity = (id: string) => {
    setSelectedOppId(id);
    window.location.hash = `opportunity-playbook/${id}`;
  };

  const handleNavigateBackFromPlaybook = () => {
    changeView('opportunity-board');
  };

  const handleAddToOpportunity = async (oppId: string) => {
    // Refresh opportunities list
    const opps = await getOpportunities();
    setOpportunities(opps);
    handleSelectOpportunity(oppId);
  };

  // Add Asset Handlers
  const handleOpenAddAssetModal = () => {
    setEditingAsset(null); // Ensure clean state
    setIsAddAssetModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAddAssetModalOpen(true);
  };

  const handleCloseAddAssetModal = () => {
    setIsAddAssetModalOpen(false);
    setEditingAsset(null);
  };

  const handleSaveNewAsset = async (newAsset: Asset) => {
    // Refresh asset list logic if needed, currently assetsStore is updated in createAsset
    const updatedAssets = await getAssets();
    setAssets(updatedAssets);
    setIsAddAssetModalOpen(false);

    // If we were in the full screen view, go back to assets
    if (view === 'add-asset') {
      changeView('assets');
    }

    // Optionally open the new asset
    handleViewAsset(newAsset.id);
  };

  const handleSwitchToAdvancedAdd = () => {
    setIsAddAssetModalOpen(false);
    changeView('add-asset');
  };

  // Add Play Handlers
  const handleSaveNewPlay = async (newPlay: Play) => {
    const updatedPlays = await getPlays();
    setPlays(updatedPlays);
    setIsAddPlayModalOpen(false);
    setEditingPlay(null);
    handleViewPlay(newPlay.id as string);
  };

  const handleEditPlay = (play: Play) => {
    setEditingPlay(play);
    setIsAddPlayModalOpen(true);
  };

  // Add Opportunity Handlers
  const handleSaveNewOpp = async (newOpp: Opportunity) => {
    const updatedOpps = await getOpportunities();
    setOpportunities(updatedOpps);
    setIsAddOppModalOpen(false);
    setEditingOpportunity(null);
    handleSelectOpportunity(newOpp.id);
  };

  const handleEditOpportunity = (opp: Opportunity) => {
    setEditingOpportunity(opp);
    setIsAddOppModalOpen(true);
  };

  const selectedPlay = selectedPlayId ? plays.find(p => p.id === selectedPlayId) : null;
  const selectedAsset = selectedAssetId ? assets.find(a => a.id === selectedAssetId) : null;
  const selectedOpportunity = selectedOppId ? opportunities.find(o => o.id === selectedOppId) : null;

  return (
    <Layout currentView={view} onChangeView={changeView} onAddAsset={handleOpenAddAssetModal}>
      {view === 'opportunity-guide' && (
        <OpportunityWizard
          dictionary={dictionary}
          plays={plays}
          onViewPlay={handleViewPlay}
          onSave={handleSaveNewOpp}
        />
      )}

      {view === 'catalog' && (
        <PlayCatalog
          plays={plays}
          dictionary={dictionary}
          onViewPlay={handleViewPlay}
          onAddToOpportunity={handleAddToOpportunity}
          onAddPlay={() => {
            setEditingPlay(null);
            setIsAddPlayModalOpen(true);
          }}
          onEditPlay={handleEditPlay}
        />
      )}

      {view === 'assets' && (
        <AssetLibrary
          assets={assets}
          dictionary={dictionary}
          onViewAsset={handleViewAsset}
          onAddAsset={handleOpenAddAssetModal}
          onEditAsset={handleEditAsset}
        />
      )}

      {view === 'add-asset' && (
        <AddAssetScreen
          dictionary={dictionary}
          onSave={handleSaveNewAsset}
          onCancel={() => changeView('assets')}
        />
      )}

      {view === 'opportunity-board' && (
        <OpportunityBoard
          opportunities={opportunities}
          onSelectOpportunity={handleSelectOpportunity}
          onAddOpportunity={() => {
            setEditingOpportunity(null);
            setIsAddOppModalOpen(true);
          }}
          onEditOpportunity={handleEditOpportunity}
        />
      )}

      {view === 'opportunity-playbook' && selectedOpportunity && (
        <OpportunityPlaybook
          opportunity={selectedOpportunity}
          onNavigateBack={handleNavigateBackFromPlaybook}
          onViewPlay={handleViewPlay}
          onViewAsset={handleViewAsset}
        />
      )}

      {view === 'admin' && (
        <AdminPage
          dictionary={dictionary}
          onRefresh={fetchData}
        />
      )}

      {/* Play Detail Modal */}
      <Modal
        isOpen={!!selectedPlay}
        onClose={handleCloseModal}
        title={selectedPlay?.title}
      >
        {selectedPlay && (
          <PlayDetailModal
            play={selectedPlay}
            dictionary={dictionary}
            onClose={handleCloseModal}
            onViewAsset={handleViewAsset}
          />
        )}
      </Modal>

      {/* Asset Detail Modal */}
      <Modal
        isOpen={!!selectedAsset}
        onClose={handleCloseModal}
        title={selectedAsset?.title}
      >
        {selectedAsset && (
          <AssetDetailModal
            asset={selectedAsset}
            dictionary={dictionary}
            onClose={handleCloseModal}
            onViewPlay={handleViewPlay}
          />
        )}
      </Modal>

      {/* Add Asset Modal */}
      <Modal
        isOpen={isAddAssetModalOpen}
        onClose={handleCloseAddAssetModal}
        title="Add New Asset"
        maxWidth="max-w-4xl"
      >
        <AddAssetModal
          dictionary={dictionary}
          onClose={handleCloseAddAssetModal}
          onSave={handleSaveNewAsset}
          onAdvancedMode={handleSwitchToAdvancedAdd}
          initialData={editingAsset || undefined}
        />
      </Modal>

      {/* Add Play Modal */}
      <Modal
        isOpen={isAddPlayModalOpen}
        onClose={() => {
          setIsAddPlayModalOpen(false);
          setEditingPlay(null);
        }}
        title={editingPlay ? "Edit Play" : "Create New Play"}
        maxWidth="max-w-4xl"
      >
        <AddPlayModal
          dictionary={dictionary}
          onClose={() => {
            setIsAddPlayModalOpen(false);
            setEditingPlay(null);
          }}
          onSave={handleSaveNewPlay}
          initialData={editingPlay || undefined}
        />
      </Modal>

      {/* Add Opportunity Modal */}
      <Modal
        isOpen={isAddOppModalOpen}
        onClose={() => {
          setIsAddOppModalOpen(false);
          setEditingOpportunity(null);
        }}
        title={editingOpportunity ? "Edit Opportunity" : "New Opportunity"}
        maxWidth="max-w-4xl"
      >
        <AddOpportunityModal
          dictionary={dictionary}
          onClose={() => {
            setIsAddOppModalOpen(false);
            setEditingOpportunity(null);
          }}
          onSave={handleSaveNewOpp}
          initialData={editingOpportunity || undefined}
        />
      </Modal>

    </Layout>
  );
}
