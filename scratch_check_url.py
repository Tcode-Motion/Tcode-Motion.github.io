import requests

urls = [
    "https://tcode-motion.github.io/NovOS/NovOS.png",
    "https://techscript.is-a.dev/NovOS/NovOS.png",
    "https://github.com/Tcode-Motion/techscript/raw/v1.0.8/techscript-logo.png"
]

for url in urls:
    r = requests.get(url, timeout=10)
    print(f"URL: {url}")
    print(f"Status: {r.status_code}")
    print(f"Content-Type: {r.headers.get('Content-Type')}")
    print(f"Content-Length: {r.headers.get('Content-Length')}")
    print(f"History (redirects): {r.history}")
    print("-" * 50)
