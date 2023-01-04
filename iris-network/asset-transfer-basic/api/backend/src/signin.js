const express = require('express');
const router = express.Router();
var childProcess = require('child_process');
const fs = require('fs');

router.get('/', (req,res,next)=>{
    res.status(200).json({
        message: "Welcome to Iris-Chain, Sign In!"
    });
});

router.post('/', (req,res,next)=>{
    const user = {
        name: req.body.name
    };
    res.status(201).json({
        message: "Handling POST requests to /sign-in",
        newUser: user
    });
    console.log(`Username: ${user.name}`);
    const {image} = req.files;
    let imagePath = __dirname + '/users/sign-in/' + user.name + '_' + Date.now().toString() + '.bmp';
    image.mv(imagePath);
    const checkTime = 1000;
    setTimeout(()=>{
        childProcess.fork('../../application-gateway-typescript/dist/appsignin.js', [user.name, imagePath]);
    }, 5*checkTime);
    //childProcess.fork('../../application-gateway-typescript/dist/appsignin.js', [user.name, user.image]);
}
);

module.exports = router;
