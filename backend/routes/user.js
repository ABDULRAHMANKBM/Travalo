const express = require('express');
const connection = require('../connection');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
var auth = require('../services/authentication');
var checkRole = require('../services/checkRols');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// const csrf = require('csurf');

// Import CSRF middleware and configure
// const csrfProtection = csrf({ cookie: true });

// Use CSRF middleware for all routes in this router
// router.use(csrfProtection);



router.post('/signup', async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    let user = req.body;
    let selectQuery = "SELECT email FROM user WHERE email = ?";
    connection.query(selectQuery, [user.email], (selectErr, selectResult) => {
        if (!selectErr) {
            if (selectResult.length <= 0) {
                const token = crypto.randomBytes(32).toString('hex');
                const tokenExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
                let insertQuery = "INSERT INTO user (fname, lname, gender, phone_number, email, password, role, token, token_expiry, statue) VALUES (?, ?, ?, ?, ?, ?, 'user', ?, ?, 'false')";
                connection.query(insertQuery, [user.fname, user.lname, user.gender, user.phoneNumber, user.email, hashedPassword, token, tokenExpiry], (insertErr, insertResult) => {
                    if (!insertErr) {
                        sendEmailVerification(token, user.email);
                        return res.status(200).json({ message: "Email verification sent to you successfully" })
                    } else {
                        return res.status(500).json(insertErr);
                    }
                });
            } else {
                return res.status(400).json({ message: "Email already exists!" });
            }
        } else {
            return res.status(500).json(selectErr);
        }
    });
});


//////////////////// signup without email verfication /////////////////////////////////
// router.post('/signup', async (req, res) => { 
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(req.body.password, salt);
//     let user = req.body;
//     let selectQuery = "select email,password,role from user where email = ?";
//     connection.query(selectQuery, [user.email], (selectErr, selectResult) => {
//         if (!selectErr) {
//             if (selectResult.length <= 0) {
//                 let insertQuery = "INSERT INTO user(fname,lname,gender,phone_number,email,password,role) values (?,?,?,?,?,?,'user');"
//                 connection.query(insertQuery, [user.fname, user.lname, user.gender, user.phoneNumber, user.email, hashedPassword], (insertErr, insertResult) => {
//                     if (!insertErr) {
//                         return res.status(200).json({ message: "successfully registered" });
//                     } else {
//                         return res.status(500).json(insertErr);
//                     }
//                 });
//             } else {
//                 return res.status(400).json({ message: "email already exists !!" });
//             }
//         } else {
//             return res.status(500).json(selectErr);
//         }
//     });
// });


// router.post('/login', (req, res) => {
//     const user = req.body;
//     query = "select email,password,role from user where email=?";
//     connection.query(query, [user.email], (err, result) => {
//         console.log(user.email);
//         console.log(user.password);
//         if (!err) {
//             if (result.length <= 0 || result[0].password != user.password) {
//                 return res.status(401).json({ message: "incorrect username or password" })
//             }
//             // else if (result[0].statue === "false") {
//             //     return res.status(401).json({ message: "Wait For Admin Approval" });
//             // }
//             else if (result[0].password == user.password) {
//                 const response = { email: result[0].email, role: result[0].role };
//                 const secretKey = process.env.ACCESS_TOKEN;

//                 // const payload = { user_id: 123 };
//                 const accessToken = jwt.sign(response, secretKey, { expiresIn: '1h' });
//                 res.status(200).json({ token: accessToken });
//                 // console.log("Login Successful");
//             }
//             else {
//                 console.log("Incorrect password for user");
//                 return res.status(400).json({ message: "Something wrong. Please try again later" });
//             }
//         }
//         else {
//             console.log(err);
//             return res.status(500).json(err);
//         }
//     })
// });

router.post('/verify-email', (req, res) => {
    const token = req.query.token;
    console.log("token is ", token);
    if (!token) {
        return res.status(400).json({ message: "Invalid token." });
    }

    const selectQuery = "SELECT id, token_expiry FROM user WHERE token = ?";
    connection.query(selectQuery, [token], (selectErr, selectResult) => {
        if (selectErr) {
            return res.status(500).json(selectErr);
        }

        if (selectResult.length > 0) {
            const currentDate = new Date();
            const tokenExpiryDate = new Date(selectResult[0].token_expiry);

            if (currentDate > tokenExpiryDate) {
                console.log("Token expired.");
                return res.status(400).json({ message: "Token expired. Please request a new verification email." });
            }

            const updateQuery = "UPDATE user SET statue = 'true', token = NULL, token_expiry = NULL WHERE id = ?";
            connection.query(updateQuery, [selectResult[0].id], (updateErr, updateResult) => {
                if (updateErr) {
                    return res.status(500).json(updateErr);
                }
                return res.status(200).json({ message: "Email verified successfully. You can now log in." });
            });
        } else {
            return res.status(400).json({ message: "Invalid link. Please try to log in to receive a new verification link." });
        }
    });
});





function sendEmailVerification(token, email) {
    const verificationLink = `http://localhost:4200/emailVerification?token=${token}`;
    var mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Email Verification',
        html: `<p>Please verify your email by clicking on the link: <a href="${verificationLink}">Verify Email</a></p>`
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return res.status(500).json({ message: "Error sending email." });
        } else {
            return res.status(200).json({ message: "Verification email sent. Please check your email to verify your account." });
        }
    });
}



router.post('/login', async (req, res) => {
    const user = req.body;
    query = "SELECT id, email, password, role, statue FROM user WHERE email=?";
    connection.query(query, [user.email], async (err, result) => {
        if (!err) {
            if (result.length <= 0 || result[0].statue !== 'true') {
                verificationQuery = "select token,token_expiry from user where email=?";
                connection.query(verificationQuery, [user.email], async (err1, res) => {
                    if (!err1) {
                        console.log("enter !err1")

                        const currentDate = new Date();
                        const tokenExpiryDate = new Date(res[0].token_expiry);
                        console.log("Current Date:", currentDate.toLocaleString());

                        console.log("Token Expiry Date:", currentDate.toLocaleString());
                        if (currentDate.toLocaleString() > tokenExpiryDate.toLocaleString()) {
                            console.log("enter if");
                            const token = crypto.randomBytes(32).toString('hex');
                            const tokenExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now
                            tokenQuery = "UPDATE user SET token = ?, token_expiry = ? WHERE id = ?";
                            connection.query(tokenQuery, [token, tokenExpiry, result[0].id], async (err2, result2) => {
                                if (!err2) {
                                    console.log("sending email")
                                    sendEmailVerification(token, user.email);
                                    // return result2.status(200).json({ message: "Email verification resent to you successfully" })
                                }
                                else {
                                    // return result2.status(500).json({ message: "Error sending email." });
                                }
                            })
                        }
                        else if (tokenExpiryDate != null && res[0].token != null) {
                            sendEmailVerification(res[0].token, user.email);
                        }
                        else {
                            console.log("else error");
                        }
                    }
                    else {
                        console.log("enter err1")
                        return res.status(401).json({ err1 });
                    }
                })
                return res.status(401).json({ message: "Account not verified or incorrect username/password." });
            }

            if (await bcrypt.compare(user.password, result[0].password)) {
                // const response = { id: result[0].id, email: result[0].email, role: result[0].role };
                // const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' });
                // res.cookie('jwt', accessToken, {
                //     httpOnly: true,
                //     maxAge: 24 * 60 * 60 * 1000 // 1 day
                // });
                // res.status(200).json({ token: accessToken });
                const response = { id: result[0].id, email: result[0].email, role: result[0].role };
                const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '15m' });
                const refreshToken = jwt.sign(response, process.env.REFRESH_TOKEN, { expiresIn: '7d' });

                // Store refresh token in the database
                connection.query('UPDATE user SET refresh_token = ? WHERE id = ?', [refreshToken, user.id], (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ message: "Error saving refresh token." });
                    }

                    res.cookie('jwt', accessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        maxAge: 15 * 60 * 1000 // 15 minutes
                    });

                    res.cookie('refreshJwt', refreshToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });

                    res.status(200).json({
                        message: "Login successful",
                        token: accessToken,
                        refreshToken: refreshToken
                    });

                });
            } else {
                return res.status(401).json({ message: "Incorrect username or password." });
            }
        } else {
            return res.status(500).json(err);
        }
    });
});

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies['refreshJwt'];
    if (!refreshToken) {
        return res.sendStatus(401);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
        if (err) {
            return res.sendStatus(403);
        }

        const newAccessToken = jwt.sign({ id: decoded.id, email: decoded.email, role: decoded.role }, process.env.ACCESS_TOKEN, { expiresIn: '15m' });

        res.cookie('jwt', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.status(200).json({ message: "Token refreshed" });
    });
});

router.post('/logout', (req, res) => {
    const refreshToken = req.cookies['refreshJwt'];

    // Remove the refresh token from the database
    connection.query('UPDATE user SET refresh_token = NULL WHERE id = ?', [res.locals.id], (err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out." });
        }

        res.cookie('jwt', '', { maxAge: 0 });
        res.cookie('refreshJwt', '', { maxAge: 0 });

        res.status(200).json({ message: 'Logged out' });
    });
});



///////////////////////// login without email verifaction ////////////////////////////////

// router.post('/login', async (req, res) => { 
//     console.log("Login route called");
//     const user = req.body;
//     console.log("user : ", user);
//     query = "select id ,email,password,role from user where email=?";
//     connection.query(query, [user.email], async (err, result) => {
//         if (!err) {

//             // else if (result[0].statue === "false") {
//             //     return res.status(401).json({ message: "Wait For Admin Approval" });
//             // }
//             if (await bcrypt.compare(user.password, result[0].password) || user.password === result[0].password) {
//                 const response = { id: result[0].id, email: result[0].email, role: result[0].role };
//                 // console.log("response  ", response)
//                 const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' });
//                 // console.log(process.env.ACCESS_TOKEN);
//                 res.cookie('jwt', accessToken, {
//                     httpOnly: true,
//                     maxAge: 24 * 60 * 60 * 1000 // 1 day
//                 });
//                 res.status(200).json({ token: accessToken });
//                 // console.log(res.locals);
//             }
//             else if (result.length <= 0 || !await bcrypt.compare(user.password, result[0].password) || user.password !== result[0].password) {
//                 return res.status(401).json({ message: "incorrect username or password" })
//             }
//             else {
//                 return res.status(400).json({ message: "Something wrong. Please try again later" });
//             }
//         }
//         else {
//             return res.status(500).json(err);
//         }
//     })
// });





router.get('/user', auth.authenticateToken, (req, res) => {
    const user = "select id ,email,password,role from user where id=?";
    connection.query(user, [req.user.id], (err, result) => {

    })
    return res.status(200).json({ message: "true" })
});

// router.post('/logout', async (req, res) => {

//     res.cookie('jwt', '', { maxAge: 0 })

//     res.send({ message: 'Logged out' });
// })

router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" })
});

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

router.post('/forgotpassword', (req, res) => {
    const user = req.body;
    // console.log(user);
    query = "select password, email from user where email = ?";
    connection.query(query, [user.email], (err, result) => {
        if (!err) {
            if (result.length <= 0 || !result[0].email) {
                return res.status(400).json({ message: "Email not found or invalid." });
            } else {
                const recipientEmail = result[0].email;
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: recipientEmail,
                    subject: 'Password by TRAVALO',
                    html: `<p><b>Your Login details to orient touch </b><br><b>Email : </b>${recipientEmail}<br> <b>Password :  </b>${result[0].password}<br><a href="http://localhost:4200/">Click here to login</a></p>`
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.error('Error sending email:', error);
                        return res.status(500).json({ message: "Error sending email." });
                    } else {
                        console.log('Email sent:', info.response);
                        return res.status(200).json({ message: "Password sent successfully to your email." });
                    }
                });
            }
        } else {
            console.error('Database error:', err);
            return res.status(500).json({ message: "Database error." });
        }
    });
});

router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    var query = "select * from user where role = 'user'";
    connection.query(query, (err, result) => {
        if (!err) {
            return res.status(200).json(result);
        }
        else {
            return res.status(500).json(err);
        }
    });
});

router.patch('/updateRole', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    let user = req.body;
    var query = "update user set statue = ? where id = ?";
    connection.query(query, [user.statue, user.id], (err, result) => {
        if (!err) {
            if (result.affectedRows == 0) {
                return res.status(404).json({ message: "id don't exist" });
            }
            else return res.status(200).json({ message: "user updated successfully" });
        }
        else {
            res.status(500).json(err);
        }
    });
});

router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({ message: "true" })
});

// router.post('/changePassword', auth.authenticateToken, (req, res) => {
//     const user = req.body;
//     const email = res.locals.email;
//     var query = "select * from user where email = ? and password = ?"
//     connection.query(query, [email, user.oldPassword], (err, result) => {
//         if (!err) {
//             if (result.length <= 0) {
//                 return res.status(400).json({ message: "Incorrect old password" })
//             }
//             else if (result[0].password == user.oldPassword) {
//                 query = "update user set password = ? where email = ?";
//                 connection.query(query, [user.newPassword, email], (err, result) => {
//                     if (!err) {
//                         return res.status(200).json({ message: "Password updated successfully" });
//                     }
//                     else return res.status(500).json(err);
//                 })
//             }
//             else return res.status(400).json({ message: "Something went wrong . Please try again later" })
//         }
//         else return res.status(500).json(err);
//     });
// });

router.post('/changePassword', auth.authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const email = res.locals.email;

    try {
        // Fetch the user from the database
        const query = "SELECT password FROM user WHERE email = ?";
        connection.query(query, [email], async (err, result) => {
            if (err) {
                return res.status(500).json(err);
            }

            if (result.length <= 0) {
                return res.status(400).json({ message: "User not found" });
            }

            const user = result[0];

            // Compare the old password
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect old password" });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update the password in the database
            const updateQuery = "UPDATE user SET password = ? WHERE email = ?";
            connection.query(updateQuery, [hashedPassword, email], (updateErr, updateResult) => {
                if (updateErr) {
                    return res.status(500).json(updateErr);
                }

                return res.status(200).json({ message: "Password updated successfully" });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Error occurred", error: error.message });
    }
});


module.exports = router;
