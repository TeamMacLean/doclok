const express = require('express');
const router = express.Router();

/* GET home page. */
router.route('/docs/**/*')
    .all(isPartOfGroup)
    .get((req, res)=>{
    });

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.session.returnTo = req.path;
        return res.redirect('/signin');
    }
}

function isPartOfGroup(req, res, next) {

    if (_isAdmin(req)) {
        return next();
    }

    if (!req.user) {
        return next('not signed in');
    }
    const currentUserGroups = req.user.memberOf;
    const reqGroup = req.params.group;

    if (!reqGroup) {
        return next('not found');
    }


    //currentUserGroup is an array of all groups the user is a member of

    const match = config.groups.filter(function (g) {
        const groupsGroupName = g.memberOf;

        let found = false;
        currentUserGroups.map(function (cug) {
            if (cug === groupsGroupName) {
                found = true;
            }
        });
        return found;
    });

    //if (match.length > 1) {
    //  return next('error, too many groups found. sorry');
    //}
    if (match.length < 1) {
        return next('you could not be found in the groups list');
    }

    Group.filter({name: match[0].name.toLowerCase()}).then(function (groups) {
        if (groups.length < 1) {
            return next('group name ' + match[0].name + ' not found, please check that the config matches the group names in the DB');
        } else {
            const group = groups[0];
            if (group.safeName.toLowerCase() === reqGroup.toLowerCase()) {
                return next();
            } else {
                return next('you do not have permission to view this group');
            }
        }
    });
}

function _isAdmin(req) {
    if (req.isAuthenticated()) {
        return config.admins.indexOf(req.user.username) > -1;
    } else {
        return false;
    }
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (isAdmin(req)) {
            return next();
        } else {
            return res.render('error', {error: 'you must be an admin to preform that action'});
        }
    } else {
        //they are not signed in, cannot be an admin
        req.session.returnTo = req.path;
        return res.redirect('/signin');
    }
}

module.exports = router;
