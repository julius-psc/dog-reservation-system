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
import VolunteerPendingApproval from './components/dashboard/redirs/VolunteerPendingApproval'; // New import
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
  const [hasSubmittedDocuments, setHasSubmittedDocuments] = useState(null); // New state
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
        await fetchVolunteerData(token);
      }

      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 3000));
      await Promise.all([minLoadingTime]);
      setIsLoading(false);
    };

    const fetchVolunteerData = async (token) => {
      try {
        // Fetch volunteer status
        const statusResponse = await fetch(`${baseURL}/volunteers/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!statusResponse.ok) throw new Error("Failed to fetch volunteer status");
        const statusData = await statusResponse.json();
        setVolunteerStatus(statusData.status);

        // Fetch documents status
        const documentsResponse = await fetch(`${baseURL}/volunteer/documents-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!documentsResponse.ok) throw new Error("Failed to fetch documents status");
        const documentsData = await documentsResponse.json();
        setHasSubmittedDocuments(documentsData.hasSubmittedDocuments);
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
        setVolunteerStatus('unknown');
        setHasSubmittedDocuments(null);
      }
    };

    checkLoginStatus();
  }, [baseURL]);

  const handleLoginSuccess = (token, role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    if (role === 'volunteer') {
      fetchVolunteerDataAfterLogin(token);
    } else {
      redirectToDashboard(role);
    }
  };

  const fetchVolunteerDataAfterLogin = async (token) => {
    try {
      const statusResponse = await fetch(`${baseURL}/volunteers/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!statusResponse.ok) throw new Error("Failed to fetch volunteer status");
      const statusData = await statusResponse.json();
      setVolunteerStatus(statusData.status);

      const documentsResponse = await fetch(`${baseURL}/volunteer/documents-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!documentsResponse.ok) throw new Error("Failed to fetch documents status");
      const documentsData = await documentsResponse.json();
      setHasSubmittedDocuments(documentsData.hasSubmittedDocuments);

      redirectToDashboard('volunteer', statusData.status, documentsData.hasSubmittedDocuments);
    } catch (error) {
      console.error("Error fetching volunteer data after login:", error);
      setVolunteerStatus('unknown');
      setHasSubmittedDocuments(null);
      redirectToDashboard('volunteer', 'unknown', null);
    }
  };

  const redirectToDashboard = (role, status, hasDocs) => {
    if (role === 'client') {
      navigate("/client-dashboard");
    } else if (role === 'volunteer') {
      if (!hasDocs) {
        navigate("/volunteer-confirmation"); // No documents submitted yet
      } else if (status === 'pending') {
        navigate("/volunteer-pending"); // Documents submitted, awaiting approval
      } else if (status === 'approved' || status === 'active') {
        navigate("/volunteer-dashboard");
      } else {
        navigate("/volunteer-confirmation"); // Rejected or unknown status
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
    setHasSubmittedDocuments(null);
    navigate("/");
  };

  const ProtectedRoute = ({ element, allowedRoles, volunteerStatuses }) => {
    if (isLoading) {
      return <DogLoader />;
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
    return <DogLoader duration={4000} />;
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
                  hasSubmittedDocuments === null ? <Navigate to="/volunteer-confirmation" replace />
                  : !hasSubmittedDocuments ? <Navigate to="/volunteer-confirmation" replace />
                  : volunteerStatus === 'pending' ? <Navigate to="/volunteer-pending" replace />
                  : volunteerStatus === 'approved' || volunteerStatus === 'active' ? <Navigate to="/volunteer-dashboard" replace />
                  : <Navigate to="/volunteer-confirmation" replace />
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