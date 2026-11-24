def generate_full_report(resume_data, interview_results, mcq_results, face_data=None):
    """Generate comprehensive AI feedback report locally."""
    
    report = {
        "strengths": [],
        "weaknesses": [],
        "skill_gaps": [],
        "learning_recommendations": [],
        "resume_suggestions": [],
        "overall_assessment": "",
        "scores": {}
    }
    
    # ── Scores ──────────────────────────────────────────
    resume_score = resume_data.get("score", {}).get("total", 0)
    interview_score = 0
    if interview_results:
        scores = [r.get("score", 0) for r in interview_results if isinstance(r, dict)]
        interview_score = round(sum(scores) / len(scores)) if scores else 0
    
    mcq_score = mcq_results.get("score_percentage", 0) if mcq_results else 0
    # Hiring feedback uses resume, answer rubric and MCQ results only.
    overall = round((resume_score + interview_score + mcq_score) / 3)
    
    report["scores"] = {
        "resume": resume_score,
        "interview": interview_score,
        "mcq": mcq_score,
        "overall": overall
    }
    
    # ── Strengths ────────────────────────────────────────
    skills = resume_data.get("skills", [])
    if len(skills) >= 5:
        report["strengths"].append(f"Strong technical skill set with {len(skills)} identified skills including {', '.join(skills[:3])}.")
    if resume_data.get("github"):
        report["strengths"].append("Active GitHub profile demonstrates practical coding experience.")
    if resume_data.get("linkedin"):
        report["strengths"].append("Professional LinkedIn presence shows networking awareness.")
    if interview_score >= 70:
        report["strengths"].append("Strong verbal communication and technical articulation during the interview.")
    if mcq_score >= 75:
        report["strengths"].append(f"Excellent MCQ performance ({mcq_score}%) shows strong theoretical foundation.")
    
    experience = resume_data.get("experience", {})
    if isinstance(experience, dict) and experience.get("total_years", 0) >= 2:
        report["strengths"].append(f"Solid work experience ({experience['total_years']} years) provides practical context.")
    
    if not report["strengths"]:
        report["strengths"].append("Shows motivation to pursue skill development and career growth.")
    
    # ── Weaknesses ───────────────────────────────────────
    if resume_score < 50:
        report["weaknesses"].append("Resume lacks sufficient detail — consider adding more projects and quantifiable achievements.")
    if interview_score < 50:
        report["weaknesses"].append("Interview answers could be more structured and example-driven (use the STAR method).")
    if mcq_score < 50:
        report["weaknesses"].append("Technical knowledge gaps identified in MCQ assessment — foundational concepts need review.")
    if len(skills) < 3:
        report["weaknesses"].append("Limited technical skill diversity on resume — expand your tech stack.")
    if not resume_data.get("github"):
        report["weaknesses"].append("No GitHub profile linked — employers expect to see code samples.")
    
    if not report["weaknesses"]:
        report["weaknesses"].append("Minor areas: could benefit from more system design and architectural knowledge.")
    
    # ── Skill Gaps ───────────────────────────────────────
    common_skills = ["docker", "kubernetes", "aws", "ci/cd", "system design", "rest api", "sql"]
    current_skills_lower = [s.lower() for s in skills]
    
    for skill in common_skills:
        if not any(skill in cs for cs in current_skills_lower):
            report["skill_gaps"].append(skill.title())
    
    if not report["skill_gaps"]:
        report["skill_gaps"].append("Consider exploring cloud-native technologies (serverless, service mesh).")
    
    # ── Learning Recommendations ─────────────────────────
    recommendations = []
    
    if "python" in current_skills_lower or any("python" in s for s in current_skills_lower):
        recommendations.append("Advanced Python: Concurrency, asyncio, and performance optimization (Real Python, Fluent Python book).")
    
    if any("machine learning" in s or "ml" in s or "ai" in s for s in current_skills_lower):
        recommendations.append("Deep Learning: fast.ai course or Andrew Ng's Deep Learning Specialization on Coursera.")
    
    if any("react" in s or "javascript" in s for s in current_skills_lower):
        recommendations.append("Full-stack: Next.js + Typescript + testing with Jest/Cypress.")
    
    recommendations.extend([
        "System Design: Study 'Designing Data-Intensive Applications' by Martin Kleppmann.",
        "Behavioral Interview: Practice STAR method answers for common scenarios.",
        "Cloud Certification: AWS Cloud Practitioner or GCP Associate Cloud Engineer.",
        "Open Source: Contribute to GitHub open source projects to build portfolio.",
        "Data Structures & Algorithms: LeetCode medium-level problems daily for 30 days."
    ])
    
    report["learning_recommendations"] = recommendations[:6]
    
    # ── Resume Suggestions ───────────────────────────────
    if not resume_data.get("github"):
        report["resume_suggestions"].append("Add your GitHub profile URL — it's essential for tech roles.")
    if not resume_data.get("linkedin"):
        report["resume_suggestions"].append("Include your LinkedIn URL for professional visibility.")
    if len(skills) < 8:
        report["resume_suggestions"].append("Expand the Skills section with relevant technologies, tools, and frameworks.")
    if isinstance(experience, dict) and not experience.get("entries"):
        report["resume_suggestions"].append("Add detailed work experience with responsibilities and achievements.")
    
    report["resume_suggestions"].extend([
        "Quantify achievements: 'Improved API response time by 40%' beats 'Improved performance'.",
        "Add a 2-3 line professional summary tailored to your target role.",
        "List certifications and relevant online courses to show continued learning.",
        "Include 2-3 significant personal/open-source projects with GitHub links and tech stack.",
        "Use ATS-friendly formatting: clean layout, standard fonts, keyword-rich content."
    ])
    
    report["resume_suggestions"] = report["resume_suggestions"][:6]
    
    # ── Overall Assessment ────────────────────────────────
    if overall >= 80:
        report["overall_assessment"] = f"Excellent candidate! With an overall score of {overall}/100, you demonstrate strong technical skills, good communication, and solid theoretical knowledge. You're well-prepared for mid to senior-level roles."
    elif overall >= 60:
        report["overall_assessment"] = f"Good potential! Overall score: {overall}/100. You have a solid foundation but should work on the identified gaps. With focused preparation (2-4 weeks), you can significantly improve your candidacy."
    elif overall >= 40:
        report["overall_assessment"] = f"Developing candidate. Overall score: {overall}/100. Focus on strengthening technical fundamentals, building projects, and improving interview communication. Consider a 1-2 month preparation plan."
    else:
        report["overall_assessment"] = f"Early stage. Overall score: {overall}/100. Start with foundational concepts, build small projects, and practice consistently. Everyone starts somewhere — commit to the learning recommendations above."
    
    return report
