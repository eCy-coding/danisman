import React from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { AUTH_COPY } from '../constants';
import { Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const { language: lang } = useTranslation();
    const emailId = React.useId();
    const passwordId = React.useId();
    return (
        <AuthLayout seoTitle={getLang(AUTH_COPY.loginTitle as MultiLang, lang)}>
            <h1 className="text-2xl font-bold text-primary mb-6 text-center">{getLang(AUTH_COPY.loginTitle as MultiLang, lang)}</h1>
            <form data-testid="login-form" className="space-y-4">
                <div>
                    <label htmlFor={emailId} className="sr-only">
                        {getLang(AUTH_COPY.emailPlaceholder as MultiLang, lang)}
                    </label>
                    <input
                        id={emailId}
                        type="email"
                        data-testid="login-email"
                        autoComplete="email"
                        placeholder={getLang(AUTH_COPY.emailPlaceholder as MultiLang, lang)}
                        aria-label={getLang(AUTH_COPY.emailPlaceholder as MultiLang, lang)}
                        className="w-full p-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-white placeholder-slate-500"
                    />
                </div>
                <div>
                    <label htmlFor={passwordId} className="sr-only">
                        {getLang(AUTH_COPY.passwordPlaceholder as MultiLang, lang)}
                    </label>
                    <input
                        id={passwordId}
                        type="password"
                        data-testid="login-password"
                        autoComplete="current-password"
                        placeholder={getLang(AUTH_COPY.passwordPlaceholder as MultiLang, lang)}
                        aria-label={getLang(AUTH_COPY.passwordPlaceholder as MultiLang, lang)}
                        className="w-full p-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-white placeholder-slate-500"
                    />
                </div>
                <button
                    type="submit"
                    data-testid="login-submit"
                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors uppercase tracking-wider text-sm shadow-md hover:shadow-lg transform active:scale-95"
                >
                    {getLang(AUTH_COPY.signInBtn as MultiLang, lang)}
                </button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-400">
                {getLang(AUTH_COPY.noAccount as MultiLang, lang)} <Link to="/register" className="text-secondary font-bold hover:underline">{getLang(AUTH_COPY.signUpBtn as MultiLang, lang)}</Link>
            </div>
            <div className="mt-2 text-center text-xs">
                <Link to="/forgot-password" className="text-slate-400 hover:text-primary">{getLang(AUTH_COPY.forgotPwTitle as MultiLang, lang)}</Link>
            </div>
        </AuthLayout>
    );

};
