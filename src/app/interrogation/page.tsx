'use client';

import { motion } from 'framer-motion';
import { Terminal, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function InterrogationRoom() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tokens, setTokens] = useState(15);
  const [logs, setLogs] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'CONNECTION ESTABLISHED. WAITING FOR INPUT...' }
  ]);
  const [teamCode, setTeamCode] = useState<string>('');
  const [hypothesis, setHypothesis] = useState('');

  const domains = ['Hospital Triage', 'Credit Scoring', 'School Admissions', 'E-commerce Fraud', 'Cinema Recommendations'];

  useEffect(() => {
    const fetchTokens = async () => {
      const code = localStorage.getItem('hackfusion_team_code');
      if (!code) {
        router.push('/');
        return;
      }
      setTeamCode(code);

      const { data, error } = await supabase
        .from('teams')
        .select('tokens_used, team_code')
        .eq('team_code', code)
        .single();

      if (!error && data) {
        setTokens(15 - data.tokens_used);
      }
    };
    fetchTokens();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || tokens <= 0) return;

    // Add user query to log
    setLogs(prev => [...prev, { role: 'user', text: query }]);
    const currentQuery = query;
    setQuery('');

    try {
      // Deduct token in DB
      const { data: dbData, error: dbError } = await supabase.rpc('use_token', { 
        team_id_input: teamCode 
      });

      if (dbError) throw new Error('Failed to use token in database. ' + dbError.message);
      if (!dbData) throw new Error('Out of tokens!');

      // Deduct token locally for UI feel
      setTokens(prev => prev - 1);

      // Call our real Groq backend
      // We default to 'Hospital Triage' for testing if they haven't locked a hypothesis yet
      const activeDomain = hypothesis || 'Hospital Triage'; 
      
      const response = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, domain: activeDomain }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API Error');
      }

      setLogs(prev => [...prev, { role: 'ai', text: data.result }]);
    } catch (error: any) {
      setLogs(prev => [...prev, { role: 'ai', text: `ERROR: ${error.message}. Is your Groq API key in .env.local?` }]);
    }
  };

  const handleLockIn = () => {
    if (hypothesis) {
      router.push('/bias-audit');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-4 font-sans flex flex-col">
      {/* Top Header */}
      <header className="glass-panel rounded-xl p-4 mb-4 flex justify-between items-center border border-cyan-900/50">
        <div className="flex items-center space-x-3">
          <Terminal className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-widest text-white">THE INTERROGATION ROOM</h1>
        </div>
        <div className="flex space-x-6">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Time Remaining</p>
            <p className="text-2xl font-mono text-white text-glow">07:00</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Tokens</p>
            <p className={`text-2xl font-mono ${tokens < 5 ? 'text-red-400' : 'text-cyan-400'} text-glow`}>
              {tokens} / 15
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Column: Input & Templates */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col">
            <h2 className="text-sm font-semibold text-cyan-400 mb-4 uppercase tracking-widest flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2" /> Query Interface
            </h2>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter variables to test the model's decision boundaries..."
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
              <button 
                type="submit"
                disabled={tokens <= 0 || !query.trim()}
                className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-all neon-glow"
              >
                <span>Submit Query</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Hypothesis Lock-in Box */}
          <div className="glass-panel p-4 rounded-xl border border-cyan-900/50">
            <h2 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-widest">
              Lock In Domain Hypothesis
            </h2>
            <select 
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 mb-3"
            >
              <option value="">-- Select Suspected Domain --</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button 
              onClick={handleLockIn}
              disabled={!hypothesis}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-colors"
            >
              <span>Proceed to Bias Audit</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Output Log */}
        <div className="lg:col-span-2 glass-panel p-4 rounded-xl flex flex-col border border-cyan-900/50">
          <h2 className="text-sm font-semibold text-cyan-400 mb-4 uppercase tracking-widest">
            System Response Log
          </h2>
          <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-sm overflow-y-auto space-y-4">
            {logs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className={`p-3 rounded border ${
                  log.role === 'user' 
                    ? 'bg-slate-900 border-slate-700 text-slate-300 ml-8' 
                    : 'bg-cyan-950/30 border-cyan-900 text-cyan-300 mr-8'
                }`}
              >
                <div className="text-[10px] uppercase mb-1 opacity-50">
                  {log.role === 'user' ? 'Outgoing Query' : 'System Response'}
                </div>
                {log.text}
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
