import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './index.css';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ResumePage from './pages/ResumePage';
import InterviewPage from './pages/InterviewPage';
import AssessmentPage from './pages/AssessmentPage';
import FeedbackPage from './pages/FeedbackPage';
import JobsPage from './pages/JobsPage';
import LandingPage from './pages/LandingPage';

function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="grid-bg" />
        <div className="noise" />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="resume" element={<ResumePage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="interview" element={<InterviewPage />} />
            <Route path="assessment" element={<AssessmentPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
