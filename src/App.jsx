import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import FareTrends from './pages/FareTrends.jsx';

function isAuthed() {
  return typeof window !== 'undefined' && window.localStorage.getItem('airgain_auth') === '1';
}

function Protected({ children }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  return (
    <div className="app">
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/fare-trends" replace />} />
          <Route
            path="/fare-trends"
            element={
              <Protected>
                <FareTrends />
              </Protected>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  );
}


