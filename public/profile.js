document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const navLinks = document.querySelectorAll('.profile-nav a');
    const sections = document.querySelectorAll('.content-section');
    const settingsForm = document.querySelector('.settings-form');

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.username) {
        alert('Please log in to view your profile.');
        window.location.href = 'index.html';
        return;
    }

    // Load user profile data
    loadUserProfile();
    loadBookingHistory();
    
    // Refresh user data if email is missing
    refreshUserDataIfNeeded();

    // Function to handle sidebar navigation
    function navigateToSection(event) {
        if (event.target.classList.contains('logout-link')) {
            // Clear user data and redirect
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }
        
        event.preventDefault();
        
        const targetId = event.target.getAttribute('href').substring(1);

        // 1. Update active class on nav links
        navLinks.forEach(link => link.classList.remove('active'));
        event.target.classList.add('active');

        // 2. Show the target section and hide others
        sections.forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // Attach click listeners to all navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', navigateToSection);
    });
    
    // Refresh user data if email is missing
    async function refreshUserDataIfNeeded() {
        if (!currentUser.email) {
            try {
                // Try to get fresh user data from server
                const response = await fetch(`${BASE_URL}/user/${encodeURIComponent(currentUser.username)}`);
                const data = await response.json();
                
                if (data.success && data.user) {
                    // Update localStorage with fresh user data
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    // Reload the page to show updated data
                    window.location.reload();
                } else {
                    console.log('Could not fetch user details from server.');
                }
            } catch (error) {
                console.log('Could not refresh user data automatically.');
            }
        }
    }

    // Load user profile information
    function loadUserProfile() {
        // Update user details in sidebar
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');

        if (userAvatar) {
            userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
        }
        if (userName) {
            userName.textContent = currentUser.username;
        }
        if (userEmail) {
            userEmail.textContent = currentUser.email || 'Loading email...';
        }
        if (usernameInput) {
            usernameInput.value = currentUser.username;
        }
        if (emailInput) {
            emailInput.value = currentUser.email || '';
        }
    }

    // Load booking history and statistics
    async function loadBookingHistory() {
        try {
            // Fetch user-specific bookings
            const response = await fetch(`${BASE_URL}/bookings?userId=${encodeURIComponent(currentUser.username)}`);
            const data = await response.json();
            
            if (data.success) {
                const bookings = data.bookings || [];
                displayBookingStats(bookings);
                displayRecentBookings(bookings);
                displayBookingHistory(bookings);
            } else {
                console.error('Failed to load bookings:', data.message);
                showNoBookings();
            }
        } catch (error) {
            console.error('Error loading booking history:', error);
            showNoBookings();
        }
    }

    // Display booking statistics
    function displayBookingStats(bookings) {
        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum, booking) => sum + (parseFloat(booking.totalPrice) || 0), 0);
        const recentBookings = bookings.filter(booking => {
            const bookingDate = new Date(booking.bookingDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return bookingDate >= thirtyDaysAgo;
        }).length;

        const totalBookingsEl = document.getElementById('total-bookings');
        const totalSpentEl = document.getElementById('total-spent');
        const recentBookingsEl = document.getElementById('recent-bookings');

        if (totalBookingsEl) totalBookingsEl.textContent = totalBookings;
        if (totalSpentEl) totalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;
        if (recentBookingsEl) recentBookingsEl.textContent = recentBookings;
    }

    // Display recent bookings in dashboard
    function displayRecentBookings(bookings) {
        const recentBookingsList = document.getElementById('recent-bookings-list');
        if (!recentBookingsList) return;

        const recentBookings = bookings
            .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
            .slice(0, 3);

        if (recentBookings.length === 0) {
            recentBookingsList.innerHTML = '<p>No recent bookings found.</p>';
            return;
        }

        recentBookingsList.innerHTML = recentBookings.map(booking => `
            <div class="ticket-summary">
                <div class="ticket-info">
                    <h4>${booking.movieTitle}</h4>
                    <p>${new Date(booking.bookingDate).toLocaleDateString()} | ${booking.showtime}</p>
                    <p class="seats">Seats: ${booking.seats.join(', ')}</p>
                    <p class="status">Status: ${booking.status}</p>
                </div>
                <button class="view-ticket-btn" onclick="viewTicket('${booking._id}')">View Details</button>
            </div>
        `).join('');
    }

    // Display full booking history
    function displayBookingHistory(bookings) {
        const bookingHistoryList = document.getElementById('booking-history-list');
        if (!bookingHistoryList) return;

        const sortedBookings = bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

        if (sortedBookings.length === 0) {
            bookingHistoryList.innerHTML = '<p>No booking history found.</p>';
            return;
        }

        bookingHistoryList.innerHTML = sortedBookings.map(booking => `
            <div class="history-item">
                <span class="movie-name">${booking.movieTitle}</span>
                <span class="date">${new Date(booking.bookingDate).toLocaleDateString()}</span>
                <span class="time">${booking.showtime}</span>
                <span class="seats">${booking.seats.join(', ')}</span>
                <span class="total">$${parseFloat(booking.totalPrice).toFixed(2)}</span>
                <span class="status">${booking.status}</span>
                <button class="rebook-btn" onclick="rebookMovie('${booking.movieTitle}', '${booking.showtime}')">Rebook</button>
            </div>
        `).join('');
    }

    // Show no bookings message
    function showNoBookings() {
        const recentBookingsList = document.getElementById('recent-bookings-list');
        const bookingHistoryList = document.getElementById('booking-history-list');
        
        if (recentBookingsList) {
            recentBookingsList.innerHTML = '<p>No bookings found. <a href="interface.html">Book a movie now!</a></p>';
        }
        if (bookingHistoryList) {
            bookingHistoryList.innerHTML = '<p>No booking history found. <a href="interface.html">Book a movie now!</a></p>';
        }
    }

    // Global functions for button actions
    window.viewTicket = function(bookingId) {
        alert(`Viewing ticket details for booking ID: ${bookingId}`);
        // In a real app, this would redirect to a ticket details page
    };

    window.rebookMovie = function(movieTitle, showtime) {
        const encodedMovie = encodeURIComponent(movieTitle);
        const encodedTime = encodeURIComponent(showtime);
        window.location.href = `seat.html?movie=${encodedMovie}&time=${encodedTime}`;
    };
    
    // Form submission handling
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validation
            if (!currentPassword) {
                alert('Please enter your current password to make changes.');
                return;
            }
            
            if (newPassword && newPassword !== confirmPassword) {
                alert('New passwords do not match.');
                return;
            }
            
            if (newPassword && newPassword.length < 6) {
                alert('New password must be at least 6 characters long.');
                return;
            }
            
            try {
                const response = await fetch(`${BASE_URL}/user/update`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: currentUser.username,
                        email: email,
                        currentPassword: currentPassword,
                        newPassword: newPassword || null
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('✅ Profile updated successfully!');
                    // Update localStorage with new user data
                    if (data.user) {
                        localStorage.setItem('currentUser', JSON.stringify(data.user));
                        // Reload the page to show updated data
                        window.location.reload();
                    }
                } else {
                    alert(`❌ Update failed: ${data.message}`);
                }
            } catch (error) {
                console.error('Profile update error:', error);
                alert('❌ Failed to update profile. Please try again.');
            }
        });
    }
});