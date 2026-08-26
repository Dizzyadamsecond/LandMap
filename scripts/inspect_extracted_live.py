import glob
import re
import os
import json

def analyze():
    files = glob.glob('extracted_lovable/live/*.js')
    print(f"Total JS files: {len(files)}")
    
    routes = set()
    texts = []
    
    for f in files:
        with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
            content = fp.read()
            
        r1 = re.findall(r'path:\s*["\']([^"\']+)["\']', content)
        r2 = re.findall(r'to:\s*["\'](/[^"\']+)["\']', content)
        r3 = re.findall(r'href:\s*["\'](/[^"\']+)["\']', content)
        for r in r1 + r2 + r3:
            if not r.startswith("http") and not r.startswith("//"):
                routes.add(r)
                
    print("Discovered live routes in Lovable:")
    for r in sorted(list(routes)):
        print(f" - {r}")

if __name__ == "__main__":
    analyze()
