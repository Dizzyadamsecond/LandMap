import { Hono } from 'hono';
const SUGGESTIONS = [
    { text: 'São Paulo', category: 'city' },
    { text: 'Rio de Janeiro', category: 'city' },
    { text: 'Brasília', category: 'city' },
    { text: 'Curitiba', category: 'city' },
    { text: 'Florianópolis', category: 'city' },
    { text: 'Porto Alegre', category: 'city' },
    { text: 'Belo Horizonte', category: 'city' },
    { text: 'Campinas', category: 'city' },
    { text: 'Ribeirão Preto', category: 'city' },
    { text: 'Niterói', category: 'city' },
    { text: 'Uberlândia', category: 'city' },
    { text: 'Goiânia', category: 'city' },
    { text: 'Salvador', category: 'city' },
    { text: 'Fortaleza', category: 'city' },
    { text: 'Recife', category: 'city' },
    { text: 'Belém', category: 'city' },
    { text: 'Manaus', category: 'city' },
    { text: 'Porto Velho', category: 'city' },
    { text: 'Rio Branco', category: 'city' },
    { text: 'Macapá', category: 'city' },
    { text: 'Boa Vista', category: 'city' },
    { text: 'Palmas', category: 'city' },
    { text: 'Santarém', category: 'city' },
    { text: 'São Luís', category: 'city' },
    { text: 'Teresina', category: 'city' },
    { text: 'Natal', category: 'city' },
    { text: 'João Pessoa', category: 'city' },
    { text: 'Maceió', category: 'city' },
    { text: 'Aracaju', category: 'city' },
    { text: 'Juazeiro do Norte', category: 'city' },
    { text: 'Campo Grande', category: 'city' },
    { text: 'Cuiabá', category: 'city' },
    { text: 'Vitória', category: 'city' },
    { text: 'Santos', category: 'city' },
    { text: 'Contagem', category: 'city' },
    { text: 'Vila Velha', category: 'city' },
    { text: 'Serra', category: 'city' },
    { text: 'Londrina', category: 'city' },
    { text: 'Maringá', category: 'city' },
    { text: 'Joinville', category: 'city' },
    { text: 'Itajaí', category: 'city' },
    { text: 'Caxias do Sul', category: 'city' },
    { text: 'Pelotas', category: 'city' },
    { text: 'Foz do Iguaçu', category: 'city' },
    { text: 'Balneário Camboriú', category: 'city' },
    { text: 'Centro', category: 'neighborhood' },
    { text: 'Batel', category: 'neighborhood' },
    { text: 'Trindade', category: 'neighborhood' },
    { text: 'Centro Cívico', category: 'neighborhood' },
    { text: 'Orla', category: 'neighborhood' },
    { text: 'Apartamento', category: 'type' },
    { text: 'Casa', category: 'type' },
    { text: 'Terreno', category: 'type' },
    { text: 'Comercial', category: 'type' },
    { text: 'Venda', category: 'modality' },
    { text: 'Aluguel', category: 'modality' },
    { text: 'Lançamento', category: 'modality' },
];
export function createSearchSuggestionsRouter() {
    const router = new Hono();
    router.get('/suggestions', async (c) => {
        const q = (c.req.query('q') || '').trim().toLowerCase();
        if (!q || q.length < 1) {
            return c.json({ items: [], total: 0 });
        }
        const filtered = SUGGESTIONS.filter((s) => s.text.toLowerCase().includes(q));
        return c.json({ items: filtered, total: filtered.length });
    });
    return router;
}
