const express = require('express');
const router = express.Router();
const fs = require('fs');

var childProcess = require('child_process');

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}


router.get('/', (req,res,next)=>{
    res.status(200).json({
        message: "Welcome to Iris-Chain, Sign Up!"
    });
});

router.post('/', (req,res,next)=>{
    const user = {
        name: req.body.name,
        image: req.body.image
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
    console.log(user.name);
    console.log(user.image);
    //childProcess.fork('./src/some-script.js');
    //childProcess.fork('/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/iris-network/asset-transfer-basic/application-gateway-typescript/dist/app.js');
    childProcess.fork('/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/iris-network/asset-transfer-basic/application-gateway-typescript/dist/appsignup.js', [user.name, user.image]);
    /** 
    runScript('./src/some-script.js', function (err) {
        if (err) throw err;
        console.log('finished running some-script.js');
    });*/
}
);

module.exports = router;
