/**
 * Created by viatsyshyn on 10/26/15.
 */

var FS = require('fs');

exports = module.exports = function (app, next) {

    console.log('initialize routes');

    var youtube = app.get('youtube');

    app.get('/', function(req, res) {
        var videoFeatured = youtube.getVideoCatalog().featured;
        res.render('home', {
            pageClass: 'home',
            videoId: videoFeatured.resourceId.videoId,
            video: videoFeatured
        });
    });

    app.get(['/video', '/video/:playlistTag', '/video/:playlistTag/:videoId'], function(req, res){
        var playlistTag = req.params.playlistTag || 'all';
        var videoCatalog = youtube.getVideoCatalog().videos;
        var playlists = youtube.getPlaylists();

        var video = videoCatalog.filter(function (_) {
                return _.id == req.params.videoId;
            })[0] || videoCatalog.filter(function (_) {
                return _.tags.indexOf(playlistTag) >= 0;
            })[0] || {};

        res.render('video', {
            pageClass: 'video',
            playlists: playlists,
            playlistTag: playlistTag,
            catalog: videoCatalog,
            video: video
        });
    });

    var clientsList = JSON.parse(FS.readFileSync('./public/clients/clients.json'));
    var rentList = JSON.parse(FS.readFileSync('./public/rent/rent.json'));
    //var plusActivities = JSON.parse(FS.readFileSync('./plus/102816136635817065628.json')).items;

    app.get('/about-us', function(req, res) {
        res.render('about-us', { pageClass: 'about-us', clientsList: clientsList });
    });

    app.get('/rent', function(req, res) {
        res.render('rent', { pageClass: 'rent', rentList: rentList });
    });

    /*app.get('/blog', function(req, res) {
        res.render('blog', { pageClass: 'blog', activitesList: plusActivities });
    });*/

    app.get('/refresh-video-catalog', function(req, res, next){
        youtube.refreshVideoCatalog(function (err, videoCatalog) {
            if (err) return next(err);
            res.send(JSON.stringify(videoCatalog));
        });
    });

    next(null, app);
};