import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingQuiz } from '../../components/pricing/PricingQuiz';

describe('atom-7-4: PricingQuiz component', () => {
  it('renders pricing-quiz section', () => {
    render(<PricingQuiz lang="tr" />);
    expect(screen.getByTestId('pricing-quiz')).toBeDefined();
  });

  it('shows first question text on mount', () => {
    render(<PricingQuiz lang="tr" />);
    expect(screen.getByText('Şirketiniz hangi aşamada?')).toBeDefined();
  });

  it('renders "Hangisi Sana Uygun?" eyebrow', () => {
    render(<PricingQuiz lang="tr" />);
    const quiz = screen.getByTestId('pricing-quiz');
    expect(quiz.textContent).toContain('Hangisi');
  });

  it('renders 3 option buttons for first question', () => {
    render(<PricingQuiz lang="tr" />);
    const quiz = screen.getByTestId('pricing-quiz');
    const buttons = quiz.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('advances to next question when option clicked', () => {
    render(<PricingQuiz lang="tr" />);
    const firstButton = screen.getByText('Erken aşama / startup');
    fireEvent.click(firstButton);
    expect(screen.getByText('En acil zorluğunuz nedir?')).toBeDefined();
  });

  it('shows recommendation after all 5 questions answered', () => {
    render(<PricingQuiz lang="tr" />);
    const clickFirst = () => {
      const buttons = document.querySelectorAll('[data-testid="pricing-quiz"] button');
      if (buttons.length) fireEvent.click(buttons[0]);
    };
    clickFirst(); // Q1
    clickFirst(); // Q2
    clickFirst(); // Q3
    clickFirst(); // Q4
    clickFirst(); // Q5
    expect(screen.getByTestId('quiz-recommendation')).toBeDefined();
  });

  it('onSelectTier callback fires with tier id', () => {
    const onSelect = vi.fn();
    render(<PricingQuiz lang="tr" onSelectTier={onSelect} />);
    const clickFirst = () => {
      const buttons = document.querySelectorAll('[data-testid="pricing-quiz"] button');
      if (buttons.length) fireEvent.click(buttons[0]);
    };
    clickFirst();
    clickFirst();
    clickFirst();
    clickFirst();
    clickFirst();
    const selectBtn = screen.getByText('Bu paketi seç');
    fireEvent.click(selectBtn);
    expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/starter|growth|enterprise/));
  });
});
