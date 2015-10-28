var express = require('express');
var async = require('async');

var app = express();

app.use(express.static(__dirname + '/public'));

var youtube = require('./app/services/youtube');

async.waterfall([

    function (next) {
        console.log('starting app');
        next(null, app);
    },

    require('./app/config'),

    function (app, next) {
        console.log('initialize youtube');

        app.set('youtube', youtube);

        var videoCatalogTimestamp = new Date();
        app.use(function (req, res, next) {
            if (videoCatalogTimestamp.getTime() + 4 * 3660 * 1000 < new Date().getTime() ) {
                refreshVideoCatalog();
                videoCatalogTimestamp = new Date();
            }

            next();
        });

        youtube.refreshVideoCatalog(function (err) {
            next(err, app);
        });
    },

    require('./app/routes'),

    function (app, next) {
        console.log('binding port', app.get('port'));

        app.listen(app.get('port'), function () {
            next();
        });
    }

], function (err) {
    if (err) throw err;

    console.log("Node app is running at localhost:" + app.get('port'));
});


