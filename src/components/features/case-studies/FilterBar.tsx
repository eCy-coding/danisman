import React from 'react';
import { motion } from 'motion/react';

interface FilterBarProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ categories, activeCategory, onSelect }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-12">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
            activeCategory === category
              ? 'text-white'
              : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          {activeCategory === category && (
            <motion.div
              layoutId="activeFilter"
              className="absolute inset-0 bg-blue-600 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{category}</span>
        </button>
      ))}
    </div>
  );
};
