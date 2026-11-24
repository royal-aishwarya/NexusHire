
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const LEVELS = ['beginner', 'intermediate', 'advanced'];
const TOTAL_TIME = 600;

// Convert different backend answer formats into an option index.
// Expected preferred format: 0, 1, 2, or 3.
function getCorrectIndex(question) {
  if (!question) return -1;

  const answer =
    question.answer_index ??
    question.correct_answer_index ??
    question.correctAnswerIndex ??
    question.answer ??
    question.correct_answer ??
    question.correctAnswer;

  if (answer === undefined || answer === null) return -1;

  // Numeric answer: zero-based option index.
  if (typeof answer === 'number') {
    return Number.isInteger(answer) &&
      answer >= 0 &&
      answer < (question.options || []).length
      ? answer
      : -1;
  }

  const value = String(answer).trim();

  // Letter answers: A, B, C, D.
  if (/^[A-D]$/i.test(value)) {
    return value.toUpperCase().charCodeAt(0) - 65;
  }

  // Numeric strings: "0", "1", "2", "3".
  if (/^\d+$/.test(value)) {
    const index = Number(value);
    return index >= 0 && index < (question.options || []).length
      ? index
      : -1;
  }

  // Answer text: compare with the available options.
  const options = question.options || [];
  return options.findIndex(
    option =>
      String(option).trim().toLowerCase() === value.toLowerCase()
  );
}

// Convert an answer index into its displayed option text.
function getOptionText(options, answer) {
  if (answer === undefined || answer === null) {
    return 'Not answered';
  }

  const value = String(answer).trim();

  let index = -1;

  if (typeof answer === 'number' || /^\d+$/.test(value)) {
    index = Number(answer);
  } else if (/^[A-D]$/i.test(value)) {
    index = value.toUpperCase().charCodeAt(0) - 65;
  } else {
    const matched = options?.find(
      option =>
        String(option).trim().toLowerCase() === value.toLowerCase()
    );

    return matched ?? value;
  }

  return options?.[index] ?? 'Not answered';
}

// Timer component
function Timer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  const expireCallback = useRef(onExpire);
  const expired = useRef(false);

  useEffect(() => {
    expireCallback.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(previous => {
        if (previous <= 1) {
          clearInterval(timer);

          if (!expired.current) {
            expired.current = true;
            setTimeout(() => expireCallback.current?.(), 0);
          }

          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const percentage = Math.max(0, (left / seconds) * 100);

  const color =
    percentage > 50
      ? 'var(--neon-green)'
      : percentage > 20
      ? 'var(--neon-amber)'
      : 'var(--neon-pink)';

  const circumference = 2 * Math.PI * 26;

  return (
    <div className="timer-wrap">
      <svg viewBox="0 0 60 60" className="timer-svg">
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="4"
        />

        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percentage / 100)}
          strokeLinecap="round"
          style={{
            transition: '1s linear',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center'
          }}
        />
      </svg>

      <span className="timer-val" style={{ color }}>
        {left}s
      </span>
    </div>
  );
}

export default function AssessmentPage() {
  const [skills, setSkills] = useState([]);
  const [phase, setPhase] = useState('setup');

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('intermediate');

  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);

  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const [selectedOpt, setSelectedOpt] = useState(null);
  const [revealed, setRevealed] = useState(false);

  // Prevent duplicate submission.
  const submitting = useRef(false);

  useEffect(() => {
    api.getSkills()
      .then(data => setSkills(Array.isArray(data) ? data : []))
      .catch(error => console.error('Skills loading error:', error));
  }, []);

  // Start assessment
  const startQuiz = async () => {
    if (!selectedSkill || loading) return;

    setLoading(true);

    try {
      const data = await api.getQuestions(
        selectedSkill.id,
        selectedLevel,
        10
      );

      const fetchedQuestions = data.questions || [];

      if (!fetchedQuestions.length) {
        alert('No questions available for this topic and difficulty.');
        return;
      }

      setQuestions(fetchedQuestions);
      setUserAnswers({});
      setQIndex(0);
      setSelectedOpt(null);
      setRevealed(false);
      setResults(null);

      submitting.current = false;

      setStartTime(Date.now());
      setPhase('quiz');
    } catch (error) {
      alert(error.message || 'Unable to load questions.');
    } finally {
      setLoading(false);
    }
  };

  // Select an answer
  const pickAnswer = optIdx => {
    if (revealed || !questions[qIndex]) return;

    setSelectedOpt(optIdx);
    setRevealed(true);

    const questionId = questions[qIndex].id;

    setUserAnswers(previous => ({
      ...previous,
      [questionId]: optIdx
    }));
  };

  // Submit assessment
  const submitQuiz = async () => {
    if (submitting.current || !selectedSkill) return;

    submitting.current = true;
    setLoading(true);

    try {
      const timeTaken = startTime
        ? Math.round((Date.now() - startTime) / 1000)
        : 0;

      const data = await api.submitAssessment(
        selectedSkill.id,
        selectedLevel,
        userAnswers,
        timeTaken
      );

      setResults(data);
      setPhase('results');
    } catch (error) {
      submitting.current = false;
      alert(error.message || 'Unable to submit assessment.');
    } finally {
      setLoading(false);
    }
  };

  // Move to next question
  const nextQ = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex(previous => previous + 1);
      setSelectedOpt(null);
      setRevealed(false);
    } else {
      submitQuiz();
    }
  };

  // Reset assessment
  const reset = () => {
    submitting.current = false;

    setPhase('setup');
    setResults(null);
    setQuestions([]);
    setUserAnswers({});
    setQIndex(0);
    setSelectedOpt(null);
    setRevealed(false);
    setStartTime(null);
  };

  // SETUP SCREEN
  if (phase === 'setup') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Skill Assessment</h1>
            <p className="page-sub">
              Timer-based MCQ evaluation across difficulty levels
            </p>
          </div>
        </div>

        <div className="glass-card">
          <h3 className="card-title">Select Topic</h3>

          <div className="skill-grid">
            {skills.map(skill => (
              <button
                key={skill.id}
                className={`skill-select-btn ${
                  selectedSkill?.id === skill.id ? 'active' : ''
                }`}
                onClick={() => setSelectedSkill(skill)}
              >
                <span className="ss-icon">{skill.icon}</span>
                <span className="ss-name">{skill.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card">
          <h3 className="card-title">Difficulty Level</h3>

          <div className="level-selector">
            {LEVELS.map(level => (
              <button
                key={level}
                className={`level-btn ${
                  selectedLevel === level ? 'active' : ''
                }`}
                onClick={() => setSelectedLevel(level)}
              >
                {level === 'beginner'
                  ? '🟢'
                  : level === 'intermediate'
                  ? '🟡'
                  : '🔴'}

                {' '}
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-info-row">
          {[
            ['10', 'Questions'],
            ['10 min', 'Time Limit'],
            ['Instant', 'Feedback'],
            ['Scored', 'Results']
          ].map(([value, label]) => (
            <div key={label} className="quiz-info-card">
              <div className="qi-val">{value}</div>
              <div className="qi-lbl">{label}</div>
            </div>
          ))}
        </div>

        <button
          className="btn-primary"
          onClick={startQuiz}
          disabled={!selectedSkill || loading}
        >
          {loading ? (
            <>
              <span className="spinner-sm" />
              Loading...
            </>
          ) : (
            `🚀 Start ${selectedSkill?.name || ''} Quiz`
          )}
        </button>
      </div>
    );
  }

  // QUIZ SCREEN
  if (phase === 'quiz') {
    const question = questions[qIndex];

    if (!question) {
      return (
        <div className="page">
          <p>Loading question...</p>
        </div>
      );
    }

    const progress = Math.round(
      ((qIndex + 1) / questions.length) * 100
    );

    const correctIndex = getCorrectIndex(question);

    const isCorrect = selectedOpt === correctIndex;

    return (
      <div className="page">
        <div className="progress-bar-wrap">
          <div className="progress-info">
            <span>
              {selectedSkill?.name} · {selectedLevel}
            </span>

            <span>
              Q {qIndex + 1}/{questions.length}
            </span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="quiz-layout">
          <div className="quiz-main">
            <div className="question-card">
              <div className="q-meta">
                <span className="q-type-badge">MCQ</span>
                <span className="q-level-badge">
                  {selectedLevel}
                </span>
              </div>

              <h2 className="question-text">
                {question.question}
              </h2>
            </div>

            <div className="options-grid">
              {question.options?.map((option, index) => {
                let className = 'option-btn';

                if (revealed) {
                  if (index === correctIndex) {
                    className += ' correct';
                  } else if (index === selectedOpt) {
                    className += ' wrong';
                  }
                }

                return (
                  <button
                    key={index}
                    className={className}
                    onClick={() => pickAnswer(index)}
                    disabled={revealed}
                  >
                    <span className="opt-letter">
                      {String.fromCharCode(65 + index)}
                    </span>

                    <span className="opt-text">
                      {option}
                    </span>

                    {revealed && index === correctIndex && (
                      <span className="opt-check">✓</span>
                    )}

                    {revealed &&
                      index === selectedOpt &&
                      index !== correctIndex && (
                        <span className="opt-x">✗</span>
                      )}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div
                className={`explanation-box ${
                  isCorrect ? 'correct' : 'wrong'
                }`}
              >
                <strong>
                  {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                </strong>

                {!isCorrect && (
                  <p>
                    Correct answer:{' '}
                    {question.options?.[correctIndex] ||
                      'Please check the question data.'}
                  </p>
                )}

                <p>
                  {question.explanation ||
                    'No explanation available.'}
                </p>
              </div>
            )}

            {revealed && (
              <button
                className="btn-primary"
                onClick={nextQ}
                disabled={loading}
              >
                {loading
                  ? 'Submitting...'
                  : qIndex + 1 < questions.length
                  ? 'Next Question →'
                  : '✅ Finish Quiz'}
              </button>
            )}
          </div>

          <div className="quiz-sidebar">
            <Timer
              key={startTime}
              seconds={TOTAL_TIME}
              onExpire={submitQuiz}
            />

            <div className="answered-grid">
              {questions.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`ans-dot ${
                    index < qIndex
                      ? 'done'
                      : index === qIndex
                      ? 'current'
                      : ''
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RESULTS SCREEN
  const gradeColor = {
    'A+': 'var(--neon-green)',
    A: 'var(--neon-green)',
    B: 'var(--neon-blue)',
    C: 'var(--neon-amber)',
    D: 'var(--neon-amber)',
    F: 'var(--neon-pink)'
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assessment Results</h1>

          <p className="page-sub">
            {selectedSkill?.name} · {selectedLevel}
          </p>
        </div>
      </div>

      <div className="results-summary">
        <div
          className="result-big-score"
          style={{
            color:
              gradeColor[results?.grade] || 'var(--neon-blue)'
          }}
        >
          {results?.score_percentage ?? 0}%
        </div>

        <div
          className="result-grade"
          style={{
            color:
              gradeColor[results?.grade] || 'var(--neon-blue)'
          }}
        >
          {results?.grade || '-'}
        </div>

        <div className="result-counts">
          {results?.correct ?? 0}/{results?.total ?? questions.length}{' '}
          correct
        </div>

        <p className="result-feedback">
          {results?.feedback || 'Assessment completed.'}
        </p>
      </div>

      <div className="answers-review">
        {results?.results?.map((result, index) => {
          const options = result.options || [];

          const correctAnswer =
            result.correct_answer_index ??
            result.correct_answer ??
            result.correctAnswer;

          const userAnswer =
            result.user_answer_index ??
            result.user_answer;

          return (
            <div
              key={result.id || index}
              className={`answer-card ${
                result.is_correct ? 'correct-card' : 'wrong-card'
              }`}
            >
              <div className="answer-header">
                <span className="q-badge">
                  Q{index + 1}
                </span>

                <span
                  className={`q-score ${
                    result.is_correct ? 'good' : 'low'
                  }`}
                >
                  {result.is_correct ? '✓ Correct' : '✗ Wrong'}
                </span>
              </div>

              <p className="a-question">
                {result.question}
              </p>

              <div className="ans-detail">
                <span>
                  Your answer:{' '}
                  <strong>
                    {getOptionText(options, userAnswer)}
                  </strong>
                </span>

                {!result.is_correct && (
                  <span style={{ color: 'var(--neon-green)' }}>
                    Correct:{' '}
                    <strong>
                      {getOptionText(options, correctAnswer)}
                    </strong>
                  </span>
                )}
              </div>

              <div className="a-feedback">
                {result.explanation}
              </div>
            </div>
          );
        })}
      </div>

      <div className="done-actions">
        <button className="btn-primary" onClick={reset}>
          🔄 New Assessment
        </button>

        <a href="/app/feedback" className="btn-secondary">
          📊 View Full Report
        </a>
      </div>
    </div>
  );
}
