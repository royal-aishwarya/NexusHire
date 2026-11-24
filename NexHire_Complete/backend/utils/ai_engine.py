import random
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ─────────────────────────────────────────────
# LOCAL QUESTION BANK
# ─────────────────────────────────────────────
QUESTION_BANK = {
    "hr": [
        {"question": "Tell me about yourself.", "keywords": ["background", "experience", "skills", "passion", "career"], "type": "hr", "level": "all"},
        {"question": "What are your greatest strengths?", "keywords": ["strength", "skill", "leadership", "problem-solving", "communication"], "type": "hr", "level": "all"},
        {"question": "What is your biggest weakness?", "keywords": ["weakness", "improve", "learning", "working on", "challenge"], "type": "hr", "level": "all"},
        {"question": "Where do you see yourself in 5 years?", "keywords": ["growth", "leadership", "senior", "manager", "career", "goals"], "type": "hr", "level": "all"},
        {"question": "Why do you want to work here?", "keywords": ["company", "culture", "mission", "growth", "opportunity", "excited"], "type": "hr", "level": "all"},
        {"question": "Describe a challenging situation and how you handled it.", "keywords": ["challenge", "solution", "team", "deadline", "resolved", "result"], "type": "hr", "level": "all"},
        {"question": "How do you handle stress and pressure?", "keywords": ["deadline", "priority", "calm", "organize", "focus", "manage"], "type": "hr", "level": "all"},
        {"question": "Tell me about a time you worked in a team.", "keywords": ["collaboration", "team", "communicate", "role", "contribute", "success"], "type": "hr", "level": "all"},
        {"question": "What motivates you?", "keywords": ["passion", "challenge", "learning", "impact", "growth", "achieve"], "type": "hr", "level": "all"},
        {"question": "How do you prioritize tasks?", "keywords": ["priority", "deadline", "organize", "schedule", "important", "urgent"], "type": "hr", "level": "all"},
        {"question": "Tell me about a time you showed leadership.", "keywords": ["lead", "team", "decision", "initiative", "mentor", "guide"], "type": "hr", "level": "all"},
        {"question": "How do you handle failure?", "keywords": ["learn", "improve", "mistake", "recover", "lesson", "growth"], "type": "hr", "level": "all"},
    ],
    "python": [
        {"question": "What are Python's key features?", "keywords": ["interpreted", "dynamic", "duck typing", "GIL", "object-oriented", "readable"], "type": "technical", "level": "beginner"},
        {"question": "Explain the difference between list and tuple in Python.", "keywords": ["mutable", "immutable", "list", "tuple", "performance", "hashable"], "type": "technical", "level": "beginner"},
        {"question": "What is a Python decorator? Give an example.", "keywords": ["decorator", "wrapper", "function", "@", "higher-order", "syntax sugar"], "type": "technical", "level": "intermediate"},
        {"question": "Explain Python's GIL (Global Interpreter Lock).", "keywords": ["GIL", "thread", "concurrency", "CPython", "lock", "multiprocessing"], "type": "technical", "level": "advanced"},
        {"question": "What are generators in Python?", "keywords": ["yield", "iterator", "lazy", "memory", "generator", "next"], "type": "technical", "level": "intermediate"},
        {"question": "Explain list comprehension vs map/filter.", "keywords": ["comprehension", "map", "filter", "readable", "performance", "functional"], "type": "technical", "level": "intermediate"},
        {"question": "What is the difference between deepcopy and copy?", "keywords": ["deepcopy", "shallow copy", "nested", "reference", "object", "copy"], "type": "technical", "level": "intermediate"},
        {"question": "How does Python's garbage collection work?", "keywords": ["reference counting", "gc", "cyclic", "memory", "del", "object"], "type": "technical", "level": "advanced"},
    ],
    "javascript": [
        {"question": "Explain event loop in JavaScript.", "keywords": ["event loop", "call stack", "callback", "microtask", "macrotask", "async"], "type": "technical", "level": "intermediate"},
        {"question": "What is closure in JavaScript?", "keywords": ["closure", "scope", "inner function", "outer", "variable", "lexical"], "type": "technical", "level": "intermediate"},
        {"question": "Explain Promise vs async/await.", "keywords": ["promise", "async", "await", "then", "catch", "asynchronous"], "type": "technical", "level": "intermediate"},
        {"question": "What is the difference between == and ===?", "keywords": ["strict equality", "type coercion", "===", "==", "comparison"], "type": "technical", "level": "beginner"},
        {"question": "Explain prototypal inheritance in JavaScript.", "keywords": ["prototype", "inheritance", "__proto__", "chain", "Object.create", "class"], "type": "technical", "level": "advanced"},
        {"question": "What are JavaScript modules (ESM vs CommonJS)?", "keywords": ["import", "export", "require", "module", "ESM", "CommonJS"], "type": "technical", "level": "intermediate"},
    ],
    "react": [
        {"question": "Explain React's virtual DOM.", "keywords": ["virtual DOM", "diffing", "reconciliation", "render", "performance", "fiber"], "type": "technical", "level": "intermediate"},
        {"question": "What are React hooks? Explain useState and useEffect.", "keywords": ["hooks", "useState", "useEffect", "functional component", "side effect", "state"], "type": "technical", "level": "intermediate"},
        {"question": "Explain the concept of lifting state up in React.", "keywords": ["parent", "child", "props", "state", "shared", "callback"], "type": "technical", "level": "intermediate"},
        {"question": "What is React Context and when would you use it?", "keywords": ["context", "provider", "consumer", "global state", "prop drilling", "useContext"], "type": "technical", "level": "intermediate"},
        {"question": "How do you optimize React performance?", "keywords": ["memo", "useMemo", "useCallback", "lazy", "Suspense", "code splitting"], "type": "technical", "level": "advanced"},
    ],
    "machine learning": [
        {"question": "Explain overfitting and how to prevent it.", "keywords": ["overfitting", "regularization", "dropout", "validation", "cross-validation", "bias-variance"], "type": "technical", "level": "intermediate"},
        {"question": "What is the difference between supervised and unsupervised learning?", "keywords": ["supervised", "unsupervised", "labels", "clustering", "classification", "regression"], "type": "technical", "level": "beginner"},
        {"question": "Explain gradient descent.", "keywords": ["gradient", "descent", "learning rate", "loss", "optimize", "converge"], "type": "technical", "level": "intermediate"},
        {"question": "What is cross-validation?", "keywords": ["k-fold", "validation", "generalize", "train", "test", "split"], "type": "technical", "level": "intermediate"},
        {"question": "Explain the bias-variance tradeoff.", "keywords": ["bias", "variance", "tradeoff", "overfitting", "underfitting", "complexity"], "type": "technical", "level": "advanced"},
        {"question": "What is feature engineering?", "keywords": ["feature", "engineering", "transform", "normalize", "encode", "selection"], "type": "technical", "level": "intermediate"},
    ],
    "system_design": [
        {"question": "How would you design a URL shortener like bit.ly?", "keywords": ["hash", "database", "redirect", "collision", "cache", "scale"], "type": "system_design", "level": "intermediate"},
        {"question": "Design a scalable notification system.", "keywords": ["queue", "pub/sub", "kafka", "push", "rate limit", "delivery"], "type": "system_design", "level": "advanced"},
        {"question": "How would you design a distributed cache?", "keywords": ["redis", "sharding", "consistent hashing", "eviction", "TTL", "replication"], "type": "system_design", "level": "advanced"},
        {"question": "Design a rate limiting system.", "keywords": ["token bucket", "sliding window", "redis", "limit", "throttle", "algorithm"], "type": "system_design", "level": "advanced"},
        {"question": "How would you design Twitter's timeline feature?", "keywords": ["fanout", "cache", "graph", "social", "feed", "timeline", "write"], "type": "system_design", "level": "advanced"},
        {"question": "Explain CAP theorem and when to choose consistency vs availability.", "keywords": ["CAP", "consistency", "availability", "partition", "tradeoff", "distributed"], "type": "system_design", "level": "advanced"},
        {"question": "How would you design a file storage system like Dropbox?", "keywords": ["chunking", "metadata", "sync", "delta", "blob", "storage"], "type": "system_design", "level": "advanced"},
    ],
    "database": [
        {"question": "Explain ACID properties in databases.", "keywords": ["atomicity", "consistency", "isolation", "durability", "transaction", "ACID"], "type": "technical", "level": "intermediate"},
        {"question": "What is database indexing and how does it work?", "keywords": ["index", "B-tree", "search", "performance", "query", "scan"], "type": "technical", "level": "intermediate"},
        {"question": "When would you use NoSQL over SQL?", "keywords": ["NoSQL", "schema", "flexible", "scale", "document", "horizontal"], "type": "technical", "level": "intermediate"},
        {"question": "Explain database normalization.", "keywords": ["1NF", "2NF", "3NF", "normalize", "redundancy", "dependency"], "type": "technical", "level": "intermediate"},
    ],
    "general": [
        {"question": "Explain object-oriented programming principles.", "keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction", "OOP", "class"], "type": "technical", "level": "beginner"},
        {"question": "What is REST API and its principles?", "keywords": ["REST", "stateless", "HTTP", "resource", "endpoint", "CRUD"], "type": "technical", "level": "beginner"},
        {"question": "Explain microservices architecture.", "keywords": ["microservice", "service", "independent", "deploy", "API", "communication"], "type": "technical", "level": "intermediate"},
        {"question": "What is CI/CD?", "keywords": ["continuous integration", "continuous delivery", "pipeline", "automate", "deploy", "test"], "type": "technical", "level": "intermediate"},
        {"question": "Explain the difference between TCP and UDP.", "keywords": ["TCP", "UDP", "reliable", "connection", "packet", "latency"], "type": "technical", "level": "intermediate"},
    ],
    "scenario": [
        {"question": "You have a production system that suddenly slows down. Walk me through your debugging process.", "keywords": ["monitor", "logs", "metrics", "bottleneck", "profile", "isolate", "fix"], "type": "scenario", "level": "intermediate"},
        {"question": "How would you handle a disagreement with a senior developer about architecture?", "keywords": ["discuss", "data", "compromise", "respect", "technical", "escalate", "team"], "type": "scenario", "level": "all"},
        {"question": "You're given an ambiguous requirement. What do you do?", "keywords": ["clarify", "stakeholder", "question", "requirement", "assumption", "document"], "type": "scenario", "level": "all"},
        {"question": "Your team is behind on a deadline. How do you handle it?", "keywords": ["communicate", "prioritize", "scope", "manager", "risk", "plan"], "type": "scenario", "level": "all"},
        {"question": "You discover a security vulnerability in production. What steps do you take?", "keywords": ["report", "patch", "assess", "impact", "notify", "rollback", "fix"], "type": "scenario", "level": "intermediate"},
    ]
}

SKILL_TO_CATEGORY = {
    "python": "python", "django": "python", "flask": "python", "fastapi": "python",
    "javascript": "javascript", "typescript": "javascript", "node.js": "javascript",
    "react": "react", "next.js": "react", "angular": "general", "vue": "general",
    "machine learning": "machine learning", "deep learning": "machine learning",
    "tensorflow": "machine learning", "pytorch": "machine learning", "scikit-learn": "machine learning",
    "sql": "database", "mysql": "database", "postgresql": "database", "mongodb": "database",
    "aws": "general", "docker": "general", "kubernetes": "general",
}

def get_questions_for_skills(skills, num_questions=15):
    """Generate interview questions matched to resume skills."""
    questions = []
    categories_used = set()
    
    # Map skills to question categories
    for skill in skills:
        skill_lower = skill.lower()
        for key, category in SKILL_TO_CATEGORY.items():
            if key in skill_lower and category not in categories_used:
                if category in QUESTION_BANK:
                    q_list = QUESTION_BANK[category]
                    selected = random.sample(q_list, min(2, len(q_list)))
                    questions.extend(selected)
                    categories_used.add(category)
                    break
    
    # Always add HR questions
    hr_qs = random.sample(QUESTION_BANK["hr"], min(3, len(QUESTION_BANK["hr"])))
    questions.extend(hr_qs)
    
    # Always add scenario questions
    scenario_qs = random.sample(QUESTION_BANK["scenario"], min(2, len(QUESTION_BANK["scenario"])))
    questions.extend(scenario_qs)
    
    # Add system design if senior (check experience keywords)
    sd_qs = random.sample(QUESTION_BANK["system_design"], min(2, len(QUESTION_BANK["system_design"])))
    questions.extend(sd_qs)
    
    # Add general technical
    gen_qs = random.sample(QUESTION_BANK["general"], min(2, len(QUESTION_BANK["general"])))
    questions.extend(gen_qs)
    
    # Deduplicate
    seen = set()
    unique_questions = []
    for q in questions:
        if q["question"] not in seen:
            seen.add(q["question"])
            unique_questions.append(q)
    
    random.shuffle(unique_questions)
    return unique_questions[:num_questions]


def evaluate_answer(question_data, user_answer):
    """Evaluate a user's answer using local NLP."""
    if not user_answer or len(user_answer.strip()) < 5:
        return {
            "score": 0,
            "feedback": "No answer provided.",
            "keyword_match": 0,
            "length_score": 0,
            "quality_signals": []
        }
    
    answer_lower = user_answer.lower()
    keywords = question_data.get("keywords", [])
    
    # 1. Keyword overlap score (40%)
    matched_keywords = [kw for kw in keywords if kw.lower() in answer_lower]
    keyword_score = (len(matched_keywords) / max(len(keywords), 1)) * 40
    
    # 2. Length/depth score (20%)
    word_count = len(user_answer.split())
    if word_count < 10:
        length_score = 5
    elif word_count < 30:
        length_score = 10
    elif word_count < 80:
        length_score = 15
    else:
        length_score = 20
    
    # 3. Quality signals (20%)
    quality_signals = []
    quality_score = 0
    
    positive_signals = {
        "example": ["example", "for instance", "for example", "such as", "like when"],
        "structure": ["first", "second", "third", "finally", "additionally", "moreover"],
        "technical": ["because", "therefore", "which means", "this ensures", "as a result"],
        "confidence": ["i have", "i used", "i implemented", "i worked", "i built"],
    }
    
    for signal_type, phrases in positive_signals.items():
        for phrase in phrases:
            if phrase in answer_lower:
                quality_signals.append(signal_type)
                quality_score += 5
                break
    
    quality_score = min(quality_score, 20)
    
    # 4. TF-IDF similarity with keywords (20%)
    try:
        keyword_text = " ".join(keywords)
        if keyword_text:
            vectorizer = TfidfVectorizer(stop_words='english')
            vectors = vectorizer.fit_transform([user_answer, keyword_text])
            similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
            tfidf_score = similarity * 20
        else:
            tfidf_score = 10
    except:
        tfidf_score = 10
    
    total_score = keyword_score + length_score + quality_score + tfidf_score
    total_score = min(round(total_score), 100)
    
    # Generate feedback
    feedback = generate_answer_feedback(total_score, matched_keywords, keywords, quality_signals, word_count)
    
    return {
        "score": total_score,
        "feedback": feedback,
        "keyword_match": round(keyword_score / 40 * 100),
        "matched_keywords": matched_keywords,
        "length_score": length_score,
        "quality_signals": list(set(quality_signals)),
        "word_count": word_count
    }


def generate_answer_feedback(score, matched_kw, all_kw, signals, word_count):
    missed_kw = [kw for kw in all_kw if kw not in matched_kw]
    
    if score >= 80:
        opening = "Excellent answer! "
    elif score >= 60:
        opening = "Good answer. "
    elif score >= 40:
        opening = "Decent attempt. "
    else:
        opening = "Needs improvement. "
    
    parts = [opening]
    
    if matched_kw:
        parts.append(f"You correctly mentioned: {', '.join(matched_kw[:3])}. ")
    
    if missed_kw:
        parts.append(f"Consider also covering: {', '.join(missed_kw[:3])}. ")
    
    if word_count < 20:
        parts.append("Try to elaborate more with examples. ")
    
    if "example" not in signals:
        parts.append("Adding a real-world example would strengthen your answer. ")
    
    if "structure" not in signals:
        parts.append("Structuring your answer (e.g., using 'First... Then... Finally...') improves clarity. ")
    
    return "".join(parts)
