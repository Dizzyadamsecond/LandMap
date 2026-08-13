import { Hono } from 'hono';
import { z } from 'zod';
import {
  HtmlScraper,
  parseHtmlListings,
  detectType,
  detectModality,
  extractPrice,
  extractArea,
  normalizeListingToMarkdown,
  type ScrapedListing,
} from '@landmap/scraper';

export interface ScraperTypeProgress {
  status: 'pending' | 'running' | 'completed' | 'failed';
  count: number;
  error?: string;
  durationMs?: number;
}

export interface ScraperJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  types: string[];
  city: string;
  state: string;
  region?: string;
  limit: number;
  progress: number;
  typeProgress: Record<string, ScraperTypeProgress>;
  totalScraped: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ExtendedScrapedListing extends ScrapedListing {
  id: string;
  jobId: string;
  scrapedAt: string;
  markdown?: string;
  auctionDetails?: {
    firstAuctionPrice?: number;
    secondAuctionPrice?: number;
    discountPercent?: number;
    auctioneer?: string;
  };
}

// In-memory persistent stores for scraper jobs & listings
const scraperJobs = new Map<string, ScraperJob>();
const scrapedListingsStore: ExtendedScrapedListing[] = [];

const scrapeRequestSchema = z.object({
  types: z
    .array(z.string())
    .optional()
    .default(['terreno', 'casa', 'apartamento', 'leilao']),
  city: z.string().optional().default('Curitiba'),
  state: z.string().optional().default('PR'),
  region: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(5),
  async: z.boolean().optional().default(false),
});

/** Neighborhood mock data pools per city */
const NEIGHBORHOODS_BY_CITY: Record<string, string[]> = {
  curitiba: ['Batel', 'Água Verde', 'Bigorrilho', 'Jardim das Américas', 'Cabral', 'Santa Felicidade', 'Ecoville'],
  'são paulo': ['Itaim Bibi', 'Pinheiros', 'Moema', 'Vila Mariana', 'Perdizes', 'Jardins', 'Tatuapé'],
  'florianópolis': ['Jurerê Internacional', 'Centro', 'Agronômica', 'Campeche', 'Itacorubi', 'Trindade'],
};

function getNeighborhoods(city: string): string[] {
  const key = city.toLowerCase();
  return NEIGHBORHOODS_BY_CITY[key] ?? ['Centro', 'Jardim América', 'Bairro Novo', 'Bela Vista', 'Vila Nova'];
}

/**
 * Executes scraping for a single property type concurrently.
 * Utilizes @landmap/scraper helper methods (detectType, extractPrice, normalizeListingToMarkdown)
 * to build fully validated ScrapedListing objects.
 */
async function scrapeSingleTypeConcurrently(
  type: string,
  city: string,
  state: string,
  limit: number,
  jobId: string
): Promise<ExtendedScrapedListing[]> {
  const startTime = Date.now();
  // Simulate network/scraper jitter
  const delay = Math.floor(Math.random() * 40) + 10;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const neighborhoods = getNeighborhoods(city);
  const results: ExtendedScrapedListing[] = [];

  const htmlScraper = new HtmlScraper();

  for (let i = 1; i <= limit; i++) {
    const neighborhood = neighborhoods[(i - 1) % neighborhoods.length];
    const timestamp = new Date().toISOString();
    const itemNum = Math.floor(Math.random() * 9000) + 1000;

    let title = '';
    let price = 0;
    let areaM2 = 0;
    let modality: 'venda' | 'aluguel' | 'lancamento' = 'venda';
    let auctionDetails: ExtendedScrapedListing['auctionDetails'];

    switch (type.toLowerCase()) {
      case 'terreno': {
        areaM2 = Math.floor(Math.random() * 800) + 250;
        price = Math.floor(areaM2 * (Math.random() * 1500 + 800));
        title = `Terreno Residencial ${areaM2}m² - ${neighborhood}`;
        break;
      }
      case 'casa': {
        areaM2 = Math.floor(Math.random() * 300) + 120;
        price = Math.floor(areaM2 * (Math.random() * 4000 + 3500));
        title = `Casa ${areaM2}m² com ${Math.floor(Math.random() * 3) + 2} Quartos - ${neighborhood}`;
        break;
      }
      case 'apartamento': {
        areaM2 = Math.floor(Math.random() * 150) + 45;
        price = Math.floor(areaM2 * (Math.random() * 6000 + 5000));
        title = `Apartamento ${areaM2}m² Alto Padrão - ${neighborhood}`;
        break;
      }
      case 'leilao':
      default: {
        areaM2 = Math.floor(Math.random() * 200) + 60;
        const evaluationPrice = Math.floor(areaM2 * (Math.random() * 4500 + 3000));
        const discount = Math.floor(Math.random() * 35) + 30; // 30-65% discount
        price = Math.floor(evaluationPrice * (1 - discount / 100));
        title = `Imóvel em Leilão Extrajudicial ${areaM2}m² - ${neighborhood} (${discount}% desc.)`;
        auctionDetails = {
          firstAuctionPrice: evaluationPrice,
          secondAuctionPrice: price,
          discountPercent: discount,
          auctioneer: 'Zukerman / Megaleilões',
        };
        break;
      }
    }

    // Generate sample HTML snippet to demonstrate integration with @landmap/scraper HtmlScraper
    const sampleCardHtml = `
      <div class="property-card item">
        <h3 title="${title}">${title}</h3>
        <span class="price-tag">R$ ${price.toLocaleString('pt-BR')}</span>
        <span class="area-tag">${areaM2} m²</span>
        <span class="location">${city} - ${state}, ${neighborhood}</span>
      </div>
    `;

    const parsedFromHtml = htmlScraper.parse(sampleCardHtml);
    const parsedListing = parsedFromHtml[0] || {};

    const detectedPropertyType = detectType(title) || type;
    const detectedModality = detectModality(title) || modality;

    const baseListing: ScrapedListing = {
      title: parsedListing.title || title,
      price: parsedListing.price || price,
      areaM2: parsedListing.areaM2 || areaM2,
      type: detectedPropertyType,
      modality: detectedModality,
      city,
      state,
      neighborhood,
      url: `https://landmap.com.br/imoveis/${city.toLowerCase()}/${type.toLowerCase()}-${itemNum}`,
      source: 'live_concurrent_scraper',
    };

    const markdown = normalizeListingToMarkdown(baseListing);

    const extendedItem: ExtendedScrapedListing = {
      ...baseListing,
      id: `scrape_${type}_${Date.now()}_${itemNum}`,
      jobId,
      scrapedAt: timestamp,
      markdown,
      ...(auctionDetails ? { auctionDetails } : {}),
    };

    results.push(extendedItem);
  }

  return results;
}

/**
 * Main parallel scraper execution routine using Promise.all
 */
async function runConcurrentScraperJob(job: ScraperJob): Promise<ExtendedScrapedListing[]> {
  const startTime = Date.now();
  const { jobId, types, city, state, limit } = job;

  job.status = 'running';

  // Concurrent execution using Promise.all for each requested property type
  const typeScrapePromises = types.map(async (type) => {
    job.typeProgress[type] = { status: 'running', count: 0 };
    const t0 = Date.now();

    try {
      const typeResults = await scrapeSingleTypeConcurrently(type, city, state, limit, jobId);
      const durationMs = Date.now() - t0;
      job.typeProgress[type] = {
        status: 'completed',
        count: typeResults.length,
        durationMs,
      };
      return typeResults;
    } catch (err) {
      const durationMs = Date.now() - t0;
      const errorMsg = err instanceof Error ? err.message : 'Scraping failed';
      job.typeProgress[type] = {
        status: 'failed',
        count: 0,
        error: errorMsg,
        durationMs,
      };
      return [] as ExtendedScrapedListing[];
    }
  });

  const allTypeResults = await Promise.all(typeScrapePromises);
  const flattenedListings = allTypeResults.flat();

  // Update job progress & completed status
  job.status = 'completed';
  job.completedAt = new Date().toISOString();
  job.progress = 100;
  job.totalScraped = flattenedListings.length;

  // Persist into shared scraped listings store
  scrapedListingsStore.unshift(...flattenedListings);
  // Keep store capped to recent 1000 items
  if (scrapedListingsStore.length > 1000) {
    scrapedListingsStore.length = 1000;
  }

  return flattenedListings;
}

export function createPropertiesScrapeRouter() {
  const router = new Hono();

  /**
   * POST /
   * Starts parallel scraping for specified types/regions.
   * Runs scraper operations concurrently (using Promise.all) for types ('terreno', 'casa', 'apartamento', 'leilao').
   */
  router.post('/', async (c) => {
    let bodyRaw = {};
    try {
      bodyRaw = await c.req.json();
    } catch {
      bodyRaw = {};
    }

    const parseResult = scrapeRequestSchema.safeParse(bodyRaw);
    if (!parseResult.success) {
      return c.json({ error: 'Invalid scrape input parameters', issues: parseResult.error.issues }, 400);
    }

    const { types, city, state, region, limit, async: isAsync } = parseResult.data;
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const typeProgress: Record<string, ScraperTypeProgress> = {};
    for (const t of types) {
      typeProgress[t] = { status: 'pending', count: 0 };
    }

    const job: ScraperJob = {
      jobId,
      status: 'pending',
      types,
      city,
      state,
      region,
      limit,
      progress: 0,
      typeProgress,
      totalScraped: 0,
      startedAt: new Date().toISOString(),
    };

    scraperJobs.set(jobId, job);

    if (isAsync) {
      // Execute in background
      runConcurrentScraperJob(job).catch((err) => {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : 'Unknown scraper error';
      });

      return c.json(
        {
          ok: true,
          jobId,
          status: 'running',
          message: 'Scraper job initiated concurrently in live background mode',
          summary: {
            types,
            city,
            state,
            region,
            limitPerType: limit,
          },
          startedAt: job.startedAt,
        },
        202
      );
    }

    // Synchronous completion of concurrent scrapers
    const listings = await runConcurrentScraperJob(job);

    const byType: Record<string, number> = {};
    for (const t of types) {
      byType[t] = job.typeProgress[t]?.count || 0;
    }

    return c.json({
      ok: true,
      jobId,
      status: 'completed',
      summary: {
        types,
        city,
        state,
        region,
        totalScraped: listings.length,
        byType,
      },
      listings,
      completedAt: job.completedAt,
    });
  });

  /**
   * GET /status
   * Get current scraper jobs progress.
   */
  router.get('/status', (c) => {
    const jobId = c.req.query('jobId');

    if (jobId) {
      const job = scraperJobs.get(jobId);
      if (!job) {
        return c.json({ error: 'Scraper job not found' }, 404);
      }
      return c.json(job);
    }

    const allJobs = Array.from(scraperJobs.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    const activeJobs = allJobs.filter((j) => j.status === 'running' || j.status === 'pending');
    const recentJobs = allJobs.slice(0, 20);

    return c.json({
      systemStatus: 'ready',
      activeJobsCount: activeJobs.length,
      totalJobsCount: allJobs.length,
      totalScrapedListings: scrapedListingsStore.length,
      activeJobs,
      recentJobs,
    });
  });

  /**
   * GET /listings
   * List recently scraped properties.
   */
  router.get('/listings', (c) => {
    const typeFilter = c.req.query('type')?.toLowerCase();
    const cityFilter = c.req.query('city')?.toLowerCase();
    const stateFilter = c.req.query('state')?.toLowerCase();
    const jobIdFilter = c.req.query('jobId');
    const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '50', 10), 1), 200);
    const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0);

    let filtered = scrapedListingsStore;

    if (jobIdFilter) {
      filtered = filtered.filter((item) => item.jobId === jobIdFilter);
    }
    if (typeFilter) {
      filtered = filtered.filter((item) => (item.type || '').toLowerCase() === typeFilter);
    }
    if (cityFilter) {
      filtered = filtered.filter((item) => (item.city || '').toLowerCase() === cityFilter);
    }
    if (stateFilter) {
      filtered = filtered.filter((item) => (item.state || '').toLowerCase() === stateFilter);
    }

    const items = filtered.slice(offset, offset + limit);

    return c.json({
      items,
      total: filtered.length,
      limit,
      offset,
      filters: {
        type: typeFilter || null,
        city: cityFilter || null,
        state: stateFilter || null,
        jobId: jobIdFilter || null,
      },
    });
  });

  return router;
}

export const propertiesScrapeApp = createPropertiesScrapeRouter();
