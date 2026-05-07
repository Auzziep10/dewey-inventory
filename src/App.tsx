import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Inventory } from './pages/Inventory/Inventory';
import { InventoryScan } from './pages/Inventory/InventoryScan';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Auth/Login';
import { WaitingRoom } from './pages/Auth/WaitingRoom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();
  
  if (loading || (user && !userData)) {
    return <div className="min-h-screen flex items-center justify-center bg-[#070605] text-white font-serif">Loading...</div>;
  }
  
  if (user && userData?.role === 'Pending') {
    return <Navigate to="/waiting" />;
  }

  if (user && userData?.role === 'Client') {
    return <Navigate to="/login" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/waiting" element={<WaitingRoom />} />
            
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory/scan" element={
              <PrivateRoute>
                <InventoryScan />
              </PrivateRoute>
            } />
            <Route path="/inventory/*" element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            } />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
