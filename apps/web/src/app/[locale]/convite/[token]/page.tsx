'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card, Button } from '@landmap/ui';
import { Users, Check } from '../../../../components/lovable/icons';
import { storeUserType } from '../../../../lib/mockAuth';

/**
 * /convite/[token] — aceite de convite para a equipe.
 * Copy 1:1 da Lovable LIVE (`convite._token` chunk):
 *   "Entrar na equipe" · "Convite aceito. Bem-vindo à equipe!" ·
 *   "Não foi possível aceitar o convite."
 */
export default function ConvitePage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const token = String(params?.token ?? '');

  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  async function accept() {
    setLoading(true);
    setError('');
    try {
      // Sem backend de convites obrigatório: marca a entrada na equipe e segue.
      storeUserType('empresa');
      try {
        window.localStorage.setItem('guest_mode', '1');
      } catch {
        /* ignore */
      }
      setAccepted(true);
      setTimeout(() => router.replace(`/${locale}/dashboard`), 1200);
    } catch {
      setError('Não foi possível aceitar o convite.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-6 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
          {accepted ? <Check size={22} /> : <Users size={22} />}
        </span>

        <h1 className="text-lg font-semibold text-[var(--foreground)]">
          Convite de equipe
        </h1>

        {accepted ? (
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Convite aceito. Bem-vindo à equipe!
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Você foi convidado para colaborar na conta. Token:{' '}
              <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 text-[11px]">{token}</code>
            </p>

            {error && (
              <p className="mt-3 text-xs font-medium text-[var(--destructive)]">{error}</p>
            )}

            <Button
              type="button"
              onClick={accept}
              disabled={loading}
              className="mt-5 w-full"
            >
              {loading ? 'Aguarde…' : 'Entrar na equipe'}
            </Button>
          </>
        )}
      </Card>
    </main>
  );
}
