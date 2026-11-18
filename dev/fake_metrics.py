"""Made-up hourly electricity prices for the dev stack.

Serves elpris_hour_dkk_per_kwh{area="DK1",start="YYYY-MM-DD HH:MM"} on :8000: one series per
hour from 12 hours ago to 33 hours ahead, start in local time (set TZ). Every price is a function
of the hour, so they stay put between scrapes: cheap at night, a dip around noon and a peak from
17 to 20, a little dearer on the second day.
"""

import math
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOUR = 3600
PAST = 12
AHEAD = 33


def price(t: int) -> float:
    local = time.localtime(t)
    h = local.tm_hour
    base = 1.2 + 0.25 * (local.tm_yday % 2)
    morning = 0.45 * math.exp(-((h - 8) ** 2) / 4)
    noon = -0.25 * math.exp(-((h - 13) ** 2) / 3)
    evening = 0.9 * math.exp(-((h - 18.5) ** 2) / 3)
    night = -0.35 if h < 5 else 0.0
    wobble = 0.06 * math.sin(t / HOUR * 1.7)
    return round(max(0.05, base + morning + noon + evening + night + wobble), 4)


def body() -> str:
    now = int(time.time()) // HOUR * HOUR
    lines = ["# TYPE elpris_hour_dkk_per_kwh gauge"]
    for i in range(-PAST, AHEAD):
        t = now + i * HOUR
        start = time.strftime("%Y-%m-%d %H:%M", time.localtime(t))
        lines.append(f'elpris_hour_dkk_per_kwh{{area="DK1",start="{start}"}} {price(t)}')
    return "\n".join(lines) + "\n"


class Handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        data = body().encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/plain; version=0.0.4")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args) -> None:
        pass


if __name__ == "__main__":
    ThreadingHTTPServer(("", 8000), Handler).serve_forever()
