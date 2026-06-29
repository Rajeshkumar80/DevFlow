import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ReviewsListPage } from './components/review/ReviewsListPage';
import { ReviewDetailPage } from './components/review/ReviewDetailPage';
import { PairSessionPage } from './components/pair/PairSessionPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { LearningPage } from './components/learning/LearningPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { HelpSupportPage } from './components/help/HelpSupportPage';
import { IntegrationsPage } from './components/integrations/IntegrationsPage';
import { RulesPage } from './components/rules/RulesPage';
import { PersonasPage } from './components/personas/PersonasPage';
import { CostsPage } from './components/costs/CostsPage';
import { QualityPage } from './components/quality/QualityPage';
import { DependenciesPage } from './components/dependencies/DependenciesPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><AppLayout><ReviewsListPage /></AppLayout></ProtectedRoute>} />
      <Route path="/reviews/:reviewId" element={<ProtectedRoute><AppLayout><ReviewDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/pair" element={<ProtectedRoute><AppLayout><PairSessionPage /></AppLayout></ProtectedRoute>} />
      <Route path="/pair/:sessionId" element={<ProtectedRoute><AppLayout><PairSessionPage /></AppLayout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnalyticsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><AppLayout><LearningPage /></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><AppLayout><HelpSupportPage /></AppLayout></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><AppLayout><IntegrationsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/rules" element={<ProtectedRoute><AppLayout><RulesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/personas" element={<ProtectedRoute><AppLayout><PersonasPage /></AppLayout></ProtectedRoute>} />
      <Route path="/costs" element={<ProtectedRoute><AppLayout><CostsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/quality" element={<ProtectedRoute><AppLayout><QualityPage /></AppLayout></ProtectedRoute>} />
      <Route path="/dependencies" element={<ProtectedRoute><AppLayout><DependenciesPage /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
