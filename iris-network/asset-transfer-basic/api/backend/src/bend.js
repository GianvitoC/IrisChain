const express = require('express');
const fileUpload = require('express-fileupload');
const bend = express();
const morgan = require('morgan');
const homeRoutes = require('./home');
const signinRoutes = require('./signin');
const signupRoutes = require('./signup');
const onSigninRoutes = require('./onsign');

bend.use(fileUpload());
bend.use(morgan('dev'));
bend.use(express.urlencoded({extended: false}));
bend.use(express.json());

bend.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    if(req.method==='OPTIONS'){
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'PUT,POST,PATCH,DELETE,GET');
        return res.status(200).json({});
    }
    next();
});

bend.use('/home', homeRoutes);
bend.use('/sign-up', signupRoutes);
bend.use('/signedup', onSigninRoutes);
bend.use('/sign-in', signinRoutes);
bend.use('/signedin', onSigninRoutes);

bend.use((req,res,next)=>{
    const error = new Error('Not found');
    error.status = 404;
    next(error);
});

bend.use((req,res,next)=>{
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = bend;