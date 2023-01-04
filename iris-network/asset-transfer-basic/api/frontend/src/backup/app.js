"use strict";
/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grpc = __importStar(require("@grpc/grpc-js"));
const fabric_gateway_1 = require("@hyperledger/fabric-gateway");
const crypto = __importStar(require("crypto"));
const node_forge_1 = __importDefault(require("node-forge"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const util_1 = require("util");
const testList = ['User1', 'User2', 'User2', 'User3'];
const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');
// Network topology
var networkTopology = ['org1.irischain.com', 'org2.irischain.com', 'org3.irischain.com'];
// Path to current biometric materials.
const currPath = envOrDefault('CURR_PATH', path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.irischain.com', 'peers', 'peer0.org1.irischain.com', 'submissions'));
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
const utf8Decoder = new util_1.TextDecoder();
async function main() {
    await displayInputParameters();
    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();
    const gateway = (0, fabric_gateway_1.connect)({
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
        for (let i = 0; i < testList.length; i++) {
            let user = testList[i];
            switch (i) {
                case 0:
                    // Authenticate User
                    console.log("\n###############################################");
                    console.log("\nTest 1: Authentication of User already enrolled");
                    await authenticateUser(contract, user, currPath);
                    await getAllAssets(contract);
                    break;
                case 1:
                    // Enrol User
                    console.log("\n###############################################");
                    console.log("\nTest 2: Enrollment of new User");
                    await enrolUser(contract, user, currPath);
                    await getAllAssets(contract);
                    break;
                case 2:
                    // Enrol User
                    console.log("\n###############################################");
                    console.log("\nTest 3: Successive Authentication of User just enrolled");
                    await authenticateUser(contract, user, currPath);
                    await getAllAssets(contract);
                    break;
                case 3:
                    // Enrol User
                    console.log("\n###############################################");
                    console.log("\nTest 4: Successive Enrollment of User already registered");
                    await enrolUser(contract, user, currPath);
                    break;
            }
        }
    }
    finally {
        gateway.close();
        client.close();
    }
}
main().catch(error => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});
async function newGrpcConnection() {
    const tlsRootCert = await fs_1.promises.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}
async function newIdentity() {
    const credentials = await fs_1.promises.readFile(certPath);
    return { mspId, credentials };
}
async function newSigner() {
    const files = await fs_1.promises.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs_1.promises.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return fabric_gateway_1.signers.newPrivateKeySigner(privateKey);
}
/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract) {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
    await contract.submitTransaction('InitLedger');
    console.log('*** Transaction committed successfully');
}
/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract) {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
    const resultBytes = await contract.evaluateTransaction('GetAllAssets');
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}
// Get Organization a User belongs to.
async function getOrga(contract, user) {
    console.log(`\n--> Organization ${user} belongs to:`);
    const resultBytes = await contract.evaluateTransaction('SearchOrga', user);
    const resultJson = utf8Decoder.decode(resultBytes);
    if (resultJson.length > 0) {
        const result = JSON.parse(resultJson);
        var plh = result[0];
        for (let idx = 0; idx < result.length; idx++) {
            if (plh !== result[idx]) {
                throw new Error(`Organization of ${user} not unique!`);
            }
        }
        console.log(plh);
        return plh;
    }
    else {
        throw new Error(`Organization of ${user} not found!`);
    }
}
// Compare template stored in the Ledger with submitted biometric material.
async function templateCompare(contract, user, currpath, curruser, verbose = "verbose") {
    const resultBytes = await contract.evaluateTransaction('SearchTemplate', user);
    const resultJson = utf8Decoder.decode(resultBytes);
    if (resultJson.length > 0) {
        const result = JSON.parse(resultJson);
        if (verbose === "verbose") {
            console.log(`\n--> Search template location for ${user}, function returns Location, Port and FragmentNumber`);
            console.log('*** Result:', result);
        }
        // 1st version (temporary): unique fs
        const frg1Pth = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', result[0]["Location"].slice(6), 'peers', result[0]["Location"], 'templates', user + "_fragment" + result[0]["FragmentNumber"] + '.txt');
        const frg1 = await (await fs_1.promises.readFile(frg1Pth, "utf-8")).split(/\n/);
        const frg2Pth = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', result[1]["Location"].slice(6), 'peers', result[1]["Location"], 'templates', user + "_fragment" + result[1]["FragmentNumber"] + '.txt');
        const frg2 = await (await fs_1.promises.readFile(frg2Pth, "utf-8")).split(/\n/);
        const frg3Pth = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', result[2]["Location"].slice(6), 'peers', result[2]["Location"], 'templates', user + "_fragment" + result[2]["FragmentNumber"] + '.txt');
        const frg3 = await (await fs_1.promises.readFile(frg3Pth, "utf-8")).split(/\n/);
        const template = frg1.slice(0, 87381).concat(frg2.slice(0, 87381), frg3.slice(0, 87382));
        if ((frg1.slice(0, 87381).length !== Math.round(512 * 512 / 3)) ||
            (frg2.slice(0, 87381).length !== Math.round(512 * 512 / 3)) ||
            (frg3.slice(0, 87382).length !== Math.round(512 * 512 / 3) + 1)) {
            throw new Error("Template Wrong Fragment Length!!!");
        }
        if (template.length !== 512 * 512) {
            throw new Error("1st Template wrong length!!!");
        }
        // Calculate Cosine Similarity between submitted biometric material and related template
        const cur1Pth = path.resolve(currpath, curruser + "_fragment1.txt");
        const cur1 = await (await fs_1.promises.readFile(cur1Pth, "utf-8")).split(/\n/);
        const cur2Pth = path.resolve(currpath, curruser + "_fragment2.txt");
        const cur2 = await (await fs_1.promises.readFile(cur2Pth, "utf-8")).split(/\n/);
        const cur3Pth = path.resolve(currpath, curruser + "_fragment3.txt");
        const cur3 = await (await fs_1.promises.readFile(cur3Pth, "utf-8")).split(/\n/);
        const current = cur1.slice(0, 87381).concat(cur2.slice(0, 87381), cur3.slice(0, 87382));
        if ((cur1.slice(0, 87381).length !== Math.round(512 * 512 / 3)) ||
            (cur2.slice(0, 87381).length !== Math.round(512 * 512 / 3)) ||
            (cur3.slice(0, 87382).length !== Math.round(512 * 512 / 3) + 1)) {
            throw new Error("Submission Wrong Fragment Length!!!");
        }
        if (current.length !== 512 * 512) {
            throw new Error("Submission wrong length!!!");
        }
        function convert(x) {
            var floatVal = +(x);
            return floatVal;
        }
        function avgOfProduct(a, b) {
            if (a.length !== b.length) {
                throw new Error("Arrays length not matching!!!");
            }
            var avgOP = 0;
            for (var j in a) {
                avgOP += (convert(a[j]) * convert(b[j]));
            }
            return avgOP / a.length;
        }
        let cosineDistance = Math.max(0, Math.min(Math.abs(1 - avgOfProduct(template, current) / Math.sqrt(avgOfProduct(template, template) * avgOfProduct(current, current))), 2));
        console.log(`\nCosine Similarity with respect to ${user}: ${cosineDistance}`);
        var cosExt = 0;
        if (cosineDistance < 0.1) {
            cosExt = 1;
            return cosExt;
        }
        else {
            cosExt = -1;
            return cosExt;
        }
    }
    else {
        throw new Error(`${user} not registered!`);
    }
}
// Generate cryptographic material.
async function generateKeyPair(contract, user, currpath) {
    // 1st version (temporary): unique fs
    const cur1Pth = path.resolve(currpath, user + "_fragment1.txt");
    const cur1 = await (await fs_1.promises.readFile(cur1Pth, "utf-8")).split(/\n/);
    const cur2Pth = path.resolve(currpath, user + "_fragment2.txt");
    const cur2 = await (await fs_1.promises.readFile(cur2Pth, "utf-8")).split(/\n/);
    const cur3Pth = path.resolve(currpath, user + "_fragment3.txt");
    const cur3 = await (await fs_1.promises.readFile(cur3Pth, "utf-8")).split(/\n/);
    const current = cur1.slice(0, 87381).concat(cur2.slice(0, 87381), cur3.slice(0, 87382));
    if ((cur1.slice(0, 87381).length !== Math.round(512 * 512 / 3)) ||
        (cur2.slice(0, 87381).length !== Math.round(512 * 512 / 3)) ||
        (cur3.slice(0, 87382).length !== Math.round(512 * 512 / 3) + 1)) {
        throw new Error("Submission Wrong Fragment Length!!!");
    }
    if (current.length !== 512 * 512) {
        throw new Error("Submission wrong length!!!");
    }
    let password = "";
    for (let i = 0; i < current.length; i++) {
        password += current[i].slice(0, -1);
    }
    const crypto = require("crypto");
    let secret = crypto.createHash('sha256').update(password).digest('hex');
    var seed = node_forge_1.default.util.hexToBytes(secret);
    var ed25519 = node_forge_1.default.pki.ed25519;
    var keypair = ed25519.generateKeyPair({ seed: seed });
    console.log("Elliptic-curve cryptography:");
    console.log(`--> Edwards-curve Digital Signature Algorithm (EdDSA - Ed25519)`);
    console.log(`Private Key: ${keypair.privateKey.toString('hex')}`);
    console.log(`Public Key: ${keypair.publicKey.toString('hex')}`);
    const certPrivate = '-----BEGIN CERTIFICATE-----' + "\n" +
        keypair.privateKey.toString('hex') + "\n" +
        '-----END CERTIFICATE-----';
    /*const certPublic =
    '-----BEGIN CERTIFICATE-----' + "\n" +
    keypair.publicKey.toString('hex') + "\n" +
    '-----END CERTIFICATE-----'
    */
    await fs_1.promises.writeFile(path.resolve(cryptoPath, 'peers', 'peer0.org1.irischain.com', 'msp', 'signcerts', user + '@org1.irischain.com.mycert'), certPrivate);
    console.log(`\n*** Private Key provided to ${user}`);
    //await fs.writeFile(path.resolve(cryptoPath, 'users', user+'@org1.irischain.com', 'msp', 'signcerts', user+'@org1.irischain.com-mycert.pem'), certPublic);
    //console.log(`\nPublic Key made available to network`)
}
async function authenticateUser(contract, user, currpath) {
    const plh = await getOrga(contract, user);
    const userid = user + '@' + plh;
    const cosExt = await templateCompare(contract, user, currpath, user);
    console.log(`\n--> Register Authentication result of "${user}" on Ledger:`);
    if (cosExt === 1) {
        console.log(`*** Authentication Granted for "${user}"`);
        await contract.submitTransaction('CreateAsset', `asset${Date.now()}`, userid, 'peer0.org1.irischain.com', '7051', '0', '1');
        // Key-pair generation
        console.log("\n--> Crypto material generation");
        await generateKeyPair(contract, user, currpath);
    }
    else {
        console.log(`*** Authentication Denied for "${user}"`);
        await contract.submitTransaction('CreateAsset', `asset${Date.now()}`, userid, 'peer0.org1.irischain.com', '7051', '0', '-1');
    }
    console.log('*** Transaction committed successfully into the Ledger!');
}
async function enrolUser(contract, user, currpath) {
    const receivingOrga = peerHostAlias.slice(peerHostAlias.search("org"));
    const userid = user + '@' + receivingOrga;
    // Check that User is not already registered 
    console.log("\n--> Check that enrolling User isn't already registered.");
    const resultBytes = await contract.evaluateTransaction("SearchUser", user);
    const resultJson = utf8Decoder.decode(resultBytes);
    if (resultJson.length > 0) {
        console.log(`*** "${user}" already Registered, no Enrolment needed!`);
    }
    else {
        console.log(`*** "${user}" not yet present in the Ledger!`);
        // 1st version (temporary): unique fs 
        // Uniqueness check of submitted biometric material
        console.log("\n--> Check uniqueness of submitted biometric material.");
        var cosExt = -1;
        let i = 0;
        while (cosExt === -1 && i < networkTopology.length) {
            var users = await fs_1.promises.readdir(path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[i], 'users'));
            let j = 0;
            while (j < users.length) {
                if (users[j].search("Admin") == -1) {
                    var usridx = users[j].search("@" + networkTopology[i]);
                    var usr = users[j].slice(0, usridx);
                    const verbose = "no";
                    var cosExt = await templateCompare(contract, usr, currpath, user, verbose);
                    if (cosExt === 1) {
                        j = users.length;
                    }
                }
                j++;
            }
            i++;
        }
        if (cosExt === -1) {
            console.log(`*** Uniqueness of submitted biometric material for "${user}" verified!`);
            var userDir = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', receivingOrga, 'users', userid);
            await fs_1.promises.mkdir(userDir);
            // Store template fragments and register the transaction in the Ledger
            for (i = 0; i < 3; i++) {
                // 2 replicas per fragment
                for (let j = 0; j < 2; j++) {
                    var destOrga = Math.floor(Math.random() * networkTopology.length);
                    var destPeerList = await fs_1.promises.readdir(path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[destOrga], 'peers'));
                    var destPeer = Math.floor(Math.random() * destPeerList.length);
                    var src = path.resolve(currpath, user + "_fragment" + (i + 1).toString() + '.txt');
                    var dst = path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', networkTopology[destOrga], 'peers', destPeerList[destPeer], 'templates', user + "_fragment" + (i + 1).toString() + '.txt');
                    await fs_1.promises.copyFile(src, dst, fs_1.promises.constants.COPYFILE_EXCL);
                    console.log(`\n*** "${user}" Template fragment "${i + 1}" assigned to peer "${destPeerList[destPeer]} - Replica ${j + 1}"`);
                    // Record transaction in the Ledger, at the moment 7051 is assumed to be the "well-known" port!
                    await contract.submitTransaction('CreateAsset', `asset${Date.now()}`, userid, destPeerList[destPeer], '7051', (i + 1).toString(), '0');
                    console.log("*** Transaction committed successfully into the Ledger!");
                }
            }
            console.log(`\n*** "${user}" successfully enrolled!`);
            // Key-pair generation
            console.log("\n--> Crypto material generation");
            await generateKeyPair(contract, user, currpath);
        }
        else {
            console.log("*** Match found, submitted biometric material not unique! \n*** Enrolment denied.");
        }
    }
}
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}
/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters() {
    console.log("\n######################################");
    console.log("\n--> Connection through following node:");
    console.log(`peerHostAlias: ${peerHostAlias}`);
}
//# sourceMappingURL=app.js.map