from flask import Blueprint, request, jsonify
from extensions import mongo
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY", "dev-change-this-before-use")

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    name = data.get('name', '')

    if not email or not password or not name or len(password) < 8:
        return jsonify({"error": "Name, email and password (minimum 8 characters) are required"}), 400

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    user = {
        "email": email,
        "name": name,
        "password": hashed,
        "created_at": datetime.utcnow(),
        "resume_data": None,
        "interview_sessions": [],
        "assessment_results": []
    }
    result = mongo.db.users.insert_one(user)
    token = jwt.encode({"user_id": str(result.inserted_id), "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token, "name": name, "email": email}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    user = mongo.db.users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode(), user['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    token = jwt.encode({"user_id": str(user['_id']), "exp": datetime.utcnow() + timedelta(days=7)}, SECRET_KEY, algorithm="HS256")
    return jsonify({"token": token, "name": user['name'], "email": email}), 200

def get_current_user(request):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return mongo.db.users.find_one({"_id": ObjectId(payload["user_id"])})
    except:
        return None
