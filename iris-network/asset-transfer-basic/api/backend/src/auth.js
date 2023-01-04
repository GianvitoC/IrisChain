const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/users/sign-up', (req,res,next)=>{
    const name = req.body.name;
    let password = null;
    let sql = 'SELECT * FROM users WHERE name=?';
    db.query(sql, [name], (err, result) => {
        if (err){
            throw err;
        }
        if(result.length>0){
            res.status(409).json({
                message: 'Username already exists'
            });
        } else {
            password = 10;
            let sql = 'INSERT INTO users (name, password) VALUES (?,?)';
            db.query(sql, [name, password], (err,result)=> {
                if(err){
                    throw err;
                }
                res.status(201).json({
                    message: 'New User created',
                    createdUser: {
                        name: name
                    }
                });
            });
        }
    });
});

module.exports = router;