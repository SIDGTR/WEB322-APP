const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs'); 

const userSchema = new Schema({
    userName: { type: String, unique: true },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String
    }]
});

let User;

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        const connectionString = "mongodb+srv://WEB322:Seneca123$@cluster0.o8gcplp.mongodb.net/";

        let db = mongoose.createConnection(connectionString);

        db.on('error', (err) => reject(err));
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};

module.exports.registerUser = function(userData) {
    return new Promise((resolve, reject) => {
        const newUser = new User({
            userName: userData.userName,
            email: userData.email,
            password: userData.password 
        });

        newUser.save()
            .then(() => resolve())
            .catch(err => reject(err.message));
    });
};

module.exports.checkUser = function(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })  
            .then(user => {
                if (!user) {  
                    reject("Unable to find user with that username");
                    return;
                }

                bcrypt.compare(userData.password, user.password)  
                    .then(match => {
                        if (match) {
                            resolve(user);  
                        } else {
                            reject("Incorrect Password");
                        }
                    })
                    .catch(err => reject("Incorrect Password"));
            })
            .catch(() => reject("Unable to find user with that username"));
    });
};
