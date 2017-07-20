const express = require('express');
const router = express.Router();
const passport = require('passport');
const config = require('./config.json');
const path = require('path');
const fs = require('fs');

function getDocs(user) {
    const userGroups = user.memberOf;

    return config.groups.filter(function (g) {
        const groupsGroupName = g.group;

        let found = false;
        userGroups.map(function (cug) {
            if (cug === groupsGroupName) {
                found = true;
            }
        });
        return found;
    });
}

router.route('/')
    .get((req, res) => {

        let docs = [];

        if (req.user) {
            docs = getDocs(req.user);
        }

        return res.render('index', {docs});
    });

router.route(['/signin', '/login'])
    .get((req, res) => {
        return res.render('signin');
    })
    .post((req, res, next) => {
        passport.authenticate('ldapauth', function (err, user, info) {
            if (err) {
                console.error(err);
                return next(err);
            }
            if (info) {
                // console.log(info);
            }
            if (!user) {
                let message = 'No such user';
                if (info && info.message) {
                    message += ', ' + info.message;
                }
                return res.render('error', {error: message});
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                //take them to the page they wanted before signing in :)
                if (req.session.returnTo) {
                    return res.redirect(req.session.returnTo);
                } else {
                    return res.redirect('/');
                }
            });
        })(req, res, next);
    });

router.route(['/signout', '/logout'])
    .get((req, res) => {
        req.logout();
        res.redirect('/');
    });

router.route('/docs')
    .all(canAccess)
    .get((req, res) => {
        let docs = getDocs(req.user);
        return res.render('docs', {docs})

    });

/* GET home page. */
router.route(['/docs/:name/', '/docs/:name/*'])
    .all(canAccess)
    .get((req, res) => {

        let splitted = req.url.split('/');
        splitted.shift();
        splitted.splice(2, 0, "docs");


        let docFile = path.posix.join(__dirname, ...splitted);

        docFile = docFile.split('?')[0];

        if (!fs.existsSync(docFile)) {
            return res.status(404)        // HTTP status 404: NotFound
                .send('Not found');
        }

        try {
            if (fs.lstatSync(docFile).isDirectory()) {
                docFile = path.join(docFile, 'index.html');
            }
        } catch (err) {
            //ERROR
        }

        return res.sendFile(docFile)

    });

function canAccess(req, res, next) {

    if (!req.isAuthenticated()) {
        req.session.returnTo = req.path;
        return res.redirect('/signin');
    }

    let docs = getDocs(req.user);

    if (docs.indexOf(req.params.name)) {
        return next();

    } else {
        return res.send('permission denied');
    }

}

module.exports = router;