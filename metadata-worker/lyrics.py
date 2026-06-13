# lyrics.py
import requests
import time

BASE_URL = "https://api.lyrics.ovh/v1"


def get_lyrics(artist: str, title: str) -> str | None:
    """
    Fetch del testo tramite lyrics.ovh.
    Ritorna il testo come stringa oppure None se non trovato.
    """
    try:
        r = requests.get(f"{BASE_URL}/{artist}/{title}", timeout=10)
        if r.status_code == 200:
            lyrics = r.json().get("lyrics")
            return lyrics.replace("\r\n", "\n").strip() if lyrics else None
        elif r.status_code == 404:
            print(f"[Lyrics] Non trovato: {artist} - {title}")
            return None
        else:
            print(f"[Lyrics] Status inatteso {r.status_code}: {artist} - {title}")
            return None
    except Exception as e:
        print(f"[Lyrics] Errore: {e}")
        return None
