
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, Loader2, Trash2, Folder, Archive, MessageSquare, Mail, Info, ArrowRight } from 'lucide-react';
import { api } from '../services/apiClient';
import { SCHEMAS } from '../constants';
import { AssetType, AssetMetadata, SchemaField, Confidentiality, AssetCategory, InboxItem, Asset } from '../types';
import { Button, Input, Select, TextArea, MultiSelect } from '../components/Common';

interface BulkItem {
  id: string;
  file: File;
  metadata: Partial<AssetMetadata>;
  status: 'pending' | 'extracted' | 'error' | 'ready';
}

export const SavePage: React.FC = () => {
  const navigate = useNavigate();
  // General State
  const [activeTab, setActiveTab] = useState<'upload' | 'inbox'>('upload');
  const [step, setStep] = useState<'upload' | 'edit' | 'bulk-edit' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [savedAssets, setSavedAssets] = useState<Asset[]>([]);
  const [options, setOptions] = useState<Record<string, string[]>>({});

  // Single Mode State
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [file, setFile] = useState<File | null>(null);
  // For inbox items, we might not have a raw file, but we have a source label
  const [sourceLabel, setSourceLabel] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Partial<AssetMetadata>>({});

  // Bulk Mode State
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);

  // Inbox State
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [processingInboxId, setProcessingInboxId] = useState<string | null>(null);

  useEffect(() => {
    // Load inbox items on mount
    api.getInbox().then(setInboxItems);

    // Load facets for autocomplete
    api.getFacets().then(facets => {
      setOptions({
        offering: facets.offering?.map(f => f.value) || [],
        related_technologies: facets.related_technologies?.map(f => f.value) || [],
        tags: facets.tags?.map(f => f.value) || [],
      });
    });
  }, []);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setSourceLabel('');
    setFormData({});
    setBulkItems([]);
    setSavedAssets([]);
    setMode('single');
    setLoading(false);
    setProcessingInboxId(null);
    api.getInbox().then(setInboxItems); // Refresh inbox
  };

  // ------------------------------------------------------------------
  // File Handling
  // ------------------------------------------------------------------
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);

      const isMultiple = files.length > 1;
      const isZip = files.length === 1 && files[0].name.endsWith('.zip');

      if (isMultiple || isZip) {
        setMode('bulk');
        setLoading(true);

        let filesToProcess = files;

        if (isZip) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const dummyFiles = [
            new File(["content"], "architectural-diagrams.pdf", { type: "application/pdf" }),
            new File(["content"], "deployment-scripts.tf", { type: "text/plain" }),
            new File(["content"], "client-meeting-notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
          ];
          filesToProcess = dummyFiles;
        }

        const items: BulkItem[] = filesToProcess.map(f => ({
          id: Math.random().toString(36).substr(2, 9),
          file: f,
          metadata: {},
          status: 'pending'
        }));

        setBulkItems(items);
        setStep('bulk-edit');

        // Parallel extraction
        const updatedItems = await Promise.all(items.map(async (item) => {
          try {
            const extracted = await api.extractMetadata(item.file);
            return {
              ...item,
              metadata: {
                ...extracted,
                confidentiality: Confidentiality.InternalOnly,
                owners: ['current.user@example.com']
              },
              status: 'ready' as const
            };
          } catch (e) {
            return { ...item, status: 'error' as const };
          }
        }));

        setBulkItems(updatedItems);
        setLoading(false);

      } else {
        // Single File
        setMode('single');
        const selectedFile = files[0];
        setFile(selectedFile);
        setSourceLabel(selectedFile.name);
        setLoading(true);

        try {
          const extracted = await api.extractMetadata(selectedFile);
          setFormData({
            ...extracted,
            confidentiality: Confidentiality.InternalOnly,
            owners: ['current.user@example.com'],
          });
          setStep('edit');
        } catch (err) {
          console.error(err);
          alert('Failed to extract metadata');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // ------------------------------------------------------------------
  // Inbox Handling
  // ------------------------------------------------------------------
  const handleProcessInboxItem = async (item: InboxItem) => {
    setProcessingInboxId(item.id);
    setLoading(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    setMode('single');
    setFile(null); // No raw file object
    setSourceLabel(`${item.source === 'slack' ? 'Slack Message' : 'Email'} from ${item.sender}`);

    setFormData({
      ...item.suggestedMetadata,
      confidentiality: Confidentiality.InternalOnly, // Default safety
    });

    setStep('edit');
    setLoading(false);
  };

  // ------------------------------------------------------------------
  // Form Submission
  // ------------------------------------------------------------------
  const handleFieldChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.save(formData as AssetMetadata);

      // If this came from inbox, remove it from inbox list
      if (processingInboxId) {
        await api.processInboxItem(processingInboxId);
      }

      setSavedAssets([result]);
      setStep('success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    setLoading(true);
    try {
      const validItems = bulkItems.filter(i => i.status === 'ready').map(i => i.metadata as AssetMetadata);
      const itemsWithId = validItems.map(i => ({ ...i, owners: ['current.user@example.com'] }));
      const results = await api.bulkSave(itemsWithId);
      setSavedAssets(results);
      setStep('success');
    } catch (err) {
      console.error(err);
      alert('Bulk commit failed');
    } finally {
      setLoading(false);
    }
  };

  // Robust schema lookup with fallback
  const activeSchema = (formData.type && SCHEMAS[formData.type])
    ? SCHEMAS[formData.type]
    : SCHEMAS[AssetType.Template] || SCHEMAS[Object.keys(SCHEMAS)[0] as AssetType];

  // Helper to render fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderField = (field: SchemaField, data: any, onChange: (val: any) => void) => {
    const value = data[field.name] || '';

    switch (field.type) {
      case 'text':
        return <Input key={field.name} label={field.label} required={field.required} value={value} onChange={e => onChange(e.target.value)} />;
      case 'textarea':
        return <TextArea key={field.name} label={field.label} required={field.required} value={value} onChange={e => onChange(e.target.value)} />;
      case 'select':
        return <Select key={field.name} label={field.label} required={field.required} options={field.options || []} value={value} onChange={e => onChange(e.target.value)} />;

      case 'creatable-select':
        return <MultiSelect
          key={field.name}
          label={field.label}
          options={options[field.name] || []}
          value={value}
          onChange={onChange}
          multiple={false}
          creatable={true}
          placeholder="Select or create..."
        />;

      case 'multiselect':
      case 'tags':
        return <MultiSelect
          key={field.name}
          label={field.label}
          options={options[field.name] || []}
          value={value}
          onChange={onChange}
          multiple={true}
          creatable={true}
          placeholder="Select or create tags..."
        />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Import Assets</h1>
        <p className="text-slate-500 mt-2">Upload files or process incoming messages from Slack and Email.</p>
      </div>

      {/* --- INITIAL STEP: TABS for Upload / Inbox --- */}
      {step === 'upload' && (
        <>
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Upload className="w-4 h-4 mr-2" /> File Upload
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center ${activeTab === 'inbox' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Inbox <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{inboxItems.length}</span>
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-16 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                {loading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Processing files...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <Folder className="w-8 h-8" />
                      </div>
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                        <Archive className="w-8 h-8" />
                      </div>
                    </div>
                    <h3 className="text-xl font-medium text-slate-900 mb-3">Drag & Drop Files, Folder, or ZIP</h3>
                    <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
                      Select a single file for detailed editing, or multiple files (or a ZIP archive) for bulk import.
                    </p>
                    <label className="relative inline-block">
                      <span className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md font-medium hover:bg-blue-700 cursor-pointer transition-all">
                        Select Files / Folder
                      </span>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileSelect}
                        multiple
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Inbox Tab */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              {/* Integration Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800 mb-1">How to contribute via integrations</h4>
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Slack:</span> DM <span className="font-mono bg-blue-100 px-1 rounded">@GitKB-Bot</span> or use <span className="font-mono bg-blue-100 px-1 rounded">/save [link]</span> in any channel.<br />
                    <span className="font-semibold">Email:</span> Forward collateral to <span className="font-mono bg-blue-100 px-1 rounded">save@gitkb.internal</span>. Attachments are automatically parsed.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {inboxItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No pending items in inbox.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {inboxItems.map(item => (
                      <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item.source === 'slack' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                          {item.source === 'slack' ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-slate-900">{item.sender}</h4>
                            <span className="text-xs text-slate-400">{item.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{item.content}</p>
                          {item.suggestedMetadata.artifacts && item.suggestedMetadata.artifacts.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                📎 {item.suggestedMetadata.artifacts[0].name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="self-center">
                          <Button onClick={() => handleProcessInboxItem(item)} className="flex items-center">
                            Process <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* --- SINGLE EDIT STEP (Used for both File Upload and Inbox Processing) --- */}
      {step === 'edit' && mode === 'single' && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              {/* Display source label (filename or inbox source) */}
              <span className="font-medium text-slate-700">{sourceLabel}</span>
            </div>
            <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>
          </div>

          <form onSubmit={handleSingleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Asset Type" required options={Object.values(AssetType)} value={formData.type || ''} onChange={e => handleFieldChange('type', e.target.value)} />
                <Select label="Category" required options={Object.values(AssetCategory)} value={formData.category || ''} onChange={e => handleFieldChange('category', e.target.value)} />
              </div>
              {activeSchema.fields.filter(f => f.name !== 'category').map(field => renderField(field, formData, (val) => handleFieldChange(field.name, val)))}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input type="checkbox" className="mt-1 mr-3 w-4 h-4 text-amber-600 rounded" checked={formData.confidentiality === Confidentiality.InternalOnly} onChange={(e) => handleFieldChange('confidentiality', e.target.checked ? Confidentiality.InternalOnly : Confidentiality.ClientSafe)} />
                  <div>
                    <span className="block text-sm font-medium text-slate-900">Internal Only</span>
                    <span className="block text-xs text-slate-600">Contains sensitive data. Uncheck for Client Safe.</span>
                  </div>
                </label>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Committing...' : 'Submit Asset'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* --- BULK EDIT STEP (Only for File/Folder Upload) --- */}
      {step === 'bulk-edit' && mode === 'bulk' && (
        <div className="flex flex-col h-[calc(100vh-200px)] animate-in slide-in-from-bottom-4">
          {/* Bulk Controls */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Archive className="w-5 h-5 mr-2 text-indigo-600" />
                Bulk Import ({bulkItems.length} items)
              </h2>
              <Button variant="primary" onClick={handleBulkSubmit} disabled={loading}>
                {loading ? 'Committing All...' : `Import ${bulkItems.length} Assets`}
              </Button>
            </div>

            <div className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase mb-2">Apply to All:</span>
              <div className="w-40">
                <select className="w-full text-sm border-slate-300 rounded" onChange={(e) => {
                  const val = e.target.value;
                  setBulkItems(prev => prev.map(item => ({ ...item, metadata: { ...item.metadata, category: val as any } })));
                }}>
                  <option value="">Category...</option>
                  {Object.values(AssetCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="w-40">
                <select className="w-full text-sm border-slate-300 rounded" onChange={(e) => {
                  const val = e.target.value;
                  setBulkItems(prev => prev.map(item => ({ ...item, metadata: { ...item.metadata, type: val as any } })));
                }}>
                  <option value="">Type...</option>
                  {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="w-40">
                <select className="w-full text-sm border-slate-300 rounded" onChange={(e) => {
                  const val = e.target.value;
                  setBulkItems(prev => prev.map(item => ({ ...item, metadata: { ...item.metadata, confidentiality: val as any } })));
                }}>
                  <option value="">Confidentiality...</option>
                  <option value={Confidentiality.InternalOnly}>Internal Only</option>
                  <option value={Confidentiality.ClientSafe}>Client Safe</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk List */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {bulkItems.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                  <div className="pt-1"><FileText className="w-5 h-5 text-slate-400" /></div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <div className="font-medium text-slate-800 text-sm truncate" title={item.file.name}>{item.file.name}</div>
                      <div className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(1)} KB</div>
                      <div className="mt-2">
                        <input
                          type="text"
                          className="w-full text-sm border-slate-300 rounded px-2 py-1"
                          placeholder="Title"
                          value={item.metadata.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkItems(prev => prev.map(i => i.id === item.id ? { ...i, metadata: { ...i.metadata, title: val } } : i));
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-2">
                      <div className="col-span-3">
                        <MultiSelect
                          value={item.metadata.tags || []}
                          options={options.tags || []}
                          placeholder="Tags..."
                          multiple={true}
                          creatable={true}
                          onChange={(val) => {
                            setBulkItems(prev => prev.map(i => i.id === item.id ? { ...i, metadata: { ...i.metadata, tags: val as string[] } } : i));
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <button onClick={() => {
                    setBulkItems(prev => prev.filter(i => i.id !== item.id));
                    if (bulkItems.length <= 1) reset();
                  }} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS STEP --- */}
      {step === 'success' && (
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-12 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Success!</h2>
          <p className="text-slate-500 mb-6">
            {savedAssets.length} asset{savedAssets.length > 1 ? 's' : ''} committed to the repository.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 max-w-lg mx-auto mb-8 text-left font-mono text-xs text-slate-600 border border-slate-200 overflow-y-auto max-h-40">
            {savedAssets.map((a, i) => (
              <div key={i} className="flex justify-between mb-1 pb-1 border-b border-slate-100 last:border-0">
                <span className="truncate pr-4">{a.path}</span>
                <span className="font-bold text-slate-800">{a.commit_sha}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={reset}>Import More</Button>
            <Button variant="outline" onClick={() => navigate('/find')}>View in Search</Button>
          </div>
        </div>
      )}
    </div>
  );
};
