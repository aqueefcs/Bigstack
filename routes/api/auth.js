const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jsonwt = require('jsonwebtoken');
const passport = require('passport');
const key = require('../../setup/myurl');

// @type  GET
// @route /api/auth
// @desc  route for login page
// @access PUBLIC
router.get('/', (req,res) => res.render("login"));

// @type  GET
// @route /api/auth/signup
// @desc  route for signup page
// @access PUBLIC
router.get('/signup', (req,res) => res.render("signup"));

//import schema for person to Register
const Person = require('../../models/Person');

// @type   POST
// @route  /api/auth/register
// @desc   route for registration of users
// @access PUBLIC
router.post('/register',(req,res)=> {
    Person.findOne({email: req.body.email})
        .then( person => {
            if(person){
                return res.status(400).json({emailerror: 'Email is already registered'})
            } else{
                const newPerson = new Person({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });
                //Encrypting password using bcrypt
                bcrypt.genSalt(10,(err, salt)=> {
                    bcrypt.hash(newPerson.password, salt, (err, hash)=> {
                        // Store hash in your password DB.
                        if(err) throw err;
                        newPerson.password = hash;
                        newPerson
                            .save()
                            .then(person => res.json(person))
                            .catch(err => console.log(err))
                    });
                });

            }
        })
        .catch(err => console.log(err));
});

// @type   POST
// @route  /api/auth/login
// @desc   route for Login of users
// @access PUBLIC
router.post('/login', (req,res)=> {
    const email = req.body.email;
    const password = req.body.password;

    Person.findOne({ email })
        .then(person => {
            if(!person){
                return res.status(404).json({emailerror: 'User not found with this email'});
            }
            bcrypt
                .compare(password, person.password)
                .then(isCorrect => {
                    if(isCorrect){
                        //res.json({success: 'User is successfully login'});
                        //use payload and create token for user
                        const payload = {
                            id: person.id,
                            name: person.name,
                            email: person.email
                        };
                        const token = jsonwt.sign(
                            payload,
                            key.secret,
                            {expiresIn: 3600},
                            /*(err,token) => {
                                res.json({
                                    success: true,
                                    token: "Bearer " + token
                                });
                            }*/
                        );
                        return res.json({ status:'ok',data:token});
                    }
                    else{
                        //res.status(400).json({passworderror: 'Password is not correct'});
                        res.redirect("/api/auth");
                    }
                    
                })
                .catch(err => console.log(err));
            
        })
        .catch(err => console.log(err))
        //res.redirect("/api/auth/profile");
});

// @type   GET
// @route  /api/auth/profile
// @desc   route for user profile
// @access PRIVATE

router.get('/profile', passport.authenticate('jwt',{session: false}), (req,res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        profilepic:  req.user.profilepic
    });
});



module.exports = router;