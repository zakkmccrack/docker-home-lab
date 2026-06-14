# routes/metadata.py
from flask import Blueprint, jsonify
from db import get_track, get_all

metadata_bp = Blueprint("metadata", __name__)

@metadata_bp.route("/api/track/metadata")
def track_metadata():
    """
    GET /api/track/metadata?path=/music/Artist/Album/track.flac
    """
    from flask import request
    file_path = request.args.get("path")
    if not file_path:
        return jsonify({"error": "path mancante"}), 400

    data = get_track(file_path)
    if not data:
        return jsonify({"error": "nessun metadato trovato per questo file"}), 404

    return jsonify(data)

@metadata_bp.route("/api/track/lyrics")
def track_lyrics():
    """
    GET /api/track/lyrics?path=/music/Artist/Album/track.flac
    """
    from flask import request
    file_path = request.args.get("path")
    if not file_path:
        return jsonify({"error": "path mancante"}), 400

    data = get_track(file_path)
    if not data or not data.get("lyrics"):
        return jsonify({"error": "lyrics non disponibili"}), 404

    return jsonify({"lyrics": data["lyrics"]})

@metadata_bp.route("/api/database/all")
def databse_dump():
    """
    GET /api/database/all
    """
    data = get_all()
    
    if not data:
        return jsonify({"error": "lyrics non disponibili"}), 404

    return jsonify(data)