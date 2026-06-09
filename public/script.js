document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000/api'; // Ensure this matches your Express server port

    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const showLoginLink = document.getElementById('show-login');
    const showSignupLink = document.getElementById('show-signup');
    
    // Helper function to show notifications (can be improved with better UI)
    const showMessage = (message, isSuccess = true) => {
        alert(message); // Using simple alert for brevity
        // In a real app, use a dedicated notification element
    };

    // --- Form Switching Logic ---
    function switchToLogin(event) {
        event.preventDefault(); 
        if (signupForm) signupForm.classList.remove('active');
        if (loginForm) loginForm.classList.add('active');
    }

    function switchToSignup(event) {
        event.preventDefault(); 
        if (loginForm) loginForm.classList.remove('active');
        if (signupForm) signupForm.classList.add('active');
    }

    if (showLoginLink) showLoginLink.addEventListener('click', switchToLogin);
    if (showSignupLink) showSignupLink.addEventListener('click', switchToSignup);

    // Toggle admin extra fields on role change
    const regRole = document.getElementById('reg-role');
    const adminExtra = document.getElementById('admin-extra');
    if (regRole && adminExtra) {
        regRole.addEventListener('change', () => {
            adminExtra.style.display = regRole.value === 'Admin' ? 'block' : 'none';
        });
    }

    // --- API Call: SIGNUP Handler ---
    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const roleSelect = document.getElementById('reg-role');
            const role = roleSelect ? roleSelect.value : 'Customer';
            const theatreName = document.getElementById('reg-theatre-name')?.value || '';
            const theatrePass = document.getElementById('reg-theatre-pass')?.value || '';
            
            // For simplicity, we'll use the email as the username for required field on the server
            const username = email.split('@')[0] || email; 

            if (password !== confirmPassword) {
                showMessage('Passwords do not match.', false);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role, theatreName: role === 'Admin' ? theatreName : undefined, theatrePass: role === 'Admin' ? theatrePass : undefined })
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(data.message, true);
                    // Successfully signed up, immediately switch to login form
                    switchToLogin(new Event('click'));
                } else {
                    showMessage(`Signup Failed: ${data.message}`, false);
                }

            } catch (error) {
                console.error('Network or Server Error during signup:', error);
                showMessage('An unexpected error occurred. Please try again later.', false);
            }
        });
    }

    // --- API Call: LOGIN Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const loginIdentifier = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // NOTE: Your backend API currently only checks for 'email' not 'username OR email'.
            // For now, we MUST pass the value as the 'email' field.
            // A robust backend would handle checking both.
            const email = loginIdentifier; 

            try {
                const response = await fetch(`${BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(`Welcome, ${data.user.username}! Login Successful.`, true);
                    
                    // Store user data in localStorage (Essential for subsequent pages)
                    localStorage.setItem('currentUser', JSON.stringify(data.user));

                    // Use role from backend to decide redirect (authoritative)
                    const userRole = (data.user && data.user.role) ? data.user.role : 'Customer';
                    if (userRole === 'Admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'interface.html';
                    }

                } else {
                    showMessage(`Login Failed: ${data.message}`, false);
                }

            } catch (error) {
                console.error('Network or Server Error during login:', error);
                showMessage('An unexpected error occurred. Please check your network.', false);
            }
        });
    }
});