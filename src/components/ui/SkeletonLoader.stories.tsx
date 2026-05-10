/**
 * SkeletonLoader Stories — Phase 2 UI-Storybook
 * npm run storybook → http://localhost:6006
 */
import type { Meta, StoryObj } from '@storybook/react';
import {
  CardSkeleton,
  TextSkeleton,
  SectionSkeleton,
  HeroSkeleton,
  TableRowSkeleton,
  TestimonialSkeleton,
} from './SkeletonLoader';

const meta: Meta = {
  title: 'UI/SkeletonLoader',
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' } },
};
export default meta;

export const Card: StoryObj = { render: () => <CardSkeleton className="max-w-sm" /> };
export const Text: StoryObj = { render: () => <TextSkeleton lines={5} className="max-w-sm p-4" /> };
export const Section: StoryObj = { render: () => <SectionSkeleton cards={3} /> };
export const Hero: StoryObj = { render: () => <HeroSkeleton /> };
export const TableRows: StoryObj = { render: () => <TableRowSkeleton cols={4} rows={5} /> };
export const Testimonial: StoryObj = { render: () => <TestimonialSkeleton /> };
