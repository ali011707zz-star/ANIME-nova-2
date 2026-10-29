import React, { useState } from 'react';
import { X, Sparkles, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Language } from '../types/anime';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === 'ar';
  const [tab, setTab] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('lly581758@gmail.com');
  const [password, setPassword] = useState('1234567890');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setStatusMessage(
        isAr
          ? 'تم إرسال كود التحقق بنجاح إلى بريدك الإلكتروني!'
          : 'Verification code sent successfully to your email!'
      );
      setTimeout(() => {
        onClose();
      }, 1600);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Dark overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#090A0C]/90 backdrop-blur-md"
      />

      {/* Modal Box matching Screenshot_20260727-222905 */}
      <div
        className="relative w-full max-w-md bg-[#090A0C] border border-white/10 rounded-3xl p-6 shadow-2xl text-white font-['Cairo'] z-10 animate-in zoom-in-95 duration-150"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#14171C] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h3 className="text-base font-extrabold text-white leading-tight">Anime NOVA</h3>
              <p className="text-[11px] text-[#9299A5] font-medium">
                {tab === 'signup'
                  ? (isAr ? 'أنشئ حسابك مجاناً' : 'Create free account')
                  : (isAr ? 'تسجيل الدخول إلى حسابك' : 'Sign in to account')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white shadow-lg shadow-violet-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="p-1 rounded-2xl bg-[#14171C] border border-white/10 flex items-center mb-6">
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              tab === 'signup'
                ? 'bg-[#7654C8] text-white shadow-md'
                : 'text-[#9299A5] hover:text-white'
            }`}
          >
            {isAr ? 'حساب جديد' : 'Sign Up'}
          </button>

          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
              tab === 'login'
                ? 'bg-[#7654C8] text-white shadow-md'
                : 'text-[#9299A5] hover:text-white'
            }`}
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signup' && (
            <div className="relative">
              <User className="w-4 h-4 text-[#9299A5] absolute top-3.5 left-4 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'الاسم (اختياري)' : 'Name (Optional)'}
                className="w-full bg-[#111317] border border-white/10 rounded-2xl px-4 py-3 pl-11 text-xs text-white placeholder:text-[#9299A5] focus:outline-none focus:border-[#7654C8] transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="w-4 h-4 text-[#9299A5] absolute top-3.5 left-4 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-[#111317] border border-white/10 rounded-2xl px-4 py-3 pl-11 text-xs text-white placeholder:text-[#9299A5] focus:outline-none focus:border-[#7654C8] transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-[#9299A5] absolute top-3.5 left-4 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#111317] border border-white/10 rounded-2xl px-4 py-3 pl-11 pr-11 text-xs text-white placeholder:text-[#9299A5] focus:outline-none focus:border-[#7654C8] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-3 right-4 text-[#9299A5] hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Feedback banner */}
          {statusMessage && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
              {statusMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-[#7654C8] hover:bg-[#6744b8] text-white font-bold text-xs shadow-lg shadow-violet-950/60 flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
            ) : (
              <>
                <span>{isAr ? 'أرسل كود التحقق' : 'Send Verification Code'}</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <p className="mt-5 text-[11px] text-[#9299A5] text-center leading-relaxed">
          {isAr
            ? 'بإنشاء حساب أنت توافق على شروط الاستخدام وسياسة الخصوصية'
            : 'By creating an account, you agree to the Terms of Service & Privacy Policy'}
        </p>
      </div>
    </div>
  );
};
