'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Lock, Eye, EyeOff } from 'lucide-react';
import { LandMapWordmark } from '../../../components/lovable/icons';

function isStrongPassword(p: string) {
  return p.length >= 8 && /[^A-Za-z0-9]/.test(p);
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        setIsRecoveryMode(true);
      }
    }
  }, []);

  async function handleSendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Mock / Real reset email
      setSent(true);
      setSuccessMsg('Verifique seu e-mail para criar uma nova senha.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível enviar o link');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isStrongPassword(newPassword)) {
      setErrorMsg('Use no mínimo 8 caracteres e ao menos 1 caractere especial.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      setSuccessMsg('Senha alterada com sucesso!');
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-hero p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 20%, oklch(0.62 0.15 148 / 0.4), transparent 55%)',
          }}
        />
        <LandMapWordmark />
        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
            Recupere o acesso em poucos segundos.
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Enviamos um link seguro para o seu e-mail e você define uma nova senha.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} LandMap
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <LandMapWordmark />
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          {isRecoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Nova senha</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Defina a nova senha da sua conta.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirmar nova senha
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Esqueci minha senha</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Informe seu e-mail e enviaremos um link de recuperação.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-email" className="text-sm font-medium">
                  E-mail
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              {sent && (
                <p className="text-sm text-muted-foreground">
                  Se existir uma conta com esse e-mail, o link já está a caminho.
                </p>
              )}
            </form>
          )}

          <Link
            href={`/${locale}/auth`}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para o login
          </Link>
        </div>
      </main>
    </div>
  );
}
