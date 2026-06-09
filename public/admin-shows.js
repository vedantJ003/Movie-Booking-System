document.addEventListener('DOMContentLoaded', () => {
    const userRaw = localStorage.getItem('currentUser');
    if (!userRaw) { alert('Please log in first.'); window.location.href = 'index.html'; return; }
    const user = JSON.parse(userRaw);
    if (!user || user.role !== 'Admin') { alert('Admins only.'); window.location.href = 'interface.html'; return; }

    const BASE_URL = 'http://localhost:3000/api';
    const tbody = document.getElementById('showsBody');
    const screenInput = document.getElementById('screen');
    const timeInput = document.getElementById('showTime');
    const movieInput = document.getElementById('movie');
    const statusSelect = document.getElementById('status');
    const genreInput = document.getElementById('genre');
    const imageUrlInput = document.getElementById('imageUrl');
    const addBtn = document.getElementById('addShowBtn');
    const priceStandard = document.getElementById('priceStandard');
    const pricePremium = document.getElementById('pricePremium');
    const priceVIP = document.getElementById('priceVIP');

    addBtn.addEventListener('click', async () => {
        const screen = screenInput.value.trim();
        const showTime = timeInput.value.trim();
        const movie = movieInput.value.trim();
        const status = statusSelect.value;
        const genre = genreInput.value.trim();
        const imageUrl = imageUrlInput.value.trim();
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const theatreName = currentUser && currentUser.theatreName ? currentUser.theatreName : '';
        if (!screen || !showTime || !movie) { alert('Please fill screen, show time, and movie.'); return; }
        try {
            const res = await fetch(`${BASE_URL}/shows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    screen, showTime, movie, status,
                    prices: {
                        standard: Number(priceStandard.value) || undefined,
                        premium: Number(pricePremium.value) || undefined,
                        vip: Number(priceVIP.value) || undefined
                    },
                    genre,
                    imageUrl,
                    theatreName
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error('Create failed');
            screenInput.value = ''; timeInput.value = ''; movieInput.value = ''; statusSelect.value = 'STOPPED';
            genreInput.value = ''; imageUrlInput.value = '';
            priceStandard.value = ''; pricePremium.value = ''; priceVIP.value = '';
            await loadShows();
        } catch (e) {
            alert('Error creating show');
        }
    });

    async function loadShows() {
        tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const theatreName = currentUser && currentUser.theatreName ? encodeURIComponent(currentUser.theatreName) : '';
            const query = theatreName ? `?theatreName=${theatreName}` : '';
            const res = await fetch(`${BASE_URL}/shows${query}`);
            const data = await res.json();
            if (!data.success) throw new Error('Fetch failed');
            renderRows(data.shows || []);
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="6">Error loading shows</td></tr>';
        }
    }

    function renderRows(shows) {
        if (!shows.length) { tbody.innerHTML = '<tr><td colspan="6">No shows</td></tr>'; return; }
        tbody.innerHTML = shows.map((s, idx) => {
            const running = s.status === 'RUNNING';
            const prices = s.prices ? `$${(s.prices.standard??'-')}/${(s.prices.premium??'-')}/${(s.prices.vip??'-')}` : '-';
            return `
                <tr data-id="${s._id}">
                    <td>${idx + 1}</td>
                    <td>${s.screen}</td>
                    <td>${s.showTime}</td>
                    <td>${s.movie}</td>
                    <td>${s.genre || '-'}</td>
                    <td>${prices}</td>
                    <td>${s.status}</td>
                    <td>
                        <button class="btn small edit-btn">Edit</button>
                        <button class="btn ${running ? 'warn' : 'success'} toggle-btn">${running ? 'Stop Running' : 'Start Running'}</button>
                        <button class="btn danger delete-btn">Stop Show</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.toggle-btn').forEach(btn => btn.addEventListener('click', onToggle));
        tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', onDelete));
        tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', onEdit));
    }

    async function onToggle(e) {
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        const currentStatus = tr.children[4].textContent.trim();
        const nextStatus = currentStatus === 'RUNNING' ? 'STOPPED' : 'RUNNING';
        try {
            const res = await fetch(`${BASE_URL}/shows/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            const data = await res.json();
            if (!data.success) throw new Error('Update failed');
            await loadShows();
        } catch (e) { alert('Error updating status'); }
    }

    async function onDelete(e) {
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        if (!confirm('Stop and delete this show?')) return;
        try {
            const res = await fetch(`${BASE_URL}/shows/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!data.success) throw new Error('Delete failed');
            tr.remove();
        } catch (e) { alert('Error deleting show'); }
    }

    async function onEdit(e) {
        const tr = e.target.closest('tr');
        const id = tr.getAttribute('data-id');
        const cells = tr.children;
        const [, screenCell, timeCell, movieCell, genreCell] = cells;
        const pricesCell = cells[5];

        const screen = prompt('Screen', screenCell.textContent.trim());
        if (screen === null) return;
        const showTime = prompt('Show Time', timeCell.textContent.trim());
        if (showTime === null) return;
        const movie = prompt('Movie', movieCell.textContent.trim());
        if (movie === null) return;
        const genre = prompt('Genre', (genreCell.textContent || '').trim());
        if (genre === null) return;
        const imageUrl = prompt('Poster URL', '');
        if (imageUrl === null) return;
        const priceParts = (pricesCell.textContent || '').replace(/\$/g,'').split('/');
        const pStandard = prompt('Price Standard', priceParts[0] ? priceParts[0] : '12.5');
        if (pStandard === null) return;
        const pPremium = prompt('Price Premium', priceParts[1] ? priceParts[1] : '15');
        if (pPremium === null) return;
        const pVip = prompt('Price VIP', priceParts[2] ? priceParts[2] : '20');
        if (pVip === null) return;

        try {
            const res = await fetch(`${BASE_URL}/shows/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    screen, showTime, movie, genre, imageUrl,
                    prices: { standard: Number(pStandard), premium: Number(pPremium), vip: Number(pVip) }
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error('Edit failed');
            await loadShows();
        } catch (err) {
            alert('Error saving changes');
        }
    }

    loadShows();
});


