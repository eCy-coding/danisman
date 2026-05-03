import React from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useTranslation, getLang, MultiLang } from '../lib/i18n';
import { AUTH_COPY } from '../constants';

export const ForgotPasswordPage: React.FC = () => {
    const { language: lang } = useTranslation();
    const emailId = React.useId();
    return (
        <AuthLayout seoTitle={getLang(AUTH_COPY.forgotPwTitle as MultiLang, lang) || ''}>
            <h1 className="text-2xl font-bold text-primary mb-2 text-center">{getLang(AUTH_COPY.forgotPwTitle as MultiLang, lang)}</h1>
            <p className="mb-6 text-sm text-slate-400 text-center">{getLang(AUTH_COPY.recoverDesc as MultiLang, lang)}</p>
            <form className="space-y-4">
                <label htmlFor={emailId} className="sr-only">
                    {getLang(AUTH_COPY.emailPlaceholder as MultiLang, lang)}
                </label>
                <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    placeholder={getLang(AUTH_COPY.emailPlaceholder as MultiLang, lang)}
                    aria-label={getLang(AUTH_COPY.emailPlaceholder as MultiLang, lang)}
                    className="w-full p-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-secondary outline-none text-white placeholder-slate-500"
                />
                <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors uppercase tracking-wider text-sm shadow-md hover:shadow-lg transform active:scale-95"
                >
                    {getLang(AUTH_COPY.resetBtn as MultiLang, lang)}
                </button>
            </form>
        </AuthLayout>
    );
};
