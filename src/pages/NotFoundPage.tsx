import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            404
          </h1>
          <div className="h-1 w-32 mx-auto bg-linear-to-r from-primary to-secondary rounded-full mt-4"></div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-white mb-4">
          Sayfa Bulunamadı
        </h2>
        <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
          Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
          Lütfen URL'yi kontrol edin veya ana sayfaya dönün.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="mr-2 h-5 w-5" />
              Ana Sayfaya Dön
            </Button>
          </Link>
          
          <Link to="/app">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Dashboard'a Git
            </Button>
          </Link>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-slate-400 mb-4">Popüler Sayfalar:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/#services" className="text-sm text-secondary hover:underline">
              Hizmetlerimiz
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/#success-stories" className="text-sm text-secondary hover:underline">
              Başarı Hikayeleri
            </Link>
            <span className="text-slate-600">•</span>
            <Link to="/#contact" className="text-sm text-secondary hover:underline">
              İletişim
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="mt-12 opacity-10">
          <Search className="w-32 h-32 mx-auto text-slate-400" />
        </div>
      </div>
    </div>
  );
};
