import React, { useState } from 'react';
import { getServices } from '@/lib/data';

const SERVICES = getServices();
import { Search, Edit, Trash2, Plus, Info } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServices = SERVICES.filter(service => 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h1 className="text-3xl font-serif text-white mb-1">Service Protocols</h1>
                   <p className="text-slate-400 font-light">Manage the 21 active service capabilities.</p>
                </div>
                <button className="flex items-center gap-2 bg-secondary text-black font-bold px-4 py-2.5 rounded-lg hover:bg-secondary/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(204,164,59,0.2)]">
                    <Plus size={18} />
                    <span className="uppercase tracking-wider text-xs">New Protocol</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-[#0A101F]/80 p-4 rounded-xl border border-white/5 flex gap-4 backdrop-blur-sm">
                 <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Search system protocols..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-secondary/30 transition-colors"
                    />
                 </div>
                 <div className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded-lg border border-white/10">
                    <Info size={14} className="text-secondary" />
                    <span className="text-xs text-slate-400 font-mono">Total: {filteredServices.length}</span>
                 </div>
            </div>

            {/* Table */}
            <div className="bg-[#0A101F]/80 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Icon</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Protocol Name</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredServices.map((service) => {
                                const Icon = service.icon as LucideIcon;
                                return (
                                    <tr key={service.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform duration-300">
                                                {Icon && <Icon size={20} />}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200 group-hover:text-white transition-colors">{service.title}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-[300px]">{service.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-900/30">
                                                Active
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="p-2 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-slate-400">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
