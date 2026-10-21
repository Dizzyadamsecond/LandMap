'use client';

import { PublicPageShell } from '../../../components/PublicPageShell';

/**
 * `/cookies` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/cookies`, chunk `cookies-YTFnWGJL.js`):
 * header Voltar → `/onboarding`, `article.mx-auto.max-w-3xl.px-6.py-16`,
 * eyebrow "Legal", H1 "Política de cookies", nota "Estrutura de referência —
 * sujeita a revisão jurídica.", 4 seções em `div.prose...space-y-6` (seção 2
 * com `ul.ml-5.list-disc` + `strong` por categoria), `<Footer />` 1:1.
 */
export default function CookiesPage() {
  return (
    <PublicPageShell backHref="/onboarding">
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Política de cookies</h1>
        <p className="mt-3 text-sm text-foreground/50">
          Estrutura de referência — sujeita a revisão jurídica.
        </p>
        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none space-y-6 text-[15px] leading-relaxed text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. O que são cookies</h2>
            <p>
              Cookies são pequenos arquivos armazenados no seu dispositivo que permitem à
              plataforma reconhecer sua sessão e lembrar preferências. Utilizamos também
              tecnologias equivalentes como armazenamento local e identificadores de dispositivo.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Categorias</h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <strong>Essenciais:</strong> necessários para autenticação e operação básica. Não
                podem ser desativados.
              </li>
              <li>
                <strong>Preferências:</strong> lembram configurações escolhidas pelo usuário (tema,
                filtros, região favorita).
              </li>
              <li>
                <strong>Medição:</strong> ajudam a entender como a plataforma é utilizada, de forma
                agregada.
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Gerenciamento</h2>
            <p>
              Você pode gerenciar cookies pelo seu navegador. Desativar categorias essenciais pode
              inviabilizar o uso da plataforma.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Atualizações</h2>
            <p>
              Esta política pode ser atualizada. Alterações substantivas são informadas na própria
              plataforma.
            </p>
          </section>
        </div>
      </article>
    </PublicPageShell>
  );
}
