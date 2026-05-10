import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const nameId = React.useId();
  const emailId = React.useId();
  const passwordId = React.useId();

  return (
    <>
      <Helmet>
        <title>{t('auth.register') || 'Register'} | EcyPro</title>
      </Helmet>

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Visual */}
        <div className="hidden lg:flex flex-col justify-between bg-[#050810] text-white p-12 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-125 h-125 bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-125 h-125 bg-secondary/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary-dark flex items-center justify-center font-bold font-serif text-xl border border-white/10 mb-8">
              E
            </div>
            <h2 className="text-5xl font-serif font-medium leading-tight mb-6">
              Join the <span className="text-secondary">Elite</span>
              <br />
              Network.
            </h2>
            <p className="text-slate-400 text-lg font-light max-w-md">
              Access premium consulting resources, exclusive market insights, and strategic tools.
            </p>
          </div>

          <div className="relative z-10 text-sm text-slate-400">
            &copy; 2024 EcyPro Consulting. Premium Membership.
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center bg-neutral p-6 md:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-white">
                {t('auth.create_account') || 'Create Account'}
              </h1>
              <p className="text-slate-400 mt-2">
                {t('auth.enter_details') || 'Enter your details to get started.'}
              </p>
            </div>

            <form data-testid="register-form" className="space-y-6">
              <div className="space-y-2">
                <label htmlFor={nameId} className="text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder-slate-500"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={emailId} className="text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder-slate-500"
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor={passwordId} className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id={passwordId}
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-required="true"
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder-slate-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <Button variant="primary" className="w-full py-3">
                {t('auth.register') || 'Sign Up'} <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>

            <div className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
