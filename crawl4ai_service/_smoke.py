
import asyncio
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
async def main():
    cfg = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
    async with AsyncWebCrawler() as c:
        r = await c.arun("https://www.gov.br/planalto/pt-br", config=cfg)
        print("success=", r.success, "len_markdown=", len(r.markdown or ""))
        print((r.markdown or "")[:180])
asyncio.run(main())
