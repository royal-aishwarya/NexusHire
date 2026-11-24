from flask import Blueprint, request, jsonify
from extensions import mongo
from utils.ai_engine import get_questions_for_skills, evaluate_answer
from routes.auth import get_current_user
from datetime import datetime
from bson import ObjectId
import uuid

interview_bp = Blueprint('interview', __name__)

@interview_bp.route('/start', methods=['POST'])
def start_interview():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    resume = user.get('resume_data', {}) or {}
    skills = data.get('skills') or resume.get('skills', [])
    if not skills:
        skills = ['python', 'javascript', 'general']

    count = max(3, min(int(data.get('question_count', 8)), 20))
    role = str(data.get('role', 'General')).strip()[:100]
    difficulty = str(data.get('difficulty', 'intermediate')).lower()
    interview_type = str(data.get('interview_type', 'mixed')).lower()
    questions = get_questions_for_skills(skills, num_questions=count)
    if interview_type == 'hr':
        questions = [q for q in questions if q.get('type') == 'hr'] or questions
    elif interview_type == 'technical':
        questions = [q for q in questions if q.get('type') != 'hr'] or questions
    questions = questions[:count]
    session_id = str(uuid.uuid4())

    session = {
        "session_id": session_id,
        "user_id": str(user["_id"]),
        "questions": questions,
        "answers": [],
        "started_at": datetime.utcnow().isoformat(),
        "status": "active",
        "role": role,
        "difficulty": difficulty,
        "interview_type": interview_type,
        "question_count": count
    }
    mongo.db.interview_sessions.insert_one(session)

    return jsonify({
        "session_id": session_id,
        "questions": [{"id": i, "question": q["question"], "type": q.get("type", "technical"), "level": q.get("level", "intermediate")} for i, q in enumerate(questions)]
    }), 200

@interview_bp.route('/answer', methods=['POST'])
def submit_answer():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    session_id = data.get('session_id')
    question_id = data.get('question_id', 0)
    answer_text = data.get('answer', '')

    session = mongo.db.interview_sessions.find_one({"session_id": session_id, "user_id": str(user["_id"])})
    if not session:
        return jsonify({"error": "Session not found"}), 404
    if session.get("status") != "active":
        return jsonify({"error": "This interview is already closed"}), 409

    questions = session.get('questions', [])
    if not isinstance(question_id, int) or question_id < 0 or question_id >= len(questions):
        return jsonify({"error": "Invalid question ID"}), 400

    question_data = questions[question_id]
    evaluation = evaluate_answer(question_data, answer_text)

    answer_record = {
        "question_id": question_id,
        "question": question_data["question"],
        "answer": answer_text,
        "score": evaluation["score"],
        "feedback": evaluation["feedback"],
        "matched_keywords": evaluation.get("matched_keywords", []),
        "quality_signals": evaluation.get("quality_signals", []),
        "timestamp": datetime.utcnow().isoformat()
    }

    mongo.db.interview_sessions.update_one(
        {"session_id": session_id, "user_id": str(user["_id"])},
        {"$push": {"answers": answer_record}}
    )

    return jsonify(evaluation), 200

@interview_bp.route('/complete', methods=['POST'])
def complete_interview():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    session_id = data.get('session_id')

    session = mongo.db.interview_sessions.find_one({"session_id": session_id, "user_id": str(user["_id"])})
    if not session:
        return jsonify({"error": "Session not found"}), 404

    answers = session.get('answers', [])
    if answers:
        avg_score = round(sum(a['score'] for a in answers) / len(answers))
    else:
        avg_score = 0

    mongo.db.interview_sessions.update_one(
        {"session_id": session_id, "user_id": str(user["_id"])},
        {"$set": {"status": "completed", "overall_score": avg_score, "completed_at": datetime.utcnow().isoformat()}}
    )
    mongo.db.users.update_one(
        {"_id": user["_id"]},
        {"$push": {"interview_sessions": session_id}, "$set": {"last_interview_score": avg_score}}
    )

    return jsonify({"session_id": session_id, "overall_score": avg_score, "total_answers": len(answers)}), 200

@interview_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    session = mongo.db.interview_sessions.find_one({"session_id": session_id, "user_id": str(user["_id"])}, {"_id": 0})
    if not session:
        return jsonify({"error": "Not found"}), 404
    return jsonify(session), 200

@interview_bp.route('/history', methods=['GET'])
def get_history():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    sessions = list(mongo.db.interview_sessions.find(
        {"user_id": str(user["_id"]), "status": "completed"},
        {"_id": 0, "questions": 0}
    ).sort("completed_at", -1).limit(10))
    return jsonify(sessions), 200
