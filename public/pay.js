document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('payment-form');
    const payButton = document.getElementById('pay-button');
    
    // --- 1. Read URL Parameters and Populate Summary ---
    const params = new URLSearchParams(window.location.search);
    const movie = params.get('movie');
    const time = params.get('time');
    const seatsList = params.get('seats');
    const subtotal = parseFloat(params.get('total')) || 0; 
    const bookingId = params.get('bookingId');

    const serviceFee = 2.50; 
    const tax = 0.00; // No tax for demo
    const grandTotal = subtotal + serviceFee + tax;
    
    // --- Timer functionality ---
    let timeLeft = 15 * 60; // 15 minutes in seconds
    const timerElement = document.getElementById('timer');
    
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            alert('⏰ Your session has expired. Please start over.');
            window.location.href = 'interface.html';
            return;
        }
        
        timeLeft--;
    }
    
    const timerInterval = setInterval(updateTimer, 1000);
    
    // Update HTML summary elements
    document.getElementById('summary-movie').textContent = decodeURIComponent(movie || 'N/A');
    document.getElementById('summary-time').textContent = decodeURIComponent(time || 'N/A');
    document.getElementById('summary-seats').textContent = decodeURIComponent(seatsList || 'N/A');
    document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summary-fee').textContent = `$${serviceFee.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('booking-id-display').textContent = `#TB${bookingId ? bookingId.slice(-6) : '123456'}`;
    
    // The total is used for display and the button text
    const summaryTotalElem = document.getElementById('summary-total');
    const buttonTotalSpan = document.getElementById('button-total');
    if (summaryTotalElem) summaryTotalElem.textContent = `$${grandTotal.toFixed(2)}`;
    if (buttonTotalSpan) buttonTotalSpan.textContent = grandTotal.toFixed(2);
    
    // --- Payment method switching ---
    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardForm = document.getElementById('card-form');
    const walletForm = document.getElementById('wallet-form');
    
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const method = option.getAttribute('data-method');
            if (method === 'card') {
                cardForm.style.display = 'block';
                walletForm.style.display = 'none';
            } else if (method === 'wallet') {
                cardForm.style.display = 'none';
                walletForm.style.display = 'block';
            }
        });
    });
    
    // --- Digital Wallet Options ---
    const walletOptions = document.querySelectorAll('.wallet-option');
    walletOptions.forEach(option => {
        option.addEventListener('click', () => {
            const walletType = option.querySelector('span').textContent;
            
            if (walletType === 'Google Pay') {
                showGooglePayScanner();
            } else if (walletType === 'Apple Pay') {
                showApplePayDialog();
            } else if (walletType === 'PayPal') {
                showPayPalLogin();
            }
        });
    }); 

    // --- 2. Enhanced Form Input Formatting ---
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})/g, '$1 ').trim();
            e.target.value = value;
            
            // Show validation icon
            const validIcon = e.target.parentElement.querySelector('.card-valid');
            if (value.replace(/\s/g, '').length === 16) {
                validIcon.style.display = 'block';
            } else {
                validIcon.style.display = 'none';
            }
        });
    }

    const expiryDateInput = document.getElementById('expiry-date');
    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').replace('/', '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // --- 3. Enhanced Payment Submission ---
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Clear timer
            clearInterval(timerInterval);
            
            // Show processing animation
            payButton.disabled = true;
            payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
            payButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
            
            // Simulate realistic payment processing
            const processingSteps = [
                'Validating card details...',
                'Connecting to payment gateway...',
                'Processing transaction...',
                'Verifying payment...'
            ];
            
            let stepIndex = 0;
            const stepInterval = setInterval(() => {
                if (stepIndex < processingSteps.length) {
                    payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${processingSteps[stepIndex]}`;
                    stepIndex++;
                } else {
                    clearInterval(stepInterval);
                    processPayment();
                }
            }, 800);
            
            async function processPayment() {
                // Simulate payment processing time
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const success = Math.random() > 0.15; // 85% success rate (more realistic)
                
                if (success) {
                    // SUCCESS SCENARIO
                    payButton.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
                    payButton.style.background = 'var(--success-color)';
                    
                    // Show success animation
                    setTimeout(async () => {
                        // Inform server that booking is paid
                        try {
                            if (bookingId) {
                                await fetch(`http://localhost:3000/api/bookings/${encodeURIComponent(bookingId)}/pay`, { method: 'POST' });
                            }
                        } catch (error) {
                            console.error('Failed to update booking status:', error);
                        }
                        
                        // Redirect to confirmation page
                        const totalPaid = grandTotal.toFixed(2);
                        const urlParams = 
                            `movie=${movie}&time=${time}&seats=${seatsList}&total=${totalPaid}&bookingId=${bookingId}`;
                        
                        window.location.href = `reciept.html?${urlParams}`;
                    }, 1000);
                    
                } else {
                    // FAILURE SCENARIO
                    payButton.innerHTML = '<i class="fas fa-times-circle"></i> Payment Failed';
                    payButton.style.background = '#dc3545';
                    
                    setTimeout(() => {
                        payButton.disabled = false;
                        payButton.innerHTML = '<i class="fas fa-lock"></i> <span>Pay $' + grandTotal.toFixed(2) + ' Securely</span>';
                        payButton.style.background = 'var(--primary-color)';
                        
                        // Show error message
                        alert('❌ Payment failed. Please check your card details and try again.\n\nPossible reasons:\n• Insufficient funds\n• Card declined\n• Invalid card details');
                    }, 2000);
                }
            }
        });
    }
    
    // --- Google Pay Scanner Function ---
    function showGooglePayScanner() {
        // Create Google Pay scanner modal
        const modal = document.createElement('div');
        modal.className = 'google-pay-modal';
        
        const upiId = 'indrajeetkokate480@okhdfcbank';
        const upiName = 'MovieBooking';
        const amount = grandTotal.toFixed(2);
        const bookingIdValue = bookingId || '000000';
        const upiUrl = `upi://pay?pa=${upiId}&pn=${upiName}&am=${amount}&tn=Movie%20Booking%20${bookingIdValue}`;
        const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=180x180`;

        modal.innerHTML = `
            <div class="google-pay-scanner">
                <div class="scanner-header">
                    <div class="google-logo">
                        <i class="fab fa-google"></i>
                        <span>Google Pay</span>
                    </div>
                    <button class="close-scanner" onclick="closeGooglePayScanner()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="scanner-content">
                    <div class="phone-mockup" style="margin-bottom:15px;">
                        <div class="phone-screen" style="background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; height:220px;">
                            <img src="${qrImgSrc}" alt="Scan QR to pay" style="width:90%;max-width:160px;max-height:160px;padding:10px;background:#fff;border-radius:18px;display:block;margin:auto;border:2px solid #e0e0e0;box-shadow:0 4px 24px #d4d4d4;" />
                        </div>
                    </div>
                    <div style="margin-bottom:10px;font-weight:500;font-size:1.05em;color:#333;text-align:center;">Scan this QR code with any UPI app to pay.</div>
                    
                    <div class="scanner-instructions">
                        <h4>Complete your payment</h4>
                        <p>Scan the QR code or use PIN to authorize this payment</p>
                        <div class="security-info">
                            <i class="fas fa-shield-alt"></i>
                            <span>Secured by Google Pay</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add CSS for the modal
        const style = document.createElement('style');
        style.textContent = `
            .google-pay-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .google-pay-scanner {
                background: white;
                border-radius: 20px;
                width: 90%;
                max-width: 400px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            
            .scanner-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            
            .google-logo {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: bold;
                color: #4285f4;
                font-size: 1.2em;
            }
            
            .close-scanner {
                background: none;
                border: none;
                font-size: 1.5em;
                color: #666;
                cursor: pointer;
                padding: 5px;
            }
            
            .scanner-content {
                padding: 20px;
            }
            
            .phone-mockup {
                width: 200px;
                height: 400px;
                background: #000;
                border-radius: 25px;
                padding: 10px;
                margin: 0 auto 20px;
                position: relative;
            }
            
            .phone-screen {
                width: 100%;
                height: 100%;
                background: #fff;
                border-radius: 20px;
                overflow: hidden;
                position: relative;
            }
            
            .google-pay-interface {
                padding: 20px;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            
            .payment-header {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .payment-header h3 {
                margin: 0 0 10px 0;
                color: #333;
            }
            
            .amount {
                font-size: 2em;
                font-weight: bold;
                color: #4285f4;
            }
            
            .card-preview {
                background: linear-gradient(135deg, #4285f4, #34a853);
                color: white;
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                position: relative;
            }
            
            .card-chip {
                width: 30px;
                height: 20px;
                background: #ffd700;
                border-radius: 3px;
                margin-bottom: 10px;
            }
            
            .card-number {
                font-size: 1.2em;
                margin-bottom: 5px;
            }
            
            .card-holder {
                font-size: 0.9em;
                opacity: 0.8;
            }
            
            .scanner-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                margin: 20px 0;
            }
            
            .scanner-frame {
                width: 200px;
                height: 200px;
                border: 2px solid #4285f4;
                border-radius: 15px;
                position: relative;
                margin-bottom: 20px;
                overflow: hidden;
                background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .qr-scanner-viewfinder {
                width: 100%;
                height: 100%;
                position: relative;
                background: rgba(0, 0, 0, 0.1);
            }
            
            .qr-corners {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }
            
            .qr-corner {
                position: absolute;
                width: 30px;
                height: 30px;
                border: 3px solid #4285f4;
            }
            
            .qr-corner.top-left {
                top: 20px;
                left: 20px;
                border-right: none;
                border-bottom: none;
            }
            
            .qr-corner.top-right {
                top: 20px;
                right: 20px;
                border-left: none;
                border-bottom: none;
            }
            
            .qr-corner.bottom-left {
                bottom: 20px;
                left: 20px;
                border-right: none;
                border-top: none;
            }
            
            .qr-corner.bottom-right {
                bottom: 20px;
                right: 20px;
                border-left: none;
                border-top: none;
            }
            
            .qr-scan-line {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #4285f4, #34a853);
                animation: qrScanLine 2s infinite;
                box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);
            }
            
            .qr-center-dot {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: #4285f4;
                border-radius: 50%;
                animation: qrPulse 1.5s infinite;
            }
            
            .scanner-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 8px;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
            }
            
            .scanner-frame:hover {
                border-color: #34a853;
                box-shadow: 0 0 20px rgba(52, 168, 83, 0.3);
            }
            
            .scanner-frame.scanning {
                border-color: #34a853;
                box-shadow: 0 0 25px rgba(52, 168, 83, 0.5);
                animation: pulse 1s infinite;
            }
            
            .scanner-line {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #4285f4, #34a853);
                animation: scanLine 2s infinite;
                box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);
            }
            
            .scanner-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(66, 133, 244, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .scanner-frame.scanning .scanner-overlay {
                opacity: 1;
            }
            
            .scanner-dots {
                display: flex;
                gap: 8px;
            }
            
            .dot {
                width: 8px;
                height: 8px;
                background: #4285f4;
                border-radius: 50%;
                animation: dotPulse 1.5s infinite;
            }
            
            .dot:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .dot:nth-child(3) {
                animation-delay: 0.4s;
            }
            
            .scanner-progress {
                width: 100%;
                height: 4px;
                background: rgba(66, 133, 244, 0.2);
                border-radius: 2px;
                margin-top: 10px;
                overflow: hidden;
                display: none;
            }
            
            .scanner-frame.scanning .scanner-progress {
                display: block;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4285f4, #34a853);
                border-radius: 2px;
                animation: progressFill 3s ease-in-out;
            }
            
            .scanner-corners {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
            }
            
            .corner {
                position: absolute;
                width: 20px;
                height: 20px;
                border: 3px solid #4285f4;
            }
            
            .corner.top-left {
                top: -3px;
                left: -3px;
                border-right: none;
                border-bottom: none;
            }
            
            .corner.top-right {
                top: -3px;
                right: -3px;
                border-left: none;
                border-bottom: none;
            }
            
            .corner.bottom-left {
                bottom: -3px;
                left: -3px;
                border-right: none;
                border-top: none;
            }
            
            .corner.bottom-right {
                bottom: -3px;
                right: -3px;
                border-left: none;
                border-top: none;
            }
            
            .scanner-text {
                text-align: center;
                color: #666;
                font-size: 0.9em;
                margin: 0;
            }
            
            .payment-options {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .pay-button, .pin-button {
                padding: 12px;
                border: none;
                border-radius: 8px;
                font-size: 1em;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .pay-button {
                background: #4285f4;
                color: white;
            }
            
            .pin-button {
                background: #f8f9fa;
                color: #333;
            }
            
            .scanner-instructions {
                text-align: center;
            }
            
            .scanner-instructions h4 {
                margin: 0 0 10px 0;
                color: #333;
            }
            
            .scanner-instructions p {
                color: #666;
                margin: 0 0 15px 0;
            }
            
            .security-info {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                color: #34a853;
                font-size: 0.9em;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes scanLine {
                0% { transform: translateY(0); }
                100% { transform: translateY(117px); }
            }
            
            @keyframes qrScanLine {
                0% { transform: translateY(0); }
                100% { transform: translateY(194px); }
            }
            
            @keyframes qrPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
                50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 25px rgba(52, 168, 83, 0.5); }
                50% { box-shadow: 0 0 35px rgba(52, 168, 83, 0.8); }
                100% { box-shadow: 0 0 25px rgba(52, 168, 83, 0.5); }
            }
            
            @keyframes dotPulse {
                0%, 100% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.2); opacity: 1; }
            }
            
            @keyframes progressFill {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
        
        // Add interactive scanner functionality
        setTimeout(() => {
            const scannerFrame = document.getElementById('scanner-frame');
            const scannerText = document.getElementById('scanner-text');
            const scannerProgress = document.getElementById('scanner-progress');
            
            if (scannerFrame) {
                scannerFrame.addEventListener('click', startScanner);
            }
        }, 100);
    }
    
    // --- Other Wallet Functions ---
    function showApplePayDialog() {
        alert('🍎 Apple Pay\n\nTouch ID or Face ID required to complete payment.\n\nThis would normally open the Apple Pay interface on supported devices.');
        // Simulate Apple Pay processing
        setTimeout(() => {
            processWalletPayment('Apple Pay');
        }, 1000);
    }
    
    function showPayPalLogin() {
        alert('💳 PayPal Login\n\nRedirecting to PayPal for secure payment...\n\nThis would normally open the PayPal login interface.');
        // Simulate PayPal processing
        setTimeout(() => {
            processWalletPayment('PayPal');
        }, 1000);
    }
    
    // --- Global Functions ---
    window.closeGooglePayScanner = function() {
        const modal = document.querySelector('.google-pay-modal');
        if (modal) {
            modal.remove();
        }
    };
    
    window.processGooglePay = function() {
        const modal = document.querySelector('.google-pay-modal');
        if (modal) {
            modal.remove();
        }
        processWalletPayment('Google Pay');
    };
    
    window.showPinEntry = function() {
        const pin = prompt('Enter your 4-digit PIN:');
        if (pin && pin.length === 4) {
            window.closeGooglePayScanner();
            processWalletPayment('Google Pay');
        } else {
            alert('Invalid PIN. Please try again.');
        }
    };
    
    // --- Custom Scanner Functions ---
    window.startScanner = function() {
        const scannerFrame = document.getElementById('scanner-frame');
        const scannerText = document.getElementById('scanner-text');
        const scannerProgress = document.getElementById('scanner-progress');
        const scannerImage = document.getElementById('scanner-image');
        
        if (!scannerFrame || scannerFrame.classList.contains('scanning')) return;
        
        // Show your custom scanner image when scanning starts
        if (scannerImage) {
            scannerImage.style.display = 'block';
        }
        
        // Start scanning animation
        scannerFrame.classList.add('scanning');
        scannerText.textContent = 'Scanning QR code...';
        
        // Simulate scanning process
        let progress = 0;
        const scanInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(scanInterval);
                completeScan();
            }
            
            // Update progress bar
            const progressBar = scannerProgress.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            // Update text based on progress
            if (progress < 30) {
                scannerText.textContent = 'Scanning QR code...';
            } else if (progress < 70) {
                scannerText.textContent = 'Reading QR data...';
            } else {
                scannerText.textContent = 'Verifying payment...';
            }
        }, 200);
        
        // Auto-complete after 3 seconds
        setTimeout(() => {
            if (scannerFrame.classList.contains('scanning')) {
                clearInterval(scanInterval);
                completeScan();
            }
        }, 3000);
    };
    
    function completeScan() {
        const scannerFrame = document.getElementById('scanner-frame');
        const scannerText = document.getElementById('scanner-text');
        
        if (!scannerFrame) return;
        
        // Complete scanning
        scannerFrame.classList.remove('scanning');
        scannerText.textContent = '✓ QR code verified!';
        scannerText.style.color = '#34a853';
        
        // Show success animation
        scannerFrame.style.borderColor = '#34a853';
        scannerFrame.style.boxShadow = '0 0 30px rgba(52, 168, 83, 0.8)';
        
        // Process payment after success
        setTimeout(() => {
            window.closeGooglePayScanner();
            processWalletPayment('Google Pay');
        }, 1500);
    }
    
    function processWalletPayment(walletType) {
        // Clear timer
        clearInterval(timerInterval);
        
        // Show processing animation
        payButton.disabled = true;
        payButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing ${walletType}...`;
        payButton.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e8e)';
        
        // Simulate wallet payment processing
        setTimeout(async () => {
            const success = Math.random() > 0.1; // 90% success rate
            
            if (success) {
                payButton.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
                payButton.style.background = 'var(--success-color)';
                
                setTimeout(async () => {
                    try {
                        if (bookingId) {
                            await fetch(`http://localhost:3000/api/bookings/${encodeURIComponent(bookingId)}/pay`, { method: 'POST' });
                        }
                    } catch (error) {
                        console.error('Failed to update booking status:', error);
                    }
                    
                    const totalPaid = grandTotal.toFixed(2);
                    const urlParams = 
                        `movie=${movie}&time=${time}&seats=${seatsList}&total=${totalPaid}&bookingId=${bookingId}`;
                    
                    window.location.href = `reciept.html?${urlParams}`;
                }, 1000);
                
            } else {
                payButton.innerHTML = '<i class="fas fa-times-circle"></i> Payment Failed';
                payButton.style.background = '#dc3545';
                
                setTimeout(() => {
                    payButton.disabled = false;
                    payButton.innerHTML = '<i class="fas fa-lock"></i> <span>Pay $' + grandTotal.toFixed(2) + ' Securely</span>';
                    payButton.style.background = 'var(--primary-color)';
                    alert(`❌ ${walletType} payment failed. Please try again or use a different payment method.`);
                }, 2000);
            }
        }, 2000);
    }
    
    // --- Scanner Image Functions ---
    window.toggleScannerImage = function() {
        const scannerImage = document.getElementById('scanner-image');
        if (scannerImage) {
            if (scannerImage.style.display === 'none' || scannerImage.style.display === '') {
                scannerImage.style.display = 'block';
                console.log('Custom scanner image enabled');
            } else {
                scannerImage.style.display = 'none';
                console.log('Default scanner enabled');
            }
        }
    };
    
    window.setScannerImage = function(imagePath) {
        const scannerImage = document.getElementById('scanner-image');
        if (scannerImage) {
            scannerImage.src = imagePath;
            scannerImage.style.display = 'block';
            console.log('Scanner image set to:', imagePath);
        }
    };
    
    // --- Global functions for terms and privacy ---
    window.showTerms = function() {
        alert('Terms and Conditions:\n\n1. All sales are final\n2. No refunds after showtime\n3. Valid ID required for ticket collection\n4. Management reserves the right to refuse entry');
    };
    
    window.showPrivacy = function() {
        alert('Privacy Policy:\n\nWe collect and process your personal information in accordance with applicable data protection laws. Your payment information is securely processed and not stored on our servers.');
    };
});