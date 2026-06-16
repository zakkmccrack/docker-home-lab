# app.py - Simple API backed by SQLite
import sqlite3
import json
import os

DB_PATH = os.environ.get("DB_PATH", "/data/metadata.db")


def get_db():
    """Create a database connection with WAL mode enabled. https://oneuptime.com/blog/post/2026-02-08-how-to-run-sqlite-in-docker-when-and-how/view"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # WAL mode allows concurrent reads while writing
    conn.execute("PRAGMA journal_mode=WAL")
    # Enable foreign key enforcement
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Crea la tabella se non esiste"""
    conn = get_db()
    conn.execute("""
            CREATE TABLE IF NOT EXISTS track_metadata (
                file_path       TEXT PRIMARY KEY,
                mbid_recording  TEXT,
                mbid_release    TEXT,
                genres          TEXT,
                tags            TEXT,
                label           TEXT,
                country         TEXT,
                release_date    TEXT,
                lyrics          TEXT,
                last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.commit()
    conn.close()


def upsert_track(file_path: str, data: dict):
    # serializza liste come JSON
    genres = json.dumps(data.get("genres", []))
    tags = json.dumps(data.get("tags", []))

    conn = get_db()
    conn.execute(
        """
            INSERT INTO track_metadata
                (file_path, mbid_recording, mbid_release, genres, tags, label, country, release_date, lyrics, last_updated)
            VALUES
                (:file_path, :mbid_recording, :mbid_release, :genres, :tags, :label, :country, :release_date, :lyrics, CURRENT_TIMESTAMP)
            ON CONFLICT(file_path) DO UPDATE SET
                mbid_recording = excluded.mbid_recording,
                mbid_release   = excluded.mbid_release,
                genres         = excluded.genres,
                tags           = excluded.tags,
                label          = excluded.label,
                country        = excluded.country,
                release_date   = excluded.release_date,
                lyrics         = excluded.lyrics,
                last_updated   = CURRENT_TIMESTAMP
        """,
        {
            "file_path": file_path,
            "mbid_recording": data.get("mbid_recording"),
            "mbid_release": data.get("mbid_release"),
            "genres": genres,
            "tags": tags,
            "label": data.get("label"),
            "country": data.get("country"),
            "release_date": data.get("release_date"),
            "lyrics": data.get("lyrics"),
        },
    )
    conn.commit()
    conn.close()


def get_track(file_path: str) -> dict | None:
    """Ritorna i dati di una certa canzone"""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM track_metadata WHERE file_path = ?", (file_path,)
    ).fetchone()
    conn.close()
    if not row:
        return None

    result = dict(row)
    result["genres"] = json.loads(result["genres"] or "[]")
    result["tags"] = json.loads(result["tags"] or "[]")
    return result

def get_track_lyrics(file_path: str) -> str | None:
    """Ritorna il testo di una certa canzone"""
    conn = get_db()
    row = conn.execute(
        "SELECT lyrics FROM track_metadata WHERE file_path = ?", (file_path,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return row


def get_all_paths() -> list[str]:
    """Recupera tutte le canzoni già registrate"""
    conn = get_db()
    rows = conn.execute("""SELECT file_path FROM track_metadata""").fetchall()
    conn.close()
    return [r["file_path"] for r in rows]

def get_all() -> list[str]:
    """Recupera tutte le canzoni già registrate"""
    conn = get_db()
    rows = conn.execute("""SELECT * FROM track_metadata""").fetchall()
    conn.close()
    return [dict(r) for r in rows]