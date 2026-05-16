import React, { useState, useEffect, useRef } from 'react';
import { matrixObserver, Metric } from '../../lib/matrix/observer';
import { matrixAnalytics, AnalyticsEvent } from '../../lib/matrix/analytics';
import { Activity, Cpu, Database, X, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MissionControl: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [metrics, setMetrics] = useState<Metric[]>([]);
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [fps, setFps] = useState(60);
    const _canvasRef = useRef<HTMLCanvasElement>(null);

    // Toggle with Ctrl + Shift + M
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                setIsVisible((prev: boolean) => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Monitoring Loop
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setMetrics(matrixObserver.getMetrics());
            setEvents(matrixAnalytics.getRecentEvents());
            // @ts-expect-error - performance.memory is non-standard
            if (performance.memory) {
                // setMemory(performance.memory.usedJSHeapSize / 1048576);
            }
        }, 1000);

        // FPS Counter
        let frameCount = 0;
        let lastTime = performance.now();
        const loop = (now: number) => {
            frameCount++;
            if (now - lastTime >= 1000) {
                setFps(frameCount);
                frameCount = 0;
                lastTime = now;
            }
            requestAnimationFrame(loop);
        };
        const raf = requestAnimationFrame(loop);

        return () => {
            clearInterval(interval);
            cancelAnimationFrame(raf);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-4 right-4 z-[9999] w-[400px] bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl text-slate-200 font-mono text-xs overflow-hidden"
            >
                <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-green-400" />
                        <span className="font-bold text-green-400">MISSION CONTROL // ORACLE</span>
                    </div>
                    <button type="button" onClick={() => setIsVisible(false)} className="hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Live Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-800 p-2 rounded flex flex-col items-center">
                            <Activity className="w-4 h-4 text-blue-400 mb-1" />
                            <span className="text-xl font-bold">{fps}</span>
                            <span className="text-[10px] text-slate-400">FPS</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded flex flex-col items-center">
                            <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                            <span className="text-xl font-bold">{(metrics.length)}</span>
                            <span className="text-[10px] text-slate-400">METRICS</span>
                        </div>
                        <div className="bg-slate-800 p-2 rounded flex flex-col items-center">
                            <Database className="w-4 h-4 text-yellow-400 mb-1" />
                            <span className="text-xl font-bold">{events.length}</span>
                            <span className="text-[10px] text-slate-400">EVENTS</span>
                        </div>
                    </div>

                    {/* Vitals Section */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Web Vitals</h4>
                        <div className="space-y-1">
                            {metrics.slice(-5).map((m: Metric, i: number) => (
                                <div key={i} className="flex justify-between items-center bg-slate-800/50 p-1.5 rounded">
                                    <span className={`font-bold ${m.rating === 'poor' ? 'text-red-400' : m.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {m.name}
                                    </span>
                                    <span>{m.value.toFixed(2)}ms</span>
                                </div>
                            ))}
                            {metrics.length === 0 && <span className="text-slate-600 italic">Waiting for data...</span>}
                        </div>
                    </div>

                    {/* Event Log */}
                    <div>
                        <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Live Feed</h4>
                        <div className="space-y-1 font-mono">
                            {events.slice().reverse().slice(0, 8).map((e: AnalyticsEvent, i: number) => (
                                <div key={i} className="flex gap-2 text-[10px] border-b border-slate-800 pb-1">
                                    <span className="text-slate-400">{new Date(e.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                                    <span className={`uppercase font-bold ${e.type === 'error' ? 'text-red-400' : 'text-blue-300'}`}>[{e.type}]</span>
                                    <span className="truncate flex-1 text-slate-300">{e.target || e.path}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
