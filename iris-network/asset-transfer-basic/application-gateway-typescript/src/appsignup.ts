/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as grpc from '@grpc/grpc-js';
import { stringToSubchannelAddress } from '@grpc/grpc-js/build/src/subchannel-address';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import forge from 'node-forge';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
import { PythonShell } from 'python-shell';
import { resolve } from 'path';
import { rejects } from 'assert';

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Network topology
var networkTopology = ['org1.irischain.com', 'org2.irischain.com', 'org3.irischain.com'];

// Path to current biometric materials.
const currPath = envOrDefault('CURR_PATH', path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.irischain.com', 'peers', 
'peer0.org1.irischain.com', 'submissions'));

// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.irischain.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.irischain.com', 'msp', 'keystore'));

// Path to user certificate.
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.irischain.com', 'msp', 'signcerts', 'User1@org1.irischain.com-cert.pem'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.irischain.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.irischain.com');

const utf8Decoder = new TextDecoder();

const pArgs = process.argv;

async function main(): Promise<void> {

    await displayInputParameters();

    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        // Initialize a set of asset data on the ledger using the chaincode 'InitLedger' function.
        await initLedger(contract);
        // Implemeted tests
        /** 
        for (let i=0; i<testList.length;i++){
            let user = testList[i];
            switch(i){
                case 0:
                    // Authenticate User
                    console.log("\n###############################################")
                    console.log("\nTest 1: Authentication of User already enrolled")
                    await authenticateUser(contract, user, currPath);
                    await getAllAssets(contract);
                    break;
                case 1:
                    // Enrol User
                    console.log("\n###############################################")
                    console.log("\nTest 2: Enrollment of new User")
                    await enrolUser(contract, user, currPath);
                    await getAllAssets(contract);
                    break;
                case 2:
                    // Enrol User
                    console.log("\n###############################################")
                    console.log("\nTest 3: Successive Authentication of User just enrolled")
                    await authenticateUser(contract, user, currPath);
                    await getAllAssets(contract);
                    break;
                case 3:
                    // Enrol User
                    console.log("\n###############################################")
                    console.log("\nTest 4: Successive Enrollment of User already registered")
                    await enrolUser(contract, user, currPath);
                    break;
            }
        }
        */
       /** 
        // Performance test - Iris-Chain
       let a = Date.now();
       for(let i=0;i<1;i++){
            await performanceComparison(pArgs[2], pArgs[3], currPath, "iris");
       }
       let b = Date.now()
       console.log((b-a)/1000);
       */
        // Enrol User
        console.log("\n###############################################")
        console.log("\nEnrollment of new User")
        let success = await featureExtraction(pArgs[2], pArgs[3], currPath);
        if (success===true){
            await enrolUser(contract, pArgs[2], currPath);
            await getAllAssets(contract);
        }   
    } finally {
        gateway.close();
        client.close();
    }
}

main().catch(error => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner(): Promise<Signer> {
    const files = await fs.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

// Get Organization a User belongs to.
async function getOrga(contract:Contract, user: string): Promise<string> {
    console.log(`\n--> Organization ${user} belongs to:`);
    const resultBytes = await contract.evaluateTransaction('SearchOrga', user);
    const resultJson = utf8Decoder.decode(resultBytes);
    if (resultJson.length>0) {
        const result = JSON.parse(resultJson);
        var plh = result[0];
        for (let idx=0; idx<result.length; idx++) {
            if (plh !== result[idx]) {
                throw new Error(`Organization of ${user} not unique!`);
            }
        } 
        console.log(plh);
        return plh;
    } else {
        throw new Error(`Organization of ${user} not found!`);
    }
}

// Compare template stored in the Ledger with submitted biometric material.
async function templateCompare(contract: Contract, user: string, currpath: string, curruser: string, verbose="verbose"): Promise<number> {
    const resultBytes = await contract.evaluateTransaction('SearchTemplate', user);
    const resultJson = utf8Decoder.decode(resultBytes);
    if (resultJson.length>0) {
        const result = JSON.parse(resultJson);
        if (verbose==="verbose") {
            console.log(`\n--> Search template location for ${user}, function returns Location, Port and FragmentNumber`);
            console.log('*** Result:', result);
        }
        // 1st version (temporary): unique fs
        const frg1Pth = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 
        result[0]["Location"].slice(6,), 'peers', result[0]["Location"], 'templates', user+"_fragment"+result[0]["FragmentNumber"]+'.txt');
        const frg1 = await (await fs.readFile(frg1Pth,"utf-8")).split(/\n/);
        const frg2Pth = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 
        result[1]["Location"].slice(6,), 'peers', result[1]["Location"], 'templates', user+"_fragment"+result[1]["FragmentNumber"]+'.txt');
        const frg2 = await (await fs.readFile(frg2Pth,"utf-8")).split(/\n/);
        const frg3Pth = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 
        result[2]["Location"].slice(6,), 'peers', result[2]["Location"], 'templates', user+"_fragment"+result[2]["FragmentNumber"]+'.txt');
        const frg3 = await (await fs.readFile(frg3Pth,"utf-8")).split(/\n/);
        const template = frg1.slice(0,87381).concat(frg2.slice(0,87381),frg3.slice(0,87382));
        if ((frg1.slice(0,87381).length !== Math.round(512*512/3)) ||
            (frg2.slice(0,87381).length !== Math.round(512*512/3)) ||
            (frg3.slice(0,87382).length !== Math.round(512*512/3)+1)){
                throw new Error("Template Wrong Fragment Length!!!");
        }
        if (template.length !== 512*512){
            throw new Error("1st Template wrong length!!!");
        }
        // Calculate Cosine Similarity between submitted biometric material and related template
        const cur1Pth = path.resolve(currpath, curruser+"_fragment1.txt")
        const cur1 = await (await fs.readFile(cur1Pth,"utf-8")).split(/\n/);
        const cur2Pth = path.resolve(currpath, curruser+"_fragment2.txt")
        const cur2 = await (await fs.readFile(cur2Pth,"utf-8")).split(/\n/);
        const cur3Pth = path.resolve(currpath, curruser+"_fragment3.txt")
        const cur3 = await (await fs.readFile(cur3Pth,"utf-8")).split(/\n/);
        const current = cur1.slice(0,87381).concat(cur2.slice(0,87381),cur3.slice(0,87382));
        if ((cur1.slice(0,87381).length !== Math.round(512*512/3)) ||
            (cur2.slice(0,87381).length !== Math.round(512*512/3)) ||
            (cur3.slice(0,87382).length !== Math.round(512*512/3)+1)){
                throw new Error("Submission Wrong Fragment Length!!!");
        }
        if (current.length !== 512*512){
            throw new Error("Submission wrong length!!!");
        }
        function convert(x: string) {
            var floatVal = +(x);
            return floatVal;
        }
        function avgOfProduct(a: string[], b: string[]) {
            if (a.length !== b.length){
                throw new Error("Arrays length not matching!!!")
            }
            var avgOP = 0;
            for (var j in a){
                avgOP += (convert(a[j])*convert(b[j]));
            }
            return avgOP/a.length;
        }
        let cosineDistance = Math.max(0,Math.min(Math.abs(1 - avgOfProduct(template,current)/Math.sqrt(avgOfProduct(template,template)*avgOfProduct(current,current))),2));
        console.log(`\nCosine Similarity with respect to ${user}: ${cosineDistance}\n(feature vectors considered belonging to same individual if cosine <0.1)`);
        var cosExt = 0;
        if (cosineDistance<0.1) {
            cosExt = 1;
            return cosExt;
        } else {
            cosExt = -1;
            return cosExt;
        }        
    } else {
        throw new Error(`${user} not registered!`);
    }

}

// Generate cryptographic material.
async function generateKeyPair(user: string, currpath: string): Promise<void>{
    // 1st version (temporary): unique fs
    const cur1Pth = path.resolve(currpath, user+"_fragment1.txt")
    const cur1 = await (await fs.readFile(cur1Pth,"utf-8")).split(/\n/);
    const cur2Pth = path.resolve(currpath, user+"_fragment2.txt")
    const cur2 = await (await fs.readFile(cur2Pth,"utf-8")).split(/\n/);
    const cur3Pth = path.resolve(currpath, user+"_fragment3.txt")
    const cur3 = await (await fs.readFile(cur3Pth,"utf-8")).split(/\n/);
    const current = cur1.slice(0,87381).concat(cur2.slice(0,87381),cur3.slice(0,87382));
    if ((cur1.slice(0,87381).length !== Math.round(512*512/3)) ||
        (cur2.slice(0,87381).length !== Math.round(512*512/3)) ||
        (cur3.slice(0,87382).length !== Math.round(512*512/3)+1)){
            throw new Error("Submission Wrong Fragment Length!!!");
    }
    if (current.length !== 512*512){
        throw new Error("Submission wrong length!!!");
    }
    let password = "";
    for (let i=0;i<current.length;i++){
        password += current[i].slice(0,-1);
    }
    const crypto = require("crypto");
    let secret = crypto.createHash('sha256').update(password).digest('hex');
    var seed = forge.util.hexToBytes(secret)
    var ed25519 = forge.pki.ed25519;
    var keypair = ed25519.generateKeyPair({seed: seed});
    console.log("Elliptic-curve cryptography:")
    console.log(`--> Edwards-curve Digital Signature Algorithm (EdDSA - Ed25519)`);
    console.log(`Private Key: ${keypair.privateKey.toString('hex')}`);
    console.log(`Public Key: ${keypair.publicKey.toString('hex')}`);
    
    const certPrivate =
    '-----BEGIN CERTIFICATE-----' + "\n" +
    keypair.privateKey.toString('hex') + "\n" +
    '-----END CERTIFICATE-----'
    await fs.writeFile(path.resolve(cryptoPath, 'peers', 'peer0.org1.irischain.com', 'msp', 'signcerts', user+'@org1.irischain.com.mycert'), certPrivate);
    console.log(`\n*** Private Key provided to ${user}`)
    
}

async function authenticateUser(contract: Contract, user: string, currpath: string): Promise<void>{
    const plh = await getOrga(contract, user);
    const userid = user+'@'+plh;
    const cosExt = await templateCompare(contract, user, currpath, user);
    console.log(`\n--> Register Authentication result of "${user}" on Ledger:`);
    if (cosExt===1) {
        console.log(`*** Authentication Granted for "${user}"`);
        await contract.submitTransaction(
            'CreateAsset',
            `asset${Date.now()}`,
            userid,
            'peer0.org1.irischain.com',
            '7051',
            '0',
            '1',
        );
        // Key-pair generation
        console.log("\n--> Crypto material generation");
        await generateKeyPair(user, currpath);
    } else {
        console.log(`*** Authentication Denied for "${user}"`);
        await contract.submitTransaction(
            'CreateAsset',
            `asset${Date.now()}`,
            userid,
            'peer0.org1.irischain.com',
            '7051',
            '0',
            '-1',
        );
    }        
    console.log('*** Transaction committed successfully into the Ledger!');
}

async function enrolUser(contract: Contract, user: string, currpath: string): Promise<void>{
    const receivingOrga = peerHostAlias.slice(peerHostAlias.search("org"),);
    const userid = user + '@' + receivingOrga;
    // Check that User is not already registered 
    console.log("\n--> Check that enrolling User isn't already registered.")
    const resultBytes = await contract.evaluateTransaction("SearchUser", user);
    const resultJson = utf8Decoder.decode(resultBytes);
    if (resultJson.length>0) {
        console.log(`*** "${user}" already Registered, no Enrolment needed!`);
        const result = "Username " + user + " is already enrolled.\nPlease choose another Username, otherwise simply Sign-In!"
        await fs.writeFile(path.resolve(__dirname, '..', '..', 'api', 'backend', 'src', 'results','result.txt'), result);
    } else {
        console.log(`*** "${user}" not yet present in the Ledger!`);
        // 1st version (temporary): unique fs 
        // Uniqueness check of submitted biometric material
        console.log("\n--> Check uniqueness of submitted biometric material.")
        var cosExt = -1;
        let i = 0;
        while (cosExt === -1 && i<networkTopology.length) {
            var users = await fs.readdir(path.resolve(__dirname,'..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[i], 'users'));
            let j = 0;
            while(j<users.length) {
                if(users[j].search("Admin") == -1) {
                    var usridx = users[j].search("@"+networkTopology[i]);
                    var usr = users[j].slice(0,usridx);
                    const verbose = "no";
                    var cosExt = await templateCompare(contract, usr, currpath, user, verbose);
                    if (cosExt === 1) {
                        j = users.length;
                    }
                }
                j++;
            }
            i ++;
        }
        if (cosExt === -1) {
            console.log(`*** Uniqueness of submitted biometric material for "${user}" verified!`);
            var userDir = path.resolve(__dirname,'..', '..', '..', 'organizations', 'peerOrganizations',receivingOrga, 'users',userid);
            await fs.mkdir(userDir);
            // Store template fragments and register the transaction in the Ledger
            for (i=0; i<3; i++) {
                let OP: string[];
                OP = [];
                // 2 replicas per fragment
                for(let j=0;j<2;j++){
                    let flag = true;
                    while(flag){
                        var destOrga = Math.floor(Math.random()*networkTopology.length);
                        var destPeerList = await fs.readdir(path.resolve(__dirname,'..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[destOrga],'peers'));
                        var destPeer = Math.floor(Math.random()*destPeerList.length);
                        let tst = destOrga.toString()+destPeer.toString();
                        if(!OP.includes(tst)){
                            var src = path.resolve(currpath, user+"_fragment"+(i+1).toString()+'.txt');
                            var dst = path.resolve(__dirname,'..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[destOrga],'peers', destPeerList[destPeer],'templates',
                            user+"_fragment"+(i+1).toString()+'.txt');
                            await fs.copyFile(src, dst, fs.constants.COPYFILE_EXCL);
                            console.log(`\n*** "${user}" Template fragment "${i+1}" assigned to peer "${destPeerList[destPeer]} - Replica ${j+1}"`);
                            // Record transaction in the Ledger, at the moment 7051 is assumed to be the "well-known" port!
                            await contract.submitTransaction(
                                'CreateAsset',
                                `asset${Date.now()}`,
                                userid,
                                destPeerList[destPeer],
                                '7051',
                                (i+1).toString(),
                                '0',
                            );
                            console.log("*** Transaction committed successfully into the Ledger!");
                            OP.push(tst);
                            flag = false;
                        }
                    }
                    /** 
                    var destOrga = Math.floor(Math.random()*networkTopology.length);
                    var destPeerList = await fs.readdir(path.resolve(__dirname,'..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[destOrga],'peers'));
                    var destPeer = Math.floor(Math.random()*destPeerList.length);
                    var src = path.resolve(currpath, user+"_fragment"+(i+1).toString()+'.txt');
                    var dst = path.resolve(__dirname,'..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[destOrga],'peers', destPeerList[destPeer],'templates',
                    user+"_fragment"+(i+1).toString()+'.txt');
                    await fs.copyFile(src, dst, fs.constants.COPYFILE_EXCL);
                    console.log(`\n*** "${user}" Template fragment "${i+1}" assigned to peer "${destPeerList[destPeer]} - Replica ${j+1}"`);
                    // Record transaction in the Ledger, at the moment 7051 is assumed to be the "well-known" port!
                    await contract.submitTransaction(
                        'CreateAsset',
                        `asset${Date.now()}`,
                        userid,
                        destPeerList[destPeer],
                        '7051',
                        (i+1).toString(),
                        '0',
                    );
                    console.log("*** Transaction committed successfully into the Ledger!");
                    */
                }
            }
            console.log(`\n*** "${user}" successfully enrolled!`);
            // Key-pair generation
            console.log("\n--> Crypto material generation");
            await generateKeyPair(user, currpath);
            const result = "CONGRATULATIONS " + user + ", you successfully signed-up!"
            await fs.writeFile(path.resolve(__dirname, '..', '..', 'api', 'backend', 'src', 'results','result.txt'), result);
        } else {
            console.log("*** Match found, submitted biometric material not unique! \n*** Enrolment denied.");
            const result = "Sorry " + user + ", your enrollment is DENIED. Your biometric material has already been submitted!"
            await fs.writeFile(path.resolve(__dirname, '..', '..', 'api', 'backend', 'src', 'results','result.txt'), result);
        }
    }
}

/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters(): Promise<void> {
    console.log("\n######################################")
    console.log("\n--> Connection through following node:");
    console.log(`peerHostAlias: ${peerHostAlias}`);
}

async function performanceComparison(user: string, imgpath: string, currpath:string, meth: string) {
    switch(meth){
        case "iris":
            let success = await featureExtraction(user, imgpath, currpath);
            if (success===true){
                await generateKeyPair(user, currpath);   
            }   
            break;
        case "random":
            console.log("\n*** Random-based key-pair generation")
            var ed25519 = forge.pki.ed25519;
            var keypair = ed25519.generateKeyPair();
            console.log("Elliptic-curve cryptography:")
            console.log(`--> Edwards-curve Digital Signature Algorithm (EdDSA - Ed25519)`);
            console.log(`Private Key: ${keypair.privateKey.toString('hex')}`);
            console.log(`Public Key: ${keypair.publicKey.toString('hex')}`);
        break;
    }
}

async function featureExtraction (user: string, imgpath:string, currpath: string) {
    let options = {
        pythonPath: path.resolve(__dirname, '..', '..', '..', '..', 'feature_extraction', 'iris', 'bin', 'python3.8'),
        args: [imgpath,user,currpath]
    };
    let success = new Promise((resolve,reject)=>{
        PythonShell.run(path.resolve(__dirname, '..', '..', '..', '..', 'feature_extraction', 'script.py'), options, function(err, res){
            if(err) {
                reject(false);
            } else {
                resolve(true);
            };
        })
    });
    if (await success===true){
        return success;
    };
}

