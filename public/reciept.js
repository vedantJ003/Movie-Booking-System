document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Read URL Parameters ---
    const params = new URLSearchParams(window.location.search);
    const movie = params.get('movie');
    const time = params.get('time');
    const seatsList = params.get('seats');
    const total = params.get('total'); 
    
    // Generate a simple unique ID for the booking confirmation
    const bookingID = 'RB' + Math.floor(Math.random() * 90000000 + 10000000); 

    // --- 2. Populate Ticket Details ---
    document.getElementById('ticket-movie').textContent = decodeURIComponent(movie || 'N/A');
    document.getElementById('ticket-time').textContent = decodeURIComponent(time || 'N/A');
    document.getElementById('ticket-seats').textContent = decodeURIComponent(seatsList || 'N/A');
    document.getElementById('ticket-total').textContent = `$${decodeURIComponent(total || '0.00')}`;
    document.getElementById('ticket-booking-id').textContent = bookingID;


    // --- 3. Button Actions ---
    const returnButton = document.getElementById('return-to-interface');
    const downloadButton = document.getElementById('download-ticket');

    if (returnButton) {
        returnButton.addEventListener('click', () => {
            // Redirects to the main movie listing interface page
            window.location.href = 'interface.html'; 
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            // This is a simulation. PDF generation requires a library/backend.
            alert('Simulation: Downloading PDF ticket...');
        });
    }
});