const express = require('express');
const connection = require('../connection');
const router = express.Router();
const auth = require('../services/authentication');


router.post('/roomInsert', (req, res) => {
    const { name, view, price, h_id } = req.body;

    connection.query(`insert into room (name,view,price,h_id) values ( ?, ?, ?,?)`, [name, view, price, h_id], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
        }
        console.log('Data inserted successfully:', result);
        return res.json({ message: 'Data inserted successfully' });
    });
});

router.post('/roomImageInsert', auth.authenticateToken, (req, res) => {
    // console.log("image ", req.files);
    console.log("received data : ", req.body);
    console.log("received image : ", req.files.image);
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.image) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }
    const r_id = req.body.r_id;
    const image = req.files.image; // Image data in binary forma
    if (!image) {
        console.error('No image uploaded');
        return res.status(400).json({ message: 'No image uploaded' });
    }
    console.log("rid : ", r_id);

    connection.query(`INSERT INTO room_img (r_id, image) VALUES (?, ?)`, [r_id, image.data], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
        }
        console.log('Data inserted successfully:', result);
        return res.json({ message: 'Data inserted successfully' });
    });
});

router.get('/getRooms', (req, res, next) => {

    var query = `select * from room order by name`;
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

router.get('/getHotelRooms', (req, res, next) => {
    const hotelId = req.query.hotelId;
    console.log("hotelId for room : ", hotelId);

    var query = `SELECT r.*, ri.image AS image
    FROM room r 
    JOIN hotel h ON r.h_id = h.id
    JOIN room_img ri ON ri.r_id = r.id 
    WHERE h.id = ${hotelId}
    GROUP BY r.id, ri.image ;
    `;
    connection.query(query, [hotelId], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const roomData = result.map(row => ({
                id: row.id,
                name: row.name,
                view: row.view,
                price: row.price,
                h_id: row.h_id,
                image: base64Encode(row.image),
            }));
            res.status(200).json(roomData);
            console.log("roomData", roomData);
        }
    });
});


router.get('/getRoom', (req, res, next) => {
    const rname = req.query.rname;

    var query = `SELECT r.*,ri.image , r.id as rid FROM room r JOIN room_img ri JOIN hotel h WHERE r.id = ri.r_id and h.id = r.h_id and r.name = '${rname}' ; `;
    connection.query(query, [rname], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred' });
        } else {
            const roomInfo = result[0];
            try {
                roomInfo.image = base64Encode(roomInfo.image);
            } catch (error) {
                console.error("Error encoding image:", error);
                // Handle the error appropriately
            }
            res.status(200).json(roomInfo);
            // console.log(roomInfo);
        }
    });
});


module.exports = router;