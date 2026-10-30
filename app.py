#!/usr/bin/env python3
"""
CursiveCraft Studio - Desktop App Launcher
Runs a local web server with active heartbeat monitoring
and launches in standalone desktop window mode (Chrome / Edge --app)
or the default web browser.
"""

import sys
import os
import time
import shutil
import socket
import threading
import subprocess
import webbrowser
import mimetypes
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Reconfigure stdout/stderr encoding to prevent Windows cp1252 UnicodeEncodeError
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Prevent crash when packed with PyInstaller --noconsole
if sys.stdout is None:
    try:
        sys.stdout = open(os.devnull, 'w', encoding='utf-8')
    except Exception:
        pass
if sys.stderr is None:
    try:
        sys.stderr = open(os.devnull, 'w', encoding='utf-8')
    except Exception:
        pass

def safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except Exception:
        pass

# Ensure correct MIME types on Windows
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')
mimetypes.add_type('image/svg+xml', '.svg')

PORT_PREFERRED = 8540

# Setup persistent working directory for assets
if getattr(sys, 'frozen', False):
    source_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    # Copy to persistent local appdata so assets are never lost
    target_dir = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'CursiveCraft')
    try:
        os.makedirs(target_dir, exist_ok=True)
        # Copy index.html
        shutil.copy2(os.path.join(source_dir, 'index.html'), os.path.join(target_dir, 'index.html'))
        # Copy css
        src_css = os.path.join(source_dir, 'css')
        dst_css = os.path.join(target_dir, 'css')
        if os.path.exists(dst_css):
            shutil.rmtree(dst_css, ignore_errors=True)
        shutil.copytree(src_css, dst_css)
        # Copy js
        src_js = os.path.join(source_dir, 'js')
        dst_js = os.path.join(target_dir, 'js')
        if os.path.exists(dst_js):
            shutil.rmtree(dst_js, ignore_errors=True)
        shutil.copytree(src_js, dst_js)
        WORKSPACE_DIR = target_dir
    except Exception as e:
        safe_print(f"Notice: Using temporary bundle directory: {e}")
        WORKSPACE_DIR = source_dir
else:
    WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))

INDEX_FILE = os.path.join(WORKSPACE_DIR, "index.html")

# Heartbeat tracking
last_heartbeat = time.time()
has_received_heartbeat = False
server_should_run = True

class HeartbeatHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)

    def do_GET(self):
        global last_heartbeat, has_received_heartbeat
        if self.path == '/heartbeat' or self.path.startswith('/heartbeat?'):
            last_heartbeat = time.time()
            has_received_heartbeat = True
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
            self.end_headers()
            self.wfile.write(b'ok')
            return
        super().do_GET()

    def log_message(self, format, *args):
        pass

def find_available_port(start_port):
    for port in range(start_port, start_port + 50):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except Exception:
            continue
    return None

def launch_app_window(target_url):
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    ]

    for exe in candidates:
        if os.path.isfile(exe):
            try:
                subprocess.Popen([
                    exe,
                    f"--app={target_url}",
                    "--window-size=1360,900"
                ])
                return True
            except Exception:
                continue

    try:
        webbrowser.open(target_url)
        return True
    except Exception:
        return False

def main():
    global last_heartbeat, has_received_heartbeat, server_should_run

    safe_print("==============================================================")
    safe_print("   CursiveCraft Studio - Adult Cursive Workbook App           ")
    safe_print("==============================================================")
    safe_print(" * ISO A4 Compatible (210 x 297 mm) with exact vector grids")
    safe_print(" * Spencerian 55 deg, French Seyes, 3-Line & Palmer ruling")
    safe_print("==============================================================")

    port = find_available_port(PORT_PREFERRED)
    server = None
    target_url = None

    if port:
        try:
            server = HTTPServer(('127.0.0.1', port), HeartbeatHandler)
            target_url = f"http://127.0.0.1:{port}/index.html"
            safe_print(f" * Serving at: {target_url}")
        except Exception as e:
            safe_print(f" * Notice: Local HTTP server could not bind ({e}).")
            port = None

    if not port or not server:
        target_url = f"file:///{INDEX_FILE.replace(os.sep, '/')}"
        safe_print(f" * Opening directly from file: {target_url}")

    if server:
        # Run server in worker thread
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

    safe_print(" Launching desktop application window...")
    launch_app_window(target_url)

    if not server:
        # File URL opened, no background server needed
        safe_print(" Launched in local file mode.")
        return

    # Heartbeat watchdog loop
    # Wait up to 20 seconds for the first heartbeat
    startup_deadline = time.time() + 20.0
    last_heartbeat = time.time()

    while True:
        time.sleep(1.0)
        now = time.time()

        if has_received_heartbeat:
            # Active session: if no heartbeat received for 7 seconds, user closed the window
            if now - last_heartbeat > 7.0:
                safe_print(" No active heartbeat from app window. Shutting down cleanly.")
                break
        else:
            # Still waiting for browser to open initial page
            if now > startup_deadline:
                # If after 20s no heartbeat was received, keep running in background or exit
                # Wait for at least 60s total before giving up
                if now > startup_deadline + 40.0:
                    break

    try:
        server.shutdown()
    except Exception:
        pass
    safe_print(" CursiveCraft server stopped. Goodbye!")

if __name__ == "__main__":
    main()
