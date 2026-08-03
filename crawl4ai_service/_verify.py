
import asyncio, crawl4ai
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
async def main():
    cfg = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, excluded_tags=["nav","header","footer","script","style"], word_count_threshold=10, only_main=True)
    async with AsyncWebCrawler() as c:
        r = await c.arun("https://pt.wikipedia.org/wiki/Mercado_imobili%C3%A1rio", config=cfg)
        print("success=", r.success)
        print("type(markdown)=", type(r.markdown), "len=", len(r.markdown or ""))
        print("type(links)=", type(r.links), "internal_count=", len((r.links or {}).get("internal", []) or []))
        print("title=", (r.metadata or {}).get("title", "")[:80])
asyncio.run(main())
