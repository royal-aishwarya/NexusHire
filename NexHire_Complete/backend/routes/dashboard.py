from flask import Blueprint, request, jsonify
from extensions import mongo
from routes.auth import get_current_user

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
def stats():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    resume = user.get('resume_data') or {}
    assessments = user.get('assessment_results', [])
    sessions = list(mongo.db.interview_sessions.find({"user_id": str(user["_id"])}, sort=[("completed_at", -1)]))
    report = user.get('last_report', {})

    resume_score = resume.get('score', {}).get('total', 0) if resume else 0
    interview_score = sessions[0].get('overall_score', 0) if sessions else 0
    mcq_score = assessments[-1].get('score_percentage', 0) if assessments else 0
    overall = report.get('scores', {}).get('overall', 0) if report else 0

    interview_trend = [{"date": s.get('completed_at', '')[:10], "score": s.get('overall_score', 0)} for s in reversed(sessions[-7:])]
    mcq_trend = [{"skill": a.get('skill', ''), "score": a.get('score_percentage', 0)} for a in assessments[-5:]]
    skills = resume.get('skills', [])[:12] if resume else []

    return jsonify({
        "resume_score": resume_score, "interview_score": interview_score,
        "mcq_score": mcq_score, "overall_score": overall,
        "skills": skills, "interview_trend": interview_trend, "mcq_trend": mcq_trend,
        "total_interviews": len(sessions), "total_assessments": len(assessments),
        "resume_breakdown": resume.get('score', {}).get('breakdown', {}),
        "strengths": report.get('strengths', [])[:3] if report else [],
        "weaknesses": report.get('weaknesses', [])[:3] if report else [],
    }), 200
