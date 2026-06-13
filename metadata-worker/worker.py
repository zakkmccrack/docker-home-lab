# worker.py
import os
import time
import multiprocessing
from db import init_db
from scanner import scan_library, scan_file

NUM_WORKERS = int(os.environ.get("NUM_WORKERS", 1))
SCAN_INTERVAL = int(os.environ.get("SCAN_INTERVAL", 3600))


def worker_fn(queue: multiprocessing.Queue):
    """
    Ogni worker pesca file dalla queue e li processa uno alla volta.
    """
    while True:
        file_path = queue.get()
        if file_path is None:
            break
        scan_file(file_path)


def run_scan():
    """
    Esegue un ciclo completo di scansione con N worker paralleli.
    """
    files = scan_library(force=False)
    if not files:
        print("[Worker] Nessun file nuovo da processare.")
        return

    print(f"[Worker] {len(files)} file da processare con {NUM_WORKERS} worker.")

    queue = multiprocessing.Queue()

    workers = []
    for _ in range(NUM_WORKERS):
        p = multiprocessing.Process(target=worker_fn, args=(queue,))
        p.start()
        workers.append(p)

    for f in files:
        queue.put(f)

    for _ in range(NUM_WORKERS):
        queue.put(None)

    for p in workers:
        p.join()

    print("[Worker] Scansione completata.")


if __name__ == "__main__":
    init_db()
    print("[Worker] DB inizializzato.")

    while True:
        print("[Worker] Avvio scansione...")
        run_scan()
        print(f"[Worker] Prossima scansione tra {SCAN_INTERVAL}s.")
        time.sleep(SCAN_INTERVAL)
