import { lazy, Suspense, type ComponentType } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import { SettingsProvider } from './hooks/useSettings';
import { Spinner } from './components/states';

const page = (mod: () => Promise<{ [k: string]: unknown }>, name: string) =>
  lazy(() => mod().then((m) => ({ default: m[name] as ComponentType })));

const Landing = page(() => import('./pages_public'), 'Landing');
const AuthPage = lazy(() => import('./AuthPage'));
const Session = lazy(() => import('./Session'));
const Guidelines = page(() => import('./pages_legal'), 'Guidelines');
const NotFound = page(() => import('./pages_legal'), 'NotFound');
const Dashboard = page(() => import('./pages_app'), 'Dashboard');
const Layout = page(() => import('./pages_app'), 'Layout');
const Subjects = page(() => import('./pages_app'), 'Subjects');
const SubjectPage = page(() => import('./pages_app'), 'SubjectPage');
const NewSubject = page(() => import('./pages_app'), 'NewSubject');
const Configure = page(() => import('./pages_app'), 'Configure');
const Result = page(() => import('./pages_app'), 'Result');
const Review = page(() => import('./pages_app'), 'Review');
const Stats = page(() => import('./pages_app'), 'Stats');
const Achievements = page(() => import('./pages_app'), 'Achievements');
const Profile = page(() => import('./pages_app'), 'Profile');
const Flashcards = page(() => import('./pages_app'), 'Flashcards');
const PrintSubject = page(() => import('./pages_app'), 'PrintSubject');

function fallback() {
  return <Spinner />;
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Suspense fallback={fallback()}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/cadastro" element={<AuthPage mode="signup" />} />
            <Route path="/diretrizes" element={<Guidelines />} />
            <Route path="/sessao/:id" element={<RequireAuth><Session /></RequireAuth>} />
            <Route path="/materias/:id/imprimir" element={<RequireAuth><PrintSubject /></RequireAuth>} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/materias" element={<Subjects />} />
              <Route path="/materias/nova" element={<NewSubject />} />
              <Route path="/materias/:id" element={<SubjectPage />} />
              <Route path="/materias/:id/flashcards" element={<Flashcards />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/sessao/configurar/:subjectId" element={<Configure />} />
              <Route path="/resultado/:sessionId" element={<Result />} />
              <Route path="/revisao" element={<Review />} />
              <Route path="/estatisticas" element={<Stats />} />
              <Route path="/conquistas" element={<Achievements />} />
              <Route path="/perfil" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </SettingsProvider>
  );
}