
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import ScoreRing from '../components/ScoreRing';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

/* -------------------------------------------------------
   AVATAR
   Animated portrait with speaking, listening, thinking
   and greeting expressions.
------------------------------------------------------- */

function InterviewAvatar({ state }) {
  return (
    <>
      <style>{`
        .nh-avatar {
          position: relative;
          width: 100%;
          max-width: 440px;
          aspect-ratio: 4 / 3;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 18px;
          background: #172033;
          isolation: isolate;
        }

        .nh-avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
          display: block;
          transition: filter .4s ease;
          transform-origin: 50% 45%;
        }

        /* Subtle head/body movement */
        .nh-speaking .nh-avatar-image {
          animation: nhHeadSpeak 3s ease-in-out infinite;
        }

        .nh-listening .nh-avatar-image {
          animation: nhHeadListen 5s ease-in-out infinite;
        }

        .nh-thinking .nh-avatar-image {
          animation: nhHeadThink 3s ease-in-out infinite;
          filter: saturate(.94);
        }

        .nh-greeting .nh-avatar-image {
          animation: nhGreeting 2.5s ease-in-out infinite;
          filter: brightness(1.04);
        }

        /* Eye blinking overlay - adjust position for your portrait */
        .nh-eyes {
          position: absolute;
          top: 31%;
          left: 29%;
          width: 42%;
          height: 12%;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
          z-index: 2;
        }

        .nh-eyelid {
          width: 42%;
          height: 0;
          border-radius: 50%;
          background: rgba(91, 57, 48, .88);
          opacity: 0;
          transform-origin: center;
        }

        .nh-listening .nh-eyelid,
        .nh-thinking .nh-eyelid,
        .nh-idle .nh-eyelid {
          animation: nhBlink 5s infinite;
        }

        .nh-eyelid:nth-child(2) {
          animation-delay: .04s;
        }

        .nh-greeting .nh-eyelid {
          animation: nhBlink 4s infinite;
        }

        /* Mouth overlay */
        .nh-mouth {
          position: absolute;
          top: 65%;
          left: 50%;
          width: 7%;
          height: 2%;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(75, 20, 29, .75);
          opacity: .12;
          z-index: 3;
          pointer-events: none;
          transition: all .12s ease;
        }

        .nh-speaking .nh-mouth {
          opacity: .9;
          animation: nhMouthSpeak .22s infinite alternate;
        }

        .nh-greeting .nh-mouth {
          width: 13%;
          height: 4%;
          top: 64%;
          opacity: .5;
          border-radius: 0 0 50% 50%;
          animation: nhSmile 1.8s ease-in-out infinite;
        }

        .nh-thinking .nh-mouth {
          width: 5%;
          height: 1%;
          opacity: .3;
        }

        .nh-avatar-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          box-shadow: inset 0 -50px 60px rgba(0,0,0,.18);
        }

        .nh-avatar-disclosure {
          position: absolute;
          bottom: 12px;
          left: 12px;
          z-index: 4;
          color: white;
          background: rgba(0,0,0,.55);
          padding: 7px 12px;
          border-radius: 20px;
          font-size: 11px;
          backdrop-filter: blur(5px);
        }

        .nh-avatar-expression {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 4;
          padding: 6px 11px;
          color: white;
          background: rgba(0,0,0,.48);
          border-radius: 20px;
          font-size: 11px;
          text-transform: capitalize;
        }

        @keyframes nhBlink {
          0%, 43%, 47%, 100% {
            height: 0;
            opacity: 0;
          }
          45% {
            height: 75%;
            opacity: .85;
          }
        }

        @keyframes nhMouthSpeak {
          from {
            height: 2%;
            width: 5%;
            transform: translateX(-50%) scaleY(.6);
          }
          to {
            height: 5%;
            width: 8%;
            transform: translateX(-50%) scaleY(1.2);
          }
        }

        @keyframes nhSmile {
          0%, 100% { transform: translateX(-50%) scaleX(1); }
          50% { transform: translateX(-50%) scaleX(1.2); }
        }

        @keyframes nhHeadSpeak {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-2px) rotate(.3deg); }
        }

        @keyframes nhHeadListen {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-1px) rotate(-.35deg); }
        }

        @keyframes nhHeadThink {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-2px) rotate(1deg); }
        }

        @keyframes nhGreeting {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1.01); }
        }

        @media (prefers-reduced-motion: reduce) {
          .nh-avatar *,
          .nh-avatar-image {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className={`nh-avatar nh-${state}`}
        role="img"
        aria-label={`NexHire virtual interviewer, ${state}`}
      >
        <img
          className="nh-avatar-image"
          src="/assets/nexushire-interviewer.jpg"
          alt="NexHire virtual interviewer"
        />

        <div className="nh-eyes">
          <span className="nh-eyelid" />
          <span className="nh-eyelid" />
        </div>

        <div className="nh-mouth" />
        <div className="nh-avatar-glow" />

        <div className="nh-avatar-expression">{state}</div>
        <div className="nh-avatar-disclosure">
          NexHire virtual interviewer
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------
   MAIN INTERVIEW PAGE
------------------------------------------------------- */

export default function InterviewPage() {
  const [phase, setPhase] = useState('setup');
  const [role, setRole] = useState('Software Developer');
  const [candidateName, setCandidateName] = useState(
    localStorage.getItem('name') || ''
  );
  const [skills, setSkills] = useState(
    'Python, JavaScript, React, Flask, MongoDB'
  );
  const [jobDescription, setJobDescription] = useState('');
  const [useSavedResume, setUseSavedResume] = useState(false);
  const [kind, setKind] = useState('technical');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [count, setCount] = useState(5);
  const [duration, setDuration] = useState(20);

  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [total, setTotal] = useState(5);

  const [answer, setAnswer] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [greeting, setGreeting] = useState(false);

  const [captions, setCaptions] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const phaseRef = useRef(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'interview' || !streamRef.current || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    const playVideo = () => video.play().catch(() => {});

    if (video.readyState >= 1) {
      playVideo();
    } else {
      video.onloadedmetadata = playVideo;
    }

    return () => {
      video.onloadedmetadata = null;
    };
  }, [phase, cameraOn]);

  /* Stop camera, microphone, speech and timer */

  const stopMedia = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCameraOn(false);
    setMicPermission(false);
    setListening(false);
    setSpeaking(false);
    setGreeting(false);
  }, []);

  useEffect(() => {
    return () => stopMedia();
  }, [stopMedia]);

  /* -------------------------------------------------------
     INDIAN ENGLISH VOICE
     Prefer an available en-IN voice.
  ------------------------------------------------------- */

  const speak = useCallback((text, isGreeting = false) =>
    new Promise(resolve => {
      if (!text || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = 'en-IN';
      utterance.rate = 0.92;
      utterance.pitch = isGreeting ? 1.08 : 1.0;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();

      const indianVoice = voices.find(voice =>
        voice.lang.toLowerCase() === 'en-in'
      );

      const indianEnglishVoice = voices.find(voice =>
        voice.lang.toLowerCase().startsWith('en-in')
      );

      const fallbackVoice = voices.find(voice =>
        voice.lang.toLowerCase().startsWith('en-gb')
      );

      utterance.voice =
        indianVoice || indianEnglishVoice || fallbackVoice || null;

      utterance.onstart = () => {
        setSpeaking(true);
        setGreeting(isGreeting);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setGreeting(false);
        resolve();
      };

      utterance.onerror = () => {
        setSpeaking(false);
        setGreeting(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    }), []);

  /* Request camera and microphone */

  const requestDevices = async () => {
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Camera and microphone access requires localhost or HTTPS and a supported browser.'
      );
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
      setMicPermission(true);
      setMuted(false);

      return true;
    } catch (e) {
      setError(
        e.name === 'NotAllowedError'
          ? 'Camera or microphone permission was denied. Allow access in your browser settings and try again.'
          : 'Could not access the selected camera or microphone. Check that the devices are connected and not being used by another app.'
      );

      return false;
    }
  };

  /* Start interview and automatically speak greeting + question */

  const startSession = async () => {
    setBusy(true);
    setError('');

    try {
      const allowed = await requestDevices();
      if (!allowed) return;

      const data = await api.startVideoInterview({
        candidate_name: candidateName,
        role,
        skills: useSavedResume
          ? []
          : skills.split(',').map(s => s.trim()).filter(Boolean),
        interview_type: kind,
        difficulty,
        question_count: Number(count),
        duration_minutes: Number(duration),
        job_description: jobDescription
      });

      setSession({ id: data.session_id });
      setQuestion(data.question);
      setQuestionIndex(0);
      setTotal(data.total_questions);

      setTranscript([]);
      setReport(null);
      setAnswer('');
      setFollowUp(false);
      setElapsed(0);
      setPhase('interview');

      timerRef.current = setInterval(() => {
        setElapsed(v => v + 1);
      }, 1000);

      const greetingText =
        `Hello ${data.candidate_name || 'there'}! ` +
        'Welcome to your NexHire interview. ' +
        'I am Alex, your virtual interviewer. ' +
        'I am happy to meet you today. Let us begin.';

      setTranscript([
        {
          speaker: 'Alex · Virtual interviewer',
          text: `${greetingText} ${data.question}`
        }
      ]);

      setGreeting(true);

      await speak(
        `${greetingText} First question. ${data.question}`,
        true
      );
    } catch (e) {
      stopMedia();
      setError(e.message || 'Unable to start the interview.');
    } finally {
      setBusy(false);
    }
  };

  /* Candidate speech recognition */

  const startListening = () => {
    if (muted) {
      setError('Unmute your microphone before speaking.');
      return;
    }

    if (!micPermission || !streamRef.current) {
      setError('Enable microphone permission first.');
      return;
    }

    if (!SpeechRecognition) {
      setError(
        'Speech recognition is unavailable in this browser. Type your answer in the transcript box; the interview still works.'
      );
      return;
    }

    try {
      const rec = new SpeechRecognition();

      rec.lang = 'en-IN';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = ev => {
        let finalText = '';
        let interim = '';

        for (let i = 0; i < ev.results.length; i++) {
          const text = ev.results[i][0].transcript;

          if (ev.results[i].isFinal) {
            finalText += text + ' ';
          } else {
            interim += text;
          }
        }

        if (finalText) {
          setAnswer(prev => (prev + ' ' + finalText).trim());
        }

        setLiveText(interim);
      };

      rec.onerror = ev => {
        setError(
          `Speech recognition issue (${ev.error}). You can continue by typing your answer.`
        );
      };

      rec.onend = () => {
        setListening(false);
        setLiveText('');
      };

      recognitionRef.current = rec;
      rec.start();

      setListening(true);
      setError('');
    } catch (_) {
      setError('Could not start speech recognition. Please type your answer.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    setListening(false);
  };

  /* Finish interview */

  const finishInterview = async () => {
    stopMedia();

    try {
      const result = await api.endVideoInterview(session.id);
      setReport(result);
      setPhase('done');
    } catch (e) {
      setError(e.message || 'Could not save the report.');
      setPhase('done');
    }
  };

  /* Submit candidate answer and speak the next question */

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please speak or type your answer before continuing.');
      return;
    }

    if (listening) {
      stopListening();
    }

    setBusy(true);
    setError('');

    try {
      const text = answer.trim();

      const result = await api.submitVideoAnswer(
        session.id,
        questionIndex,
        text,
        followUp
      );

      const nextSpokenText =
        result.follow_up_question ||
        result.next_question ||
        'Thank you. That completes this part of the interview.';

      setTranscript(prev => [
        ...prev,
        { speaker: 'You', text },
        {
          speaker: 'Alex · Virtual interviewer',
          text: nextSpokenText
        }
      ]);

      setAnswer('');
      setLiveText('');

      if (result.awaiting_followup && result.follow_up_question) {
        setFollowUp(true);
        setQuestion(result.follow_up_question);

        await speak(
          `Thank you for your answer. I have one follow-up question. ${result.follow_up_question}`
        );
      } else if (result.has_next) {
        setFollowUp(false);
        setQuestionIndex(result.next_question_index);
        setQuestion(result.next_question);

        await speak(
          `Thank you for your answer. Let us move on to the next question. ${result.next_question}`
        );
      } else {
        await finishInterview();
      }
    } catch (e) {
      setError(e.message || 'Could not submit this answer.');
    } finally {
      setBusy(false);
    }
  };

  const endEarly = async () => {
    if (
      !window.confirm(
        'End this interview now and save the answers collected so far?'
      )
    ) {
      return;
    }

    setBusy(true);
    await finishInterview();
    setBusy(false);
  };

  const toggleMute = () => {
    const next = !muted;

    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !next;
      });
    }

    if (next && listening) {
      stopListening();
    }

    setMuted(next);
  };

  const toggleCamera = async () => {
    if (cameraOn && streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.stop());

      setCameraOn(false);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        if (streamRef.current) {
          stream.getVideoTracks().forEach(track => {
            streamRef.current.addTrack(track);
          });
        } else {
          streamRef.current = stream;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }

        setCameraOn(true);
        setError('');
      } catch (_) {
        setError(
          'Unable to turn the camera on. Check browser permission and device connection.'
        );
      }
    }
  };

  const repeatQuestion = () => {
    if (question) {
      speak(question);
    }
  };

  const time =
    `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:` +
    `${String(elapsed % 60).padStart(2, '0')}`;

  const avatarState = greeting
    ? 'greeting'
    : speaking
      ? 'speaking'
      : busy
        ? 'thinking'
        : listening
          ? 'listening'
          : 'idle';

  /* -------------------------------------------------------
     SETUP SCREEN
  ------------------------------------------------------- */

  if (phase === 'setup') {
    return (
      <div className="page nh-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">
              NexHire · Phase 3 Video Interview
            </h1>
            <p className="page-sub">
              A local-first face-to-face interview room. Camera video stays
              in your browser; no video is recorded or uploaded.
            </p>
          </div>
        </div>

        <div className="setup-card nh-setup">
          <div>
            <span className="badge badge-blue">Local AI · No API keys</span>
            <h2>Prepare your interview</h2>
            <p className="page-sub">
              Your browser will request camera and microphone access only
              after you press “Check devices & start”.
            </p>
          </div>

          <div className="nh-form-grid">
            <div className="field-group">
              <label>Candidate name</label>
              <input
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="field-group">
              <label>Target job role</label>
              <input
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Interview type</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value)}
              >
                <option value="technical">Technical</option>
                <option value="hr">HR / Behavioural</option>
                <option value="mixed">Mixed</option>
                <option value="scenario">Scenario-based</option>
              </select>
            </div>

            <div className="field-group">
              <label>Experience level</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="beginner">Fresher / Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Experienced / Advanced</option>
              </select>
            </div>

            <div className="field-group">
              <label>Skills (comma-separated)</label>
              <input
                value={skills}
                onChange={e => setSkills(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Job description (optional)</label>
              <textarea
                rows="3"
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste role responsibilities or required skills…"
              />
            </div>

            <label className="nh-resume-choice">
              <input
                type="checkbox"
                checked={useSavedResume}
                onChange={e => setUseSavedResume(e.target.checked)}
              />
              Use skills extracted from my saved NexHire resume instead
              of the skills above
            </label>

            <div className="field-group">
              <label>Number of questions (3–15)</label>
              <input
                type="number"
                min="3"
                max="15"
                value={count}
                onChange={e =>
                  setCount(
                    Math.max(3, Math.min(15, Number(e.target.value) || 3))
                  )
                }
              />
            </div>

            <div className="field-group">
              <label>Duration (minutes)</label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
              >
                <option value={10}>10 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>
          </div>

          <div className="nh-consent">
            <b>Before you continue</b>
            <ul>
              <li>
                Camera and microphone permission are requested only after
                your click.
              </li>
              <li>
                Live camera preview stays on this device and is not stored
                or transmitted to Flask.
              </li>
              <li>
                Speech recognition uses your browser's built-in engine
                when available; browser vendors may process recognition
                remotely. Use typed answers if you require fully offline
                speech.
              </li>
              <li>
                Only interview answers/transcripts and the practice report
                are saved in your NexHire MongoDB account.
              </li>
            </ul>

            <label>
              <input
                type="checkbox"
                checked={captions}
                onChange={e => setCaptions(e.target.checked)}
              />
              Show captions during the interview
            </label>
          </div>

          <button
            className="btn-primary"
            disabled={busy}
            onClick={startSession}
          >
            {busy ? 'Checking devices…' : 'Check devices & start interview'}
          </button>

          {error && (
            <div className="auth-error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     REPORT SCREEN
  ------------------------------------------------------- */

  if (phase === 'done') {
    return (
      <div className="page nh-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Interview report</h1>
            <p className="page-sub">
              Your practice report is saved to your authenticated NexHire
              account.
            </p>
          </div>
        </div>

        {report ? (
          <>
            <div className="setup-card nh-report-top">
              <ScoreRing
                score={report.overall_score || 0}
                size={142}
                label="Practice score"
              />

              <div>
                <h2>
                  {report.overall_score}/100 · {report.role}
                </h2>
                <p>{report.summary}</p>
                <p className="page-sub">
                  {report.answered_count} answers · {report.interview_type}
                  {' · '}
                  {report.difficulty}
                </p>
              </div>
            </div>

            <div className="setup-card">
              <h3>Strengths / concepts covered</h3>
              <p>
                {report.strengths?.length
                  ? report.strengths.join(' · ')
                  : 'Keep practising core concepts and add examples.'}
              </p>

              <h3>Suggested practice topics</h3>
              <p>
                {report.practice_topics?.length
                  ? report.practice_topics.join(' · ')
                  : 'Use structured explanations, examples and trade-off analysis.'}
              </p>

              <p className="page-sub">{report.scoring_notice}</p>
            </div>

            {report.answers?.map((a, i) => (
              <div className="setup-card nh-answer-report" key={i}>
                <b>{a.question}</b>
                <p>{a.answer}</p>
                <b>Score: {a.evaluation?.score ?? 0}/100</b>
                <p>{a.evaluation?.feedback}</p>
              </div>
            ))}
          </>
        ) : (
          <div className="setup-card">
            The interview ended, but the report could not be retrieved.
            {' '}
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 18 }}
          onClick={() => {
            setPhase('setup');
            setReport(null);
            setTranscript([]);
            setError('');
          }}
        >
          Start another interview
        </button>
      </div>
    );
  }

  /* -------------------------------------------------------
     LIVE INTERVIEW SCREEN
  ------------------------------------------------------- */

  return (
    <div className="page nh-page">
      <div className="nh-room-header">
        <div>
          <span className="badge badge-blue">
            {kind.toUpperCase()} INTERVIEW
          </span>

          <h1>{role}</h1>

          <p>
            Question {Math.min(questionIndex + 1, total)} of {total}
            {followUp ? ' · Follow-up' : ''}
          </p>
        </div>

        <div className="nh-progress-wrap">
          <b>{time}</b>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${
                  Math.round(
                    (questionIndex / Math.max(total, 1)) * 100
                  )
                }%`
              }}
            />
          </div>
        </div>

        <button
          className="btn-secondary"
          onClick={endEarly}
          disabled={busy}
        >
          End interview
        </button>
      </div>

      <div className="nh-room-grid">
        {/* AI INTERVIEWER */}

        <div className="setup-card nh-video-card">
          <div className="nh-card-title">
            <span>AI INTERVIEWER</span>

            <span className={`nh-state nh-state-${avatarState}`}>
              {avatarState === 'speaking'
                ? 'Speaking'
                : avatarState === 'greeting'
                  ? 'Greeting'
                  : avatarState === 'listening'
                    ? 'Listening'
                    : avatarState === 'thinking'
                      ? 'Thinking'
                      : 'Ready'}
            </span>
          </div>

          <InterviewAvatar state={avatarState} />

          <div className="nh-question">
            <small>
              {followUp
                ? 'CONTEXTUAL FOLLOW-UP'
                : 'CURRENT QUESTION'}
            </small>

            <p>{question}</p>

            {captions && (
              <button
                className="btn-secondary"
                onClick={repeatQuestion}
              >
                ↻ Repeat question
              </button>
            )}
          </div>
        </div>

        {/* CANDIDATE CAMERA */}

        <div className="setup-card nh-video-card">
          <div className="nh-card-title">
            <span>YOUR CAMERA</span>

            <span className={cameraOn ? 'nh-online' : 'nh-offline'}>
              {cameraOn ? '● Camera on' : '○ Camera off'}
            </span>
          </div>

          <div className="nh-candidate-video">
            <video ref={videoRef} autoPlay muted playsInline />

            {!cameraOn && (
              <div className="nh-camera-placeholder">
                <span>▣</span>
                <b>Camera is off</b>
                <small>Your video is not being recorded</small>
              </div>
            )}
          </div>

          <div className="nh-device-line">
            <span>
              {micPermission
                ? muted
                  ? 'Mic muted'
                  : 'Mic permission on'
                : 'Mic unavailable'}
            </span>

            <span>Video stays on this device</span>
          </div>
        </div>

        {/* TRANSCRIPT */}

        <div className="setup-card nh-transcript">
          <div className="nh-card-title">
            <span>CONVERSATION TRANSCRIPT</span>
            <span>{transcript.length} messages</span>
          </div>

          <div className="nh-transcript-list">
            {transcript.map((message, i) => (
              <div
                className={`nh-message ${
                  message.speaker === 'You' ? 'nh-message-you' : ''
                }`}
                key={i}
              >
                <b>{message.speaker}</b>
                <p>{message.text}</p>
              </div>
            ))}

            {liveText && (
              <div className="nh-message nh-message-you">
                <b>Live transcription…</b>
                <p>{liveText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ANSWER AREA */}

      <div className="setup-card nh-answer-card">
        <div className="nh-card-title">
          <span>
            {listening
              ? 'LISTENING TO YOUR ANSWER'
              : busy
                ? 'PROCESSING ANSWER'
                : 'YOUR RESPONSE'}
          </span>

          <span>
            {listening ? '● Microphone active' : 'Speak or type'}
          </span>
        </div>

        <textarea
          rows="4"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Your recognized speech appears here. You can edit it or type your answer…"
          disabled={busy}
        />

        <div className="nh-controls">
          <button
            className="btn-secondary"
            onClick={listening ? stopListening : startListening}
            disabled={busy || muted}
          >
            {listening ? '■ Stop speaking' : '🎙 Start speaking'}
          </button>

          <button
            className="btn-secondary"
            onClick={toggleMute}
            disabled={!micPermission}
          >
            {muted ? 'Unmute mic' : 'Mute mic'}
          </button>

          <button
            className="btn-secondary"
            onClick={toggleCamera}
          >
            {cameraOn ? 'Turn camera off' : 'Turn camera on'}
          </button>

          <button
            className="btn-secondary"
            onClick={repeatQuestion}
          >
            ↻ Repeat
          </button>

          <button
            className="btn-primary"
            onClick={submitAnswer}
            disabled={busy || !answer.trim()}
          >
            {busy
              ? 'Evaluating…'
              : followUp
                ? 'Submit follow-up'
                : 'Submit answer'}
          </button>
        </div>

        {error && (
          <div className="auth-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <p className="nh-footnote">
          Local answer evaluation uses the existing keyword and TF-IDF
          rubric. It is a practice aid, not an automated hiring decision.
          No facial, emotion, accent or eye-contact scoring is performed.
        </p>
      </div>
    </div>
  );
}
