'use client';

import { BellRing, Check } from '../../../components/lovable/icons';
import { ProductPageShell } from '../../../components/ProductPageShell';
import { Reveal } from '../../../components/Motion';
import { Card } from '@landmap/ui';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. O que são cookies',
    body: 'Cookies são pequenos arquivos armazenados no seu dispositivo que permitem à plataforma reconhecer sua sessão e lembrar preferências. Utilizamos também tecnologias equivalentes como armazenamento local e identificadores de dispositivo.',
  },
  {
    title: '2. Categorias',
    body: 'Essenciais: necessários para autenticação e operação básica. Não podem ser desativados. Preferências: lembram configurações escolhidas pelo usuário (tema, filtros, região favorita). Medição: ajudam a entender como a plataforma é utilizada, de forma agregada.',
  },
  {
    title: '3. Gerenciamento',
    body: 'Você pode gerenciar cookies pelo seu navegador. Desativar categorias essenciais pode inviabilizar o uso da plataforma.',
  },
  {
    title: '4. Atualizações',
    body: 'Esta política pode ser atualizada. Alterações substantivas são informadas na própria plataforma.',
  },
];

export default function CookiesPage() {
  return (
    <ProductPageShell
      backHref="/map"
      eyebrow={<><BellRing className="h-3 w-3" /> Cookies</>}
      title="Política de Cookies"
      description="Estrutura de referência — sujeita a revisão jurídica."
    >
      <section className="space-y-3">
        {SECTIONS.map((s) => (
          <Reveal key={s.title}>
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[var(--foreground)]">{s.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">{s.body}</p>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="./privacy"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Privacidade
        </a>
        <a
          href="./terms"
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
        >
          Termos de uso
        </a>
      </div>
    </ProductPageShell>
  );
}
