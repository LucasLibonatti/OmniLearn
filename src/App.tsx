import { Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages_public';
import AuthPage from './AuthPage';
import { AuthProvider, RequireAuth } from './auth';
import Session from './Session';
import { Layout, Dashboard, Subjects, SubjectPage, NewSubject, Configure, Result, Review, Stats, Achievements, Profile } from './pages_app';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/cadastro" element={<AuthPage mode="signup" />} />
        <Route path="/sessao/:id" element={<RequireAuth><Session /></RequireAuth>} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/materias" element={<Subjects />} />
          <Route path="/materias/nova" element={<NewSubject />} />
          <Route path="/materias/:id" element={<SubjectPage />} />
          <Route path="/sessao/configurar/:subjectId" element={<Configure />} />
          <Route path="/resultado/:sessionId" element={<Result />} />
          <Route path="/revisao" element={<Review />} />
          <Route path="/estatisticas" element={<Stats />} />
          <Route path="/conquistas" element={<Achievements />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}
