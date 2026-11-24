const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const headers = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra
});

const req = async (method, path, body, isFormData = false) => {
  const opts = {
    method,
    headers: isFormData
      ? { ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) }
      : headers(),
  };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  // Auth
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  register: (name, email, password) => req('POST', '/auth/register', { name, email, password }),

  // Resume
  uploadResume: (formData) => req('POST', '/resume/upload', formData, true),
  getResume: () => req('GET', '/resume/data'),
  getResumeHistory: () => req('GET', '/resume/history'),
  compareResumes: (resumeIds) => req('POST', '/resume/compare', { resume_ids: resumeIds }),
  updateResumeProfile: (profile) => req('PATCH', '/resume/profile', profile),
  screenResume: (jobDesc) => req('POST', '/resume/screen', { job_description: jobDesc }),

  // Interview
  startInterview: (config) => req('POST', '/interview/start', Array.isArray(config) ? { skills: config } : config),
  submitAnswer: (sessionId, questionId, answer, questionData) =>
    req('POST', '/interview/answer', { session_id: sessionId, question_id: questionId, answer, question_data: questionData }),
  completeInterview: (sessionId) => req('POST', '/interview/complete', { session_id: sessionId }),
  getSession: (sessionId) => req('GET', `/interview/session/${sessionId}`),

  // Phase 3: authenticated conversational video interviews (video stays client-side)
  startVideoInterview: (config) => req('POST', '/video-interviews/start', config),
  submitVideoAnswer: (sessionId, questionIndex, answer, followUp = false) =>
    req('POST', `/video-interviews/${sessionId}/answer`, { question_index: questionIndex, answer, follow_up: followUp }),
  endVideoInterview: (sessionId) => req('POST', `/video-interviews/${sessionId}/end`, {}),
  getVideoInterviewReport: (sessionId) => req('GET', `/video-interviews/${sessionId}/report`),

  // Assessment
  getSkills: () => req('GET', '/assessment/skills'),
  getQuestions: (skill, level, count) => req('GET', `/assessment/questions?skill=${skill}&level=${level}&count=${count}`),
  submitAssessment: (skill, level, answers, timeTaken) =>
    req('POST', '/assessment/submit', { skill, level, answers, time_taken: timeTaken }),


  // Feedback
  generateFeedback: (faceData) => req('POST', '/feedback/generate', { face_data: faceData }),
  getReport: () => req('GET', '/feedback/report'),

  // Job descriptions and local resume matching
  getJobs: () => req('GET', '/jobs'),
  createJob: (job) => req('POST', '/jobs', job),
  updateJob: (id, job) => req('PATCH', `/jobs/${id}`, job),
  deleteJob: (id) => req('DELETE', `/jobs/${id}`),
  matchJob: (id) => req('POST', `/jobs/${id}/match`, {}),

  // Dashboard
  getDashboard: () => req('GET', '/dashboard/stats'),
};
