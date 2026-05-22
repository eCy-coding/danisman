import { RuleEngine, Rule, RuleContext } from '../lib/director/engine';

// Define Message Types
export type DirectorMessageType = 'INIT' | 'RUN_RULES' | 'STATUS_UPDATE';

export interface DirectorMessage {
  type: DirectorMessageType;
  payload: unknown;
}

// Worker State
let engine: RuleEngine | null = null;

// Initialize Standard Rules (Example)
const defaultRules: Rule[] = [
  {
    id: 'auto-archive-old',
    name: 'Auto Archive Old Drafts',
    priority: 10,
    conditions: [
      { field: 'status', operator: 'EQUALS', value: 'DRAFT' },
      { field: 'daysSinceUpdate', operator: 'GREATER_THAN', value: 30 },
    ],
    actions: [{ type: 'UPDATE_STATUS', payload: 'ARCHIVED' }],
  },
  {
    id: 'promote-high-score',
    name: 'Promote High Score Drafts',
    priority: 5,
    conditions: [
      { field: 'status', operator: 'EQUALS', value: 'DRAFT' },
      { field: 'heuristicScore', operator: 'GREATER_THAN', value: 80 },
    ],
    actions: [{ type: 'UPDATE_STATUS', payload: 'READY' }],
  },
];

// Message Handler
self.onmessage = (e: MessageEvent<DirectorMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT':
      initializeEngine();
      break;

    case 'RUN_RULES': {
      if (!engine) initializeEngine();
      const context = payload as RuleContext;
      const actions = engine?.evaluate(context);
      self.postMessage({ type: 'RULES_EXECUTED', payload: actions });
      break;
    }

    default:
      // Drop unknown messages
      break;
  }
};

function initializeEngine() {
  if (engine) return;
  engine = new RuleEngine(defaultRules);
  self.postMessage({ type: 'STATUS_UPDATE', payload: 'INITIALIZED' });
}

export {};
