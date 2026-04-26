import { Routes, Route, Navigate } from "react-router-dom";
import { AttendancePage } from "../pages/teacher/AttendancePage";
import { CommentsPage } from "../pages/teacher/CommentsPage";
import { PsychometricPage } from "../pages/teacher/PsychometricPage";
import ScoreEntryPage from "../pages/teacher/ScoreEntryPage";
import StudentsPage from "../pages/teacher/StudentsPage";
import { SubjectsPage } from "../pages/teacher/SubjectsPage";
import { SubmitResultsPage } from "../pages/teacher/SubmitResultsPage";
import { TeacherDashboard } from "../pages/teacher/TeacherDashboard";

export default function TeacherRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teacher/dashboard" />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="/teacher/students" element={<StudentsPage />} />
      <Route path="/teacher/subjects" element={<SubjectsPage />} />
      <Route path="/teacher/scores" element={<ScoreEntryPage />} />
      <Route path="/teacher/psychometric" element={<PsychometricPage />} />
      <Route path="/teacher/comments" element={<CommentsPage />} />
      <Route path="/teacher/attendance" element={<AttendancePage />} />
      <Route path="/teacher/submit" element={<SubmitResultsPage />} />
    </Routes>
  );
}
