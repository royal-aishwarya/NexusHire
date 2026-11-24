from flask import Blueprint, request, jsonify
from extensions import mongo
from utils.resume_parser import parse_resume, calculate_resume_score
from routes.auth import get_current_user
from datetime import datetime
from bson import ObjectId

resume_bp = Blueprint('resume', __name__)

@resume_bp.route('/upload', methods=['POST'])
def upload_resume():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if 'resume' not in request.files and 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files.get('resume') or request.files.get('file')
    job_description = request.form.get('job_description', '')
    filename = (file.filename or '').lower()
    if len(filename) > 255:
        return jsonify({"error": "Invalid filename"}), 400

    if filename.endswith('.pdf'):
        file_type = 'pdf'
    elif filename.endswith('.docx'):
        file_type = 'docx'
    elif filename.endswith('.txt'):
        file_type = 'txt'
    else:
        return jsonify({"error": "Unsupported file type. Use PDF, DOCX, or TXT"}), 400

    file_bytes = file.read(10 * 1024 * 1024 + 1)
    if len(file_bytes) > 10 * 1024 * 1024:
        return jsonify({"error": "Resume exceeds 10 MB limit"}), 413
    parsed = parse_resume(file_bytes, file_type)
    score = calculate_resume_score(parsed, job_description)
    parsed['score'] = score
    parsed['uploaded_at'] = datetime.utcnow().isoformat()
    parsed['job_description'] = job_description

    # Keep extracted text in the local, user-scoped database for offline job matching.
    db_data = dict(parsed)
    version_doc = dict(db_data)
    version_doc.update({"user_id": str(user["_id"]), "created_at": parsed["uploaded_at"]})
    version_result = mongo.db.resume_versions.insert_one(version_doc)
    db_data["resume_version_id"] = str(version_result.inserted_id)
    mongo.db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"resume_data": db_data}}
    )

    response = dict(parsed)
    response["resume_version_id"] = str(version_result.inserted_id)
    return jsonify(response), 200

@resume_bp.route('/data', methods=['GET'])
def get_resume():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    resume = user.get('resume_data')
    if not resume:
        return jsonify({"error": "No resume uploaded"}), 404
    return jsonify(resume), 200

@resume_bp.route('/screen', methods=['POST'])
def screen_resume():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json() or {}
    job_description = data.get('job_description', '')
    resume = user.get('resume_data', {})
    if not resume:
        return jsonify({"error": "No resume uploaded yet"}), 404
    from utils.resume_parser import calculate_jd_match
    raw = resume.get('raw_text', ' '.join(resume.get('skills', [])))
    match = calculate_jd_match(raw, job_description)
    pct = round(match * 100)
    return jsonify({"match_percentage": pct, "similarity_score": round(match, 3)}), 200


@resume_bp.route('/history', methods=['GET'])
def resume_history():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    rows = list(mongo.db.resume_versions.find(
        {"user_id": str(user["_id"])},
        {"raw_text": 0}
    ).sort("created_at", -1).limit(30))
    for row in rows:
        row["_id"] = str(row["_id"])
    return jsonify(rows), 200

@resume_bp.route('/compare', methods=['POST'])
def compare_resumes():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    ids = data.get("resume_ids", [])
    if not isinstance(ids, list) or len(ids) < 2 or len(ids) > 5:
        return jsonify({"error": "Provide between 2 and 5 resume version IDs"}), 400
    try:
        object_ids = [ObjectId(x) for x in ids]
    except Exception:
        return jsonify({"error": "One or more resume IDs are invalid"}), 400
    rows = list(mongo.db.resume_versions.find(
        {"_id": {"$in": object_ids}, "user_id": str(user["_id"])}
    ))
    if len(rows) != len(set(ids)):
        return jsonify({"error": "One or more resumes were not found"}), 404
    result = []
    for row in rows:
        result.append({
            "resume_id": str(row["_id"]),
            "name": row.get("name"),
            "uploaded_at": row.get("uploaded_at"),
            "score": row.get("score", {}).get("total", 0),
            "skills": row.get("skills", []),
            "skill_count": len(row.get("skills", [])),
            "experience_years": row.get("experience", {}).get("total_years", 0),
            "education": row.get("education", [])
        })
    result.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"comparison": result, "note": "Comparison is descriptive and does not determine candidate suitability."}), 200


@resume_bp.route('/profile', methods=['PATCH'])
def update_resume_profile():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    current = user.get("resume_data") or {}
    if not current:
        return jsonify({"error": "Upload a resume first"}), 404
    data = request.get_json(silent=True) or {}
    allowed = ["name", "email", "phone", "linkedin", "github"]
    for field in allowed:
        if field in data:
            current[field] = str(data[field]).strip()[:300]
    if "skills" in data and isinstance(data["skills"], list):
        current["skills"] = sorted({str(s).strip()[:80] for s in data["skills"] if str(s).strip()})[:100]
    mongo.db.users.update_one({"_id": user["_id"]}, {"$set": {"resume_data": current}})
    return jsonify(current), 200
