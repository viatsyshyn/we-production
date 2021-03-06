/**
 * Created by viatsyshyn on 10/26/15.
 */

var google = require('googleapis'),
    async = require('async');

var youtube = google.youtube('v3');

var API_KEY = process.env.GOOGLE_API_SERVER_KEY;

var featuredPlaylistId = 'PLzV6tpn4rBOWxesUoQmuAZZ_JmULtVCff';

var playlists = [
    //{tag: 'all',        id: 'PLzV6tpn4rBOUztp8xznAXtoynct-3hmE1'},
    {tag: 'music',      id: 'PLzV6tpn4rBOXGk7FCHEPdmjOM5TVehw8q'},
    {tag: 'commercial', id: 'PLzV6tpn4rBOV_3aTyWe7jyi-h8nmmtG_8'},
    {tag: 'sport',      id: 'PLzV6tpn4rBOXuNhjI7m7-ZcQRIdKiq31Q'},
    {tag: 'social',     id: 'PLzV6tpn4rBOXkqQQHrqeNjWBQB06XYvIK'},
    //{tag: 'corporate',  id: 'PLzV6tpn4rBOWCFYy4x1VkxZgb25YonsjS'},
    //{tag: 'tv-show',    id: 'PLzV6tpn4rBOWCFYy4x1VkxZgb25YonsjS', title: 'tv show'},
    //{tag: 'concert',    id: 'PLzV6tpn4rBOWXmSrPTxoIMmzFPrNLeveZ'},
];

function playlistItemsList(playlistId, cb) {
    youtube.playlistItems.list({
        key: API_KEY,
        part: 'snippet',
        maxResults: 50,
        playlistId: playlistId
    }, function (err, packet) {
        cb(err, packet && packet.items
            .map(function (_) {
                return _.snippet;
            }));
    });
}

function buildVideoCatalog(featuredPlaylistId, playlists, complete) {

    async.parallel({

        videos: function (next) {
            async.forEachLimit(Object.keys(playlists), 4, function (plIndex, next) {
                var playlist = playlists[plIndex];

                playlistItemsList(playlist.id, function (err, items) {
                    if (err) return next(err);

                    playlist.items = items
                        .filter(function (_) { return _.thumbnails !== undefined })
                        .map(function (_) {
                            var $tmp = _.thumbnails;
                            return {
                                id: _.resourceId.videoId,
                                maxres: ($tmp.maxres || $tmp.standard || $tmp.high).url,
                                lores: ($tmp.medium || $tmp.default || $tmp.high).url,
                                title: _.title.toLocaleLowerCase()
                                    .replace(/\([^\)]*\)/gi, '')
                                    .replace(/\[[^\]]*\]/gi, '')
                                    .replace(/\{[^\]]*\}/gi, '')
                                    .replace(/\/[^\/]*\//gi, '')
                                    .replace(/\d\d\.\d\d\.\d{2,4}/gi, ''),
                                description: _.description,
                                published: Math.ceil(Date.parse(_.publishedAt).valueOf() / 60000 * 60),
                                plRate: plIndex > 0 ? plIndex / playlists.length : 2,
                                vdRate: _.position / items.length,
                                tags: [playlist.tag],
                                position: _.position
                            }
                        });

                    next();
                })
            }, function (err) {
                if (err) return next(err);

                var $map = {},
                    videos = playlists
                        .reduce(function (acc, _) { return acc.concat(_.items); }, [])
                        .sort(function (_1, _2) {
                            return _1.position - _2.position;
                        })
                        .filter(function (_) {
                            return $map[_.id] ? ([].push.apply($map[_.id].tags, _.tags), false) : (($map[_.id] = _), true);
                        });

                playlists.forEach(function (_) {
                    _.default = videos.filter(function (v) { return v.tags.indexOf(_.tag) >= 0})[0] || {};
                });

                next(null, videos);
            });
        },

        featured: function (next) {
            playlistItemsList(featuredPlaylistId, function (err, items) {
                if (err) return next(err);
                next(null, items[0] || {});
            })
        }
    }, complete);
}

var catalog = null;

function refreshVideoCatalog(next) {
    buildVideoCatalog(featuredPlaylistId, playlists, function (err, data) {
        console.log('catalog rebuild', new Date().toString());
        if (err && next) return next(err);
        if (err) throw err;

        catalog = data;
        next && next(null, data);
    })
}

exports = module.exports = {
    refreshVideoCatalog: refreshVideoCatalog,
    getVideoCatalog: function () {
        return catalog;
    },
    getPlaylists: function () {
        return playlists;
    }
}
