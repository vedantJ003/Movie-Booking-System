document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api'; // Ensure this matches your server.js port

    const seatingGrid = document.getElementById('seating-grid');
    const seatsCountElement = document.getElementById('seats-count');
    const totalPriceElement = document.getElementById('total-price');
    const proceedButton = document.getElementById('proceed-button');

    // Configuration
    const rows = 8;
    const seatsPerRow = 12;
    let seatPrices = { standard: 12.50, premium: 15.00, vip: 20.00 };

    let occupiedSeats = []; // Will be populated from database
    
    // --- 1. Read URL Parameters from Interface Page ---
    const params = new URLSearchParams(window.location.search);
    const movie = params.get('movie'); 
    const time = params.get('time');
    const screen = params.get('screen');
    
    const movieTitle = movie ? decodeURIComponent(movie) : 'Movie Title Placeholder';
    const showtime = time ? decodeURIComponent(time) : 'Showtime Placeholder';
    
    // Update display 
    const movieTitleElem = document.querySelector('.movie-title');
    const showtimeInfoElem = document.querySelector('.showtime-info');
    if (movieTitleElem) movieTitleElem.textContent = movieTitle;
    if (showtimeInfoElem) {
        const screenLabel = screen ? ` | ${decodeURIComponent(screen)}` : '';
        showtimeInfoElem.textContent = `Cinema City Plex${screenLabel} | ${showtime} | Today`;
    }

    // Fetch pricing and booked seats from the server
    (async function loadShowData() {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const theatreName = currentUser && currentUser.theatreName ? encodeURIComponent(currentUser.theatreName) : '';
            
            // Fetch pricing from shows API
            const showsQuery = theatreName ? `?theatreName=${theatreName}` : '';
            const showsRes = await fetch(`http://localhost:3000/api/shows${showsQuery}`);
            const showsData = await showsRes.json();
            if (showsData && showsData.success && Array.isArray(showsData.shows)) {
                const decodedScreen = screen ? decodeURIComponent(screen) : '';
                const match = showsData.shows.find(s => (s.screen||'') === decodedScreen && (s.showTime||'') === showtime && (s.movie||'') === movieTitle);
                if (match && match.prices) {
                    seatPrices = {
                        standard: Number(match.prices.standard) || seatPrices.standard,
                        premium: Number(match.prices.premium) || seatPrices.premium,
                        vip: Number(match.prices.vip) || seatPrices.vip
                    };
                    const ps = document.getElementById('price-standard');
                    const pp = document.getElementById('price-premium');
                    const pv = document.getElementById('price-vip');
                    if (ps) ps.textContent = seatPrices.standard.toFixed(2);
                    if (pp) pp.textContent = seatPrices.premium.toFixed(2);
                    if (pv) pv.textContent = seatPrices.vip.toFixed(2);
                }
            }
            
            // Fetch booked seats for this specific show
            const bookedSeatsQuery = new URLSearchParams({
                movieTitle: encodeURIComponent(movieTitle),
                showtime: encodeURIComponent(showtime)
            });
            if (screen) {
                bookedSeatsQuery.append('screen', encodeURIComponent(screen));
            }
            
            const bookedRes = await fetch(`http://localhost:3000/api/booked-seats?${bookedSeatsQuery}`);
            const bookedData = await bookedRes.json();
            if (bookedData && bookedData.success && Array.isArray(bookedData.bookedSeats)) {
                occupiedSeats = bookedData.bookedSeats;
                console.log('Loaded booked seats:', occupiedSeats);
            }
            
        } catch (error) {
            console.error('Error loading show data:', error);
        }
    })();


    // --- 2. Seat Generation & Selection Logic ---
    function generateSeats() {
        const alphabet = 'ABCDEFGH';
        if (!seatingGrid) return;
        seatingGrid.innerHTML = ''; 

        for (let i = 0; i < rows; i++) {
            const rowLabel = alphabet[i];
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('row');
            
            // Row Label
            const labelDiv = document.createElement('div');
            labelDiv.classList.add('seat-label');
            labelDiv.textContent = rowLabel;
            rowDiv.appendChild(labelDiv);
            
            // Seats
            for (let j = 1; j <= seatsPerRow; j++) {
                const seatId = `${rowLabel}${j}`;
                const seatDiv = document.createElement('div');
                seatDiv.classList.add('seat');
                seatDiv.setAttribute('data-seat-id', seatId);

                // Assign categories by row: A-B VIP, C-E Premium, F-H Standard
                let category = 'standard';
                if (i <= 1) category = 'vip';
                else if (i <= 4) category = 'premium';
                seatDiv.classList.add(category);
                seatDiv.setAttribute('data-category', category);
                
                if (occupiedSeats.includes(seatId)) {
                    seatDiv.classList.add('occupied');
                } else {
                    seatDiv.classList.add('available');
                    seatDiv.addEventListener('click', toggleSeatSelection);
                }
                rowDiv.appendChild(seatDiv);
            }
            seatingGrid.appendChild(rowDiv);
        }
    }

    function toggleSeatSelection(event) {
        const seat = event.target;
        if (seat.classList.contains('available') && !seat.classList.contains('occupied')) {
            seat.classList.toggle('selected');
            updateSummary();
        }
    }

    function updateSummary() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        const count = selectedSeats.length;
        let totalValue = 0;
        selectedSeats.forEach(s => {
            const cat = s.getAttribute('data-category');
            if (cat && seatPrices[cat] != null) totalValue += seatPrices[cat];
        });
        const total = totalValue.toFixed(2);

        if (seatsCountElement) seatsCountElement.textContent = count;
        if (totalPriceElement) totalPriceElement.textContent = total;
        if (proceedButton) proceedButton.disabled = count === 0;
    }

    // --- 3. Handle Proceed to Payment (Sends data to DB, gets ID, redirects) ---
    if (proceedButton) {
        proceedButton.addEventListener('click', async () => {
            const selectedSeats = Array.from(document.querySelectorAll('.seat.selected'))
                                                 .map(seat => seat.getAttribute('data-seat-id'));
            const total = totalPriceElement.textContent; // Total price as a string
            
            if (selectedSeats.length === 0) return; 

            // Prepare data for the server
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const theatreNameVal = currentUser && currentUser.theatreName ? currentUser.theatreName : '';
            const userId = currentUser && currentUser.username ? currentUser.username : '';
            const bookingData = {
                movieTitle: movieTitle,
                showtime: showtime,
                screen: screen ? decodeURIComponent(screen) : undefined,
                seats: selectedSeats,
                total: total
            };
            if (theatreNameVal) {
                bookingData.theatreName = theatreNameVal;
            }
            if (userId) {
                bookingData.userId = userId;
            }

            try {
                // Send data to the new server endpoint
                const response = await fetch(`${API_BASE_URL}/book-seats`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    const bookingId = result.bookingId; // Get the ID from the server response
                    
                    // Redirect to Payment Page (pay.html) with all details + the new Booking ID
                    const seatsParam = encodeURIComponent(selectedSeats.join(','));
                    const totalParam = encodeURIComponent(total);
                    const movieParam = encodeURIComponent(movieTitle);
                    const timeParam = encodeURIComponent(showtime);
                    const bookingIdParam = encodeURIComponent(bookingId); // New parameter

                    window.location.href = `pay.html?movie=${movieParam}&time=${timeParam}&seats=${seatsParam}&total=${totalParam}&bookingId=${bookingIdParam}`;
                } else {
                    alert(`Booking Failed: ${result.message}`);
                }

            } catch (error) {
                console.error('Network Error:', error);
                alert('Could not connect to the server (http://localhost:3000).');
            }
        });
    }

    // Initialize the page - wait for data to load first
    async function initializePage() {
        // Wait a moment for the async data loading to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Generate seats with the loaded data
        generateSeats();
        updateSummary();
    }
    
    initializePage(); 
});