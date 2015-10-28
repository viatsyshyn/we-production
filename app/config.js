/**
 * Created by viatsyshyn on 10/26/15.
 */

exports = module.exports = function (app, next) {

    console.log('initialize app');

    app.set('port', (process.env.PORT || 5000));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');

    app.locals.keys = {
        GOOGLE_API_BROWSER_KEY: process.env.GOOGLE_API_BROWSER_KEY
    };

    next(null, app);
};