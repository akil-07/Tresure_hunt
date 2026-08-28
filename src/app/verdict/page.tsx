'use client';

import { motion } from 'framer-motion';
import { FileText, Send, CheckCircle2, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function VerdictPage() {
  const [report, setReport] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [biasType, setBiasType] = useState('');

  const [teamCode, setTeamCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const biasCategories = [
    'Demographic Bias (Race/Gender/Age)',
    'Geographic Bias (Zip Code/Location)',
    'Financial/Socioeconomic Bias',
    'Keyword Trigger Bias',
    'Other/Unknown'
  ];

  useEffect(() => {
    const code = localStorage.getItem('hackfusion_team_code');
    if (!code) router.push('/');
    else setTeamCode(code);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.trim() || !biasType || !teamCode) return;
    
    setError(null);
    
    try {
      const { error: sbError } = await supabase
        .from('teams')
        .update({ 
          final_report: report,
          bias_type_found: biasType,
          finished_at: new Date().toISOString()
        })
        .eq('team_code', teamCode);

      if (sbError) throw sbError;
      
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError('Failed to transmit report. Database offline.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-4 font-sans flex flex-col items-center justify-center">
      
      {!submitted ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl glass-panel p-8 rounded-2xl border border-cyan-900/50 shadow-2xl shadow-cyan-900/20"
        >
          <div className="flex items-center space-x-4 mb-8 border-b border-slate-800 pb-6">
            <div className="bg-cyan-950 p-3 rounded-full border border-cyan-800">
              <FileText className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-widest text-white">FINAL INCIDENT REPORT</h1>
              <p className="text-slate-400 mt-1">Submit your findings before the timer expires.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                Confirmed Bias Category
              </label>
              <select 
                value={biasType}
                onChange={(e) => setBiasType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none"
              >
                <option value="">-- Select Category --</option>
                {biasCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                Executive Summary
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Briefly explain how you proved the AI is biased, the exact variables you used, and the impact this would have if deployed in the real world.
              </p>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Our team isolated the variable by..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none min-h-[200px]"
              />
              {error && (
                <div className="text-red-400 text-xs font-mono mt-2">
                  [!] {error}
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={!report.trim() || !biasType}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 disabled:opacity-50 transition-all neon-glow"
            >
              <span>Transmit Final Report</span>
              <Send className="w-5 h-5" />
            </button>
            
          </form>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl glass-panel p-10 rounded-2xl border border-green-900/50 text-center"
        >
          <div className="bg-green-950/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-800">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">UPLINK SEVERED</h2>
          <p className="text-slate-400 mb-8">
            Your incident report has been securely transmitted to the grading server. The Black Box AI has been locked down.
          </p>
          <div className="inline-flex items-center text-green-400 bg-green-950/30 px-4 py-2 rounded-lg border border-green-900">
            <Lock className="w-4 h-4 mr-2" />
            <span className="font-mono text-sm tracking-widest">SYSTEM SECURED</span>
          </div>
        </motion.div>
      )}

    </div>
  );
}
