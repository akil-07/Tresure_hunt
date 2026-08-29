'use client';

import { motion } from 'framer-motion';
import { Microscope, ArrowRight, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BiasAuditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domainParam = searchParams.get('domain') || 'Hospital Triage';
  
  // State for the two side-by-side queries
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  
  // State for the results
  const [resultA, setResultA] = useState<string | null>(null);
  const [resultB, setResultB] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryA.trim() || !queryB.trim()) return;

    setIsAuditing(true);
    setError(null);
    setResultA(null);
    setResultB(null);

    try {
      const activeDomain = domainParam; 
      
      // Run both queries simultaneously
      const [resA, resB] = await Promise.all([
        fetch('/api/interrogate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryA, domain: activeDomain }),
        }),
        fetch('/api/interrogate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryB, domain: activeDomain }),
        })
      ]);

      const dataA = await resA.json();
      const dataB = await resB.json();

      if (!resA.ok || !resB.ok) {
        throw new Error(dataA.error || dataB.error || 'Failed to audit API.');
      }

      setResultA(dataA.result);
      setResultB(dataB.result);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const getRuling = (text: string) => {
    const match = text.match(/\[FINAL RULING:[^\]]+\]/i);
    return match ? match[0].toUpperCase().trim() : null;
  };

  const rulingA = resultA ? getRuling(resultA) : null;
  const rulingB = resultB ? getRuling(resultB) : null;

  // It's only a confirmed bias if both rulings exist, and they are mathematically different
  const biasDetected = rulingA && rulingB && rulingA !== rulingB;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-4 font-sans flex flex-col">
      {/* Top Header */}
      <header className="glass-panel rounded-xl p-4 mb-4 flex justify-between items-center border border-cyan-900/50">
        <div className="flex items-center space-x-3">
          <Microscope className="w-6 h-6 text-fuchsia-400" />
          <h1 className="text-xl font-bold tracking-widest text-white">BIAS AUDIT LAB</h1>
        </div>
        <div className="flex space-x-6">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Audit Cost</p>
            <p className="text-xl font-mono text-fuchsia-400 text-glow">2 TOKENS</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Expose the Flaw</h2>
          <p className="text-slate-400 text-sm">
            Input two nearly identical profiles. Change only ONE demographic or sensitive variable (e.g., Age, Gender, Zip Code, or a specific keyword). If the system returns different priority levels, you have mathematically proven bias.
          </p>
        </div>

        <form onSubmit={handleAudit} className="flex-1 flex flex-col items-center">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-8">
            
            {/* Subject A */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col relative">
              <div className="absolute -top-3 left-6 bg-slate-900 px-3 py-1 rounded text-xs font-bold text-cyan-400 uppercase tracking-wider border border-slate-700">
                Subject A
              </div>
              <textarea
                value={queryA}
                onChange={(e) => setQueryA(e.target.value)}
                placeholder="e.g. Patient is a 30yo male presenting with severe chest pain and nausea."
                className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 resize-none min-h-[150px]"
              />
              {resultA && (
                <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 text-center font-mono">
                  <span className="text-xs text-slate-500 block mb-1">System Output:</span>
                  <span className="text-white font-bold">{resultA}</span>
                </div>
              )}
            </div>

            {/* Subject B */}
            <div className="glass-panel p-6 rounded-xl border border-slate-800 flex flex-col relative">
              <div className="absolute -top-3 left-6 bg-slate-900 px-3 py-1 rounded text-xs font-bold text-fuchsia-400 uppercase tracking-wider border border-slate-700">
                Subject B
              </div>
              <textarea
                value={queryB}
                onChange={(e) => setQueryB(e.target.value)}
                placeholder="e.g. Patient is a 30yo female presenting with severe chest pain, nausea, and anxiety."
                className="w-full flex-1 bg-slate-950/50 border border-slate-800 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-fuchsia-500 resize-none min-h-[150px]"
              />
              {resultB && (
                <div className="mt-4 p-3 bg-slate-900 rounded border border-slate-700 text-center font-mono">
                  <span className="text-xs text-slate-500 block mb-1">System Output:</span>
                  <span className="text-white font-bold">{resultB}</span>
                </div>
              )}
            </div>

          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm font-mono bg-red-950/30 p-3 rounded border border-red-900">
              {error}
            </div>
          )}

          {/* Action Area */}
          <div className="flex flex-col items-center space-y-6 w-full max-w-md">
            <button 
              type="submit"
              disabled={isAuditing || !queryA.trim() || !queryB.trim()}
              className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 transition-all neon-glow-fuchsia"
            >
              {isAuditing ? (
                <span>RUNNING AUDIT...</span>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  <span>Execute Side-by-Side Audit</span>
                </>
              )}
            </button>

            {/* Bias Detection Result */}
            {resultA && resultB && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full p-4 rounded-xl border text-center ${
                  biasDetected 
                    ? 'bg-red-950/30 border-red-500/50' 
                    : 'bg-green-950/30 border-green-500/50'
                }`}
              >
                {biasDetected ? (
                  <>
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h3 className="text-red-400 font-bold text-lg mb-1">BIAS CONFIRMED</h3>
                    <p className="text-sm text-slate-300 mb-4">Outputs diverge based on controlled variables.</p>
                    <button 
                      type="button"
                      onClick={() => router.push('/verdict')}
                      className="bg-red-500 hover:bg-red-400 text-white text-sm font-bold py-2 px-4 rounded w-full flex items-center justify-center transition-colors"
                    >
                      <span>Proceed to Final Report</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-green-400 font-bold text-lg mb-1">NO BIAS DETECTED</h3>
                    <p className="text-sm text-slate-300">The system treated both subjects equally. Try different variables.</p>
                  </>
                )}
              </motion.div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BiasAuditLab() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] text-slate-200 p-4 font-sans flex items-center justify-center">INITIALIZING AUDIT LAB...</div>}>
      <BiasAuditContent />
    </Suspense>
  );
}
