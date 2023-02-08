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
const python_shell_1 = require("python-shell");
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
const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.irischain.com', 'msp', 'signcerts', 'cert.pem'));
// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.irischain.com', 'tls', 'ca.crt'));
// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');
// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.irischain.com');
const utf8Decoder = new util_1.TextDecoder();
const pArgs = process.argv;
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
        // Authenticate User
        console.log("\n###############################################");
        console.log("\nAuthentication of User already enrolled");
        let success = await featureExtraction(pArgs[2], pArgs[3], currPath);
        if (success === true) {
            await authenticateUser(contract, pArgs[2], currPath);
            await getAllAssets(contract);
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
        console.log(`\nCosine Similarity with respect to ${user}: ${cosineDistance}\n(feature vectors considered belonging to same individual if cosine <0.1)`);
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
async function generateKeyPair(user, currpath) {
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
    await fs_1.promises.writeFile(path.resolve(cryptoPath, 'peers', 'peer0.org1.irischain.com', 'msp', 'signcerts', user + '@org1.irischain.com.mycert'), certPrivate);
    console.log(`\n*** Private Key provided to ${user}`);
    return keypair.privateKey.toString('hex');
}
async function authenticateUser(contract, user, currpath) {
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
        console.log(`\n--> ${user} belongs to Organization:`);
        console.log(plh);
        const userid = user + '@' + plh;
        const cosExt = await templateCompare(contract, user, currpath, user);
        console.log(`\n--> Register Authentication result of "${user}" on Ledger:`);
        if (cosExt === 1) {
            console.log(`*** Authentication Granted for "${user}"`);
            await contract.submitTransaction('CreateAsset', `asset${Date.now()}`, userid, 'peer0.org1.irischain.com', '7051', '0', '1');
            // Key-pair generation
            console.log("\n--> Crypto material generation");
            const privKey = await generateKeyPair(user, currpath);
            const result = "CONGRATULATIONS " + user + ", you successfully signed-in!\nYour Private Key is: " + privKey;
            await fs_1.promises.writeFile(path.resolve(__dirname, '..', '..', 'api', 'backend', 'src', 'results', 'result.txt'), result);
        }
        else {
            console.log(`*** Authentication Denied for "${user}"`);
            await contract.submitTransaction('CreateAsset', `asset${Date.now()}`, userid, 'peer0.org1.irischain.com', '7051', '0', '-1');
            const result = "Sorry " + user + ", your authentication is DENIED.\nPlease check again your submitted biometric material.";
            await fs_1.promises.writeFile(path.resolve(__dirname, '..', '..', 'api', 'backend', 'src', 'results', 'result.txt'), result);
        }
        console.log('*** Transaction committed successfully into the Ledger!');
    }
    else {
        console.log(`${user} is not an enrolled User, authentication Denied!`);
        const result = user + " is not an enrolled User.\nPlease check again your submitted Username, otherwise Sign Up!";
        await fs_1.promises.writeFile(path.resolve(__dirname, '..', '..', 'api', 'backend', 'src', 'results', 'result.txt'), result);
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
async function featureExtraction(user, imgpath, currpath) {
    let options = {
        //pythonPath: "/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/feature_extraction/iris/bin/python3.8",
        pythonPath: path.resolve(__dirname, '..', '..', '..', '..', 'feature_extraction', 'iris', 'bin', 'python3.8'),
        args: [imgpath, user, currpath]
    };
    // "/home/ubuntu/go/src/github.com/GianvitoC/fabric-samples/feature_extraction/script.py"
    let success = new Promise((resolve, reject) => {
        python_shell_1.PythonShell.run(path.resolve(__dirname, '..', '..', '..', '..', 'feature_extraction', 'script.py'), options, function (err, res) {
            if (err) {
                reject(false);
            }
            else {
                resolve(true);
            }
            ;
        });
    });
    if (await success === true) {
        return success;
    }
    ;
}
//# sourceMappingURL=appsignin.js.map