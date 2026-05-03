import React from 'react';
import { useReader } from '../../hooks/useReader';
import { Play, Pause, Square, Mic2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoicePlayerProps {
  content: string;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ content }) => {
  const { 
    speak, 
    pause, 
    resume, 
    stop, 
    isPlaying, 
    isPaused, 
    currentSentence, 
    supported 
  } = useReader({ text: content });

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Active Sentence Captions */}
      <AnimatePresence>
        {(isPlaying || isPaused) && currentSentence && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-2 max-w-sm rounded-xl bg-black/80 p-4 text-sm font-medium leading-relaxed text-white shadow-2xl backdrop-blur-md"
          >
             <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400">
                <Activity className="h-3 w-3 animate-pulse text-emerald-400" />
                <span>The Sovereign Voice</span>
             </div>
             "{currentSentence}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Fab */}
      <motion.div 
        className="flex items-center gap-2 rounded-full bg-neutral-900 p-2 shadow-xl ring-1 ring-white/10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {!isPlaying && !isPaused ? (
          <button
            onClick={speak}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all"
            aria-label="Listen to article"
          >
            <Mic2 className="h-5 w-5" />
          </button>
        ) : (
          <>
            {isPlaying ? (
              <button
                onClick={pause}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Pause"
              >
                <Pause className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={resume}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                aria-label="Resume"
              >
                <Play className="h-5 w-5 ml-0.5" />
              </button>
            )}
            
            <button
              onClick={stop}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20"
               aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
