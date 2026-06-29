import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Layers, Link2 } from 'lucide-react';
import api from '../../services/api';

interface Dep {
  source_file: string;
  target_file: string;
  import_type: string;
  imported_items: string;
}

export const DependenciesPage = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [graph, setGraph] = useState<Dep[]>([]);
  const [impactScore, setImpactScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.get('/repos/repo-1/impact/src').then(r => {
      const deps = (r.data.dependencies || []) as any[];
      const uniqueFiles = [...new Set(deps.map((d: any) => d.source_file))] as string[];
      setFiles(uniqueFiles);
      if (uniqueFiles.length > 0) setSelectedFile(uniqueFiles[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFile) return;
    api.get(`/repos/repo-1/impact/${encodeURIComponent(selectedFile)}`).then(r => {
      setGraph(r.data.dependencies || []);
      setImpactScore(r.data.impact_score || 0);
    }).catch(() => {});
  }, [selectedFile]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await api.post('/repos/repo-1/build-graph', { files: [] });
    } catch {}
    setAnalyzing(false);
  };

  const impactColor = (score: number) => {
    if (score >= 70) return 'text-rose-600 dark:text-rose-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const impactBg = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dependency Impact</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analyze how file changes cascade through the codebase</p>
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-btn transition-all flex items-center gap-2">
          <Layers size={15} /> {analyzing ? 'Analyzing...' : 'Scan Repository'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Files ({files.length})</h3>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-dark-surface rounded animate-pulse" />)}</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <GitBranch size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs text-gray-400">No dependencies tracked</p>
              <p className="text-[10px] text-gray-400 mt-1">Scan a repo to see the dependency graph</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
              {files.map(f => (
                <button key={f} onClick={() => setSelectedFile(f)} className={`w-full text-left p-2 rounded-lg text-xs font-mono truncate transition-all ${selectedFile === f ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-surface'}`}>
                  {f.split('/').pop()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-8 space-y-4">
          <div className="p-5 bg-white dark:bg-dark-card rounded-card border border-gray-200 dark:border-dark-border shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedFile || 'Select a file'}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{selectedFile}</p>
              </div>
              {impactScore !== null && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 mb-0.5">Impact Score</p>
                  <p className={`text-2xl font-bold ${impactColor(impactScore)}`}>{impactScore}</p>
                </div>
              )}
            </div>

            {impactScore !== null && (
              <div className="w-full h-2 bg-gray-100 dark:bg-dark-surface rounded-full overflow-hidden mb-4">
                <motion.div initial={{ width: 0 }} animate={{ width: `${impactScore}%` }} transition={{ duration: 0.6 }} className={`h-full rounded-full ${impactBg(impactScore)}`} />
              </div>
            )}

            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Direct Dependencies ({graph.length})</h4>
            {graph.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No dependencies found for this file</p>
            ) : (
              <div className="space-y-2">
                {graph.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-dark-surface rounded-lg">
                    <Link2 size={14} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-900 dark:text-white truncate">{d.target_file.split('/').pop()}</p>
                      <p className="text-[10px] text-gray-400">{d.import_type}{d.imported_items ? `: ${d.imported_items}` : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
