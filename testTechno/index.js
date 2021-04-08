var client = require('./config/bd');

const express = require('express');
const app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

var moment = require('./config/moment');
app.locals.moment = require('./config/moment');

var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

var session = require("express-session");
const { ObjectId } = require('bson');
//app.use(express.static("public"));

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    session.cookie.secure = true // serve secure cookies
}

app.use(session({
    secret: "cats",
    cookie: { _expires: 50 * 60 * 60000 } //50 min
}));

app.use(passport.initialize());
app.use(passport.session());

client.connect(function (err) {
    const db = client.db("gsbTest");
    if (err) throw err;

    passport.use(new LocalStrategy(
        function (username, password, done) {
            db.collection("visiteur").findOne({ login: username }, function (err, user) {

                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (user.password != password) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
        }
    ));
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });


    app.set('view engine', 'ejs');


    app.get('/', (req, res) => {
        res.redirect('/pageConnexion')
    });

    app.get('/pageConnexion', (req, res) => {
        res.render('pageConnexion')
    });

    app.post('/pageConnexion',
        passport.authenticate('local', { //peut etre: local-login
            successRedirect: '/pageAcceuil',
            failureRedirect: '/pageConnexion',
        })
    );

    app.get('/pageAcceuil', (req, res) => {

        var User = req.session.passport.user;
        var fichedefrais = User.fichedefrais[0];
        res.render('pageAcceuil', {
            user: User,
            forfaitise: fichedefrais.forfaitise,
            horsForfait: fichedefrais.horsforfait
        })
    })

    app.get('/historique', (req, res) => {
        var User = req.session.passport.user;
        var fichedefrais = User.fichedefrais;
        res.render('historique', { fichedefrais: fichedefrais })
    })

    app.get('/pageDetail/:id', (req, res) => {
        var User = req.session.passport.user;
        var fichedefrais = User.fichedefrais;

        fichedefrais.forEach(function (unefiche) {
            if (unefiche._id == req.params.id) {
                res.render('pageDetail', {
                    date: unefiche.dateDebut,
                    forfaitise: unefiche.forfaitise,
                    horsforfait: unefiche.horsforfait
                })
            }
        });
    })

    app.get('/pageAddHf', (req, res) => {
        res.render('pageAddHf')
    })

    app.post('/pageAddHf', (req, res) => {

        var User = req.session.passport.user;
        var fichedefrais = User.fichedefrais[0];
        db.collection('visiteur').updateOne(
            {
                "_id": ObjectId(User._id),
                "fichedefrais._id": ObjectId(fichedefrais._id)
            }, {
            $push: {
                "fichedefrais.$.horsforfait":
                {
                    "_id": ObjectId(),
                    "libelle": req.body.libelle,
                    "prix": parseFloat(req.body.montant),
                    "numFacture": req.body.numfacture,
                    "date": new Date(moment(req.body.date).format())
                }
            }
        }, function (err) {
            if (err) throw err;
            else {
                db.collection('visiteur').findOne({ _id: ObjectId(User._id) }, function (err, user) {
                    if (err) throw err;
                    req.session.passport.user = user
                    res.redirect('/pageAcceuil')
                })
            }
        })
    })
});

app.get('/modifierHorsforfait/:id', (req, res) => {
    var User = req.session.passport.user;
    var horsforfaits = User.fichedefrais[0].horsforfait;
    horsforfaits.forEach(function (unHorsforfaits) {
        if (unHorsforfaits._id == req.params.id) {
            res.render('pageModifeHf', { horsforfaits: unHorsforfaits })
        }
        //else { res.redirect('/pageAcceuil') } //Ne marche pas à voir
    })
});

app.listen(81, '127.0.0.2')
