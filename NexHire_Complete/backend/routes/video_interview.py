"""Local, authenticated conversational video-interview endpoints."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import uuid
import re
from extensions import mongo
from routes.auth import get_current_user
from utils.ai_engine import get_questions_for_skills, evaluate_answer

video_interview_bp = Blueprint('video_interview', __name__)


def _user():
    return get_current_user(request)


def _owned(session_id, user):
    return mongo.db.video_interview_sessions.find_one({
        'session_id': session_id, 'user_id': str(user['_id'])
    })


def _follow_up(question, answer, used=False):
    """Transparent deterministic follow-up prompts; no cloud model is implied."""
    if used:
        return None
    text = (answer or '').strip()
    words = re.findall(r"[A-Za-z0-9+#.-]+", text)
    if len(words) < 8:
        return 'Could you expand on that answer and walk me through one specific example?'
    lower = text.lower()
    if any(x in lower for x in ['project', 'built', 'developed', 'implemented']):
        return 'What was the most challenging part of that work, and how did you address it?'
    if any(x in lower for x in ['because', 'therefore', 'which means', 'so that']):
        return 'What trade-off or alternative did you consider before choosing that approach?'
    if any(x in lower for x in ['team', 'collaborat', 'colleague']):
        return 'What was your individual contribution, and how did you measure the outcome?'
    return 'Can you give me a concrete example that demonstrates how you would apply that in practice?'


@video_interview_bp.route('/start', methods=['POST'])
def start():
    user = _user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json(silent=True) or {}
    role = str(data.get('role') or 'Software Developer').strip()[:100]
    kind = str(data.get('interview_type') or 'mixed').lower()
    difficulty = str(data.get('difficulty') or 'intermediate').lower()
    count = max(3, min(int(data.get('question_count', 5)), 15))
    skills = data.get('skills') or (user.get('resume_data') or {}).get('skills') or ['python', 'javascript', 'general']
    if not isinstance(skills, list):
        skills = [x.strip() for x in str(skills).split(',') if x.strip()]
    job_description = str(data.get('job_description') or '')[:12000]
    # Use only known local question-bank categories/skills mentioned in the JD.
    jd_lower = job_description.lower()
    for known in ['python', 'javascript', 'react', 'machine learning', 'deep learning', 'sql', 'mongodb', 'database', 'flask', 'fastapi', 'system design']:
        if known in jd_lower and known not in [str(x).lower() for x in skills]:
            skills.append(known)
    questions = get_questions_for_skills(skills, num_questions=max(count * 2, count))
    if kind == 'hr':
        questions = [q for q in questions if q.get('type') == 'hr'] or questions
    elif kind == 'technical':
        questions = [q for q in questions if q.get('type') != 'hr'] or questions
    questions = questions[:count]
    sid = str(uuid.uuid4())
    doc = {
        'session_id': sid, 'user_id': str(user['_id']), 'candidate_name': str(data.get('candidate_name') or user.get('name') or 'Candidate')[:100],
        'role': role, 'job_description': job_description, 'interview_type': kind, 'difficulty': difficulty, 'duration_minutes': max(5, min(int(data.get('duration_minutes', 20)), 90)),
        'question_count': len(questions), 'questions': questions, 'current_index': 0, 'answers': [],
        'status': 'active', 'started_at': datetime.utcnow().isoformat(), 'followups_used': [],
        'privacy': {'video_recorded': False, 'audio_recorded': False, 'transcript_saved': True}
    }
    mongo.db.video_interview_sessions.insert_one(doc)
    first = questions[0]['question'] if questions else 'Tell me about yourself.'
    return jsonify({'session_id': sid, 'candidate_name': doc['candidate_name'], 'role': role,
                    'total_questions': len(questions), 'question_index': 0,
                    'question': first, 'question_type': questions[0].get('type', 'technical') if questions else 'hr'}), 201


@video_interview_bp.route('/<session_id>/answer', methods=['POST'])
def answer(session_id):
    user = _user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    session = _owned(session_id, user)
    if not session:
        return jsonify({'error': 'Interview session not found'}), 404
    if session.get('status') != 'active':
        return jsonify({'error': 'This interview is already closed'}), 409
    data = request.get_json(silent=True) or {}
    index = data.get('question_index')
    answer_text = str(data.get('answer') or '').strip()[:12000]
    if not answer_text:
        return jsonify({'error': 'Please provide a spoken transcript or typed answer.'}), 400
    if not isinstance(index, int) or index != session.get('current_index'):
        return jsonify({'error': 'This answer does not match the current interview question.'}), 409
    questions = session.get('questions', [])
    if index >= len(questions):
        return jsonify({'error': 'No active question remains.'}), 409
    q = questions[index]
    is_followup_turn = bool(data.get('follow_up', False))
    if is_followup_turn and not session.get('awaiting_followup'):
        return jsonify({'error': 'No follow-up response is currently expected.'}), 409
    if not is_followup_turn and session.get('awaiting_followup'):
        return jsonify({'error': 'Please answer the follow-up question first.'}), 409
    evaluation = evaluate_answer(q, answer_text)
    matched = evaluation.get('matched_keywords', [])
    evaluation['missed_concepts'] = [kw for kw in q.get('keywords', []) if kw not in matched]
    evaluation['rubric'] = {
        'keyword_coverage': {'score': evaluation.get('keyword_match', 0), 'weight': '40% maximum', 'basis': 'Overlap with question-bank concepts; not semantic proof'},
        'answer_depth': {'score': evaluation.get('length_score', 0), 'weight': '20 points maximum', 'basis': 'Approximate response length'},
        'explanation_signals': {'signals': evaluation.get('quality_signals', []), 'weight': '20 points maximum', 'basis': 'Presence of examples, structure and explanatory phrases'},
        'tfidf_similarity': {'weight': '20 points maximum', 'basis': 'Local TF-IDF similarity to expected concepts'}
    }
    if is_followup_turn:
        followup = None
        record = {'question_index': index, 'question': 'Follow-up: ' + q['question'], 'answer': answer_text,
                  'evaluation': evaluation, 'follow_up_question': None, 'answered_at': datetime.utcnow().isoformat()}
        next_index = index + 1
        update = {'$push': {'answers': record}, '$set': {'current_index': next_index, 'awaiting_followup': False}}
    else:
        followup = _follow_up(q['question'], answer_text, False)
        record = {'question_index': index, 'question': q['question'], 'answer': answer_text,
                  'evaluation': evaluation, 'follow_up_question': followup, 'answered_at': datetime.utcnow().isoformat()}
        next_index = index if followup else index + 1
        update = {'$push': {'answers': record}, '$set': {'current_index': next_index, 'awaiting_followup': bool(followup)}}
    mongo.db.video_interview_sessions.update_one(
        {'session_id': session_id, 'user_id': str(user['_id']), 'status': 'active', 'current_index': index}, update
    )
    has_next = next_index < len(questions)
    next_question = questions[next_index]['question'] if has_next else None
    return jsonify({'evaluation': evaluation, 'follow_up_question': followup, 'awaiting_followup': bool(followup) if not is_followup_turn else False,
                    'next_question': next_question, 'next_question_index': next_index,
                    'has_next': has_next, 'completed_primary_questions': next_index,
                    'total_questions': len(questions)}), 200


@video_interview_bp.route('/<session_id>/end', methods=['POST'])
def end(session_id):
    user = _user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    session = _owned(session_id, user)
    if not session:
        return jsonify({'error': 'Interview session not found'}), 404
    answers = session.get('answers', [])
    scores = [a.get('evaluation', {}).get('score', 0) for a in answers]
    overall = round(sum(scores) / len(scores)) if scores else 0
    strengths, improvements = [], []
    for a in answers:
        ev = a.get('evaluation', {})
        strengths.extend(ev.get('matched_keywords', [])[:2])
        improvements.extend(ev.get('missed_concepts', [])[:3])
    report = {
        'session_id': session_id, 'candidate_name': session.get('candidate_name'), 'role': session.get('role'),
        'interview_type': session.get('interview_type'), 'difficulty': session.get('difficulty'),
        'overall_score': overall, 'answered_count': len(answers), 'total_questions': len(session.get('questions', [])),
        'strengths': sorted(set(strengths))[:8], 'practice_topics': sorted(set(improvements))[:8],
        'summary': ('Your responses showed useful coverage of expected concepts.' if overall >= 70 else 'Continue practising structured explanations and concrete examples.' if overall >= 40 else 'Review the core concepts and practise explaining them with examples.'),
        'answers': answers, 'started_at': session.get('started_at'), 'completed_at': datetime.utcnow().isoformat(),
        'scoring_notice': 'Scores are explainable practice indicators from local keyword/TF-IDF heuristics, not a human-equivalent hiring decision.'
    }
    mongo.db.video_interview_sessions.update_one({'session_id': session_id, 'user_id': str(user['_id'])},
        {'$set': {'status': 'completed', 'overall_score': overall, 'completed_at': report['completed_at'], 'report': report}})
    mongo.db.users.update_one({'_id': user['_id']}, {'$push': {'interview_sessions': session_id}, '$set': {'last_interview_score': overall}})
    return jsonify(report), 200


@video_interview_bp.route('/<session_id>/report', methods=['GET'])
def get_report(session_id):
    user = _user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    session = _owned(session_id, user)
    if not session:
        return jsonify({'error': 'Interview session not found'}), 404
    if session.get('status') != 'completed' or not session.get('report'):
        return jsonify({'error': 'The interview report is not ready yet.'}), 409
    return jsonify(session['report']), 200
