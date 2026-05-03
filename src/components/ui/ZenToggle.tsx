import React, { useEffect } from 'react';
import { useZenStore } from '@/lib/stores/zenStore';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export const ZenToggle: React.FC = () => {
  const { isZenMode, toggleZen } = useZenStore();

  useEffect(() => {
    if (isZenMode) {
      document.documentElement.classList.add('zen-mode');
    } else {
      document.documentElement.classList.remove('zen-mode');
    }
  }, [isZenMode]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleZen}
      className={`
        fixed bottom-6 left-6 z-50 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300
        ${isZenMode 
            ? 'bg-black text-white border border-gray-800' 
            : 'bg-neutral-900/80 text-slate-200 border border-white/10 hover:bg-white/10'
        }
      `}
      aria-label={isZenMode ? "Disable Zen Mode" : "Enable Zen Mode"}
      title="Zen Mode (Reading View)"
    >
      {isZenMode ? <EyeOff size={20} /> : <Eye size={20} />}
    </motion.button>
  );
};
