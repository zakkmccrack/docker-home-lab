import requests
import time
import urllib.parse
import re

BASE_URL = "https://musicbrainz.org/ws/2"
HEADERS = {"User-Agent": "MusicPlayerWorker/1.0 (zaganelli.alessandro.wm@email.com)"}


def _get(url: str, params: dict) -> dict | None:
    params["fmt"] = "json"
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[MB] Errore: {e}")
        return None


def search_recording(
    artist: str, title: str, album: str = None
) -> tuple[str, str] | tuple[None, None]:
    """
    Cerca il brano su MusicBrainz.
    Ritorna (mbid_recording, mbid_release) oppure (None, None) se non trovato.
    """
    query = f'recording:"{title}" AND artist:"{artist}"'
    if album:
        query += f' AND release:"{album}"'

    data = _get(f"{BASE_URL}/recording", {"query": query, "limit": 5})
    if not data or not data.get("recordings"):
        return None, None

    for rec in data["recordings"]:
        if int(rec.get("score", 0)) >= 90:
            mbid_recording = rec["id"]
            releases = rec.get("releases", [])
            mbid_release = releases[0]["id"] if releases else None
            return mbid_recording, mbid_release

    return None, None


def get_release_metadata(mbid_release: str) -> dict:
    """
    Dato il MBID del release, ritorna generi, tag, label, paese, data.
    """
    if not mbid_release:
        return {}

    data = _get(
        f"{BASE_URL}/release/{mbid_release}",
        {"inc": "genres+tags+labels+artist-credits"},
    )
    if not data:
        return {}

    artist_credits = data.get("artist-credit", [])
    artist = artist_credits[0].get("artist", {})

    genres = [g["name"] for g in artist.get("genres", [])]

    tags = [t["name"] for t in artist.get("tags", []) if t.get("count", 0) >= 1]

    label = None
    label_info = data.get("label-info", [])
    if label_info:
        first = label_info[0]
        if first and first.get("label"):
            label = first.get("label", {}).get("name")

    return {
        "genres": genres,
        "tags": tags,
        "label": label,
        "country": data.get("country"),
        "release_date": data.get("date"),
    }


def fetch_metadata(artist: str, title: str, album: str = None) -> dict:
    """
    Entry point unica per il worker.
    Ritorna tutto quello che serve in un colpo solo.
    """
    patterns = ["Remastered", "Deluxe", "Extended", "Album Version"]
    pattern = r'\s*\((?:' + '|'.join(re.escape(p) for p in patterns) + r')[^)]*\)'
    title_result = re.sub(pattern, '', title, flags=re.IGNORECASE).strip()
    album_result = re.sub(pattern, '', album, flags=re.IGNORECASE).strip()

    print(f"[MusicBrainz] Searching {artist}: {title_result} from {album_result}")

    mbid_recording, mbid_release = search_recording(artist, title_result, album_result)
    time.sleep(1)

    if not mbid_recording:
        return {}

    release_data = get_release_metadata(mbid_release)
    time.sleep(1)

    return {
        "mbid_recording": mbid_recording,
        "mbid_release": mbid_release,
        **release_data,
    }
