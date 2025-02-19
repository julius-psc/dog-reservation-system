import { useState, useEffect } from 'react';
import Login from './Login';
import PropTypes from "prop-types";
import { useLocation } from 'react-router-dom';

const AuthPages = ({ onLoginSuccess, showLogin: initialShowLogin }) => {
    const [showLogin, setShowLogin] = useState(initialShowLogin);
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === '/login') {
            setShowLogin(true);
        }
    }, [location.pathname]);

    const handleSuccessfulLogin = (token, role) => {
        onLoginSuccess(token, role);
    };


    return (
        <div className="auth-page justify-center items-center h-screen">
            {showLogin && (
                <Login onLogin={handleSuccessfulLogin} />
            )}
        </div>
    );
};

AuthPages.propTypes = {
    onLoginSuccess: PropTypes.func.isRequired,
    showLogin: PropTypes.bool.isRequired,
};

export default AuthPages;