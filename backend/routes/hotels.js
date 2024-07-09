const express = require('express');
const connection = require('../connection');
const router = express.Router();
var auth = require('../services/authentication');
var checkRole = require('../services/checkRols');
const bodyParser = require('body-parser');
// const csrf = require('csurf');
// const csrfProtection = csrf({ cookie: true });


// const fileUpload = require('express-fileupload');
// const cors = require('cors');
var multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage
})
// const checkRole = require('../services/checkRole');
// router.use(cors());
// router.use(csrfProtection);
// router.use(express.json({ limit: '10mb' }));
// router.use(fileUpload());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());


router.post('/HotelInsert', (req, res) => {
    const { name, city, street_name, description, rate } = req.body;

    connection.query(`INSERT INTO hotel (name, city,street_name , description,rate) VALUES ( ?, ?, ?,?,?)`, [name, city, street_name, description, rate], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
        }
        console.log('Data inserted successfully:', result);
        return res.json({ message: 'Data inserted successfully' });
    });
});

router.post('/HotelImageInsert', auth.authenticateToken, (req, res) => {
    // console.log("image ", req.files);
    console.log("received data : ", req.body);
    console.log("received image : ", req.files.image);
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.image) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }
    const h_id = req.body.h_id;
    const image = req.files.image; // Image data in binary forma
    if (!image) {
        console.error('No image uploaded');
        return res.status(400).json({ message: 'No image uploaded' });
    }
    console.log("hid : ", h_id);

    connection.query(`INSERT INTO hotel_img (h_id, image) VALUES (?, ?)`, [h_id, image.data], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
        }
        console.log('Data inserted successfully:', result);
        return res.json({ message: 'Data inserted successfully' });
    });
});

router.get('/display_HomeHotels', (req, res) => {
    const selectQuery = `SELECT h.*,hi.image FROM hotel h JOIN hotel_img hi where h.id=hi.id ORDER BY RAND() limit 4;`;
    connection.query(selectQuery, (err, rows) => {
        if (err) {
            console.error('Error retrieving data from database:', err);
            res.status(500).json({ error: 'An error occurred' });
            return;
        }
        const formattedData = rows.map(row => ({
            id: row.id,
            name: row.name,
            image: row.image ? row.image.toString('base64') : null,
            description: row.description,
            rate: row.rate,
            city: row.city,
            street_name: row.street_name
        }));

        res.status(200).json(formattedData);
        // console.log(formattedData);
    });
});


router.get('/getHotel', (req, res, next) => {

    var query = `select * from hotel order by name`;
    connection.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred' });
        }
        else {
            res.status(200).json(result);
        }
    });
});
const base64Encode = (buffer) => {
    return Buffer.from(buffer).toString('base64');
};

router.get('/getHotels', (req, res, next) => {
    const hotelId = req.query.hotelId;
    // console.log("enter hotel", hotelId);

    var query = `SELECT h.*, hi.image FROM hotel h JOIN hotel_img hi WHERE h.id = hi.h_id and h.id = ? `;
    connection.query(query, [hotelId], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const hotelInfo = result[0];
            try {
                hotelInfo.image = base64Encode(hotelInfo.image);
            } catch (error) {
                console.error("Error encoding image:", error);
                // Handle the error appropriately
            }
            res.status(200).json(hotelInfo);
            // console.log(hotelInfo);
        }
    });
});

// router.post('/search', (req, res, next) => {
//     const { location } = req.body;

//     var query = `SELECT h.*, hi.image FROM hotel h JOIN hotel_img hi WHERE h.id = hi.h_id and city = ? `;
//     connection.query(query, [location], (err, result) => {
//         if (err) {
//             console.error('Error executing query:', err);
//             res.status(500).json({ error: 'An error occurred' });
//         } else {
//             const hotelData = result.map(row => ({
//                 id: row.id,
//                 name: row.name,
//                 city: row.city,
//                 street_name: row.street_name,
//                 description: row.description,
//                 rate: row.rate,
//                 image: base64Encode(row.image),
//             }));
//             res.status(200).json(hotelData);
//             // console.log(hotelData);
//         }
//     });
// });

router.post('/search', (req, res, next) => {
    const { guests, location, checkin, checkout } = req.body;
    // console.log(guests, location, checkin, checkout);

    // var query = `CALL SearchAvailableRooms(?, ?, ?, ?)`;
    var query = `SELECT DISTINCT h.*,hi.image
    FROM room r
    JOIN hotel h JOIN hotel_img hi  ON r.h_id = h.id AND h.id = hi.h_id
    WHERE r.numberOfGuests >= ?
    
    AND h.city = ?
    AND r.id NOT IN (
        SELECT DISTINCT room_id
        FROM availability_calender
        WHERE date BETWEEN ? AND ?
        AND statue = 'booked')`;
    connection.query(query, [guests, location, checkin, checkout], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const hotelData = result.map(row => ({
                id: row.id,
                name: row.name,
                city: row.city,
                street_name: row.street_name,
                description: row.description,
                rate: row.rate,
                image: base64Encode(row.image),
            }));
            // const hotelData = result;
            res.status(200).json(hotelData);
            // console.log(hotelData);
        }
    });
});


module.exports = router;
