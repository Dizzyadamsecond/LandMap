import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Embeddings & Busca SemÃ¢ntica | LandMap',
    description: 'Como usar embeddings e busca semÃ¢ntica no LandMap â€” geraÃ§Ã£o de vetores, similaridade por cosseno e consultas hÃ­bridas.',
    openGraph: {
      title: 'Embeddings & Busca SemÃ¢ntica | LandMap',
      description: 'Guia de embeddings e busca semÃ¢ntica no LandMap.',
      url: `/${locale || 'pt-BR'}/docs/embedding`,
      type: 'website',
    },
  };
}

export default async function EmbeddingDocsPage({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-20">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <a href={`/${locale}/docs`} className="transition hover:text-[var(--muted-foreground)]">Docs</a>
          <span>/</span>
          <span className="text-[var(--muted-foreground)]">Embeddings</span>
        </nav>

        <span className="kicker block">Busca SemÃ¢ntica</span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Embeddings & Busca SemÃ¢ntica
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          O LandMap utiliza embeddings vetoriais para permitir buscas por similaridade semÃ¢ntica,
          indo alÃ©m da correspondÃªncia textual exata.
        </p>

        {/* How it works */}
        <section className="mt-10">
          <h2 className="text-lg font-medium text-[var(--foreground)]">Como funciona</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/40 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold">1</div>
              <h3 className="mt-3 text-sm font-medium text-[var(--foreground)]">TokenizaÃ§Ã£o</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Cada imÃ³vel Ã© tokenizado a partir de seus atributos (tÃ­tulo, cidade, tipo, tags).
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/40 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-bold">2</div>
              <h3 className="mt-3 text-sm font-medium text-[var(--foreground)]">VetorizaÃ§Ã£o</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Os tokens sÃ£o convertidos em vetores numÃ©ricos (embeddings) de alta dimensÃ£o.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/40 p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent-foreground)] text-sm font-bold">3</div>
              <h3 className="mt-3 text-sm font-medium text-[var(--foreground)]">Similaridade</h3>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                A busca calcula similaridade por cosseno entre o vetor da consulta e os vetores indexados.
              </p>
            </div>
          </div>
        </section>

        {/* Endpoint */}
        <section className="mt-12">
          <h2 className="text-lg font-medium text-[var(--foreground)]">Endpoint</h2>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 mt-4 p-5">
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-md bg-[var(--primary)]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--primary)]">GET</span>
              <code className="text-xs text-[var(--muted-foreground)] font-mono">/api/embeddings/similar</code>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[var(--muted-foreground)]">ParÃ¢metros</h3>
              <table className="mt-2 w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                    <th className="py-2 text-left font-medium">ParÃ¢metro</th>
                    <th className="py-2 text-left font-medium">Tipo</th>
                    <th className="py-2 text-left font-medium">ObrigatÃ³rio</th>
                    <th className="py-2 text-left font-medium">DescriÃ§Ã£o</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted-foreground)]">
                  <tr className="border-b border-[var(--border)]/50">
                    <td className="py-2 font-mono">q</td>
                    <td className="py-2 text-[var(--muted-foreground)]">string</td>
                    <td className="py-2 text-[var(--muted-foreground)]">Sim</td>
                    <td className="py-2">Texto da consulta em linguagem natural</td>
                  </tr>
                  <tr className="border-b border-[var(--border)]/50">
                    <td className="py-2 font-mono">limit</td>
                    <td className="py-2 text-[var(--muted-foreground)]">number</td>
                    <td className="py-2 text-[var(--muted-foreground)]">NÃ£o</td>
                    <td className="py-2">MÃ¡ximo de resultados (default: 5)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Exemplo</h3>
              <pre className="mt-2 overflow-x-auto rounded-md bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)]">
                <code>{`curl "http://localhost:4000/embeddings/similar?q=apartamento+centro+curitiba&limit=5"`}</code>
              </pre>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[var(--muted-foreground)]">Resposta</h3>
              <pre className="mt-2 overflow-x-auto rounded-md bg-[var(--card)] p-3 text-xs text-[var(--muted-foreground)]">
                <code>{`{
  "items": [
    {
      "id": "1",
      "title": "Apartamento padrÃ£o",
      "score": 0.92,
      "city": "Curitiba",
      "state": "PR",
      "price": 420000,
      ...
    }
  ],
  "total": 3
}`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="mt-12">
          <h2 className="text-lg font-medium text-[var(--foreground)]">Casos de uso</h2>
          <div className="mt-4 space-y-3">
            {[
              { title: 'Busca por conceito', desc: '"ImÃ³veis perto da praia em FlorianÃ³polis" â€” mesmo sem a palavra exata, a semÃ¢ntica encontra resultados.' },
              { title: 'RecomendaÃ§Ã£o inteligente', desc: 'Encontre imÃ³veis similares a um que o usuÃ¡rio jÃ¡ visitou, baseado em perfil vetorial.' },
              { title: 'Chat com IA contextual', desc: 'O assistente LLM combina busca semÃ¢ntica com geraÃ§Ã£o de texto para respostas precisas.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--card)]/40 p-4">
                <h3 className="text-sm font-medium text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
