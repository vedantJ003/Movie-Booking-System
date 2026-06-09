const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// mongoose connectiom

const MONGODB_URI = 'mongodb://localhost:27017/cinebookDB'; 

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.log('MongoDB Connection Error:', err.message));

// user schema 
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Customer'],
        default: 'Customer',
        required: true
    },
    theatreName: { type: String, default: '' },
    theatrePass: { type: String, default: '' }
});
const User = mongoose.model('User', userSchema, 'signup'); 

// booking schema
const bookingSchema = new mongoose.Schema({
    movieTitle: {
        type: String,
        required: true,
    },
    showtime: {
        type: String,
        required: true,
    },
    screen: {
        type: String,
        required: false, // optional for legacy bookings
    },
    theatreName: {
        type: String,
        required: false,
        default: ''
    },
    userId: {
        type: String,
        required: false, // optional for legacy bookings
        default: ''
    },
    seats: {
        type: [String],
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    bookingDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'CANCELLED'],
        default: 'PENDING', 
    }
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookings'); 




app.use(express.static('public'));


app.use(bodyParser.json());


app.use(cors()); 
 


app.post('/api/signup', async (req, res) => {
    console.log('--- SIGNUP REQUEST ---');
    console.log('Received Body:', req.body); 
    
    try {
        const { username, email, password, role, theatreName, theatrePass } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const normalizedRole = role === 'Admin' ? 'Admin' : 'Customer';
        if (normalizedRole === 'Admin') {
            if (!theatreName || !theatrePass) {
                return res.status(400).json({ success: false, message: 'Theatre name and pass are required for Admin registration.' });
            }
        }
        const newUser = new User({ username, email, password, role: normalizedRole, theatreName: normalizedRole==='Admin'?theatreName:'', theatrePass: normalizedRole==='Admin'?theatrePass:'' });
        await newUser.save(); 
        
        console.log('User saved successfully:', username);

        res.status(201).json({ success: true, message: 'Account created successfully!' });

    } catch (error) {
        if (error.code === 11000) {
            console.error('Signup Duplicate Key Error:', error.message);
            return res.status(409).json({ success: false, message: 'User with this email or username already exists.' });
        }
        console.error('Signup error (Server Log):', error);
        res.status(500).json({ success: false, message: 'Server error during signup.' });
    }
});

 
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
       
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

       
        if (!user.role) {
            user.role = 'Customer';
            try { await user.save(); } catch (e) { /* ignore*/ }
        }

        res.status(200).json({ success: true, message: 'Login successful!', user: { username: user.username, email: user.email, role: user.role || 'Customer', theatreName: user.theatreName } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

app.get('/api/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        
        res.status(200).json({ 
            success: true, 
            user: { 
                username: user.username, 
                email: user.email, 
                role: user.role || 'Customer', 
                theatreName: user.theatreName 
            } 
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching user details.' });
    }
});

// Update user profile
app.put('/api/user/update', async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        
        if (!username || !currentPassword) {
            return res.status(400).json({ success: false, message: 'Username and current password are required.' });
        }
        
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        
        // Verify current password
        if (user.password !== currentPassword) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }
        
        // Update user data
        const updateData = {};
        if (email) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ email, username: { $ne: username } });
            if (existingUser) {
                return res.status(409).json({ success: false, message: 'Email is already taken by another user.' });
            }
            updateData.email = email;
        }
        
        if (newPassword) {
            updateData.password = newPassword;
        }
        
        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            user._id, 
            { $set: updateData }, 
            { new: true }
        );
        
        res.status(200).json({ 
            success: true, 
            message: 'Profile updated successfully!',
            user: { 
                username: updatedUser.username, 
                email: updatedUser.email, 
                role: updatedUser.role || 'Customer', 
                theatreName: updatedUser.theatreName 
            }
        });
        
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
});


app.post('/api/book-seats', async (req, res) => {
    console.log('--- BOOKING REQUEST ---');
    console.log('Received Booking Body:', req.body); 
    
    try {
        const { movieTitle, showtime, seats, total, screen, theatreName, userId } = req.body;
        
        if (!movieTitle || !showtime || !seats || seats.length === 0 || !total) {
            return res.status(400).json({ success: false, message: 'Missing required booking details.' });
        }
        
        const newBooking = new Booking({
            movieTitle,
            showtime,
            screen: screen || null,
            theatreName: theatreName || '', // blank if missing
            userId: userId || '', // blank if missing
            seats: seats, 
            totalPrice: parseFloat(total), 
            status: 'PENDING'
        });

        const savedBooking = await newBooking.save(); 
        
        console.log('Booking saved successfully, ID:', savedBooking._id);

        res.status(201).json({ 
            success: true, 
            message: 'Booking created, proceeding to payment.', 
            bookingId: savedBooking._id // Returns ID needed for pay.html redirect
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ success: false, message: 'Server error during booking.' });
    }
});

app.get('/api/booked-seats', async (req, res) => {
    try {
        const { movieTitle, showtime, screen } = req.query;
        
        if (!movieTitle || !showtime) {
            return res.status(400).json({ success: false, message: 'Movie title and showtime are required.' });
        }
        
        
        const filter = { 
            movieTitle: decodeURIComponent(movieTitle),
            showtime: decodeURIComponent(showtime),
            status: { $in: ['PENDING', 'PAID'] } // Only count confirmed bookings
        };
        
        // Add screen filter if provided
        if (screen) {
            filter.screen = decodeURIComponent(screen);
        }
        
        // Get all bookings for this specific show
        const bookings = await Booking.find(filter);
        
        // Extract all booked seats
        const bookedSeats = [];
        bookings.forEach(booking => {
            if (booking.seats && Array.isArray(booking.seats)) {
                bookedSeats.push(...booking.seats);
            }
        });
        
        res.status(200).json({ 
            success: true, 
            bookedSeats: bookedSeats,
            count: bookedSeats.length 
        });
    } catch (error) {
        console.error('Fetch booked seats error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching booked seats.' });
    }
});

// Mark booking as paid (used after successful payment)
app.post('/api/bookings/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Booking.findByIdAndUpdate(id, { $set: { status: 'PAID' } }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Booking not found.' });
        res.status(200).json({ success: true, booking: updated });
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ success: false, message: 'Server error marking booking as paid.' });
    }
});


// --- ADMIN ENDPOINTS: Manage Bookings ---
// List all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const { theatreName, userId } = req.query;
        let filter = {};
        
        if (userId) {
            // Filter by user ID (for user-specific bookings)
            filter = { userId };
        } else if (theatreName !== undefined) {
            if (theatreName === '') {
                // Filter for bookings with empty or null theatreName
                filter = { $or: [{ theatreName: '' }, { theatreName: { $exists: false } }, { theatreName: null }] };
            } else {
                // Filter for specific theatre name
                filter = { theatreName };
            }
        }
        
        const bookings = await Booking.find(filter).sort({ bookingDate: -1 });
        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error('Fetch bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching bookings.' });
    }
});

// Aggregate totals grouped by movieTitle + showtime + screen
app.get('/api/bookings/summary', async (req, res) => {
    try {
        const { theatreName } = req.query;
        const pipeline = [];
        
        if (theatreName !== undefined) {
            if (theatreName === '') {
                // Filter for bookings with empty or null theatreName
                pipeline.push({ $match: { $or: [{ theatreName: '' }, { theatreName: { $exists: false } }, { theatreName: null }] } });
            } else {
                // Filter for specific theatre name
                pipeline.push({ $match: { theatreName } });
            }
        }
        
        pipeline.push(
            {
                $group: {
                    _id: {
                        movieTitle: '$movieTitle',
                        showtime: '$showtime',
                        screen: '$screen'
                    },
                    totalBookings: { $sum: 1 },
                    totalSeats: { $sum: { $size: '$seats' } },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            },
            { $sort: { '_id.movieTitle': 1, '_id.showtime': 1, '_id.screen': 1 } }
        );
        const summary = await Booking.aggregate(pipeline);
        res.status(200).json({ success: true, summary });
    } catch (error) {
        console.error('Summary bookings error:', error);
        res.status(500).json({ success: false, message: 'Server error summarizing bookings.' });
    }
});

// Update booking status
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        const updated = await Booking.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        res.status(200).json({ success: true, message: 'Status updated.', booking: updated });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ success: false, message: 'Server error updating booking.' });
    }
});

// Delete a booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Booking.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }
        res.status(200).json({ success: true, message: 'Booking deleted.' });
    } catch (error) {
        console.error('Delete booking error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting booking.' });
    }
});

// --- SHOWS MODEL & ENDPOINTS (Theatre Manager) ---
const showSchema = new mongoose.Schema({
    screen: { type: String, required: true },
    showTime: { type: String, required: true },
    movie: { type: String, required: true },
    genre: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    theatreName: { type: String, default: '' },
    status: { type: String, enum: ['RUNNING', 'STOPPED'], default: 'STOPPED' },
    prices: {
        standard: { type: Number, default: 12.5 },
        premium: { type: Number, default: 15.0 },
        vip: { type: Number, default: 20.0 }
    },
    createdAt: { type: Date, default: Date.now }
});
const Show = mongoose.model('Show', showSchema, 'shows');

// List shows
app.get('/api/shows', async (req, res) => {
    try {
        const { theatreName } = req.query;
        const filter = theatreName ? { theatreName } : {};
        const shows = await Show.find(filter).sort({ createdAt: 1 });
        res.status(200).json({ success: true, shows });
    } catch (error) {
        console.error('Fetch shows error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching shows.' });
    }
});

// Get a single show by ID
app.get('/api/shows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const show = await Show.findById(id);
        if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });
        res.status(200).json({ success: true, show });
    } catch (error) {
        console.error('Fetch show by id error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching show.' });
    }
});

// Find a show by movie + showTime + screen (convenience for seat pricing)
app.get('/api/shows/find/byTriplet', async (req, res) => {
    try {
        const { movie, showTime, screen } = req.query;
        if (!movie || !showTime || !screen) {
            return res.status(400).json({ success: false, message: 'movie, showTime and screen are required.' });
        }
        const show = await Show.findOne({ movie, showTime, screen });
        if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });
        res.status(200).json({ success: true, show });
    } catch (error) {
        console.error('Find show by triplet error:', error);
        res.status(500).json({ success: false, message: 'Server error searching show.' });
    }
});

// Create show
app.post('/api/shows', async (req, res) => {
    try {
        const { screen, showTime, movie, status, prices, genre, imageUrl, theatreName } = req.body;
        if (!screen || !showTime || !movie) {
            return res.status(400).json({ success: false, message: 'screen, showTime, and movie are required.' });
        }
        const normalizedStatus = status === 'RUNNING' ? 'RUNNING' : 'STOPPED';
        const created = await Show.create({ 
            screen, 
            showTime, 
            movie, 
            status: normalizedStatus,
            genre: genre || '',
            imageUrl: imageUrl || '',
            theatreName: theatreName || '',
            prices: {
                standard: prices?.standard ?? 12.5,
                premium: prices?.premium ?? 15.0,
                vip: prices?.vip ?? 20.0
            }
        });
        res.status(201).json({ success: true, show: created });
    } catch (error) {
        console.error('Create show error:', error);
        res.status(500).json({ success: false, message: 'Server error creating show.' });
    }
});

app.patch('/api/shows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};
        const { screen, showTime, movie, status, prices, genre, imageUrl, theatreName } = req.body;
        if (screen !== undefined) updates.screen = screen;
        if (showTime !== undefined) updates.showTime = showTime;
        if (movie !== undefined) updates.movie = movie;
        if (genre !== undefined) updates.genre = genre;
        if (imageUrl !== undefined) updates.imageUrl = imageUrl;
        if (theatreName !== undefined) updates.theatreName = theatreName;
        if (status !== undefined) {
            if (!['RUNNING', 'STOPPED'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status value.' });
            }
            updates.status = status;
        }
        if (prices !== undefined) {
            updates.prices = {
                standard: prices?.standard,
                premium: prices?.premium,
                vip: prices?.vip
            };
        }
        const updated = await Show.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Show not found.' });
        res.status(200).json({ success: true, show: updated });
    } catch (error) {
        console.error('Update show error:', error);
        res.status(500).json({ success: false, message: 'Server error updating show.' });
    }
});

// Delete show
app.delete('/api/shows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Show.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Show not found.' });
        res.status(200).json({ success: true, message: 'Show deleted.' });
    } catch (error) {
        console.error('Delete show error:', error);
        res.status(500).json({ success: false, message: 'Server error deleting show.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});