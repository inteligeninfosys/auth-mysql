const express = require('express');
const router = express.Router();
const db  = require('./dbConnection');
const { signupValidation, loginValidation } = require('./validation');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', signupValidation, (req, res, next) => { 
  db.query(
    `SELECT * FROM tblusers WHERE LOWER(username) = LOWER(${db.escape(
      req.body.username
    )});`,
    (err, result) => {
      if (result.length) {
        return res.status(409).send({
          result: 'failure',
          msg: 'This user is already in use!'
        });
      } else {
        // username is available
        bcrypt.hash(req.body.pass, 10, (err, hash) => {
          if (err) {
            console.log(err)
            return res.status(500).send({
              msg: err.message
            });
          } else {
            // has hashed pw => add to database
            var query = `insert into tblusers (username, firstname,surname,lastname,emailaddress,pass,role,changepassword) VALUES ('${req.body.username}','${req.body.firstname}','${req.body.surname}','${req.body.lastname}', '${req.body.emailaddress}', ${db.escape(hash)},'${req.body.role}','${req.body.changepassword}')`
            //console.log(query)
            db.query(
              query,
              (err, result) => {
                if (err) {
                  console.error(err)
                  //throw err;
                  return res.status(400).send({
                    msg: err
                  });
                }
                return res.status(201).send({
                  result: 'success',
                  msg: 'The user has been registerd with us!'
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post('/login', loginValidation, (req, res, next) => {

  db.query(
    `SELECT * FROM tblusers WHERE lower(username) = LOWER(${db.escape(
      req.body.username
    )});`,
    (err, result) => {
      // user does not exists
      if (err) {
        console.log(err);
        return res.status(400).send({
          msg: err
        });
      }

      if (!result.length) {
        return res.status(401).send({
          msg: 'username or password is incorrect!'
        });
      }
      // check password
      bcrypt.compare(
        req.body.pass,
        result[0]['pass'],
        (bErr, bResult) => {
          // wrong password
          if (bErr) {
            console.log(bErr);
            return res.status(401).send({
              result: 'failure',
              msg: 'Email or password is incorrect!'
            });
          }
          if (bResult) {
            const token = jwt.sign({id:result[0].id},'the-super-strong-secrect',{ expiresIn: '1h' });
            db.query(
              `UPDATE tblusers SET loggedin='Y', lastlogin = now() WHERE username = '${result[0].username}'`
            );
            return res.status(200).send({
              result: 'success',
              msg: 'Logged in!',
              token,
              user: result[0]
            });
          }
          return res.status(401).send({
            result: 'failure',
            msg: 'Username or password is incorrect!'
          });
        }
      );
    }
  );
});

router.post('/passwdreset', signupValidation, (req, res, next) => {
  db.query(
    `SELECT * FROM tblusers WHERE LOWER(username) = LOWER(${db.escape(
      req.body.username
    )});`,
    (err, result) => {
      if (!result.length) {
        return res.status(409).send({
          result: 'NO',
          msg: 'This user is not registerd!'
        });
      } else {
        // username is available
        bcrypt.hash(req.body.pass, 10, (err, hash) => {
          if (err) {
            console.log(err)
            return res.status(500).send({
              msg: err.message
            });
          } else {
            // has hashed pw => add to database
            var query = `update tblusers set pass= ${db.escape(hash)} where username='${req.body.username}'`
            //console.log(query)
            db.query(
              query,
              (err, result) => {
                if (err) {
                  console.error(err)
                  //throw err;
                  return res.status(400).send({
                    msg: err
                  });
                }
                return res.status(201).send({
                  result: 'OK',
                  msg: 'Password is succesfully reset!'
                });
              }
            );
          }
        });
      }
    }
  );
});

router.post('/get-user', signupValidation, (req, res, next) => {


    if(
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer') ||
        !req.headers.authorization.split(' ')[1]
    ){
        return res.status(422).json({
            message: "Please provide the token",
        });
    }

    const theToken = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(theToken, 'the-super-strong-secrect');


    //db.query('SELECT * FROM tblusers where username=?', decoded.iat, function (error, results, fields) {
      db.query("SELECT * FROM tblusers where username='" + req.body.username + "'", function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results[0], message: 'Fetch Successfully.' });
    });


});


module.exports = router;
