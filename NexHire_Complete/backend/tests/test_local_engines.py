from utils.resume_parser import extract_skills, calculate_jd_match, parse_resume
from utils.ai_engine import evaluate_answer

def test_skill_extraction_is_local_and_case_insensitive():
    skills = extract_skills("Built a React app with Python, Flask, MongoDB and REST API.")
    lowered = {s.lower() for s in skills}
    assert {"react", "python", "flask", "mongodb", "rest api"}.issubset(lowered)

def test_tfidf_job_match_returns_bounded_similarity():
    score = calculate_jd_match("Python developer using Flask and MongoDB", "Python Flask backend engineer")
    assert 0.0 <= score <= 1.0

def test_answer_evaluation_is_explainable_and_bounded():
    result = evaluate_answer(
        {"question": "Explain Python lists", "keywords": ["mutable", "ordered", "elements"]},
        "A list is mutable and ordered. For example, I used lists to store elements in my Python project."
    )
    assert 0 <= result["score"] <= 100
    assert "matched_keywords" in result
