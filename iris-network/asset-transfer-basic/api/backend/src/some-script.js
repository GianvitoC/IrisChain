const fs = require('fs');
const user = {
    name: 'req.body.name',
    image: 'req.body.image'
};
fs.writeFile('/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/iris-network/asset-transfer-basic/api/backend/src/users/sign-up/user.txt', JSON.stringify(user), function(err){
    if(err){
        throw(err)
    }
});