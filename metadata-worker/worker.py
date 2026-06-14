# worker.py
import os
import time
from db import init_db
from scanner import scan_library, scan_file

SCAN_INTERVAL = int(os.environ.get("SCAN_INTERVAL", 3600))


def run_scan():
    """
    Esegue un ciclo completo di scansione con N worker paralleli.
    """
    files = scan_library(force=False)
    if not files:
        print("[Worker] Nessun file nuovo da processare.")
        return

    print(f"[Worker] {len(files)} file da processare.")

    for f in files:
        scan_file(f)

    print("[Worker] Scansione completata.")


if __name__ == "__main__":
    init_db()
    print("[Worker] DB inizializzato.")

    while True:
        print("[Worker] Avvio scansione...")
        run_scan()
        print(f"[Worker] Prossima scansione tra {SCAN_INTERVAL}s.")
        time.sleep(SCAN_INTERVAL)
