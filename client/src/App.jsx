import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import AuthPage from './components/auth/AuthPages';
import ClientSignup from './components/auth/ClientSignup';
import VolunteerSignup from './components/auth/VolunteerSignup';
import ClientDashboard from './components/dashboard/ClientDashboard';
import VolunteerDashboard from './components/dashboard/VolunteerDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import LandingPage from './components/landing-page/LandingPage';
import VolunteerPendingApproval from './components/dashboard/redirs/VolunteerPendingApproval';
import Donate from './components/dashboard/forms/Donate';
import Benefits from './components/landing-page/Benefits';
import ResetPasswordComponent from './components/auth/ResetPassword';
import DogLoader from './components/dashboard/recycled/DogLoader';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [volunteerStatus, setVolunteerStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const redirectToDashboard = useCallback((role, status = null) => {
    if (role === 'client') {
      navigate("/client-dashboard");
    } else if (role === 'volunteer') {
      if (status === 'pending') {
        navigate("/volunteer-pending");
      } else if (status === 'approved' || status === 'active') {
        navigate("/volunteer-dashboard");
      } else {
        navigate("/volunteer-pending"); // Default to pending if status is unknown
      }
    } else if (role === 'admin') {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchVolunteerData = useCallback(async (token) => {
    try {
      const statusResponse = await fetch(`${baseURL}/volunteers/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!statusResponse.ok) throw new Error("Failed to fetch volunteer status");
      const statusData = await statusResponse.json();
      setVolunteerStatus(statusData.status);
      redirectToDashboard('volunteer', statusData.status);
    } catch (error) {
      console.error("Error fetching volunteer data:", error);
      setVolunteerStatus('pending'); // Default to pending on error
      redirectToDashboard('volunteer', 'pending');
    }
  }, [baseURL, redirectToDashboard]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = Cookies.get('token');
      setIsLoggedIn(!!token);
      let decodedRole = null;

      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          decodedRole = decodedToken.role;
          setUserRole(decodedRole);
        } catch (error) {
          console.error("Error decoding token:", error);
          setUserRole(null);
          Cookies.remove('token');
          Cookies.remove('userId');
        }
      } else {
        setUserRole(null);
      }

      if (decodedRole === 'volunteer') {
        await fetchVolunteerData(token);
      } else if (decodedRole) {
        redirectToDashboard(decodedRole);
      }

      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 3000));
      await Promise.all([minLoadingTime]);
      setIsLoading(false);
    };

    checkLoginStatus();
  }, [baseURL, fetchVolunteerData, redirectToDashboard]);

  const handleLoginSuccess = (token, role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    Cookies.set('token', token, { expires: 7 });
    if (role === 'volunteer') {
      fetchVolunteerData(token);
    } else {
      redirectToDashboard(role);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('userId');
    setIsLoggedIn(false);
    setUserRole(null);
    setVolunteerStatus(null);
    navigate("/");
  };

  const ProtectedRoute = ({ element, allowedRoles, volunteerStatuses }) => {
    if (isLoading) return <DogLoader />;
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(userRole)) return <div>Not authorized (role).</div>;
    if (volunteerStatuses && !volunteerStatuses.includes(volunteerStatus)) return <div>Not authorized (status).</div>;
    return element;
  };

  ProtectedRoute.propTypes = {
    element: PropTypes.element.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
    volunteerStatuses: PropTypes.arrayOf(PropTypes.string),
  };

  if (isLoading) return <DogLoader duration={4000} />;

  return (
    <div>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<AuthPage onLoginSuccess={handleLoginSuccess} showLogin={true} />} />
        <Route path="/client-signup" element={<ClientSignup onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/volunteer-signup" element={<VolunteerSignup onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/reset-password/:token" element={<ResetPasswordComponent />} />
        <Route path="/client-dashboard" element={<ProtectedRoute allowedRoles={['client']} element={<ClientDashboard handleLogout={handleLogout} />} />} />
        <Route path="/volunteer-dashboard" element={<ProtectedRoute allowedRoles={['volunteer']} volunteerStatuses={['approved', 'active']} element={<VolunteerDashboard handleLogout={handleLogout} />} />} />
        <Route path="/volunteer-pending" element={<ProtectedRoute allowedRoles={['volunteer']} volunteerStatuses={['pending']} element={<VolunteerPendingApproval handleLogout={handleLogout} />} />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']} element={<AdminDashboard handleLogout={handleLogout} />} />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              userRole === 'client' ? <Navigate to="/client-dashboard" replace />
                : userRole === 'volunteer' ? (
                  volunteerStatus === 'pending' ? <Navigate to="/volunteer-pending" replace />
                    : volunteerStatus === 'approved' || volunteerStatus === 'active' ? <Navigate to="/volunteer-dashboard" replace />
                    : <Navigate to="/volunteer-pending" replace />
                )
                : userRole === 'admin' ? <Navigate to="/admin-dashboard" replace />
                  : <Navigate to="/" replace />
            ) : (
              <LandingPage />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;