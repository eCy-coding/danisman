import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Loader2, CheckCircle, XCircle, Terminal } from 'lucide-react';
import { useSSE } from '../../hooks/useSSE';
import { apiClient } from '../../lib/api';

interface TaskEvent {
  type?: string;
  status?: string;
  message?: string;
  progress?: number;
  [key: string]: unknown;
}

export const PromptTaskBoard: React.FC = () => {
  const [projectId, setProjectId] = useState<number>(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [logs, setLogs] = useState<TaskEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSSEEvent = (event: TaskEvent) => {
    setLogs((prev) => [...prev, event]);
    if (event.type === 'COMPLETED' || event.type === 'FAILED') {
      setIsRunning(false);
    }
  };

  const { reconnect } = useSSE({
    url: activeTaskId ? `${import.meta.env.VITE_API_URL}/stream/${activeTaskId}` : undefined,
    autoReconnect: false,
    onEvent: handleSSEEvent as unknown as (event: unknown) => void,
  });

  const handleStartTask = async () => {
    try {
      setIsRunning(true);
      setLogs([]);
      // Start task via API
      const response = await apiClient.post('/run', { project_id: projectId });
      const taskId = response.data.task_id;
      setActiveTaskId(taskId);
      // Wait a moment for Celery to pick it up, then reconnect SSE
      setTimeout(() => {
        reconnect();
      }, 500);
    } catch (error) {
      setIsRunning(false);
      const msg = error instanceof Error ? error.message : 'Failed to start task';
      setLogs([{ type: 'FAILED', message: msg }]);
    }
  };

  const lastLog = logs[logs.length - 1];
  const currentProgress = lastLog?.progress ?? 0;
  const isCompleted = lastLog?.type === 'COMPLETED';
  const isFailed = lastLog?.type === 'FAILED';

  return (
    <div className="bg-[#0A101F]/80 border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-serif text-white flex items-center gap-2">
            <Terminal size={20} className="text-secondary" />
            Prompt Optimization Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1">Real-time autonomous reasoning and refinement stream</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-secondary"
            disabled={isRunning}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(id => (
              <option key={id} value={id}>Project {id}</option>
            ))}
          </select>
          <button type="button"
            onClick={handleStartTask}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
              isRunning 
                ? 'bg-secondary/20 text-secondary cursor-not-allowed' 
                : 'bg-secondary hover:bg-secondary/80 text-black'
            }`}
          >
            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Optimizing...' : 'Initialize'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {(isRunning || isCompleted || isFailed) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">Pipeline Status</span>
            <span className="text-secondary font-mono">{Math.round(currentProgress)}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              className={`h-full ${isFailed ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-secondary'}`}
            />
          </div>
        </div>
      )}

      {/* Live Terminal Output */}
      <div className="bg-black/80 rounded-xl p-4 font-mono text-sm h-75 overflow-y-auto border border-white/10 shadow-inner relative">
        {!activeTaskId && !isRunning && logs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Awaiting initialization parameters...
          </div>
        )}
        <AnimatePresence>
          {logs.map((log, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-2 flex items-start gap-3"
            >
              <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
              {log.type === 'FAILED' ? (
                <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              ) : log.type === 'COMPLETED' ? (
                <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
              ) : (
                <span className="text-secondary mt-0.5 shrink-0">❯</span>
              )}
              <span className={`${
                log.type === 'FAILED' ? 'text-red-300' : 
                log.type === 'COMPLETED' ? 'text-green-300' : 
                'text-slate-300'
              }`}>
                {log.message || JSON.stringify(log)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
