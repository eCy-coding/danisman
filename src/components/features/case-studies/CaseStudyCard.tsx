import React from 'react';
import { motion } from 'motion/react';
import { Building2, Trophy, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  industry: string;
  result: string;
  image?: string;
  content: string; // HTML snippet
  /** Duration of the engagement, e.g. "8 months". */
  duration?: string;
  /** Go-live quarter/period, e.g. "Q2 2025". */
  goLive?: string;
  /** Short one-line problem statement. */
  challenge?: string;
}

interface CaseStudyCardProps {
  study: CaseStudy;
}

export const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ study }) => {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="group bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col h-full"
    >
      {study.image && (
        <div className="h-48 overflow-hidden relative">
          <img
            src={study.image}
            alt={study.title}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      <div className="p-8 pb-4 grow">
        <div className="flex items-center space-x-2 text-sm text-primary font-medium mb-3">
          <Building2 className="w-4 h-4" />
          <span>{study.industry}</span>
        </div>

        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-secondary transition-colors">
          {study.title}
        </h3>

        <p className="text-slate-400 text-sm mb-4">Client: {study.client}</p>

        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
          <Trophy className="w-3 h-3" />
          <span>{study.result}</span>
        </div>

        <div
          className="mt-6 text-slate-400 text-sm line-clamp-3 prose prose-invert prose-sm"
          dangerouslySetInnerHTML={{ __html: study.content }}
        />
      </div>

      <div className="p-6 pt-0 mt-auto border-t border-white/5 bg-white/5">
        <Link
          to={`/case-studies/${study.slug}`} // Assuming individual pages exist or will exist
          className="flex items-center space-x-2 text-sm font-semibold text-white group-hover:translate-x-1 transition-transform mt-4"
        >
          <span>Read Case Study</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  );
};
