import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { realtimeService } from '../../../services/realtimeService';

interface ViewerPayload {
  count: number;
}

interface ServiceLiveTrackerProps {
  serviceId: string;
}

export const ServiceLiveTracker: React.FC<ServiceLiveTrackerProps> = ({ serviceId }) => {
  const [viewerCount, setViewerCount] = useState<number>(0);

  useEffect(() => {
    // Initial random count for "immediate" feel
    setViewerCount(Math.floor(Math.random() * 5) + 2);

    const unsubscribe = realtimeService.subscribe(`service:${serviceId}`, (event) => {
      if (event.type === 'viewer-update') {
        setViewerCount((event.payload as ViewerPayload).count);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [serviceId]);

  return (
    <div
      data-testid="live-tracker"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full animate-fade-in"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
        <Users size={12} className="text-emerald-500" />
        {viewerCount} Live Viewers
      </span>
    </div>
  );
};
