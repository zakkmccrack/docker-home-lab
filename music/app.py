import os
from pathlib import Path
from flask import Flask, jsonify, send_file, abort, send_from_directory, request
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TPE1, TALB
from mutagen.flac import FLAC, Picture
import json
from PIL import Image
import io
from functools import lru_cache

from datetime import date

app = Flask(__name__)

MUSIC_DIR = os.environ.get("MUSIC_DIR", "/music")
PLAYLISTS_FILE = "./data/playlists.json"

library = []
library_tree = {}


def get_metadata(filepath):
    fp = str(filepath)
    try:
        if fp.endswith(".mp3"):
            audio = MP3(fp)
            tags = ID3(fp)
            return {
                "title": str(tags.get("TIT2", Path(fp).stem)),
                "artist": str(tags.get("TPE1", "Sconosciuto")),
                "album": str(tags.get("TALB", "Sconosciuto")),
                "duration": round(audio.info.length),
                "title_full": Path(fp).stem,
                "format": "mp3",
            }
        elif fp.endswith(".flac"):
            audio = FLAC(fp)
            return {
                "title": audio.get("title", [Path(fp).stem])[0],
                "title_full": Path(fp).stem,
                "artist": audio.get("artist", ["Sconosciuto"])[0],
                "album": audio.get("album", ["Sconosciuto"])[0],
                "duration": round(audio.info.length),
                "format": "flac",
            }
    except Exception as e:
        print(e)
        return {
            "title": "Path(fp).stem",
            "artist": "Sconosciuto",
            "album": "Sconosciuto",
            "duration": 0,
            "format": fp.split(".")[-1],
        }


def scan_library(music_dir_passed):
    songs = []
    library_tree = {}
    times = -1
    for i, path in enumerate(Path(music_dir_passed).rglob("*")):
        if path.suffix.lower() in [".mp3", ".flac"]:
            meta = get_metadata(path)
            if meta:
                times += 1
                meta["id"] = times
                meta["filepath"] = str(path)
                songs.append(meta)

                parts = path.relative_to(MUSIC_DIR).parts
                # parts = ("Green Day", "American Idiot", "American Idiot.flac")
                if len(parts) == 3:
                    artist, album, _ = parts
                elif len(parts) == 2:
                    artist, _ = parts
                    album = "Sconosciuto"
                else:
                    artist = "Sconosciuto"
                    album = "Sconosciuto"

                if artist not in library_tree:
                    library_tree[artist] = {}
                if album not in library_tree[artist]:
                    library_tree[artist][album] = []

                library_tree[artist][album].append(meta)
    return songs, library_tree


@lru_cache(maxsize=512)
def get_album_cover(path):
    parentPath = os.path.dirname(path)
    stringToPath = Path(parentPath)
    result = next(stringToPath.rglob("*.jpg"), None)
    if result == None:
        result = next(stringToPath.rglob("*.png"), None)
    return result


# --- Utility playlist ---


def read_playlists():
    with open(PLAYLISTS_FILE, "r") as f:
        return json.load(f)


def write_playlists(data):
    with open(PLAYLISTS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def next_id(playlists):
    if not playlists:
        return 1
    return max(p["id"] for p in playlists) + 1


# --- Routes ---


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)


@app.route("/api/songs")
def songs():
    return jsonify(library)


@app.route("/api/stream/<int:song_id>")
def stream(song_id):
    if song_id >= len(library):
        abort(404)
    song = library[song_id]
    mimetype = "audio/mpeg" if song["format"] == "mp3" else "audio/flac"
    return send_file(song["filepath"], mimetype=mimetype)


@app.route("/api/stream/path/<path:filepath>")
def stream_by_path(filepath):
    full_path = Path(MUSIC_DIR) / filepath
    if not full_path.exists():
        abort(404)
    # Sicurezza: evita path traversal tipo ../../etc/passwd
    if not str(full_path.resolve()).startswith(str(Path(MUSIC_DIR).resolve())):
        abort(403)
    mimetype = "audio/mpeg" if filepath.endswith(".mp3") else "audio/flac"
    return send_file(str(full_path), mimetype=mimetype)


# --- Route playlist ---


@app.route("/api/playlists", methods=["GET"])
def get_playlists():
    data = read_playlists()
    return jsonify(data["playlists"])


@app.route("/api/playlists", methods=["POST"])
def create_playlist():
    body = request.get_json()
    if not body or not body.get("name"):
        return jsonify({"error": "nome mancante"}), 400

    data = read_playlists()
    playlist = {
        "id": next_id(data["playlists"]),
        "name": body["name"],
        "created_at": str(date.today()),
        "songs": body.get("songs", []),
    }
    data["playlists"].append(playlist)
    write_playlists(data)
    return jsonify(playlist), 201


@app.route("/api/playlists/<int:playlist_id>", methods=["PUT"])
def update_playlist(playlist_id):
    body = request.get_json()
    data = read_playlists()

    playlist = next((p for p in data["playlists"] if p["id"] == playlist_id), None)
    if not playlist:
        return jsonify({"error": "playlist non trovata"}), 404

    if "name" in body:
        playlist["name"] = body["name"]
    if "songs" in body:
        playlist["songs"] = body["songs"]

    write_playlists(data)
    return jsonify(playlist)


@app.route("/api/playlists/<int:playlist_id>", methods=["DELETE"])
def delete_playlist(playlist_id):
    data = read_playlists()

    playlist = next((p for p in data["playlists"] if p["id"] == playlist_id), None)
    if not playlist:
        return jsonify({"error": "playlist non trovata"}), 404

    data["playlists"] = [p for p in data["playlists"] if p["id"] != playlist_id]
    write_playlists(data)
    return jsonify({"status": "ok"})


@app.route("/api/playlists/<int:playlist_id>/add", methods=["POST"])
def add_song(playlist_id):
    body = request.get_json()
    if not body or not body.get("song_id"):
        return jsonify({"error": "song_id mancante"}), 400

    data = read_playlists()
    playlist = next((p for p in data["playlists"] if p["id"] == playlist_id), None)
    if not playlist:
        return jsonify({"error": "playlist non trovata"}), 404

    if body["song_id"] not in playlist["songs"]:
        playlist["songs"].append(body["song_id"])
        write_playlists(data)

    return jsonify(playlist)


@app.route("/api/playlists/<int:playlist_id>/remove", methods=["POST"])
def remove_song(playlist_id):
    body = request.get_json()
    if not body or not body.get("song_id"):
        return jsonify({"error": "song_id mancante"}), 400

    data = read_playlists()
    playlist = next((p for p in data["playlists"] if p["id"] == playlist_id), None)
    if not playlist:
        return jsonify({"error": "playlist non trovata"}), 404

    playlist["songs"] = [s for s in playlist["songs"] if s != body["song_id"]]
    write_playlists(data)
    return jsonify(playlist)


# --- Route Albums ---


@app.route("/api/tree")
def tree():
    return jsonify(library_tree)


@app.route("/api/cover/<path:filename>")
def getImage(filename):
    full_path = Path(MUSIC_DIR) / filename
    cover = get_album_cover(full_path)
    size = request.args.get("size", type=int)  # es. /api/cover/...?size=300

    if size:
        img = Image.open(cover)
        img.thumbnail((size, size))
        buf = io.BytesIO()
        if img.format == "PNG":
            img.save(buf, format="PNG", quality=75)
            buf.seek(0)
            return send_file(buf, mimetype="image/png")
        else:
            img.save(buf, format="JPEG", quality=75)
            buf.seek(0)
            return send_file(buf, mimetype="image/jpeg")
    return send_from_directory(str(cover.parent), cover.name)


library, library_tree = scan_library(MUSIC_DIR)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5451)
