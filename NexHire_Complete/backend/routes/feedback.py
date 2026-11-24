from flask import Blueprint, request, jsonify
from extensions import mongo
from utils.feedback_engine import generate_full_report
from routes.auth import get_current_user
from datetime import datetime

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/generate', methods=['POST'])
def generate_feedback():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.get_json(silent=True) or {}
    resume_data = user.get('resume_data') or data.get('resume_data', {})
    session = mongo.db.interview_sessions.find_one(
        {"user_id": str(user["_id"]), "status": "completed"},
        sort=[("completed_at", -1)]
    )
    interview_results = session.get('answers', []) if session else []
    assessments = user.get('assessment_results', [])
    mcq_results = assessments[-1] if assessments else {}
    report = generate_full_report(resume_data, interview_results, mcq_results, None)
    report['generated_at'] = datetime.utcnow().isoformat()
    mongo.db.users.update_one({"_id": user["_id"]}, {"$set": {"last_report": report}})
    return jsonify(report), 200

@feedback_bp.route('/report', methods=['GET'])
def get_report():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    report = user.get('last_report')
    if not report:
        return jsonify({"error": "No report generated yet"}), 404
    return jsonify(report), 200
