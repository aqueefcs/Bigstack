const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PersonSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String
    },
    profilepic: {
        type: String,
        default: "https://image.shutterstock.com/image-vector/man-avatar-profile-picture-vector-260nw-229692004.jpg"
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = Person = mongoose.model("myPerson",PersonSchema);
