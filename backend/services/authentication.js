require('dotenv').config();

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const token = req.cookies.jwt;
    console.log('token : ', token);
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.sendStatus(403);
        }
        res.locals = decoded;
        next();
    });
}

module.exports = { authenticateToken };


// const jwt = require('jsonwebtoken');

// function authenticateToken(req, res, next) {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (token == null) {
//         return res.sendStatus(401);
//     }
//     jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
//         if (err) {
//             return res.sendStatus(403);
//         }
//         res.locals = decoded;
//         console.log("local", decoded);
//         console.log("locals", res.locals);
//         // res.locals.id = response.id; // Assuming 'id' is the property in the decoded token
//         next();
//     });
// }

// function authenticateToken(req, res, next) {
//     try {
//         const cookie = req.cookies['jwt'];

//         const claims = jwt.verify(cookie, process.env.ACCESS_TOKEN);
//         if (!claims) {
//             return res.sendStatus(403);
//         }

//     }
//     catch (err) {
//         return res.status(401).send({
//             message: 'Unauthorized'
//         })
//     }
// }
// module.exports = { authenticateToken: authenticateToken }