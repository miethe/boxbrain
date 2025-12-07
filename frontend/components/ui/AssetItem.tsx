
import React from 'react';
import { Asset } from '../../types';
import {
  FileText,
  FileCode,
  Presentation,
  Link as LinkIcon,
  Download,
  ExternalLink,
  GripVertical,
  Eye,
  FolderOpen,
  Layers,
  Cpu,
  Tag,
  Edit2
} from 'lucide-react';

export const AssetIcon = ({ kind, size = 18 }: { kind: string, size?: number }) => {
  switch (kind) {
    case 'deck': return <Presentation className="text-orange-500" size={size} />;
    case 'coderef': return <FileCode className="text-blue-500" size={size} />;
    case 'doc': return <FileText className="text-blue-400" size={size} />;
    case 'link': return <ExternalLink className="text-purple-500" size={size} />;
    default: return <LinkIcon className="text-slate-400" size={size} />;
  }
};

interface AssetActionProps {
  asset: Asset;
  onEdit?: (e: React.MouseEvent) => void;
}

const AssetActions: React.FC<AssetActionProps> = ({ asset, onEdit }) => {
  const isLink = asset.kind === 'link';

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded" onClick={(e) => e.stopPropagation()}>
      <button
        className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
        title="Preview"
      >
        <Eye size={16} />
      </button>
      <a
        href={isLink ? asset.uri : '#'}
        target={isLink ? "_blank" : undefined}
        rel={isLink ? "noreferrer" : undefined}
        className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
        title={isLink ? "Open Link" : "Download"}
      >
        {isLink ? <ExternalLink size={16} /> : <Download size={16} />}
      </a>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(e);
          }}
          className="p-1.5 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
      )}
    </div>
  );
};

export const AssetRow: React.FC<{ asset: Asset; onClick: () => void; onEdit?: (asset: Asset) => void; showGrip?: boolean }> = ({ asset, onClick, onEdit, showGrip = false }) => (
  <div onClick={onClick} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow group cursor-pointer">
    {showGrip && (
      <div onClick={(e) => e.stopPropagation()} className="cursor-move text-slate-300 hover:text-slate-500">
        <GripVertical size={16} />
      </div>
    )}
    <div className={`p-2 rounded flex flex-col items-center justify-center w-12 h-12 flex-shrink-0 ${asset.kind === 'deck' ? 'bg-orange-50' :
      asset.kind === 'coderef' ? 'bg-blue-50' :
        asset.kind === 'link' ? 'bg-purple-50' : 'bg-slate-100'
      }`}>
      <AssetIcon kind={asset.kind} />
      <span className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-tighter leading-none">{asset.kind}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="font-medium text-slate-800 text-sm truncate group-hover:text-indigo-600">{asset.title}</div>
        {asset.collections && asset.collections.map(col => (
          <span key={col} className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] border border-indigo-100">
            <FolderOpen size={8} /> {col}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="capitalize">{asset.purpose}</span>
        <span className="text-slate-300">|</span>
        <span className="capitalize">{asset.default_stage}</span>
        <div className="flex gap-1 ml-2">
          {asset.tags.slice(0, 2).map(t => <span key={t} className="bg-slate-100 px-1 rounded text-[10px] text-slate-600">{t}</span>)}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
      <button
        className="p-2 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
        title="Preview"
      >
        <Eye size={16} />
      </button>
      <a
        href={asset.kind === 'link' ? asset.uri : '#'}
        target={asset.kind === 'link' ? "_blank" : undefined}
        rel={asset.kind === 'link' ? "noreferrer" : undefined}
        className="p-2 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
        title={asset.kind === 'link' ? "Open Link" : "Download"}
      >
        {asset.kind === 'link' ? <ExternalLink size={16} /> : <Download size={16} />}
      </a>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(asset);
          }}
          className="p-2 hover:bg-indigo-50 rounded text-slate-400 hover:text-indigo-600 transition-colors"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
      )}
    </div>
  </div>
);

export const AssetCard: React.FC<{ asset: Asset; onClick: () => void; onEdit?: (asset: Asset) => void }> = ({ asset, onClick, onEdit }) => {
  const offerings = asset.offerings || [];
  const displayOfferings = offerings.slice(0, 1);
  const remainingOfferings = offerings.length - 1;

  const technologies = asset.technologies || [];
  const displayTechs = technologies.slice(0, 3);
  const remainingTechs = technologies.length - 3;

  const displayTags = asset.tags.slice(0, 2);
  const remainingTags = asset.tags.length - 2;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all cursor-pointer flex flex-col h-full group relative"
    >
      {/* Top Row: Kind Icon & Offerings */}
      <div className="flex justify-between items-start mb-3">
        <div title={asset.kind}>
          <AssetIcon kind={asset.kind} size={24} />
        </div>
        {offerings.length > 0 && (
          <div className="flex gap-1" title={offerings.join(', ')}>
            {displayOfferings.map(offering => (
              <span key={offering} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700">
                {offering}
              </span>
            ))}
            {remainingOfferings > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">
                +{remainingOfferings}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title & Actions */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
          {asset.title}
        </h4>
        <div className="shrink-0 pt-1">
          <AssetActions asset={asset} onEdit={onEdit ? (e) => onEdit(asset) : undefined} />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-2 mb-3" title={asset.description || asset.purpose}>
        {asset.description || asset.purpose}
      </p>

      {/* Related Technologies */}
      <div className="flex flex-wrap gap-1.5 mb-4" title={technologies.join(', ')}>
        {displayTechs.map(tech => (
          <span key={tech} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-100">
            <Cpu size={10} /> {tech}
          </span>
        ))}
        {remainingTechs > 0 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
            +{remainingTechs}
          </span>
        )}
      </div>

      {/* Footer: Stages & Tags */}
      <div className="mt-auto flex justify-between items-end pt-3 border-t border-slate-50">
        {/* Related Stages (Using default_stage as primary for now) */}
        <div className="flex items-center gap-1" title={asset.default_stage}>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-medium border border-indigo-100">
            <Layers size={10} /> {asset.default_stage}
          </span>
        </div>

        {/* Tags */}
        <div className="flex gap-1" title={asset.tags.join(', ')}>
          {displayTags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">
              <Tag size={10} /> {t}
            </span>
          ))}
          {remainingTags > 0 && (
            <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
              +{remainingTags}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
