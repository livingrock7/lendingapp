//we import passport packages required for authentication
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var bcrypt = require('bcrypt-nodejs');

//
//We will need the models folder to check passport against
var db = require("./models/");
var model = require("../models/");

// Check if password is correct
var validPassword = function(password, savedPassword) {
  return bcrypt.compareSync(password, savedPassword);
};


// Telling passport we want to use a Local Strategy. In other words, we want login with a username/email and password
passport.use(new LocalStrategy(
  // Our user will sign in using an email, rather than a "username"
  {
    usernameField: "email",
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    // When a user tries to sign in this code runs
    db.users.findOne({
      where: {
        email: email // return done(null, false, req.flash('error_message', 'Password is incorrect!!'));
      }
    }).then(function(dbUser) {
      // console.log(dbUser);
      // If there's no user with the given email
      if (!dbUser) {
        return done(null, false, req.flash('error_message', 'No email is found'));
      }
      // If there is a user with the given email, but the password the user gives us is incorrect
      else if (!validPassword(password, dbUser.password)) {
        return done(null, false, req.flash('error_message', 'Password is incorrect!!'));
      } else {
        // Checks if there is a user with the same user Id in smartcredit database, otherwise adds user to smartcredit database
        model.User.findOne({
          where: {
            userId: dbUser.id
          }
        }).then(function(user) {
          if (!user) {
            db.profile.findOne({
              where: {
                uid: dbUser.id
              }
            }).then(function(res) {
              model.User.create({
                userId: res.uid,
                email: dbUser.email,
                user: res.full_name,
                authProvider: "ICO dashboard"
              }).catch(function(error) {
                console.log(error);
              })
            })
          }
          return done(null, dbUser);
        })
      }
      // If none of the above, return the user

    });
  }
));

// In order to help keep authentication state across HTTP requests,
// Sequelize needs to serialize and deserialize the user
// Just consider this part boilerplate needed to make it all work
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  model.User.findOne({
    where: {
      userId: id
    }
  }).then(function(user) {
    cb(null, user);
  });
});

// Exporting our configured passport
module.exports = passport;
