const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/', (req,res,next)=>{
    const checkTime = 1000;
    function check() {
        setTimeout(() => {
            fs.readFile('./src/results/result.txt', 'utf8', function(err, data) {
               if (err) {
                   check();
               } else {
                   res.status(200).json({
                    message: data
                    });
                    setTimeout(()=>{
                        fs.unlink('./src/results/result.txt', function(err){
                            if(err){
                                throw err;
                            }
                        });
                    }, 5*checkTime);
               }
            })
        }, checkTime);
    }
    check();
});

module.exports = router;
