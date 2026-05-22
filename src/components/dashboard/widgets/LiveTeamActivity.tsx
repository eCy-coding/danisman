import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Users, Zap } from 'lucide-react';
import { realtimeService } from '../../../services/realtimeService';

interface ActivityItem {
  id: string;
  message: string;
  type: 'lead' | 'user' | 'system';
  time: string;
}

export const LiveTeamActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Add initial fake activity
    setActivities([
      { id: '1', message: 'System baseline established', type: 'system', time: 'Just now' },
    ]);

    const unsubscribe = realtimeService.subscribeGlobal((_event) => {
      const newItem: ActivityItem = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: '',
        type: 'system',
      };

      if (newItem.message) {
        setActivities((prev) => [newItem, ...prev].slice(0, 5)); // Keep only latest 5
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="h-full bg-white/5 rounded-2xl p-5 shadow-sm border border-white/10 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Live Activity
        </h3>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <div className="grow space-y-3 overflow-hidden font-mono text-xs">
        <AnimatePresence initial={false}>
          {activities.map((item) => (
            <motion.div
              key={item.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 border-b border-white/5 pb-2 last:border-0"
            >
              <div
                className={`mt-0.5 p-1 rounded-md ${
                  item.type === 'lead'
                    ? 'bg-orange-500/10 text-orange-400'
                    : item.type === 'user'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-white/5 text-slate-400'
                }`}
              >
                {item.type === 'lead' ? (
                  <Zap size={12} />
                ) : item.type === 'user' ? (
                  <Users size={12} />
                ) : (
                  <Activity size={12} />
                )}
              </div>
              <div>
                <p className="text-slate-400 leading-tight">{item.message}</p>
                <span className="text-[10px] text-slate-400">{item.time}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
