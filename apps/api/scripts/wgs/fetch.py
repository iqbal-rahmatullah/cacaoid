"""Download one URL with N parallel HTTP range requests (stdlib only).

ENA serves ~0.2 MB/s per connection, so parallel ranges are the only way to get usable speed from a laptop.
Usage: python fetch.py URL OUT [--conns 8]
"""
import argparse
import os
import queue
import ssl
import sys
import threading
import time
import urllib.request

PART = 32 << 20
# python.org builds ship without CA roots; fall back to the OS bundle
CTX = ssl.create_default_context(cafile=os.environ.get("SSL_CERT_FILE") or ("/etc/ssl/cert.pem" if os.path.exists("/etc/ssl/cert.pem") else None))


def content_length(url: str) -> int:
    with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=60, context=CTX) as r:
        return int(r.headers["Content-Length"])


def fetch(url: str, out: str, conns: int = 8) -> dict:
    n = content_length(url)
    part = out + ".part"  # renamed on success, so a finished file is never confused with a half-written one
    fd = os.open(part, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    os.ftruncate(fd, n)
    parts: queue.Queue = queue.Queue()
    for start in range(0, n, PART):
        parts.put((start, min(start + PART, n) - 1))
    done, errors, t0 = [0], [], time.time()
    lock = threading.Lock()

    def worker():
        while True:
            try:
                start, end = parts.get_nowait()
            except queue.Empty:
                return
            pos = start
            for attempt in range(8):  # resume a broken range from where it stopped
                try:
                    req = urllib.request.Request(url, headers={"Range": f"bytes={pos}-{end}"})
                    with urllib.request.urlopen(req, timeout=120, context=CTX) as r:
                        while blk := r.read(1 << 20):
                            os.pwrite(fd, blk, pos)
                            pos += len(blk)
                            with lock:
                                done[0] += len(blk)
                    if pos > end:
                        break
                except Exception as e:  # noqa: BLE001 - network errors of every flavour are retried
                    time.sleep(2 + 3 * attempt)
                    if attempt == 7:
                        errors.append(f"{start}-{end}: {e}")

    threads = [threading.Thread(target=worker, daemon=True) for _ in range(conns)]
    for t in threads:
        t.start()
    while any(t.is_alive() for t in threads):
        time.sleep(10)
        el = time.time() - t0
        print(f"  {done[0] / 1e6:8.0f}/{n / 1e6:.0f} MB  {done[0] / 1e6 / el:5.2f} MB/s", file=sys.stderr, flush=True)
    os.close(fd)
    el = time.time() - t0
    if errors or done[0] != n:
        raise SystemExit(f"download incomplete ({done[0]}/{n} bytes): {errors[:3]}")
    os.replace(part, out)
    return {"bytes": n, "seconds": round(el, 1), "mb_per_s": round(n / 1e6 / el, 2)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("out")
    ap.add_argument("--conns", type=int, default=8)
    a = ap.parse_args()
    print(fetch(a.url, a.out, a.conns))
