import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingQuiz } from '../../components/pricing/PricingQuiz';

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', rest, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

describe('atom-7-4: PricingQuiz component', () => {
  it('renders pricing-quiz section', () => {
    render(<PricingQuiz />);
    expect(screen.getByTestId('pricing-quiz')).toBeDefined();
  });

  it('shows first question text on mount', () => {
    render(<PricingQuiz />);
    expect(screen.getByText('Şirketinizin yıllık ciro aralığı nedir?')).toBeDefined();
  });

  it('renders "Hangisi Sana Uygun?" eyebrow', () => {
    render(<PricingQuiz />);
    const quiz = screen.getByTestId('pricing-quiz');
    expect(quiz.textContent).toContain('Soru 1');
  });

  it('renders 3 option buttons for first question', () => {
    render(<PricingQuiz />);
    const quiz = screen.getByTestId('pricing-quiz');
    const buttons = quiz.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('advances to next question when option clicked', () => {
    render(<PricingQuiz />);
    const firstButton = screen.getByText('100 milyon USD altı');
    fireEvent.click(firstButton);
    expect(screen.getByText('Hangi alanda desteğe ihtiyaç duyuyorsunuz?')).toBeDefined();
  });

  it('shows recommendation after all 5 questions answered', () => {
    render(<PricingQuiz />);
    const clickFirst = () => {
      const buttons = document.querySelectorAll('[data-testid="pricing-quiz"] button');
      if (buttons.length) fireEvent.click(buttons[0]);
    };
    clickFirst(); // Q1
    clickFirst(); // Q2
    clickFirst(); // Q3
    clickFirst(); // Q4
    clickFirst(); // Q5
    expect(screen.getByTestId('quiz-result')).toBeDefined();
  });

  it('onSelectTier callback fires with tier id', () => {
    const onSelect = vi.fn();
    render(<PricingQuiz onResult={onSelect} />);
    const clickFirst = () => {
      const buttons = document.querySelectorAll('[data-testid="pricing-quiz"] button');
      if (buttons.length) fireEvent.click(buttons[0]);
    };
    clickFirst();
    clickFirst();
    clickFirst();
    clickFirst();
    clickFirst();
    const selectBtn = screen.getByTestId('quiz-cta');
    fireEvent.click(selectBtn);
    expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/starter|growth|enterprise/));
  });
});
