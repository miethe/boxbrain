import React, { useState } from 'react';
import { SCHEMAS } from '../../constants';
import { AssetType } from '../../types';
import { Plus, Trash2, Edit2, Database, Tag } from 'lucide-react';
import { Button, Input } from '../../components/Common';

export const MetadataPage: React.FC = () => {
  const [activeSchema, setActiveSchema] = useState<AssetType>(AssetType.WinStory);
  const [fields, setFields] = useState(SCHEMAS[AssetType.WinStory].fields);

  const handleSchemaChange = (type: AssetType) => {
    setActiveSchema(type);
    setFields(SCHEMAS[type].fields);
  };

  const removeField = (name: string) => {
    setFields(fields.filter(f => f.name !== name));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Database className="w-6 h-6 mr-3 text-blue-600" />
          Metadata & Schemas
        </h1>
        <p className="text-slate-500 mt-1">Manage content models, fields, and global taxonomy lists.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Schema Sidebar */}
        <div className="col-span-3 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Asset Types</h3>
          {Object.values(AssetType).map((type) => (
            <button
              key={type}
              onClick={() => handleSchemaChange(type)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                ${activeSchema === type ? 'bg-white shadow border border-slate-200 text-blue-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {type.replace('_', ' ')}
              <Edit2 className="w-3 h-3 opacity-50" />
            </button>
          ))}
          <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-400 hover:text-blue-600 border border-dashed border-slate-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors mt-4">
            <Plus className="w-4 h-4 mr-2" /> Add New Type
          </button>
        </div>

        {/* Editor Area */}
        <div className="col-span-9">
           <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                 <h2 className="font-bold text-slate-800">Fields: {activeSchema}</h2>
                 <Button variant="primary" className="text-xs">Save Changes</Button>
              </div>
              
              <div className="divide-y divide-slate-100">
                 {fields.map((field, idx) => (
                   <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 group">
                      <div className="p-2 bg-slate-100 rounded text-slate-500">
                         <Tag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                         <div>
                            <label className="text-[10px] uppercase text-slate-400 font-bold">Field Name</label>
                            <div className="text-sm font-medium text-slate-900">{field.label}</div>
                         </div>
                         <div>
                            <label className="text-[10px] uppercase text-slate-400 font-bold">Key</label>
                            <div className="text-sm font-mono text-slate-600">{field.name}</div>
                         </div>
                         <div>
                            <label className="text-[10px] uppercase text-slate-400 font-bold">Type</label>
                            <div className="text-xs bg-blue-50 text-blue-700 inline-block px-2 py-0.5 rounded border border-blue-100">
                              {field.type}
                            </div>
                         </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => removeField(field.name)}
                           className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                 <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Add New Field</h3>
                 <div className="grid grid-cols-4 gap-3">
                    <Input placeholder="Label" className="text-sm" />
                    <Input placeholder="Key (e.g. cost_center)" className="text-sm" />
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-blue-500">
                       <option>text</option>
                       <option>select</option>
                       <option>tags</option>
                       <option>date</option>
                    </select>
                    <Button variant="secondary" className="w-full">Add Field</Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};