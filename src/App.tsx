import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Inventory } from './pages/Inventory/Inventory';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Auth/Login';
import { WaitingRoom } from './pages/Auth/WaitingRoom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  
  if (loading || (user && !userData)) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-black font-serif">Loading...</div>;
  }
  
  if (user && userData?.role === 'Pending') {
    return <Navigate to="/waiting" />;
  }

  if (user && userData?.role === 'Client') {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/waiting" element={<WaitingRoom />} />
          
          <Route path="/" element={<Navigate to="/inventory" replace />} />
          <Route path="/inventory/*" element={
            <PrivateRoute>
              <Inventory />
            </PrivateRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
