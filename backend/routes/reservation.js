const express = require('express');
const router = express.Router();
const connection = require('../connection');
const auth = require('../services/authentication');

// router.post('/reserveInsert', auth.authenticateToken, (req, res) => {
//     const { r_id, checkin_date, checkout_date, cardNumber, expire_date, verification_code, name_on_Card } = req.body;
//     const u_id = res.locals.id;
//     connection.query('INSERT INTO reservation (room_id, u_id, check_in_date, check_out_date, card_number, expire_date, verification_code, name_card) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
//         [r_id, u_id, checkin_date, checkout_date, cardNumber, expire_date, verification_code, name_on_Card],
//         (err, result) => {
//             if (err) {
//                 console.error('Error inserting data:', err);
//                 return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
//             }
//             console.log('Data inserted successfully:', result);
//             return res.json({ message: 'Data inserted successfully' });
//         });
// });


router.post('/reserveInsert', auth.authenticateToken, (req, res) => {
    const { r_id, checkin_date, checkout_date, cardNumber, expire_date, verification_code, name_on_Card } = req.body;
    const u_id = res.locals.id;
    connection.query('INSERT INTO reservation (room_id, u_id, check_in_date, check_out_date, card_number, expire_date, verification_code, name_card) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r_id, u_id, checkin_date, checkout_date, cardNumber, expire_date, verification_code, name_on_Card],
        (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                return res.status(500).json({ message: 'Error Inserting Data', error: err.message });
            }
            console.log('Data inserted successfully:', result);
            return res.json({ message: 'Data inserted successfully' });
        });
});
module.exports = router;
