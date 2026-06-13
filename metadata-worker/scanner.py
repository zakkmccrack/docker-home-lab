# scanner.py
import os
from mutagen.flac import FLAC
from musicbrainz import fetch_metadata
from lyrics import get_lyrics
from db import upsert_track, get_all_paths

MUSIC_DIR = os.environ.get("MUSIC_DIR", "/music")


def get_flac_tags(file_path: str) -> dict | None:
    """
    Legge i tag dal file FLAC con mutagen.
    Ritorna un dict con artist, album, title oppure None se fallisce.
    """
    try:
        audio = FLAC(file_path)
        return {
            "artist": audio.get("artist", [None])[0],
            "album": audio.get("album", [None])[0],
            "title": audio.get("title", [None])[0],
        }
    except Exception as e:
        print(f"[Scanner] Errore lettura tag {file_path}: {e}")
        return None


def scan_file(file_path: str):
    """
    Processa un singolo file FLAC:
    1. Legge i tag esistenti
    2. Fetch metadati da MusicBrainz
    3. Fetch lyrics
    4. Salva tutto nel DB
    """
    print(f"[Scanner] Processing: {file_path}")

    tags = get_flac_tags(file_path)
    if not tags:
        return
    if not all([tags["artist"], tags["title"]]):
        print(f"[Scanner] Tag insufficienti, skip: {file_path}")
        return

    mb_data = fetch_metadata(
        artist=tags["artist"], title=tags["title"], album=tags["album"]
    )

    if not mb_data:
        print(f"[Scanner] Nessun risultato MB per: {tags['artist']} - {tags['title']}")

    lyrics = get_lyrics(tags["artist"], tags["title"])

    upsert_track(
        file_path,
        {
            **mb_data,
            "lyrics": lyrics,
        },
    )

    print(f"[Scanner] Done: {tags['artist']} - {tags['title']}")


def scan_library(force: bool = False) -> list[str]:
    """
    Scansiona tutta la libreria musicale e ritorna
    la lista dei file da processare.
    Se force=False, skippa i file già nel DB.
    """
    already_done = set() if force else set(get_all_paths())
    to_process = []

    for root, _, files in os.walk(MUSIC_DIR):
        for fname in files:
            if not fname.endswith(".flac"):
                continue
            path = os.path.join(root, fname)
            if path in already_done:
                print(f"[Scanner] Skip (già processato): {path}")
                continue
            to_process.append(path)

    return to_process
