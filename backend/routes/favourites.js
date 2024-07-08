const express = require('express');
const connection = require('../connection');
const router = express.Router();
const auth = require('../services/authentication');


router.post('/favInsert', (req, res) => {
    const { h_id } = req.body;
    u_id = res.locals.id;
    console.log("hid = ", h_id, "  uid = ", u_id);


    connection.query(`insert into favourites (h_id,u_id) VALUES (?,?)`, [h_id, u_id], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
        }
        console.log('Data inserted successfully:', result);
        return res.json({ message: 'Data inserted successfully' });
    });
});

const base64Encode = (buffer) => {
    return Buffer.from(buffer).toString('base64');
};


router.get('/getFav', auth.authenticateToken, (req, res, next) => {
    u_id = res.locals.id;
    console.log("Getting favourites for user id: ", u_id);
    console.log("fav locals : ", res.locals);

    var query = `select f.h_id,f.u_id,h.*,hi.image from favourites f JOIN hotel h JOIN hotel_img hi  where f.h_id=h.id and hi.h_id=h.id and f.u_id = ? group by 
    h.id, 
    h.name, 
    hi.image;`;
    connection.query(query, [u_id], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'An error occurred' });
        }
        else {
            const fav = result.map(row => ({
                id: row.id,
                name: row.name,
                city: row.city,
                street_name: row.street_name,
                description: row.description,
                rate: row.rate,
                h_id: row.h_id,
                u_id: row.u_id,
                image: base64Encode(row.image),
            }));
            res.status(200).json(fav);
        }
    });
});

module.exports = router;