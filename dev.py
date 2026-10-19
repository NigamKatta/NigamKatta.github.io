#!/usr/bin/env python3
"""Local preview server with live reload.

Usage: python3 dev.py [port]   (default port 8000)

Serves this folder at http://localhost:<port> and reloads the browser
whenever an HTML/CSS/JS/image file changes. Standard library only.
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
WATCH_EXT = ('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg')
RELOAD_SNIPPET = b"""
<script>
(function () {
  var seen;
  setInterval(function () {
    fetch('/__version', { cache: 'no-store' })
      .then(function (r) { return r.text(); })
      .then(function (v) { if (seen && v !== seen) location.reload(); seen = v; })
      .catch(function () {});
  }, 700);
})();
</script>
"""


def latest_mtime():
    latest = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        for name in filenames:
            if name.endswith(WATCH_EXT):
                try:
                    latest = max(latest, os.stat(os.path.join(dirpath, name)).st_mtime_ns)
                except OSError:
                    pass
    return str(latest)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        if path == '/__version':
            return self._send(latest_mtime().encode(), 'text/plain')

        fs_path = self.translate_path(path)
        if os.path.isdir(fs_path):
            fs_path = os.path.join(fs_path, 'index.html')
        if fs_path.endswith('.html') and os.path.isfile(fs_path):
            with open(fs_path, 'rb') as f:
                body = f.read()
            if b'</body>' in body:
                body = body.replace(b'</body>', RELOAD_SNIPPET + b'</body>', 1)
            else:
                body += RELOAD_SNIPPET
            return self._send(body, 'text/html; charset=utf-8')

        return super().do_GET()

    def _send(self, body, content_type):
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if '/__version' not in (args[0] if args else ''):
            super().log_message(fmt, *args)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler)
    print(f'Previewing at http://localhost:{port}  (live reload on save, Ctrl+C to stop)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
