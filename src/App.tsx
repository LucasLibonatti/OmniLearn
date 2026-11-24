import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth, useAuth } from './auth';
import { AppDataProvider } from './context/AppDataContext';
import { SettingsProvider } from './hooks/useSettings';
import { I18nProvider } from './i18n';
import { InAppShell } from './ui';
import { Spinner } from './components/states';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastHost } from './components/Toast';

const page = (mod: () => Promise<{ [k: string]: unknown }>, name: string) =>
  lazy(() => mod().then((m) => ({ default: m[name] as ComponentType })));

const Landing = page(() => import('./pages_public'), 'Landing');
const AuthPage = lazy(() => import('./AuthPage'));
const Session = lazy(() => import('./Session'));
const Guidelines = page(() => import('./pages_legal'), 'Guidelines');
const NotFound = page(() => import('./pages_legal'), 'NotFound');
const Support = page(() => import('./pages_support'), 'Support');

// Code-splitting por rota (cada tela baixa apenas o próprio bundle)
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Subjects = lazy(() => import('./pages/Subjects'));
const SubjectPage = lazy(() => import('./pages/SubjectPage'));
const NewSubject = lazy(() => import('./pages/NewSubject'));
const Configure = lazy(() => import('./pages/Configure'));
const Result = lazy(() => import('./pages/Result'));
const Review = lazy(() => import('./pages/Review'));
const Stats = lazy(() => import('./pages/Stats'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Profile = lazy(() => import('./pages/Profile'));
const Flashcards = lazy(() => import('./pages/Flashcards'));
const PrintSubject = lazy(() => import('./pages/PrintSubject'));

function MaybeShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <>{children}</>;
  return (
    <InAppShell.Provider value={true}>
      <Layout>{children}</Layout>
    </InAppShell.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <SettingsProvider>
          <AuthProvider>
            <AppDataProvider>
              <Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<AuthPage mode="login" />} />
                  <Route path="/cadastro" element={<AuthPage mode="signup" />} />
                  <Route
                    path="/diretrizes"
                    element={
                      <MaybeShell>
                        <Guidelines />
                      </MaybeShell>
                    }
                  />
                  <Route
                    path="/suporte"
                    element={
                      <MaybeShell>
                        <Support />
                      </MaybeShell>
                    }
                  />
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
              <ToastHost />
            </AppDataProvider>
          </AuthProvider>
        </SettingsProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
