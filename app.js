const path = require('path');
const multer = require('multer');
const bodyParser = require('body-parser');
const routes = require('./routes');
const config = require('./config.json');
const fs = require('fs');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const util = require('./lib/auth');
const rethinkSession = require('session-rethinkdb')(session);
const schedule = require('node-schedule');
const moment = require('moment');
// const email = require('./lib/email');


const express = require('express');
const app = express();
const server = require('http').createServer(app);

app.locals.title = config.appName;
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

const options = {
    servers: [
        {host: 'localhost', port: 28015, db: config.DBName}
    ]
};

const store = new rethinkSession(options);

app.use(session({
    secret: config.secret,
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    if (req.user !== null) {
        res.locals.signedInUser = {};
        res.locals.signedInUser.username = req.user.username;
        res.locals.signedInUser.name = req.user.name;
        res.locals.signedInUser.mail = req.user.mail;
    }
    next(null, req, res);
});

util.setupPassport();


app.use(routes);

app.use(function (err, req, res, next) {
    if (err) {
        console.error(err);
        return res.status(500).render('error', {error: err});
    } else {
        return next();
    }
});


module.exports = server;

