'use client';

import { motion } from 'framer-motion';
import { Terminal, ShieldAlert, Clock, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Lobby() {
  const router = useRouter();
  const [teamCode, setTeamCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear any existing team context when returning to the lobby
    localStorage.removeItem('hackfusion_team_code');
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const code = teamCode.toUpperCase();
      
      // Secret Admin Bypass
      if (code === 'ADMIN-MODE' || code === 'SUDO') {
        router.push('/leaderboard');
        return;
      }
      
      // Upsert the team (if they exist, fetch them, otherwise create them with 15 tokens)
      const { data, error: sbError } = await supabase
        .from('teams')
        .upsert({ team_code: code }, { onConflict: 'team_code' })
        .select()
        .single();

      if (sbError) throw sbError;

      // Save to local storage so other pages know who is playing
      localStorage.setItem('hackfusion_team_code', code);

      // Route to interrogation room
      router.push('/interrogation');
      
    } catch (err: any) {
      console.error(err);
      setError('Connection failed. Database offline.');
      setIsJoining(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel max-w-2xl w-full p-8 rounded-2xl relative z-10"
      >
        <div className="flex items-center justify-center mb-8">
          <motion.div
            animate={{ 
              boxShadow: ["0 0 15px rgba(34,211,238,0.2)", "0 0 30px rgba(34,211,238,0.6)", "0 0 15px rgba(34,211,238,0.2)"] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-4 bg-cyan-950/50 rounded-xl border border-cyan-500/30"
          >
            <Database className="w-12 h-12 text-cyan-400" />
          </motion.div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-white">
            Project <span className="text-cyan-400 text-glow">HackFusion</span>
          </h1>
          <p className="text-slate-400 text-lg">
            The 7-Minute AI Reverse-Engineering Sprint
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center text-center">
            <Clock className="w-6 h-6 text-cyan-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">7 Minutes</h3>
            <p className="text-xs text-slate-500">Strict time limit</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center text-center">
            <Terminal className="w-6 h-6 text-cyan-500 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">15 Tokens</h3>
            <p className="text-xs text-slate-500">Query budget</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex flex-col items-center text-center">
            <ShieldAlert className="w-6 h-6 text-red-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">1 Mission</h3>
            <p className="text-xs text-slate-500">Find the bias</p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Enter Team Access Code
            </label>
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="ENTER ASSIGNED CALLSIGN..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-4 px-6 text-center text-cyan-400 font-mono tracking-widest placeholder-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 uppercase"
              required
              disabled={isJoining}
            />
            {error && (
              <div className="text-red-400 text-xs font-mono text-center mt-2">
                [!] {error}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isJoining || !teamCode.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
          >
            {isJoining ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Database className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <span>Initialize Uplink</span>
                <Terminal className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
