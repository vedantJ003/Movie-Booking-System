# Movie Booking System

A full-stack web application developed using Node.js, Express.js, and MongoDB for managing movie ticket reservations. The system provides separate interfaces for customers and administrators, enabling movie browsing, seat selection, ticket booking, payment processing, and booking management.

## Overview

The Movie Booking System is designed to simplify the process of reserving movie tickets online. It provides an interactive platform where users can register, log in, browse available shows, select seats, complete payments, and view booking receipts. Administrators can manage movie shows and monitor bookings through a dedicated dashboard.

## Features

### User Authentication

* User registration and login
* Role-based access for Customers and Admins
* Admin-specific theatre credentials
* Validation for duplicate accounts

### Movie Show Management

* Display available movie shows
* Show timings and screen information
* Manage show details through the admin panel
* Store show information in MongoDB

### Seat Selection

* Interactive seat booking interface
* Multiple seat selection support
* Seat availability management
* Price calculation based on selected seats

### Ticket Booking

* Create and store bookings
* Booking status management
* Booking history maintenance
* Support for pending and paid bookings

### Payment Module

* Payment interface integration
* Booking confirmation
* Receipt generation after successful booking

### Admin Dashboard

* Manage movie shows
* Monitor bookings
* Theatre-specific administration
* View customer reservations

### Profile Management

* User profile interface
* Booking information access
* Customer details management

## Technology Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Frontend

* HTML5
* CSS3
* JavaScript

### Development Tools

* Visual Studio Code
* MongoDB Compass
* Git
* GitHub

## Project Structure

```text
Movie-Booking-System
│
├── public/
│   ├── index.html
│   ├── interface.html
│   ├── profile.html
│   ├── seat.html
│   ├── pay.html
│   ├── reciept.html
│   ├── admin.html
│   ├── admin-shows.html
│   ├── admin-bookings.js
│   ├── CSS files
│   └── JavaScript files
│
├── server.js
├── package.json
├── package-lock.json
└── .gitignore
```

## Database Collections

### signup

Stores user account information.

Fields:

* username
* email
* password
* role
* theatreName
* theatrePass

### bookings

Stores booking details.

Fields:

* movieTitle
* showtime
* screen
* theatreName
* userId
* seats
* totalPrice
* bookingDate
* status

### shows

Stores movie and show information.

## API Functionalities

### Authentication APIs

* User Signup
* User Login

### Booking APIs

* Create Booking
* Retrieve Booking Details
* Update Booking Status

### Admin APIs

* Manage Shows
* Manage Bookings

## Workflow

1. Users register and log in.
2. Available movie shows are retrieved from the database.
3. Users select a movie and choose seats.
4. Payment details are processed.
5. Booking information is stored in MongoDB.
6. A receipt is generated after successful booking.
7. Administrators can manage shows and monitor bookings.

## Concepts Implemented

* RESTful APIs
* CRUD Operations
* Client-Server Architecture
* Role-Based Access Control
* Database Integration using Mongoose
* Middleware Handling
* Static File Serving
* Booking Management System

## Future Enhancements

* Password encryption using bcrypt
* JWT-based authentication
* Email notifications
* Payment gateway integration
* QR code ticket generation
* Movie posters and images
* Responsive UI improvements
* Booking cancellation and refunds

## Installation

```bash
npm install
node server.js
```

Server runs on:

```text
http://localhost:3000
```

## Author

Vedant Jadhav

GitHub: https://github.com/vedantJ003
