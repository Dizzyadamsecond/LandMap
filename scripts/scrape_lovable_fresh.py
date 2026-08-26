import urllib.request
import re
import os
import sys

BASE = "https://landmap-insight.lovable.app"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def fetch(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    os.makedirs("extracted_lovable/live", exist_ok=True)
    html_bytes = fetch(BASE)
    if not html_bytes:
        print("Failed to fetch base HTML")
        return
    
    html = html_bytes.decode("utf-8", errors="ignore")
    with open("extracted_lovable/live/index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Saved index.html (bytes: {len(html)})")

    # Find scripts and styles
    scripts = re.findall(r'src="([^"]+\.js)"', html)
    styles = re.findall(r'href="([^"]+\.css)"', html)

    print("Discovered scripts:", scripts)
    print("Discovered styles:", styles)

    all_js_urls = set()
    for s in scripts:
        if s.startswith("http"):
            all_js_urls.add(s)
        elif s.startswith("/"):
            all_js_urls.add(BASE + s)
        else:
            all_js_urls.add(f"{BASE}/{s}")

    for s in styles:
        url = s if s.startswith("http") else (BASE + s if s.startswith("/") else f"{BASE}/{s}")
        css_data = fetch(url)
        if css_data:
            fname = os.path.basename(url.split("?")[0])
            with open(f"extracted_lovable/live/{fname}", "wb") as f:
                f.write(css_data)
            print(f"Saved CSS: {fname} ({len(css_data)} bytes)")

    # Fetch initial scripts and discover dynamic chunks
    downloaded_js = set()
    queue = list(all_js_urls)

    while queue:
        url = queue.pop(0)
        if url in downloaded_js:
            continue
        downloaded_js.add(url)
        js_data = fetch(url)
        if not js_data:
            continue
        fname = os.path.basename(url.split("?")[0])
        with open(f"extracted_lovable/live/{fname}", "wb") as f:
            f.write(js_data)
        print(f"Saved JS: {fname} ({len(js_data)} bytes)")

        # Scan for imported chunks
        js_text = js_data.decode("utf-8", errors="ignore")
        found = re.findall(r'["\'](/assets/[a-zA-Z0-9_\-\.]+\.js)["\']', js_text)
        found += re.findall(r'["\'](assets/[a-zA-Z0-9_\-\.]+\.js)["\']', js_text)
        found += re.findall(r'["\'](\./[a-zA-Z0-9_\-\.]+\.js)["\']', js_text)

        for item in found:
            clean = item.lstrip("./")
            if not clean.startswith("/"):
                clean = "/" + clean
            full_url = f"{BASE}{clean}"
            if full_url not in downloaded_js and full_url not in queue:
                queue.append(full_url)

    print(f"Successfully downloaded {len(downloaded_js)} chunks to extracted_lovable/live/")

if __name__ == "__main__":
    main()
