"use strict";
const express = require('express');
const DB = require('./db');
const config = require('./config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, `${req.body.author}-${req.body.name}.${file.originalname.split('.').pop()}` )
  }
});
const upload = multer({storage});

const db = new DB("sqlitedb")
const app = express();
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}
app.use(allowCrossDomain);

app.use(express.static('uploads'));

router.post('/registration', function(req, res) {
  db.insertUser([
    req.body.name,
    req.body.email,
    bcrypt.hashSync(req.body.password, 8)
  ],
  function (err) {
      if (err) return res.status(500).send("There was a problem registering the user.")
      db.selectByEmail(req.body.email, (err,user) => {
        if (err) return res.status(500).send("There was a problem getting user")
        
        let token = jwt.sign(
            { 
              id: user.id 
            }, 
            config.secret, 
            {
              expiresIn: 86400
            });
        console.dir(user)
        res.status(200).send(
          { 
            auth: true, 
            token: token, 
            user: user 
          });
      }); 
  }); 
});

router.post('/login', (req, res) => {
  db.selectByEmail(req.body.email, (err, user) => {
    if (err) return res.status(500).send('Error on the server.');
  
    if (!user) return res.status(404).send('No user found.');
    
    let passwordIsValid = bcrypt.compareSync(req.body.password, user.user_pass);
    
    if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
    
    let token = jwt.sign(
      { id: user.id }, 
      config.secret, 
      { expiresIn: 86400 
      });
    
    res.status(200).send({
      auth: true,
      token: token,
      user: user
    });
  });
});

router.get('/auth', (req, res) => {
  if (req.headers.authorization) {
    jwt.verify(
      req.headers.authorization,
      config.secret,
      (err, payload) => {
        if (err) return false;
        else if (payload) {
          db.selectById(payload.id, (err, user) => {
            if (err) return res.status(500).send('Error on the server.');      
            if (!user) return res.status(404).send('No user found.');  
            res.status(200).send({
              auth: true,
              user: user
            });
          });
        }
      }
    );
  }
});

router.post('/upload', upload.any(), (req, res) => {
  if (req.headers.authorization) {
    jwt.verify(
      req.headers.authorization,
      config.secret,
      (err, payload) => {
        if (err) return false;
        else if (payload) {
          db.insertTrack([
            req.body.author,
            req.body.name,
            req.body.genre,
            `${req.body.author}-${req.body.name}.${req.files[0].originalname.split('.').pop()}`,
            payload.id
          ],
          function (err) {
            if (err) return res.status(500).send("There was a problem upload the track.");
            res.status(200).send();
          });
        }
      }
    );
  }
})

app.use(router)
let port = process.env.PORT || 3000;
let server = app.listen(port, function() {
    console.log('Express server listening on port ' + port)
});