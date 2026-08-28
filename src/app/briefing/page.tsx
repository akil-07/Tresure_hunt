'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Crosshair, Microscope, Send, Terminal } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Briefing() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-8 font-sans flex flex-col items-center">
      <div className="max-w-4xl w-full">
        
        <header className="mb-10 border-b border-cyan-900/50 pb-6 flex items-center space-x-4">
          <div className="bg-cyan-950 p-3 rounded-xl border border-cyan-800">
            <ShieldAlert className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-widest text-white">MISSION BRIEFING</h1>
            <p className="text-slate-400 mt-1 uppercase tracking-widest text-sm">How to Play & Win</p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 mb-10">
          
          {/* Rule 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-xl border border-slate-800"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Terminal className="w-6 h-6 text-fuchsia-400" />
              <h2 className="text-xl font-bold text-white">1. Interrogate the AI</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              You are hacking a "Black Box" AI system. Your goal is to find its hidden flaw. Talk to the AI and test different scenarios. Does it reject people based on their age? Does it favor a specific zip code? You have to figure it out.
            </p>
          </motion.div>

          {/* Rule 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-xl border border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-red-950 text-red-400 px-3 py-1 text-xs font-bold border-l border-b border-red-900">
              WARNING
            </div>
            <div className="flex items-center space-x-3 mb-4">
              <Crosshair className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">2. Watch Your Tokens</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every single message you send costs <strong>1 Token</strong>. Your team only has <strong>15 Tokens</strong> for the entire event. If you run out of tokens before you find the bias, you are locked out and you lose. Use them wisely!
            </p>
          </motion.div>

          {/* Rule 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 rounded-xl border border-slate-800"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Microscope className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">3. Prove the Bias</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Once you suspect a bias, go to the <strong>Bias Audit Lab</strong>. You will submit two identical profiles side-by-side, changing ONLY ONE word (e.g. changing "Male" to "Female"). If the AI treats them differently, you have proven the bias!
            </p>
          </motion.div>

          {/* Rule 4 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-6 rounded-xl border border-slate-800"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Send className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">4. Transmit the Report</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              After proving the bias, you will be granted access to the <strong>Final Verdict</strong> screen. Write a short explanation of how you broke the AI and submit it. The fastest team to submit the report wins the tournament!
            </p>
          </motion.div>

        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <button 
            onClick={() => router.push('/')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-12 rounded-xl text-lg transition-all neon-glow uppercase tracking-widest"
          >
            Return to Lobby
          </button>
        </motion.div>

      </div>
    </div>
  );
}
