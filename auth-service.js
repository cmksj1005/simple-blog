var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

var userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGO_HOST_URI);
    db.on('error', (err) => {
      console.log('MONGO ERR: ' + err);
      reject(err);
    });

    db.once('open', () => {
      User = db.model('users', userSchema);
      console.log('MONGO CONNECTED SUCCESSFULLY!');
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password != userData.password2) {
      reject('PASSWORDS DO NOT MATCH!');
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;

          let newUser = new User(userData);
          newUser
            .save()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              if (err.code == 11000) {
                reject('User Name already taken');
              } else if (err.code != 11000) {
                reject('There was an error creating the user: ' + err);
              }
            });
        })
        .catch((err) => {
          console.log(err);
          reject('There was an error encrypting the password');
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .exec()
      .then((user) => {
        bcrypt
          .compare(userData.password, user.password) //?? hash?
          .then((result) => {
            //console.log(result);
            if (result === true) {
              user.loginHistory.push({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });
              User.updateOne(
                { userName: user.userName },
                { $set: { loginHistory: user.loginHistory } }
              )
                .exec()
                .then(() => {
                  resolve(user);
                })
                .catch((err) => {
                  reject('There was an error verifying the user: ' + err);
                  console.log(err);
                });
            } else {
              reject('Incorrect Password for user: ' + userData.userName);
            }
          })
          .catch((err) => {
            console.log(err);
            reject('Incorrect Password for user: ' + userData.userName);
          });
      })
      .catch((err) => {
        reject('Unable to find user: ' + userData.userName);
      });
  });
};
