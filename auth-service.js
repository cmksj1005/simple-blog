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
  loginHistory: [{ dateTime: Date }, { userAgent: String }],
});

let User; // to be defined on new connection

module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(
      'mongodb+srv://cmksj1005: kbHh2dOQN7OELsRw@senecaweb.9lyby8c.mongodb.net/?retryWrites=true&w=majority'
    );
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
          reject('PASSWORD ENCRYPTION ERROR');
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        bcrypt
          .compare(users[0].password, userData.password)
          .then((result) => {
            //console.log(result);
            if (result) {
              users[0].loginHistory.push({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });
              User.updateOne(
                { userName: users[0].userName },
                { $set: { loginHistory: users[0].loginHistory } }
              )
                .exec()
                .then(() => {
                  resolve(users[0]);
                })
                .catch((err) => {
                  reject('There was an error verifying the user: ' + err);
                  console.log(err);
                });
            } else {
              reject('CREDENTIALS INCORRECT: TRY AGAIN!');
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
