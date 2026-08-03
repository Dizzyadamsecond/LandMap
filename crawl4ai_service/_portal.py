
import asyncio, json
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode, JsonCssExtractionStrategy

async def main():
    url = "https://imoveis.olx.com.br/brasil"
    cfg = CrawlerRunConfig(cache_mode=CacheMode.BYPASS,
                           excluded_tags=["nav","header","footer","script","style"],
                           word_count_threshold=10)
    async with AsyncWebCrawler() as c:
        r = await c.arun(url, config=cfg)
        print("success=", r.success, "status=", r.status_code)
        md = r.markdown or ""
        print("markdown_len=", len(md))
        print(md[:400])
        # count links containing /imovel/
        import re
        links = re.findall(r'https?://[^\s"<>]+', md)
        imovel = [l for l in links if 'olx.com.br' in l and '/imovel/' in l]
        print("imovel_links=", len(imovel), imovel[:3])

asyncio.run(main())
