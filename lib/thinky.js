"use strict";

const config = require('../config.json');

const thinky = require('thinky')({db: config.DBName});
module.exports = thinky;