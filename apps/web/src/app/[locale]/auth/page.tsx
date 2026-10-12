'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, LandMapWordmark } from '../../../components/lovable/icons';
import { Briefcase, Building2, TrendingUp, User } from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import {
  useMockUser,
  readMockUser,
  storeUserType,
  getPostAuthRedirect,
  type UserType,
} from '../../../lib/mockAuth';
import { track, trackCta } from '../../../track';

/** Segmentos do mercado imobiliário — escolha obrigatória no cadastro (1:1 Lovable). */
const USER_TYPE_OPTIONS: { id: UserType; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: 'corretor', label: 'Corretor', icon: <Briefcase size={18} />, hint: 'Comissão e carteira de clientes' },
  { id: 'investidor', label: 'Investidor', icon: <TrendingUp size={18} />, hint: 'Valorização e ROI de terrenos' },
  { id: 'incorporadora', label: 'Construtora', icon: <Building2 size={18} />, hint: 'Aquisição e desenvolvimento' },
  { id: 'empresa', label: 'Empresário', icon: <User size={18} />, hint: 'Gestão e oportunidades' },
];

const fieldClass =
  'w-full rounded-lg border bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--ring)]';

function Field({
  label,
  type = 'text',
  ...rest
}: { label: string; type?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          className={`${fieldClass} ${isPassword ? 'pr-10' : ''}`}
          style={{ borderColor: 'var(--border)' }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-foreground focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </label>
  );
}

function AuthPageInner() {
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const lh = (p: string) => `/${locale}${p}`;
  const [tab, setTab] = useState<'login' | 'signup'>(
    params.get('mode') === 'request' ? 'signup' : 'login',
  );

  /** Where to land after auth: honors ?returnTo=, persisted post-auth return, else /map. */
  const postAuth = () => getPostAuthRedirect(params.get('returnTo') ?? undefined, locale);

  useEffect(() => {
    const user = readMockUser();
    if (user && user.provider !== 'guest') {
      router.replace(`/${locale}/dashboard`);
    }
  }, [router, locale]);

  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<UserType | ''>('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPwFocused, setSignupPwFocused] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    const ddd = d.slice(0, 2);
    let local = d.slice(2);
    if (local.length > 5) local = `${local.slice(0, 5)}-${local.slice(5)}`;
    else if (local.length > 4) local = `${local.slice(0, 4)}-${local.slice(4)}`;
    return `(${ddd}) ${local}`;
  };

  const { signInEmail, signInGuest } = useMockUser();

  /** Free landing surface: /map. */
  const guest = () => {
    try {
      window.localStorage.setItem('guest_mode', '1');
    } catch {
      /* ignore */
    }
    track('user_guest_access', undefined, {});
    signInGuest();
    router.replace(postAuth());
    router.refresh();
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    track('user_login_attempt', undefined, { metadata: { method: 'email' } });
    try {
      await signInEmail({ email: loginEmail || undefined });
      track('user_login_success', undefined, { metadata: { method: 'email' } });
      router.replace(postAuth());
      router.refresh();
    } finally {
      setLoginLoading(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const phoneDigits = phone.replace(/\D/g, '');
    const pwLenMet = signupPassword.length >= 8;
    const pwSpecialMet = /[^A-Za-z0-9]/.test(signupPassword);
    if (!fullName.trim()) return setError('Informe seu nome.');
    if (phoneDigits.length < 10 || phoneDigits.length > 11)
      return setError('Telefone deve ter DDD + 8 ou 9 dígitos.');
    if (!userType) return setError('Selecione seu perfil.');
    if (!email.trim()) return setError('E-mail inválido.');
    if (!pwLenMet || !pwSpecialMet)
      return setError('A senha precisa de ao menos 8 caracteres e 1 caractere especial.');
    setSignupLoading(true);
    track('user_signup_attempt', undefined, { metadata: { userType } });
    storeUserType(userType as UserType);
    try {
      await signInEmail({
        email: email.trim(),
        name: fullName.trim(),
        userType: userType as UserType,
      });
      track('user_signup_success', undefined, { metadata: { userType } });
      router.replace(postAuth());
      router.refresh();
    } catch {
      track('user_signup_error', undefined, { metadata: { userType } });
      setError('Não foi possível concluir o cadastro. Tente novamente.');
    } finally {
      setSignupLoading(false);
    }
  };

  const pwLenMet = signupPassword.length >= 8;
  const pwSpecialMet = /[^A-Za-z0-9]/.test(signupPassword);
  const showPwHint = signupPwFocused || signupPassword.length > 0;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[var(--gradient-hero)] p-12 text-[var(--primary-foreground)] lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: 'var(--primary-glow)' }}
        />
        <div className="h-12">
          <LandMapWordmark />
        </div>
        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
            Inteligência de terrenos, do mapa à decisão.
          </h2>
          <p className="mt-4 max-w-md text-[color:color-mix(in_srgb,var(--primary-foreground)_80%,transparent)]">
            Preços verificados, comparação de regiões e histórico — em uma única plataforma.
          </p>
        </div>
        <p className="relative text-sm text-[color:color-mix(in_srgb,var(--primary-foreground)_60%,transparent)]">
          © {new Date().getFullYear()} LandMap
        </p>
      </aside>

      <main className="flex items-center justify-center bg-[var(--background)] p-6 md:p-12">
        <Reveal className="w-full max-w-md" y={24}>
          <div className="mb-8 h-12 lg:hidden">
            <LandMapWordmark />
          </div>

          <div
            role="tablist"
            className="grid w-full grid-cols-2 rounded-lg bg-[var(--muted)] p-1 text-sm font-medium"
          >
            {(
              [
                { id: 'login', label: 'Entrar' },
                { id: 'signup', label: 'Criar conta' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`tabcontent-${t.id}`}
                onClick={() => {
                  setTab(t.id);
                  setError('');
                }}
                className="rounded-md px-3 py-1.5 transition focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
                style={{
                  backgroundColor: tab === t.id ? 'var(--background)' : 'transparent',
                  color: tab === t.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'login' && (
            <form id="tabcontent-login" onSubmit={onLogin} className="mt-8 space-y-4">
              <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Acesse a plataforma com sua conta.
              </p>
              <Field
                label="E-mail"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <Field label="Senha" type="password" autoComplete="current-password" required />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-card)] transition hover:bg-[color:color-mix(in_srgb,var(--primary)_90%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              >
                {loginLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form id="tabcontent-signup" onSubmit={onSignup} className="mt-8 space-y-4">
              <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Preencha seus dados para começar a usar o LandMap.
              </p>
              <Field
                label="Nome completo"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Field
                label="Telefone"
                type="tel"
                inputMode="numeric"
                maxLength={15}
                placeholder="(11) 98765-4321"
                value={formatPhone(phone)}
                onChange={(e) => setPhone(e.target.value)}
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                  Tipo de usuário
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {USER_TYPE_OPTIONS.map((t) => {
                    const active = userType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setUserType(t.id)}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition focus-visible:ring-1 focus-visible:ring-[var(--ring)] ${
                          active
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                            : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]'
                        }`}
                      >
                        <span className="text-[var(--primary)]">{t.icon}</span>
                        <span className="text-sm font-medium text-[var(--foreground)]">{t.label}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">{t.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </label>
              <Field
                label="E-mail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">
                  Senha
                </span>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onFocus={() => setSignupPwFocused(true)}
                    onBlur={() => setSignupPwFocused(false)}
                    className={`${fieldClass} pr-10`}
                    style={{ borderColor: 'var(--border)' }}
                    autoComplete="new-password"
                  />
                </div>
                {showPwHint && (
                  <div className="mt-2 flex flex-col gap-1 rounded-md border border-[color:color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[var(--muted)] p-2 text-xs">
                    <span className={pwLenMet ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}>
                      {pwLenMet ? '✓' : '·'} Mínimo 8 caracteres
                    </span>
                    <span
                      className={
                        pwSpecialMet ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'
                      }
                    >
                      {pwSpecialMet ? '✓' : '·'} Ao menos 1 caractere especial
                    </span>
                  </div>
                )}
              </label>
              {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-card)] transition hover:bg-[color:color-mix(in_srgb,var(--primary)_90%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
              >
                {signupLoading ? 'Enviando...' : 'Criar conta'}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">ou</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <button
            type="button"
            onClick={guest}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border text-sm font-semibold transition hover:bg-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Entrar sem cadastro
          </button>

          <p className="mt-8 text-center text-sm text-[var(--muted-foreground)]">
            <Link href={lh('/')} className="hover:text-[var(--foreground)]">
              ← Voltar para o site
            </Link>
          </p>
        </Reveal>
      </main>
    </div>
  );
}

export default AuthPageInner;
