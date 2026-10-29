'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useMockUser, getPostAuthRedirect } from '../../../lib/mockAuth';
import { track } from '../../../track';

const LAST_EMAIL_KEY = 'landmap:last_email';

function formatPhone(val: string): string {
  const t = val.replace(/\D/g, '').slice(0, 11);
  if (t.length <= 2) return t;
  if (t.length <= 6) return `(${t.slice(0, 2)}) ${t.slice(2)}`;
  if (t.length <= 10) return `(${t.slice(0, 2)}) ${t.slice(2, 6)}-${t.slice(6)}`;
  return `(${t.slice(0, 2)}) ${t.slice(2, 7)}-${t.slice(7)}`;
}

export default function AuthPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const trial = searchParams.get('trial');
  const returnTo = searchParams.get('returnTo') || searchParams.get('next');

  const trialUsed = trial === 'used';
  const [tab, setTab] = useState<'login' | 'signup'>(
    !trialUsed && mode === 'request' ? 'signup' : 'login',
  );

  const { signIn, signInEmail } = useMockUser();
  const postAuth = () => getPostAuthRedirect(returnTo ?? undefined, locale);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    user_type: '',
    email: '',
    password: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupPwFocused, setSignupPwFocused] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  // Social loading
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  // Pre-fill last saved email if available
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAST_EMAIL_KEY);
      if (saved && !loginEmail) {
        setLoginEmail(saved);
      }
    } catch {}
  }, []);

  // Update tab if mode param changes
  useEffect(() => {
    if (!trialUsed && mode === 'request') {
      setTab('signup');
    }
  }, [mode, trialUsed]);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    track('user_oauth_attempt', undefined, { provider });
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('../../../lib/supabase');
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/${locale}/dashboard`,
            },
          });
          if (error) {
            toast.error('Não foi possível entrar', { description: error.message });
            setOauthLoading(null);
            return;
          }
        }
      }
      await signIn('corretor');
      toast.success('Bem-vindo(a)');
      router.replace(postAuth());
    } catch (err: any) {
      toast.error('Não foi possível entrar', { description: err?.message || 'Falha na conexão' });
    } finally {
      setOauthLoading(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = loginEmail.trim().toLowerCase();
    if (!r || !loginPassword) {
      toast.error('Preencha e-mail e senha para entrar');
      return;
    }
    setLoginLoading(true);
    track('user_login_attempt', undefined, { method: 'email' });
    try {
      if (typeof window !== 'undefined') {
        const { supabase } = await import('../../../lib/supabase');
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: r,
            password: loginPassword,
          });
          if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('not confirmed')) {
              toast.error('E-mail ainda não confirmado', {
                description: "Confirme pelo link enviado por e-mail ou use 'Esqueci minha senha'.",
              });
              setLoginLoading(false);
              return;
            }
            if (msg.includes('invalid login') || msg.includes('credentials')) {
              toast.error('E-mail ou senha incorretos', {
                description: 'Confira os dados. Se esqueceu a senha, use a recuperação de senha.',
              });
              setLoginLoading(false);
              return;
            }
            if (msg.includes('rate limit') || msg.includes('too many')) {
              toast.error('Muitas tentativas', {
                description: 'Aguarde alguns instantes e tente novamente.',
              });
              setLoginLoading(false);
              return;
            }
            toast.error('Falha no login', { description: error.message });
            setLoginLoading(false);
            return;
          }
        }
      }

      await signInEmail({ email: r });
      try {
        if (rememberEmail) {
          window.localStorage.setItem(LAST_EMAIL_KEY, r);
        } else {
          window.localStorage.removeItem(LAST_EMAIL_KEY);
        }
      } catch {}

      toast.success('Bem-vindo(a) de volta');
      router.replace(postAuth());
    } catch (err: any) {
      toast.error('Falha no login', { description: err?.message || 'Erro inesperado' });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = form.phone.replace(/\D/g, '').slice(0, 11);
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      toast.error('Confira os dados', { description: 'Informe seu nome' });
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast.error('Confira os dados', { description: 'Telefone deve ter DDD + 8 ou 9 dígitos' });
      return;
    }
    if (!form.user_type) {
      toast.error('Confira os dados', { description: 'Selecione seu perfil' });
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('Confira os dados', { description: 'E-mail inválido' });
      return;
    }
    if (form.password.length < 8) {
      toast.error('Confira os dados', { description: 'Mínimo 8 caracteres' });
      return;
    }
    if (!/[^A-Za-z0-9]/.test(form.password)) {
      toast.error('Confira os dados', {
        description: 'Inclua ao menos um caractere especial (ex.: $, £, @, !)',
      });
      return;
    }

    setSignupLoading(true);
    track('user_signup_attempt', undefined, { user_type: form.user_type });
    try {
      const formattedPhone = `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2)}`;
      if (typeof window !== 'undefined') {
        const { supabase } = await import('../../../lib/supabase');
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          const { data, error } = await supabase.auth.signUp({
            email: form.email.trim(),
            password: form.password,
            options: {
              emailRedirectTo: `${window.location.origin}/${locale}/dashboard`,
              data: {
                full_name: form.full_name.trim(),
                company: '',
                phone: formattedPhone,
                user_type: form.user_type,
              },
            },
          });
          if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
              toast.error('E-mail já cadastrado', {
                description: 'Só é possível ter uma conta por e-mail. Faça login ou recupere a senha.',
              });
              setSignupLoading(false);
              return;
            }
            if (msg.includes('phone') || msg.includes('duplicate') || msg.includes('unique')) {
              toast.error('Telefone já cadastrado', {
                description: 'Esse número já está vinculado a uma conta LandMap.',
              });
              setSignupLoading(false);
              return;
            }
            toast.error('Não foi possível cadastrar', { description: error.message });
            setSignupLoading(false);
            return;
          }
        }
      }

      await signInEmail({
        email: form.email.trim(),
        name: form.full_name.trim(),
        userType: form.user_type as any,
      });

      try {
        window.localStorage.setItem(LAST_EMAIL_KEY, form.email.trim());
      } catch {}

      toast.success('Conta criada');
      setLoginEmail(form.email.trim());
      setTab('login');
    } catch (err: any) {
      toast.error('Não foi possível cadastrar', { description: err?.message || 'Erro inesperado' });
    } finally {
      setSignupLoading(false);
    }
  };

  const pwLenMet = form.password.length >= 8;
  const pwSpecialMet = /[^A-Za-z0-9]/.test(form.password);
  const showPwHint = signupPwFocused || form.password.length > 0;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative hidden overflow-hidden bg-gradient-hero p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        style={{
          backgroundImage:
            'linear-gradient(140deg, oklch(0.20 0.08 265) 0%, oklch(0.30 0.15 265) 55%, oklch(0.50 0.20 265) 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, oklch(0.62 0.15 148 / 0.4), transparent 55%)',
          }}
        />
        <div className="flex items-center">
          <img
            src="/landmap-logo-transparent.png"
            alt="LandMap"
            className="w-auto object-contain h-12"
          />
        </div>
        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
            Inteligência de terrenos, do mapa à decisão.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Preços verificados, comparação de regiões e histórico — em uma única plataforma.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} LandMap
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center">
              <img
                src="/landmap-logo-transparent.png"
                alt="LandMap"
                className="w-auto object-contain h-12"
              />
            </div>
          </div>

          {trialUsed && (
            <div className="mb-6 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-foreground/70">
              Entre com outra conta para continuar. O teste gratuito de 7 dias já foi utilizado e não pode ser iniciado novamente.
            </div>
          )}

          <div data-orientation="horizontal" dir="ltr">
            {!trialUsed && (
              <div
                role="tablist"
                aria-orientation="horizontal"
                className="h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground grid w-full grid-cols-2"
                style={{ outline: 'none' }}
                tabIndex={0}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'login'}
                  aria-controls="radix-login-content"
                  data-state={tab === 'login' ? 'active' : 'inactive'}
                  onClick={() => setTab('login')}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'signup'}
                  aria-controls="radix-signup-content"
                  data-state={tab === 'signup' ? 'active' : 'inactive'}
                  onClick={() => setTab('signup')}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                >
                  Criar conta
                </button>
              </div>
            )}

            <div
              role="tabpanel"
              id="radix-login-content"
              aria-labelledby="radix-login-trigger"
              data-state={tab === 'login' ? 'active' : 'inactive'}
              hidden={tab !== 'login'}
              className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-8"
              tabIndex={0}
            >
              <form onSubmit={handleLogin} className="space-y-4" name="login" autoComplete="on">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesse a plataforma com sua conta.
                  </p>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    E-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((s) => !s)}
                      aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/${locale}/reset-password`}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  Lembrar meu e-mail neste dispositivo
                </label>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
                >
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </div>

            <div
              role="tabpanel"
              id="radix-signup-content"
              aria-labelledby="radix-signup-trigger"
              data-state={tab === 'signup' ? 'active' : 'inactive'}
              hidden={tab !== 'signup'}
              className="ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-8"
              style={{ animationDuration: '0s' }}
              tabIndex={0}
            >
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Preencha seus dados para começar a usar o LandMap.
                  </p>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="full_name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Nome completo
                  </label>
                  <input
                    id="full_name"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Telefone
                  </label>
                  <input
                    id="phone"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="(11) 98765-4321"
                    value={formatPhone(form.phone)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setForm({ ...form, phone: digits });
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Tipo de usuário
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={selectOpen}
                      onClick={() => setSelectOpen((prev) => !prev)}
                      className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                      data-placeholder={!form.user_type ? '' : undefined}
                    >
                      <span className={form.user_type ? 'text-foreground' : 'text-muted-foreground'}>
                        {form.user_type === 'broker'
                          ? 'Corretor'
                          : form.user_type === 'developer'
                          ? 'Construtora'
                          : form.user_type === 'investor'
                          ? 'Investidor'
                          : 'Selecione seu perfil'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                    {selectOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setSelectOpen(false)}
                        />
                        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                          <div className="p-1">
                            {[
                              { value: 'broker', label: 'Corretor' },
                              { value: 'developer', label: 'Construtora' },
                              { value: 'investor', label: 'Investidor' },
                            ].map((item) => (
                              <div
                                key={item.value}
                                role="option"
                                aria-selected={form.user_type === item.value}
                                onClick={() => {
                                  setForm({ ...form, user_type: item.value });
                                  setSelectOpen(false);
                                }}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                              >
                                <span>{item.label}</span>
                                {form.user_type === item.value && (
                                  <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <Check className="h-4 w-4" />
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    <select
                      tabIndex={-1}
                      aria-hidden="true"
                      value={form.user_type}
                      onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                      style={{
                        position: 'absolute',
                        border: '0px',
                        width: '1px',
                        height: '1px',
                        padding: '0px',
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0px, 0px, 0px, 0px)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <option value="broker">Corretor</option>
                      <option value="developer">Construtora</option>
                      <option value="investor">Investidor</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="signup-email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    E-mail
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="signup-password"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      autoComplete="new-password"
                      required
                      type={showSignupPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={() => setSignupPwFocused(true)}
                      onBlur={() => setSignupPwFocused(false)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((s) => !s)}
                      aria-label={showSignupPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {showPwHint && (
                    <div className="mt-2 flex flex-col gap-1 rounded-md border border-border/50 bg-muted/30 p-2 text-xs">
                      <span
                        className={`flex items-center gap-1.5 transition-colors ${
                          pwLenMet ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold ${
                            pwLenMet
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {pwLenMet ? '✓' : '·'}
                        </span>
                        Mínimo 8 caracteres
                      </span>
                      <span
                        className={`flex items-center gap-1.5 transition-colors ${
                          pwSpecialMet ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        <span
                          className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold ${
                            pwSpecialMet
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {pwSpecialMet ? '✓' : '·'}
                        </span>
                        Ao menos 1 caractere especial
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
                >
                  {signupLoading ? 'Enviando...' : 'Criar conta'}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full gap-2"
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2a7 7 0 0 1-6.6-4.8H1.4v3.1A11.9 11.9 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.4 14.5a7.1 7.1 0 0 1 0-4.9V6.5H1.4a11.9 11.9 0 0 0 0 10.7l4-2.7Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.7c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 11.9 11.9 0 0 0 1.4 6.5l4 3.1A7 7 0 0 1 12 4.7Z"
                />
              </svg>
              {oauthLoading === 'google' ? 'Conectando...' : 'Continuar com Google'}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={oauthLoading !== null}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full gap-2"
            >
              <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M16.4 12.7c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.5ZM14.6 4.9c.6-.8 1-1.8.9-2.9-.9.1-2 .6-2.7 1.4-.6.7-1 1.8-.9 2.8 1 .1 2-.5 2.7-1.3Z" />
              </svg>
              {oauthLoading === 'apple' ? 'Conectando...' : 'Continuar com Apple'}
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-foreground">
              ← Voltar para o site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
