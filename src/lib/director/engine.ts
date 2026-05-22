export type ContentStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'PUBLISHED' | 'ARCHIVED';

// Basic types allowed in the rule engine
export type ConditionValue = string | number | boolean | null | undefined | string[] | number[];
export type ActionPayload = Record<string, unknown> | string | number | boolean | null;

export interface RuleContext {
  [key: string]: ConditionValue;
}

export interface Condition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN';
  value: ConditionValue;
}

export interface Action {
  type: 'UPDATE_STATUS' | 'SELECT_ASSET' | 'SCHEDULE_POST' | 'NOTIFY';
  payload: ActionPayload;
}

export interface Rule {
  id: string;
  name: string;
  priority: number;
  conditions: Condition[];
  actions: Action[];
}

export class RuleEngine {
  private rules: Rule[] = [];

  constructor(rules: Rule[] = []) {
    this.rules = rules.sort((a, b) => b.priority - a.priority);
  }

  addRule(rule: Rule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  evaluate(context: RuleContext): Action[] {
    const actions: Action[] = [];

    for (const rule of this.rules) {
      if (this.checkConditions(rule.conditions, context)) {
        actions.push(...rule.actions);
      }
    }

    return actions;
  }

  private checkConditions(conditions: Condition[], context: RuleContext): boolean {
    return conditions.every((condition) => {
      const contextValue = context[condition.field];
      const conditionValue = condition.value;

      if (contextValue == null || conditionValue == null) return false;

      switch (condition.operator) {
        case 'EQUALS':
          return contextValue === conditionValue;
        case 'NOT_EQUALS':
          return contextValue !== conditionValue;
        case 'GREATER_THAN':
          return typeof contextValue === 'number' && typeof conditionValue === 'number'
            ? contextValue > conditionValue
            : false;
        case 'LESS_THAN':
          return typeof contextValue === 'number' && typeof conditionValue === 'number'
            ? contextValue < conditionValue
            : false;
        case 'CONTAINS':
          if (Array.isArray(contextValue)) {
            return (contextValue as unknown[]).includes(conditionValue as unknown);
          } else if (typeof contextValue === 'string') {
            return contextValue.includes(String(conditionValue));
          }
          return false;
        case 'IN':
          return (
            Array.isArray(conditionValue) &&
            (conditionValue as unknown[]).includes(contextValue as unknown)
          );
        default:
          return false;
      }
    });
  }
}

export class StateMachine {
  private state: ContentStatus = 'DRAFT';
  private transitions: Record<ContentStatus, ContentStatus[]> = {
    DRAFT: ['PROCESSING', 'ARCHIVED'],
    PROCESSING: ['READY', 'DRAFT'],
    READY: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
    PUBLISHED: ['ARCHIVED'],
    ARCHIVED: ['DRAFT'],
  };

  constructor(initialState: ContentStatus = 'DRAFT') {
    this.state = initialState;
  }

  getState(): ContentStatus {
    return this.state;
  }

  canTransitionTo(newState: ContentStatus): boolean {
    return this.transitions[this.state].includes(newState);
  }

  transition(newState: ContentStatus): boolean {
    if (this.canTransitionTo(newState)) {
      this.state = newState;
      return true;
    }
    return false;
  }
}
