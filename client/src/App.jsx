import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import AuthPage from './components/auth/AuthPages';
import ClientSignup from './components/auth/ClientSignup';
import VolunteerSignup from './components/auth/VolunteerSignup';
import ClientDashboard from './components/dashboard/ClientDashboard';
import VolunteerDashboard from './components/dashboard/VolunteerDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import LandingPage from './components/landing-page/LandingPage';
import VolunteerConfirmationPage from './components/dashboard/redirs/VolunteerConfirmationPage';
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
        await fetchVolunteerStatus(token);
      }

      // Ensure loader shows for at least 3 seconds
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 3000));
      await Promise.all([minLoadingTime]); // Wait for both actual load and minimum time
      setIsLoading(false);
    };

    const fetchVolunteerStatus = async (token) => {
      try {
        const response = await fetch(`${baseURL}/volunteers/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch volunteer status");
        }
        const data = await response.json();
        if (!data.status) {
          throw new Error("Volunteer status not found in response");
        }
        setVolunteerStatus(data.status);
      } catch (error) {
        console.error("Error fetching volunteer status:", error);
        setVolunteerStatus('unknown');
      }
    };

    checkLoginStatus();
  }, [baseURL]);

  const handleLoginSuccess = (token, role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    if (role === 'volunteer') {
      fetchVolunteerStatusAfterLogin(token);
    } else {
      redirectToDashboard(role);
    }
  };

  const fetchVolunteerStatusAfterLogin = async (token) => {
    try {
      const response = await fetch(`${baseURL}/volunteers/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch volunteer status after login");
      }
      const data = await response.json();
      setVolunteerStatus(data.status);
      redirectToDashboard('volunteer', data.status);
    } catch (error) {
      console.error("Error fetching volunteer status after login:", error);
      setVolunteerStatus('unknown');
      redirectToDashboard('volunteer', 'unknown');
    }
  };

  const redirectToDashboard = (role, status) => {
    if (role === 'client') {
      navigate("/client-dashboard");
    } else if (role === 'volunteer') {
      if (status === 'pending' || status === 'rejected') {
        navigate("/volunteer-confirmation");
      } else {
        navigate("/volunteer-dashboard");
      }
    } else if (role === 'admin') {
      navigate("/admin-dashboard");
    } else {
      navigate("/");
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
    if (isLoading) {
      return <DogLoader />; // Use DogLoader instead of plain text
    }
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <div>Not authorized (role).</div>;
    }
    if (volunteerStatuses && !volunteerStatuses.includes(volunteerStatus)) {
      return <div>Not authorized (status).</div>;
    }
    return element;
  };

  ProtectedRoute.propTypes = {
    element: PropTypes.element.isRequired,
    allowedRoles: PropTypes.arrayOf(PropTypes.string),
    volunteerStatuses: PropTypes.arrayOf(PropTypes.string),
  };

  if (isLoading) {
    return <DogLoader duration={4000} />; // Show loader for 4 seconds minimum
  }

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
        <Route path="/volunteer-confirmation" element={<ProtectedRoute allowedRoles={['volunteer']} volunteerStatuses={['pending', 'rejected']} element={<VolunteerConfirmationPage />} />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']} element={<AdminDashboard handleLogout={handleLogout} />} />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              userRole === 'client' ? <Navigate to="/client-dashboard" replace />
                : userRole === 'volunteer' ? (
                  volunteerStatus === 'pending' || volunteerStatus === 'rejected' ? <Navigate to="/volunteer-confirmation" replace /> : <Navigate to="/volunteer-dashboard" replace />
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