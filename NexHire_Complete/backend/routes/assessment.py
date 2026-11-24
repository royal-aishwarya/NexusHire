from flask import Blueprint, request, jsonify
from extensions import mongo
from utils.assessment_engine import get_assessment_questions, evaluate_mcq_answers
from routes.auth import get_current_user
from datetime import datetime
import uuid

assessment_bp = Blueprint('assessment', __name__)

@assessment_bp.route('/questions', methods=['GET'])
def get_questions():
    skill = request.args.get('skill', 'general')
    level = request.args.get('level', 'intermediate')
    count = int(request.args.get('count', 10))
    questions = get_assessment_questions(skill, level, count)
    # Strip answer before sending to frontend
    safe = [{k: v for k, v in q.items() if k != 'answer'} for q in questions]
    return jsonify({"questions": safe, "total": len(safe)}), 200

@assessment_bp.route('/submit', methods=['POST'])
def submit_assessment():
    user = get_current_user(request)
    data = request.get_json()
    skill = data.get('skill', 'general')
    level = data.get('level', 'intermediate')
    user_answers = data.get('answers', {})
    time_taken = data.get('time_taken', 0)

    questions = get_assessment_questions(skill, level, 10)
    result = evaluate_mcq_answers(questions, user_answers)
    result['skill'] = skill
    result['level'] = level
    result['time_taken'] = time_taken
    result['taken_at'] = datetime.utcnow().isoformat()

    if user:
        mongo.db.users.update_one(
            {"_id": user["_id"]},
            {"$push": {"assessment_results": result}, "$set": {"last_mcq_score": result['score_percentage']}}
        )
    return jsonify(result), 200

@assessment_bp.route('/skills', methods=['GET'])
def available_skills():
    skills = [
        {"id": "python", "name": "Python", "icon": "🐍", "levels": ["beginner", "intermediate", "advanced"]},
        {"id": "javascript", "name": "JavaScript", "icon": "⚡", "levels": ["beginner", "intermediate", "advanced"]},
        {"id": "machine learning", "name": "Machine Learning", "icon": "🤖", "levels": ["beginner", "intermediate", "advanced"]},
        {"id": "general", "name": "General CS", "icon": "💻", "levels": ["beginner", "intermediate", "advanced"]},
        {"id": "database", "name": "Databases", "icon": "🗄️", "levels": ["beginner", "intermediate"]},
    ]
    return jsonify(skills), 200
