import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { EntrepreneurDashboard } from './pages/EntrepreneurDashboard';
import { JobSeekerDashboard } from './pages/JobSeekerDashboard';
import { InvestorDashboard } from './pages/InvestorDashboard';
import { StartupsPage } from './pages/StartupsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { FindPeoplePage } from './pages/FindPeoplePage';
import { MentorsPage } from './pages/MentorsPage';
import { AdminReportsPage } from './pages/AdminReportsPage';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Render role-protected or public page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} />;

      case 'login':
        return <AuthPage initialMode="login" setCurrentPage={setCurrentPage} />;

      case 'signup':
        return <AuthPage initialMode="signup" setCurrentPage={setCurrentPage} />;

      case 'startups':
        return <StartupsPage />;

      case 'opportunities':
        return <OpportunitiesPage />;

      case 'find-people':
        return <FindPeoplePage />;

      case 'mentors':
        return <MentorsPage />;

      case 'entrepreneur-dashboard':
        if (!user) return <AuthPage initialMode="login" setCurrentPage={setCurrentPage} />;
        return <EntrepreneurDashboard setCurrentPage={setCurrentPage} />;

      case 'jobseeker-dashboard':
        if (!user) return <AuthPage initialMode="login" setCurrentPage={setCurrentPage} />;
        return <JobSeekerDashboard setCurrentPage={setCurrentPage} />;

      case 'investor-dashboard':
        if (!user) return <AuthPage initialMode="login" setCurrentPage={setCurrentPage} />;
        return <InvestorDashboard setCurrentPage={setCurrentPage} />;

      case 'admin-reports':
        return <AdminReportsPage />;

      default:
        return <HomePage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF8] text-[#17211B] antialiased selection:bg-[#EAF7EF] selection:text-[#08663A]">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
