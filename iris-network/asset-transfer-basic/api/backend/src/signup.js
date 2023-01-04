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
    /** 
    fs.writeFile('/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/iris-network/asset-transfer-basic/api/backend/src/users/sign-up/user.txt', JSON.stringify(user), function(err){
        if(err){
            throw(err)
        }
    });
    */
    res.status(201).json({
        message: "Handling POST requests to /sign-up",
        newUser: user
    });
    console.log(`Username: ${user.name}`);
    // '/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/iris-network/asset-transfer-basic/application-gateway-typescript/dist/appsignup.js'
    const {image} = req.files;
    let imagePath = __dirname + '/users/sign-up/' + user.name + '_' + Date.now().toString() + '.bmp';
    image.mv(imagePath);
    const checkTime = 1000;
    setTimeout(()=>{
        childProcess.fork('../../application-gateway-typescript/dist/appsignup.js', [user.name, imagePath]);
    }, 5*checkTime);
}
);

module.exports = router;
