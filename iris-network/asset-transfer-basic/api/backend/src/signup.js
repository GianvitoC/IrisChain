const express = require('express');
const router = express.Router();
const fs = require('fs');

var childProcess = require('child_process');

router.get('/', (req,res,next)=>{
    res.status(200).json({
        message: "Welcome to Iris-Chain, Sign Up!"
    });
});

router.post('/', (req,res,next)=>{
    const user = {
        name: req.body.name
    };
    res.status(201).json({
        message: "Handling POST requests to /sign-up",
        newUser: user
    });
    console.log(`Username: ${user.name}`);
    const {image} = req.files;
    let imagePath = __dirname + '/users/sign-up/' + user.name + '_' + Date.now().toString() + '.bmp';
    image.mv(imagePath);
    const checkTime = 1000;
    setTimeout(()=>{
        childProcess.fork('../../application-gateway-typescript/dist/appsignup.js', [user.name, imagePath]);
    }, 5*checkTime);
    setTimeout(()=>{
        fs.unlink(imagePath, function(err){
            if(err){
                throw err;
            }
        });
    }, 15*checkTime);
}
);

module.exports = router;
