import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { FadeIn } from '../components/common/FadeIn';

export const PartnersPage: React.FC = () => {
    const partners = [
        { name: "Oracle", tier: "Platinum", logo: "" },
        { name: "Microsoft", tier: "Gold", logo: "" },
        { name: "Salesforce", tier: "Strategic", logo: "" },
        { name: "SAP", tier: "Global", logo: "" }
    ];

    return (
        <div className="min-h-screen bg-neutral pt-32 pb-24 text-slate-300 font-sans">
             <div className="max-w-7xl mx-auto px-6 md:px-12">
                <FadeIn>
                    <div className="text-center mb-20">
                        <span className="text-secondary font-bold tracking-widest uppercase text-xs mb-4 inline-block">Global Ecosystem</span>
                        <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6">
                            Strategic <span className="text-primary">Alliances</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-slate-400 font-light">
                            Collaborating with world leaders to deliver excellence.
                        </p>
                    </div>
                </FadeIn>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
                    {partners.map((partner, i) => (
                        <div key={i} className="aspect-square glass-card rounded-2xl flex items-center justify-center p-8 hover:border-white/20 transition-all grayscale hover:grayscale-0 opacity-70 hover:opacity-100">
                             {/* Placeholder for Logos */}
                             <div className="text-center">
                                <Globe2 className="w-12 h-12 text-blue-900 mx-auto mb-3" />
                                <span className="font-bold text-white">{partner.name}</span>
                                <span className="block text-xs text-slate-400 mt-1">{partner.tier} Partner</span>
                             </div>
                        </div>
                    ))}
                </div>

                <div className="glass-card rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-serif font-bold text-white mb-6">Become a Partner</h2>
                        <p className="text-slate-400 max-w-xl mx-auto mb-10">
                            Join our ecosystem of consulting excellence. Let's create value together.
                        </p>
                        <Link to="/contact" className="btn-primary">
                            Apply Now
                        </Link>
                    </div>
                </div>
             </div>
        </div>
    );
};
