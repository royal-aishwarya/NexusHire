from flask import Blueprint, request, jsonify
from extensions import mongo
from routes.auth import get_current_user
from datetime import datetime
from bson import ObjectId
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

jobs_bp = Blueprint('jobs', __name__)

def _user():
    return get_current_user(request)

def _clean_skills(values):
    if not isinstance(values, list):
        return []
    return sorted({str(x).strip()[:80] for x in values if str(x).strip()})[:100]

@jobs_bp.route('', methods=['GET'])
def list_jobs():
    user = _user()
    if not user: return jsonify(error='Unauthorized'), 401
    rows = list(mongo.db.job_descriptions.find({'user_id': str(user['_id'])}).sort('created_at', -1))
    for row in rows: row['_id'] = str(row['_id'])
    return jsonify(rows), 200

@jobs_bp.route('', methods=['POST'])
def create_job():
    user = _user()
    if not user: return jsonify(error='Unauthorized'), 401
    data = request.get_json(silent=True) or {}
    title, description = str(data.get('title','')).strip(), str(data.get('description','')).strip()
    if not title or not description: return jsonify(error='Title and job description are required'), 400
    doc = {'user_id': str(user['_id']), 'title': title[:160], 'company': str(data.get('company',''))[:160],
           'description': description[:30000], 'required_skills': _clean_skills(data.get('required_skills', [])),
           'preferred_skills': _clean_skills(data.get('preferred_skills', [])), 'created_at': datetime.utcnow().isoformat(),
           'updated_at': datetime.utcnow().isoformat()}
    result = mongo.db.job_descriptions.insert_one(doc)
    doc['_id'] = str(result.inserted_id)
    return jsonify(doc), 201

@jobs_bp.route('/<job_id>', methods=['PATCH'])
def update_job(job_id):
    user = _user()
    if not user: return jsonify(error='Unauthorized'), 401
    try: oid = ObjectId(job_id)
    except Exception: return jsonify(error='Invalid job id'), 400
    data = request.get_json(silent=True) or {}
    allowed = {}
    for field in ('title','company','description'):
        if field in data: allowed[field] = str(data[field]).strip()[:30000]
    for field in ('required_skills','preferred_skills'):
        if field in data: allowed[field] = _clean_skills(data[field])
    allowed['updated_at'] = datetime.utcnow().isoformat()
    result = mongo.db.job_descriptions.update_one({'_id': oid, 'user_id': str(user['_id'])}, {'$set': allowed})
    if not result.matched_count: return jsonify(error='Job not found'), 404
    return jsonify(message='Job updated'), 200

@jobs_bp.route('/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    user = _user()
    if not user: return jsonify(error='Unauthorized'), 401
    try: oid = ObjectId(job_id)
    except Exception: return jsonify(error='Invalid job id'), 400
    result = mongo.db.job_descriptions.delete_one({'_id': oid, 'user_id': str(user['_id'])})
    if not result.deleted_count: return jsonify(error='Job not found'), 404
    return jsonify(message='Job deleted'), 200

@jobs_bp.route('/<job_id>/match', methods=['POST'])
def match_job(job_id):
    user = _user()
    if not user: return jsonify(error='Unauthorized'), 401
    try: oid = ObjectId(job_id)
    except Exception: return jsonify(error='Invalid job id'), 400
    job = mongo.db.job_descriptions.find_one({'_id': oid, 'user_id': str(user['_id'])})
    if not job: return jsonify(error='Job not found'), 404
    resume = user.get('resume_data') or {}
    resume_text = resume.get('raw_text', '')
    if not resume_text: return jsonify(error='Upload a resume with selectable text first'), 400
    try:
        matrix = TfidfVectorizer(stop_words='english', ngram_range=(1,2)).fit_transform([resume_text, job['description']])
        text_score = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0] * 100)
    except ValueError: text_score = 0.0
    detected = {x.lower() for x in resume.get('skills', [])}
    required, preferred = job.get('required_skills', []), job.get('preferred_skills', [])
    req_hits = [s for s in required if s.lower() in detected]
    pref_hits = [s for s in preferred if s.lower() in detected]
    req_cov = 100 * len(req_hits)/len(required) if required else None
    pref_cov = 100 * len(pref_hits)/len(preferred) if preferred else None
    parts = [(0.40,text_score)]
    if req_cov is not None: parts.append((0.45,req_cov))
    if pref_cov is not None: parts.append((0.15,pref_cov))
    score = sum(w*v for w,v in parts)/sum(w for w,_ in parts)
    result = {'job_id': job_id, 'job_title': job['title'], 'text_similarity': round(text_score,2),
              'required_skill_coverage': round(req_cov,2) if req_cov is not None else None,
              'preferred_skill_coverage': round(pref_cov,2) if pref_cov is not None else None,
              'composite_score': round(score,2), 'matched_required_skills': req_hits,
              'missing_required_skills': [s for s in required if s not in req_hits],
              'matched_preferred_skills': pref_hits,
              'missing_preferred_skills': [s for s in preferred if s not in pref_hits],
              'scoring_method': '40% TF-IDF text similarity, 45% required-skill coverage, 15% preferred-skill coverage; absent skill groups are renormalized.'}
    result['recommendations'] = ['Add evidence of '+s+' in a project or experience section.' for s in result['missing_required_skills'] + result['missing_preferred_skills']]
    mongo.db.resume_match_results.insert_one({'user_id':str(user['_id']), **result, 'created_at':datetime.utcnow().isoformat()})
    return jsonify(result), 200
