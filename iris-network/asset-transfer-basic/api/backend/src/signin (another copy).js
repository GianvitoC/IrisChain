const express = require('express');
const router = express.Router();
var childProcess = require('child_process');

router.get('/', (req,res,next)=>{
    res.status(200).json({
        message: "Welcome to Iris-Chain, Sign In!"
    });
});

router.post('/', (req,res,next)=>{
    const user = {
        name: req.body.name,
        image: req.body.image
    };
    res.status(201).json({
        message: "Handling POST requests to /sign-in",
        newUser: user
    });
    console.log(`Username: ${user.name}`);
    console.log(`Iris image path: ${user.image}`);
    childProcess.fork('/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/iris-network/asset-transfer-basic/application-gateway-typescript/dist/appsignin.js', [user.name, user.image]);
}
);

module.exports = router;
