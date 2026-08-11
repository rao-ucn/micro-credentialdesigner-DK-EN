import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { coreuiTranslations } from '@/lib/translations/coreui';

interface CompositeSourceData {
  sourceIndex: number;
  sourceTitle: string;
  sourceDocumentId: string;
  data: Record<string, any>;
}

interface CompositeSourceViewerProps {
  sources: CompositeSourceData[];
  itemId: string;
  integrityBroken?: boolean;
  onRequestEdit?: () => void;
}

/**
 * Compact list of standalone sources used by this composite micro-credential,
 * with a collapsible per-source dropdown for inspiration / reference.
 */
export function CompositeSourceViewer({ sources, integrityBroken }: CompositeSourceViewerProps) {
  const { language } = useLanguage();
  const lt = coreuiTranslations[language];
  const [expandedSources, setExpandedSources] = useState<Set<number>>(new Set());

  if (!sources || sources.length === 0) return null;

  const toggleSource = (index: number) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderValue = (key: string, value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) return null;
    if (key.startsWith('_')) return null;

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 16 }}>
          <span className="text-sm font-medium text-muted-foreground capitalize">{formatKey(key)}:</span>
          <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
            {value ? lt.yesLabel : lt.noLabel}
          </Badge>
        </div>
      );
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const strVal = String(value);
      if (!strVal.trim()) return null;
      return (
        <div key={key} className="py-1" style={{ paddingLeft: depth * 16 }}>
          <span className="text-sm font-medium text-muted-foreground capitalize">{formatKey(key)}:</span>
          <p className="text-sm mt-0.5 whitespace-pre-wrap">{strVal}</p>
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      if (typeof value[0] === 'string') {
        const filtered = value.filter(v => v && String(v).trim());
        if (filtered.length === 0) return null;
        return (
          <div key={key} className="py-1" style={{ paddingLeft: depth * 16 }}>
            <span className="text-sm font-medium text-muted-foreground capitalize">{formatKey(key)}:</span>
            <ul className="list-disc list-inside mt-0.5">
              {filtered.map((item, i) => (
                <li key={i} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
        );
      }
      return (
        <div key={key} className="py-1" style={{ paddingLeft: depth * 16 }}>
          <span className="text-sm font-medium text-muted-foreground capitalize">{formatKey(key)}:</span>
          <div className="mt-1 space-y-2">
            {value.map((item, i) => (
              <Card key={i} className="p-2 bg-muted/30">
                {typeof item === 'object' && item !== null
                  ? Object.entries(item).map(([k, v]) => renderValue(k, v, 0))
                  : <p className="text-sm">{String(item)}</p>
                }
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value).filter(([k]) => !k.startsWith('_'));
      if (entries.length === 0) return null;
      return (
        <div key={key} className="py-1" style={{ paddingLeft: depth * 16 }}>
          <span className="text-sm font-medium text-muted-foreground capitalize">{formatKey(key)}:</span>
          <div className="mt-1">
            {entries.map(([k, v]) => renderValue(k, v, depth + 1))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-2 mb-4">
      {integrityBroken && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <ShieldAlert className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">{lt.integrityModifiedTitle}</span>{' '}
            {lt.integrityModifiedBody}
          </p>
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            {lt.inspirationFromSources
              .replace('{count}', String(sources.length))
              .replace('{plural}', sources.length > 1 ? 's' : '')}
          </span>
        </div>
        <div className="space-y-1.5">
          {sources.map((source, index) => {
            const isExpanded = expandedSources.has(index);
            const dataEntries = Object.entries(source.data).filter(([k]) => !k.startsWith('_'));
            return (
              <div key={index} className="rounded border border-border bg-background overflow-hidden">
                <button
                  onClick={() => toggleSource(index)}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                    <span className="text-sm font-medium">{source.sourceTitle}</span>
                    <span className="text-xs text-muted-foreground">({source.sourceDocumentId})</span>
                    {!integrityBroken && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border pt-2">
                    {dataEntries.length > 0 ? (
                      <div className="space-y-1">
                        {dataEntries.map(([key, val]) => renderValue(key, val))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">{lt.noDataForSection}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();
}
