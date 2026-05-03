import { WifiOff } from 'lucide-react';
import { useOffline } from '../../lib/useOffline';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineStatus: React.FC = () => {
  const isOffline = useOffline();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-9999"
        >
          <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <WifiOff className="text-red-400 w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Bağlantı Kesildi</p>
              <p className="text-slate-400 text-xs">Şu an çevrimdışı moddasınız.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
