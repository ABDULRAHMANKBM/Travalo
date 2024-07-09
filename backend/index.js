// // index.js

// const express = require('express');
// const cors = require('cors');
// const fileUpload = require('express-fileupload');
// const connection = require('./connection');
// const hotel = require('./routes/hotels');
// const room = require('./routes/rooms');
// const user = require('./routes/user');
// const favourites = require('./routes/favourites');
// const reservation = require('./routes/reservation');
// const app = express();
// const csurf = require('csurf');
// const cookieParser = require('cookie-parser');
// const csrfRoutes = require('./routes/csrfRoutes');

// const csrfMiddleware = csurf({ cookie: true });

// app.use(cors({
//     credentials: true,
//     origin: ['http://localhost:4200']
// }));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(fileUpload());
// app.use(cookieParser());
// app.use(csrfMiddleware); // Mount csurf middleware before defining routes

// app.use('/csrf', csrfRoutes);

// app.use('/hotel', hotel);
// app.use('/room', room);
// app.use('/user', user);
// app.use('/favourites', favourites);
// app.use('/reservation', reservation);

// module.exports = app;
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const connection = require('./connection');
const hotel = require('./routes/hotels');
const room = require('./routes/rooms');
const user = require('./routes/user');
const favourites = require('./routes/favourites');
const reservation = require('./routes/reservation');
const app = express();
const cookieParser = require('cookie-parser');

app.use(cors({
    origin: 'http://localhost:4200',  // Specify the exact frontend origin
    credentials: true,  // Allow credentials (cookies, HTTP authentication)
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allow these headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']  // Allowed methods
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(cookieParser());



app.use('/hotel', hotel);
app.use('/room', room);
app.use('/user', user);
app.use('/favourites', favourites);
app.use('/reservation', reservation);

module.exports = app;
