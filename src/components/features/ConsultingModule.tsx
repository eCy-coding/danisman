import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Play, Pause, Save, RotateCcw, BarChart3, Lock } from 'lucide-react';
import { MockService } from '../../services/mockData';
import { DataTable } from '../ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { AdminOnly } from '../auth/RoleGuard';
import { LocalPersistenceService, Session, SessionSchema, STORAGE_KEYS } from '../../services/persistence';
import { Logger } from '../../lib/logger';

export const ConsultingModule: React.FC = () => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dialog State
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
        // Load from local storage via service
        const stored = LocalPersistenceService.getItem<Session[]>(STORAGE_KEYS.SESSIONS);
        if (stored) {
            setSessions(stored);
        } else {
             // Fallback to mock data if empty
             const mocks = await MockService.getSessions(); // Now async
             const typedMocks: Session[] = mocks.map(m => ({
                 id: m.id.toString(), // Ensure string
                 clientId: m.client, // Map client to clientId
                 client: m.client,
                 startTime: new Date(m.date).getTime(),
                 endTime: new Date(m.date).getTime() + 60000,
                 duration: 60000,
                 notes: 'Mock Session',
                 status: m.status === 'Tamamlandı' ? 'completed' : 'active'
             }));
             setSessions(typedMocks);
        }
    };
    loadData();
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && activeSession) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSession]);

  const startSession = () => {
    if (!clientName) return;
    const newSession: Session = {
        id: crypto.randomUUID(),
        clientId: clientName,
        client: clientName,
        startTime: Date.now(),
        duration: 0,
        status: 'active', // Supported by updated schema
        notes: ''
    };
    setActiveSession(newSession);
    setIsTimerRunning(true);
  };

  const pauseSession = () => {
    setIsTimerRunning(false);
  };

  const resumeSession = () => {
    setIsTimerRunning(true);
  };

  const stopSession = () => {
      pauseSession();
      setShowSaveDialog(true);
  };

  const saveSession = () => {
      if (!activeSession) return;
      
      const completedSession: Session = {
          ...activeSession,
          endTime: Date.now(),
          duration: elapsed * 1000,
          status: 'completed', // Supported by updated schema
          notes: notes
      };

      // Validate
      const validation = SessionSchema.safeParse(completedSession);
      if (!validation.success) {
          Logger.error('[ConsultingModule] Invalid session data', validation.error);
          return;
      }

      const updatedSessions = [completedSession, ...sessions];
      setSessions(updatedSessions);
      LocalPersistenceService.setItem(STORAGE_KEYS.SESSIONS, updatedSessions);

      setActiveSession(null);
      setElapsed(0);
      setClientName('');
      setNotes('');
      setShowSaveDialog(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Table Columns
  const columns: ColumnDef<Session>[] = [
      {
          accessorKey: 'clientId',
          header: 'Client',
      },
      {
          accessorKey: 'startTime',
          header: 'Date',
          cell: ({ getValue }) => new Date(getValue() as number).toLocaleDateString(),
      },
      {
          accessorKey: 'duration',
          header: 'Duration',
          cell: ({ getValue }) => {
              const mins = Math.floor((getValue() as number) / 60000);
              return `${mins} min`;
          }
      },
      {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ getValue }) => (
              <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                ${getValue() === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}
              `}>
                  {getValue() as string}
              </span>
          )
      }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-white">Consulting Console</h2>
                <p className="text-slate-400">Manage active sessions and client time tracking.</p>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline"><RotateCcw size={16} className="mr-2"/> Sync</Button>
                 <AdminOnly>
                    <Button variant="ghost" className="text-slate-400"><Lock size={16} /></Button>
                 </AdminOnly>
            </div>
        </div>

        {/* Active Session Card */}
        <Card className="p-6 border-white/10 shadow-lg relative overflow-hidden bg-white/5">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            
            {!activeSession ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full">
                        <Label>Client Name / Project ID</Label>
                        <Input 
                            placeholder="Enter client name..." 
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="text-lg"
                        />
                    </div>
                    <Button 
                        size="lg" 
                        onClick={startSession}
                        disabled={!clientName}
                        className="w-full md:w-auto bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20"
                    >
                        <Play size={20} className="mr-2" /> Start Session
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">{activeSession.clientId}</h3>
                            <div className="flex items-center gap-2 text-green-600 text-sm animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-green-600" /> Live Tracking
                            </div>
                        </div>
                        <div className="text-5xl font-mono font-bold text-white tracking-wider">
                            {formatTime(elapsed)}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {isTimerRunning ? (
                             <Button onClick={pauseSession} variant="outline" className="flex-1 border-white/20">
                                <Pause size={20} className="mr-2" /> Pause
                             </Button>
                        ) : (
                             <Button onClick={resumeSession} variant="outline" className="flex-1 border-green-500/20 bg-green-500/10 text-green-400">
                                <Play size={20} className="mr-2" /> Resume
                             </Button>
                        )}
                        <Button onClick={stopSession} variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700">
                            <Save size={20} className="mr-2" /> Stop & Save
                        </Button>
                    </div>
                    
                    <div>
                        <Label>Session Notes</Label>
                        <Input 
                            placeholder="Add notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)} 
                        />
                    </div>
                </div>
            )}
        </Card>

        {/* History Table */}
        <div className="space-y-4">
             <div className="flex items-center gap-2 text-white font-bold">
                <BarChart3 size={20} /> Session History
             </div>
             <div className="glass-card rounded-xl overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={sessions} 
                />
             </div>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="glass-card rounded-2xl max-w-md w-full p-6 animate-scale-in">
                    <h3 className="text-xl font-bold mb-4">Complete Session?</h3>
                    <p className="text-slate-400 mb-6">
                        Are you sure you want to save this session for <strong>{clientName}</strong>?
                        Duration: {formatTime(elapsed)}
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                        <Button onClick={saveSession}>Confirm & Save</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
