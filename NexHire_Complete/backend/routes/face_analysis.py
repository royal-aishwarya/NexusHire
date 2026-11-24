from flask import Blueprint, jsonify
face_bp = Blueprint('face', __name__)

@face_bp.route('/analyze', methods=['POST'])
def analyze_face():
    return jsonify({
        'enabled': False,
        'message': 'Facial/emotion/eye-contact scoring is intentionally disabled. Camera video stays in your browser.'
    }), 410
