import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface Department {
  id: string;
  label: string | { tr: string; en: string };
}

interface ServiceFilterProps {
  departments: Department[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
  departments,
  selectedCategory,
  onSelectCategory,
}) => {
  const { i18n } = useTranslation();
  const lang = ((i18n.language || 'en').startsWith('tr') ? 'tr' : 'en') as 'tr' | 'en';

  const getLabel = (label: string | { tr: string; en: string }) => {
    if (typeof label === 'string') return label;
    return label[lang];
  };

  return (
    <div className="w-full overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
      <motion.div
        className="flex md:flex-wrap gap-2 md:justify-center min-w-max px-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {departments.map((dept) => {
          const isActive = selectedCategory === dept.id;
          return (
            <button
              type="button"
              key={dept.id}
              onClick={() => onSelectCategory(dept.id)}
              data-testid={`services-filter-${dept.id}`}
              data-active={isActive ? 'true' : 'false'}
              className={`
                                relative px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300
                                border flex items-center gap-2 whitespace-nowrap
                                ${
                                  isActive
                                    ? 'text-white bg-primary border-primary shadow-lg shadow-primary/20'
                                    : 'text-slate-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white'
                                }
                            `}
            >
              {getLabel(dept.label)}
              {isActive && (
                <motion.span
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
