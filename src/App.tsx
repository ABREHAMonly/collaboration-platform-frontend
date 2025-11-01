import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import CreateWorkspace from './pages/CreateWorkspace';
import WorkspaceDetail from './pages/WorkspaceDetail';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import AdminPanel from './pages/AdminPanel';
import AIDashboard from './pages/AIDashboard';

// Components
import Layout from './components/Layout';

// Hooks
import { AuthProvider, useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; admin?: boolean }> = ({ children, admin = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (admin && user.globalStatus !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// New component that uses useAuth after AuthProvider
const AppContent: React.FC = () => {

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        
        
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/workspaces" element={
            <ProtectedRoute>
              <Layout>
                <Workspaces />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/workspaces/create" element={
            <ProtectedRoute>
              <Layout>
                <CreateWorkspace />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/workspaces/:id" element={
            <ProtectedRoute>
              <Layout>
                <WorkspaceDetail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Layout>
                <Projects />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Layout>
                <Tasks />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/ai-dashboard" element={
            <ProtectedRoute>
              <Layout>
                <AIDashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute admin>
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent /> {/* Now useAuth works here */}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;