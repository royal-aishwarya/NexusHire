from flask import Blueprint, jsonify
voice_bp = Blueprint('voice', __name__)

@voice_bp.route('/transcribe', methods=['POST'])
def transcribe():
    return jsonify({
        'success': False,
        'message': 'Server transcription is disabled to guarantee no external speech API calls. Use browser speech recognition where supported or type your answer.'
    }), 410
