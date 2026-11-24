from flask import Flask
from flask_cors import CORS
from extensions import mongo
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-change-this-before-use')
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/ai_interview_platform')
CORS(app, resources={r'/api/*': {'origins': ['http://localhost:3000', 'http://127.0.0.1:3000']}},
     allow_headers=['Content-Type', 'Authorization'], supports_credentials=False)
mongo.init_app(app)

from routes.resume import resume_bp
from routes.interview import interview_bp
from routes.assessment import assessment_bp
from routes.feedback import feedback_bp
from routes.auth import auth_bp
from routes.face_analysis import face_bp
from routes.voice import voice_bp
from routes.dashboard import dashboard_bp
from routes.jobs import jobs_bp
from routes.video_interview import video_interview_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(resume_bp, url_prefix='/api/resume')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(assessment_bp, url_prefix='/api/assessment')
app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
app.register_blueprint(face_bp, url_prefix='/api/face')
app.register_blueprint(voice_bp, url_prefix='/api/voice')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(video_interview_bp, url_prefix='/api/video-interviews')

@app.errorhandler(413)
def too_large(_):
    return {'error': 'Upload exceeds the 10 MB limit.'}, 413

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'NexHire local backend running'}

if __name__ == '__main__':
    app.run(host='127.0.0.1', debug=True, port=5000)
