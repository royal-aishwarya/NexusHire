import re
import io
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Skill extraction is deterministic and fully local; no model download is needed.

TECH_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "kotlin", "swift",
    "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "fastapi",
    "spring", "hibernate", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins",
    "git", "linux", "bash", "rest api", "graphql", "microservices", "ci/cd",
    "machine learning", "deep learning", "nlp", "computer vision", "data science",
    "html", "css", "tailwind", "bootstrap", "sass", "webpack", "vite",
    "agile", "scrum", "jira", "selenium", "pytest", "jest", "mocha",
    "hadoop", "spark", "kafka", "airflow", "tableau", "power bi"
]

EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "b.tech", "m.tech", "b.e", "m.e", "bsc", "msc",
    "b.sc", "m.sc", "mba", "bca", "mca", "diploma", "certification", "degree",
    "university", "college", "institute", "school", "iit", "nit", "bits"
]

def extract_text_from_pdf(file_bytes):
    try:
        from pdfminer.high_level import extract_text
        return extract_text(io.BytesIO(file_bytes))
    except:
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        except:
            return ""

def extract_text_from_docx(file_bytes):
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\\n".join([para.text for para in doc.paragraphs])
    except:
        return ""

def extract_email(text):
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(pattern, text)
    return emails[0] if emails else None

def extract_phone(text):
    pattern = r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}'
    phones = re.findall(pattern, text)
    return phones[0] if phones else None

def extract_linkedin(text):
    pattern = r'linkedin\.com/in/[a-zA-Z0-9\-_]+'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return matches[0] if matches else None

def extract_github(text):
    pattern = r'github\.com/[a-zA-Z0-9\-_]+'
    matches = re.findall(pattern, text, re.IGNORECASE)
    return matches[0] if matches else None

def extract_skills(text):
    text_lower = text.lower()
    found_skills = []
    for skill in TECH_SKILLS:
        if skill.lower() in text_lower:
            found_skills.append(skill)
    return list(set(found_skills))

def extract_experience(text):
    experiences = []
    lines = text.split('\\n')
    exp_section = False
    exp_keywords = ['experience', 'work history', 'employment', 'career']
    end_keywords = ['education', 'skills', 'projects', 'certifications', 'awards']
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        if any(kw in line_lower for kw in exp_keywords):
            exp_section = True
        elif any(kw in line_lower for kw in end_keywords) and exp_section:
            exp_section = False
        
        if exp_section and line.strip():
            year_pattern = r'\b(19|20)\d{2}\b'
            if re.search(year_pattern, line):
                experiences.append(line.strip())
    
    # Extract years of experience
    years_pattern = r'(\d+)\+?\s*years?\s*(of\s+)?(experience|exp)'
    years_match = re.search(years_pattern, text, re.IGNORECASE)
    total_years = int(years_match.group(1)) if years_match else 0
    
    return {
        "entries": experiences[:10],
        "total_years": total_years
    }

def extract_education(text):
    education = []
    lines = text.split('\\n')
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in EDUCATION_KEYWORDS):
            if len(line.strip()) > 5:
                education.append(line.strip())
    return education[:5]

def extract_name(text):
    lines = [l.strip() for l in text.split('\\n') if l.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line.split()) <= 4 and first_line[0].isupper():
            return first_line
    return "Candidate"

def parse_resume(file_bytes, file_type):
    if file_type == 'pdf':
        text = extract_text_from_pdf(file_bytes)
    elif file_type in ['docx', 'doc']:
        text = extract_text_from_docx(file_bytes)
    else:
        text = file_bytes.decode('utf-8', errors='ignore')
    
    return {
        "raw_text": text,
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "linkedin": extract_linkedin(text),
        "github": extract_github(text),
        "skills": extract_skills(text),
        "experience": extract_experience(text),
        "education": extract_education(text)
    }

def calculate_resume_score(resume_data, job_description=""):
    score = 0
    breakdown = {}
    
    # Skills score (30%)
    skill_score = min(len(resume_data.get("skills", [])) * 3, 30)
    breakdown["skills"] = skill_score
    score += skill_score
    
    # Contact completeness (15%)
    contact_score = 0
    if resume_data.get("email"): contact_score += 5
    if resume_data.get("phone"): contact_score += 5
    if resume_data.get("linkedin"): contact_score += 3
    if resume_data.get("github"): contact_score += 2
    breakdown["contact"] = contact_score
    score += contact_score
    
    # Experience (25%)
    exp = resume_data.get("experience", {})
    exp_years = exp.get("total_years", 0) if isinstance(exp, dict) else 0
    exp_score = min(exp_years * 5, 25)
    if exp_score == 0 and isinstance(exp, dict) and exp.get("entries"):
        exp_score = min(len(exp["entries"]) * 3, 15)
    breakdown["experience"] = exp_score
    score += exp_score
    
    # Education (15%)
    edu_score = min(len(resume_data.get("education", [])) * 5, 15)
    breakdown["education"] = edu_score
    score += edu_score
    
    # JD Match (15%)
    jd_score = 0
    if job_description:
        jd_score = calculate_jd_match(resume_data.get("raw_text", ""), job_description)
        jd_score = int(jd_score * 15)
    else:
        jd_score = 15
    breakdown["jd_match"] = jd_score
    score += jd_score
    
    return {
        "total": min(score, 100),
        "breakdown": breakdown
    }

def calculate_jd_match(resume_text, job_description):
    if not resume_text or not job_description:
        return 0.5
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        vectors = vectorizer.fit_transform([resume_text, job_description])
        similarity = cosine_similarity(vectors[0], vectors[1])[0][0]
        return float(similarity)
    except:
        return 0.5
