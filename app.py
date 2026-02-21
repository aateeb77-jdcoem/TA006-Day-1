from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import requests
import hashlib
import tempfile
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="static")
CORS(app)

DATASET_PATH = "dataset.json"
USERS_PATH   = "users.json"
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# ─── Helpers ───────────────────────────────────────────────

def load_data():
    """Load product data from the local JSON dataset."""
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def load_users():
    """Load user data from local JSON file."""
    if os.path.exists(USERS_PATH):
        with open(USERS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_users(users):
    """Save user data to local JSON file."""
    with open(USERS_PATH, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


def hash_password(password):
    """Simple SHA-256 hash for demo purposes."""
    return hashlib.sha256(password.encode()).hexdigest()


def build_product_context(products):
    """Build a compact context string for the AI from product data."""
    ctx = "Available Products (INR):\n"
    for p in products:
        ctx += (
            f"- {p['title']} [{p['category']}]: "
            f"₹{p['discounted_price']:,} (MRP ₹{p['original_price']:,}, "
            f"{p['discount_percentage']}% off, Rating {p['rating']})\n"
            f"  Offers: {', '.join(p['offers'])}\n"
        )
    return ctx

# ─── Page Routes ───────────────────────────────────────────

@app.route("/")
def index():
    """Serve the login page as the landing page."""
    return send_from_directory(app.static_folder, "login.html")


@app.route("/dashboard")
def dashboard():
    """Serve the main product dashboard (after login/skip)."""
    return send_from_directory(app.static_folder, "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)

# ─── Auth API ──────────────────────────────────────────────

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    """Register a new user."""
    data = request.json
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"success": False, "error": "All fields are required."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters."}), 400

    users = load_users()

    # Check if user already exists
    if any(u["email"] == email for u in users):
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    new_user = {
        "id": len(users) + 1,
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
    }
    users.append(new_user)
    save_users(users)

    # Return user info (without password hash)
    return jsonify({
        "success": True,
        "user": {"id": new_user["id"], "name": name, "email": email}
    })


@app.route("/api/auth/signin", methods=["POST"])
def signin():
    """Authenticate an existing user."""
    data = request.json
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    users = load_users()
    pw_hash = hash_password(password)

    user = next((u for u in users if u["email"] == email and u["password_hash"] == pw_hash), None)

    if not user:
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    return jsonify({
        "success": True,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]}
    })

# ─── Products API ──────────────────────────────────────────

@app.route("/api/products", methods=["GET"])
def get_products():
    """Return filtered & sorted product list."""
    products = load_data()

    query      = request.args.get("query", "").lower()
    category   = request.args.get("category", "")
    min_price  = request.args.get("min_price", type=int, default=0)
    max_price  = request.args.get("max_price", type=int, default=1000000)
    min_rating = request.args.get("min_rating", type=float, default=0.0)

    filtered = []
    for p in products:
        if query and query not in p["title"].lower():
            continue
        if category and category.lower() != "all" and category.lower() != p["category"].lower():
            continue
        if p["discounted_price"] < min_price or p["discounted_price"] > max_price:
            continue
        if p["rating"] < min_rating:
            continue
        filtered.append(p)

    sort_by = request.args.get("sort", "")
    if sort_by == "price_asc":
        filtered.sort(key=lambda x: x["discounted_price"])
    elif sort_by == "price_desc":
        filtered.sort(key=lambda x: x["discounted_price"], reverse=True)
    elif sort_by == "rating_desc":
        filtered.sort(key=lambda x: x["rating"], reverse=True)

    return jsonify(filtered)

# ─── Chat API (Sarvam LLM) ────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    """Send a text message to Sarvam chat completions and return the reply."""
    data = request.json
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    if not SARVAM_API_KEY:
        return jsonify({"reply": "Sarvam API key not configured. Please add it to the .env file."}), 500

    products = load_data()
    products_context = build_product_context(products)

    system_prompt = (
        "You are SmartCart AI, an expert shopping assistant. "
        "Answer user queries based on the products below. "
        "Always format prices in Indian Rupees (₹). Keep answers concise.\n\n"
        f"{products_context}\n"
    )

    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
    }

    payload = {
        "model": "sarvam-m",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
    }

    try:
        resp = requests.post(
            "https://api.sarvam.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15,
        )

        if resp.status_code == 200:
            result = resp.json()
            reply = (
                result.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "Sorry, I couldn't generate a response.")
            )
            return jsonify({"reply": reply})
        else:
            return jsonify({"reply": f"AI service error: {resp.status_code} - {resp.text}"})
    except Exception as e:
        return jsonify({"reply": f"Error connecting to AI: {str(e)}"})

# ─── Speech-to-Text API (Sarvam Saaras) ───────────────────

@app.route("/api/stt", methods=["POST"])
def speech_to_text():
    """Accept audio from browser mic and return transcript via Sarvam STT."""
    if not SARVAM_API_KEY:
        return jsonify({"error": "API key not configured"}), 500

    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    audio_file.save(tmp.name)
    tmp.close()

    try:
        headers = {"api-subscription-key": SARVAM_API_KEY}
        with open(tmp.name, "rb") as f:
            files = {"file": ("audio.wav", f, "audio/wav")}
            data = {"model": "saaras:v2", "language_code": "en-IN"}
            resp = requests.post(
                "https://api.sarvam.ai/speech-to-text",
                headers=headers,
                files=files,
                data=data,
                timeout=15,
            )

        if resp.status_code == 200:
            result = resp.json()
            return jsonify({"transcript": result.get("transcript", "")})
        else:
            return jsonify({"error": f"STT error: {resp.status_code} - {resp.text}"}), 500
    except Exception as e:
        return jsonify({"error": f"STT exception: {str(e)}"}), 500
    finally:
        os.unlink(tmp.name)

# ─── Text-to-Speech API (Sarvam Bulbul) ───────────────────

@app.route("/api/tts", methods=["POST"])
def text_to_speech():
    """Convert text to speech via Sarvam TTS and return base64 audio."""
    if not SARVAM_API_KEY:
        return jsonify({"error": "API key not configured"}), 500

    data = request.json
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "Text is required"}), 400

    headers = {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
    }

    payload = {
        "inputs": [text[:2500]],
        "target_language_code": "en-IN",
        "speaker": "meera",
        "model": "bulbul:v2",
    }

    try:
        resp = requests.post(
            "https://api.sarvam.ai/text-to-speech",
            headers=headers,
            json=payload,
            timeout=15,
        )

        if resp.status_code == 200:
            result = resp.json()
            audios = result.get("audios", [])
            if audios:
                return jsonify({"audio_base64": audios[0]})
            return jsonify({"error": "No audio returned"}), 500
        else:
            return jsonify({"error": f"TTS error: {resp.status_code} - {resp.text}"}), 500
    except Exception as e:
        return jsonify({"error": f"TTS exception: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
