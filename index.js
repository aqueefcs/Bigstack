const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const passport = require('passport');

//bring or import all routes
const auth = require('./routes/api/auth');
const profile = require('./routes/api/profile');
const questions = require('./routes/api/questions');


const app = express();

//Middleware for bodyparser and express
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

//mongoDB configuration
const db = require('./setup/myurl').mongoURL;


//set view dir
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


//Attempt to connect to database
mongoose
    .connect(db)
    .then(()=> console.log('MongoDB connected successfully'))
    .catch(err => console.log(err));


//passport middleware
app.use(passport.initialize());

//configuration for JWT strategy
require('./strategies/jsonwtStrategy')(passport);

//route just for testing
app.get('/',(req,res)=>{
    Question.find()
        .sort({date: 'desc'})
        .then(questions => {
            res.render('home',{questions:questions});
        })
        .catch(err=>res.json({noquestions: 'No Questions to Display'}));
});

//actual routes of our application
app.use('/api/auth', auth);
app.use('/api/profile', profile);
app.use('/api/questions', questions);

const port = process.env.PORT || 3000;

app.listen(port,() => console.log(`App is running at ${port}`));