
import React, { useState, useEffect } from 'react';
import { 
  Compass, ArrowRight, CheckCircle, Target, Briefcase, 
  Layers, Zap, ChevronRight, RefreshCw 
} from 'lucide-react';
import { Button, Select, MultiSelect } from '../components/Common';
import { api } from '../services/mockApi';
import { Asset, AssetType } from '../types';

interface WizardState {
  step: number;
  dealType: string;
  stage: string;
  offering: string[];
  relatedTech: string[];
}

const STAGES_MAP = {
  discovery: { label: 'Discovery / Qualification', icon: Target },
  solutioning: { label: 'Solutioning / Validation', icon: Layers },
  proposal: { label: 'Proposal / Negotiation', icon: Briefcase },
  closing: { label: 'Closing / Delivery', icon: CheckCircle }
};

export const DealGuidePage: React.FC = () => {
  const [state, setState] = useState<WizardState>({
    step: 1,
    dealType: '',
    stage: '',
    offering: [],
    relatedTech: []
  });
  
  const [recommendations, setRecommendations] = useState<Record<string, Asset[]>>({});
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{
      offerings: string[];
      technologies: string[];
  }>({ offerings: [], technologies: [] });

  useEffect(() => {
      // Fetch available options for the dropdowns
      api.getFacets().then(facets => {
          const offs = facets.offering?.map(f => f.value) || [];
          const techs = facets.related_technologies?.map(f => f.value) || [];
          setOptions({ offerings: offs, technologies: techs });
      });
  }, []);

  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  
  const generateRecommendations = async () => {
    setLoading(true);
    const allAssets = await api.search('', {});
    
    // Filter logic
    const filtered = allAssets.filter(asset => {
      // Match Offering (if any selected offering matches asset's offering)
      if (state.offering.length > 0 && asset.offering) {
          const hasMatch = state.offering.some(sel => 
              asset.offering?.toLowerCase().includes(sel.toLowerCase())
          );
          if (!hasMatch) return false;
      }
      
      // Match Tech (if any match)
      if (state.relatedTech.length > 0 && asset.related_technologies) {
        const hasMatch = state.relatedTech.some(t => 
           asset.related_technologies!.some(at => at.toLowerCase().includes(t.toLowerCase()))
        );
        if (!hasMatch && asset.type === AssetType.CodeRef) return false; // Strict for code
      }
      
      return true;
    });

    // Bucket logic
    const buckets: Record<string, Asset[]> = {
      discovery: [],
      solutioning: [],
      proposal: [],
      closing: []
    };

    filtered.forEach(asset => {
      // Map asset types to sales lifecycle stages
      if (asset.type === AssetType.WinStory) {
        buckets.discovery.push(asset); // Proof points for early stage
      } else if (asset.type === AssetType.Play) {
        buckets.solutioning.push(asset); // How-to for middle stage
      } else if (asset.type === AssetType.CodeRef) {
        buckets.solutioning.push(asset); // Technical proof
        buckets.closing.push(asset); // Delivery prep
      } else if (asset.type === AssetType.Template) {
        if (asset.title.toLowerCase().includes('pricing') || asset.title.toLowerCase().includes('sow')) {
          buckets.proposal.push(asset);
        } else {
          buckets.discovery.push(asset); // One-pagers
        }
      }
    });

    setRecommendations(buckets);
    setLoading(false);
    nextStep();
  };

  const restart = () => {
    setState({
      step: 1,
      dealType: '',
      stage: '',
      offering: [],
      relatedTech: []
    });
    setRecommendations({});
  };

  return (
    <div className="max-w-6xl mx-auto p-8 h-full flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <Compass className="w-8 h-8 text-blue-600 mr-3" />
            Deal Guide
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Answer a few questions to get a curated list of assets for your opportunity.
          </p>
        </div>
        {state.step === 4 && (
          <Button onClick={restart} variant="outline" className="flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" /> Start Over
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full mb-12 overflow-hidden">
        <div 
          className="bg-blue-600 h-full transition-all duration-500 ease-in-out" 
          style={{ width: `${state.step * 25}%` }}
        />
      </div>

      <div className="flex-1">
        {/* STEP 1: Context */}
        {state.step === 1 && (
          <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">Let's start with the basics.</h2>
             <div className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">What type of opportunity is this?</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['New License / Logo', 'Expansion / Upsell', 'Renewal', 'Services / Consulting'].map(opt => (
                      <div 
                        key={opt}
                        onClick={() => setState(prev => ({ ...prev, dealType: opt }))}
                        className={`cursor-pointer border-2 rounded-lg p-4 transition-all flex items-center justify-center text-center h-20 font-medium
                          ${state.dealType === opt ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-300'}`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Current Sales Stage</label>
                   <Select 
                     options={Object.values(STAGES_MAP).map(s => s.label)} 
                     value={state.stage} 
                     onChange={(e) => setState(prev => ({ ...prev, stage: e.target.value }))} 
                   />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    onClick={nextStep} 
                    disabled={!state.dealType || !state.stage}
                    className="flex items-center text-lg px-8 py-3"
                  >
                    Next <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
             </div>
          </div>
        )}

        {/* STEP 2: Scope */}
        {state.step === 2 && (
          <div className="animate-in slide-in-from-right duration-300 max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">What technology is involved?</h2>
             <div className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <div>
                   <MultiSelect 
                      label="Primary Offering / Product" 
                      placeholder="Select offerings (e.g. OpenShift, Cloud...)" 
                      options={options.offerings || []}
                      value={state.offering}
                      multiple={true}
                      creatable={false}
                      onChange={(val) => setState(prev => ({ ...prev, offering: val as string[] }))}
                   />
                   <p className="text-xs text-slate-500 mt-1">The main product(s) you are selling.</p>
                </div>

                <div>
                   <MultiSelect 
                      label="Related Technologies" 
                      placeholder="Select related tech (e.g. AWS, Terraform...)" 
                      options={options.technologies || []}
                      value={state.relatedTech}
                      multiple={true}
                      creatable={false}
                      onChange={(val) => setState(prev => ({ ...prev, relatedTech: val as string[] }))}
                   />
                   <p className="text-xs text-slate-500 mt-1">Other tools in the customer's environment.</p>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button onClick={() => setState(prev => ({...prev, step: 1}))} className="text-slate-500 hover:text-slate-800">Back</button>
                  <Button 
                    onClick={generateRecommendations} 
                    disabled={state.offering.length === 0}
                    className="flex items-center text-lg px-8 py-3"
                  >
                    {loading ? 'Generating...' : 'Generate Guide'} <Zap className="w-5 h-5 ml-2" />
                  </Button>
                </div>
             </div>
          </div>
        )}

        {/* STEP 3: Recommendations */}
        {state.step === 3 && (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Sidebar Summary */}
               <div className="md:col-span-1">
                 <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg sticky top-6">
                    <h3 className="font-bold text-lg mb-4 border-b border-slate-700 pb-2">Deal Profile</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <div className="text-slate-400 text-xs uppercase">Type</div>
                        <div className="font-medium">{state.dealType}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs uppercase">Stage</div>
                        <div className="font-medium">{state.stage}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs uppercase">Primary Offering</div>
                        <div className="font-medium text-blue-400">{state.offering.join(', ')}</div>
                      </div>
                      {state.relatedTech.length > 0 && (
                        <div>
                           <div className="text-slate-400 text-xs uppercase">Tech Stack</div>
                           <div className="flex flex-wrap gap-1 mt-1">
                             {state.relatedTech.map(t => (
                               <span key={t} className="bg-slate-700 px-2 py-0.5 rounded text-xs">{t}</span>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                 </div>
               </div>

               {/* Main Timeline Content */}
               <div className="md:col-span-2 space-y-10 pb-20">
                  {Object.entries(bucketsUI).map(([key, conf], idx) => {
                     const items = recommendations[key] || [];
                     const isActiveStage = state.stage.toLowerCase().includes(conf.stageMatch);
                     
                     return (
                       <div key={key} className={`relative pl-8 border-l-2 ${isActiveStage ? 'border-blue-500' : 'border-slate-200'}`}>
                          <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isActiveStage ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`} />
                          
                          <h3 className={`text-xl font-bold mb-4 flex items-center ${isActiveStage ? 'text-blue-700' : 'text-slate-500'}`}>
                             <conf.icon className="w-6 h-6 mr-2" />
                             {conf.title}
                             {isActiveStage && <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Current Stage</span>}
                          </h3>

                          {items.length === 0 ? (
                            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-500 italic border border-slate-100">
                               No specific assets found for this stage based on your filters.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4">
                              {items.map(asset => (
                                <div key={asset.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-start group">
                                   <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                          asset.type === 'win_story' ? 'bg-green-100 text-green-700' : 
                                          asset.type === 'code_ref' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {asset.type.replace('_', ' ')}
                                        </span>
                                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600">{asset.title}</h4>
                                      </div>
                                      <p className="text-xs text-slate-500 line-clamp-2">{asset.summary}</p>
                                   </div>
                                   <a 
                                     href={`#/find`} 
                                     className="p-2 bg-slate-50 rounded hover:bg-blue-50 hover:text-blue-600 text-slate-400"
                                     title="View Asset"
                                   >
                                      <ChevronRight className="w-4 h-4" />
                                   </a>
                                </div>
                              ))}
                            </div>
                          )}
                       </div>
                     );
                  })}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const bucketsUI = {
  discovery: { title: 'Discovery & Qualification', icon: Target, stageMatch: 'discovery' },
  solutioning: { title: 'Solutioning & Technical Validation', icon: Layers, stageMatch: 'solution' },
  proposal: { title: 'Proposal & Negotiation', icon: Briefcase, stageMatch: 'proposal' },
  closing: { title: 'Closing & Delivery', icon: CheckCircle, stageMatch: 'closing' },
};
