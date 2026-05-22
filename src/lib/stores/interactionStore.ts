import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WizardState {
  currentStep: number;
  totalSteps: number;
  data: Record<string, unknown>;
  isComplete: boolean;
}

interface InteractionStore {
  // Booking Wizard State
  booking: WizardState;

  // Quiz State
  quiz: WizardState & { score: number };

  // Calculator State
  calculator: {
    revenue: number;
    teamSize: number;
    projectedGrowth: number;
  };

  // Actions
  setBookingStep: (step: number) => void;
  updateBookingData: (data: Partial<Record<string, unknown>>) => void;
  resetBooking: () => void;

  setQuizStep: (step: number) => void;
  updateQuizScore: (score: number) => void;
  updateQuizData: (data: Partial<Record<string, unknown>>) => void;

  updateCalculator: (data: { revenue?: number; teamSize?: number }) => void;
}

export const useInteractionStore = create<InteractionStore>()(
  persist(
    (set) => ({
      booking: {
        currentStep: 0,
        totalSteps: 3,
        data: {},
        isComplete: false,
      },
      quiz: {
        currentStep: 0,
        totalSteps: 5,
        data: {},
        score: 0,
        isComplete: false,
      },
      calculator: {
        revenue: 1000000,
        teamSize: 10,
        projectedGrowth: 0,
      },

      // Booking Actions
      setBookingStep: (step) =>
        set((state) => ({
          booking: { ...state.booking, currentStep: step },
        })),
      updateBookingData: (data) =>
        set((state) => ({
          booking: { ...state.booking, data: { ...state.booking.data, ...data } },
        })),
      resetBooking: () =>
        set((state) => ({
          booking: { ...state.booking, currentStep: 0, data: {}, isComplete: false },
        })),

      // Quiz Actions
      setQuizStep: (step) =>
        set((state) => ({
          quiz: { ...state.quiz, currentStep: step },
        })),
      updateQuizScore: (score) =>
        set((state) => ({
          quiz: { ...state.quiz, score: state.quiz.score + score },
        })),
      updateQuizData: (data) =>
        set((state) => ({
          quiz: { ...state.quiz, data: { ...state.quiz.data, ...data } },
        })),

      // Calculator Actions
      updateCalculator: (data) =>
        set((state) => ({
          calculator: { ...state.calculator, ...data },
        })),
    }),
    {
      name: 'ecypro-interaction-storage', // unique name
    },
  ),
);
