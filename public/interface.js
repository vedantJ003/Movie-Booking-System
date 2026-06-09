document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000/api';
    const genreSelect = document.querySelector('#genre-filter');
    const grid = document.getElementById('movie-grid');
    const profileBtn = document.querySelector('.profile-btn');

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    async function loadShows() {
        if (grid) grid.innerHTML = '<p style="color:#ccc">Loading shows...</p>';
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const theatreName = currentUser && currentUser.theatreName ? encodeURIComponent(currentUser.theatreName) : '';
            const query = theatreName ? `?theatreName=${theatreName}` : '';
            const res = await fetch(`${BASE_URL}/shows${query}`);
            const data = await res.json();
            const shows = (data && data.success && Array.isArray(data.shows)) ? data.shows : [];
            renderShows(shows.filter(s => s.status === 'RUNNING'));
        } catch (e) {
            if (grid) grid.innerHTML = '<p style="color:#f66">Failed to load shows.</p>';
        }
    }

    function renderShows(shows) {
        if (!grid) return;
        if (!shows.length) {
            grid.innerHTML = '<p style="color:#ccc">No running shows right now.</p>';
            return;
        }
        grid.innerHTML = shows.map(show => {
            const prices = show.prices ? `Standard $${show.prices.standard ?? '-'} · Premium $${show.prices.premium ?? '-'} · VIP $${show.prices.vip ?? '-'}` : '';
            return `
                <div class="movie-card" data-screen="${show.screen}" data-genre="${show.genre || 'All'}">
                    <img src="${show.imageUrl || ''}" alt="${show.movie} Poster" class="poster">
                    <div class="card-content">
                        <h3>${show.movie}</h3>
                        <p class="genre">${show.genre || ''}</p>
                        <div class="rating">${prices}</div>
                        <p class="available-times-label">Showtime:</p>
                        <div class="showtimes">
                            <button class="time-btn" data-time="${encodeURIComponent(show.showTime)}">${show.showTime}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers
        grid.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                const movieCard = event.target.closest('.movie-card');
                const movieTitle = encodeURIComponent(movieCard.querySelector('h3').textContent);
                const showtime = event.target.getAttribute('data-time');
                const screen = encodeURIComponent(movieCard.getAttribute('data-screen') || '');
                window.location.href = `seat.html?movie=${movieTitle}&time=${showtime}&screen=${screen}`;
            });
        });

        if (genreSelect) {
            genreSelect.addEventListener('change', () => {
                const selected = genreSelect.value;
                grid.querySelectorAll('.movie-card').forEach(card => {
                    const genres = (card.getAttribute('data-genre') || '').split(',').map(s => s.trim());
                    card.style.display = (selected === 'All' || genres.includes(selected)) ? 'block' : 'none';
                });
            });
        }
    }

    loadShows();
});