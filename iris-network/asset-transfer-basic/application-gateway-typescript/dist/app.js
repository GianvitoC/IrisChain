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
        // Performance test - Iris-Chain
        let a = Date.now();
        for (let i = 0; i < 1; i++) {
            await performanceComparison(pArgs[2], pArgs[3], currPath, "iris");
        }
        let b = Date.now();
        console.log((b - a) / 1000);
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
    /**
    const certPrivate =
    '-----BEGIN CERTIFICATE-----' + "\n" +
    keypair.privateKey.toString('hex') + "\n" +
    '-----END CERTIFICATE-----'
    await fs.writeFile(path.resolve(cryptoPath, 'peers', 'peer0.org1.irischain.com', 'msp', 'signcerts', user+'@org1.irischain.com.mycert'), certPrivate);
    console.log(`\n*** Private Key provided to ${user}`);
    */
    return keypair.privateKey.toString('hex');
}
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
    //return process.env[key] || defaultValue;
    return defaultValue;
}
/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters() {
    console.log("\n######################################");
    console.log("\n--> Connection through following node:");
    console.log(`peerHostAlias: ${peerHostAlias}`);
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certPath:          ${certPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}
async function performanceComparison(user, imgpath, currpath, meth) {
    switch (meth) {
        case "iris":
            let success = await featureExtraction(user, imgpath, currpath);
            if (success === true) {
                await generateKeyPair(user, currpath);
            }
            break;
        case "random":
            console.log("\n*** Random-based key-pair generation");
            var ed25519 = node_forge_1.default.pki.ed25519;
            var keypair = ed25519.generateKeyPair();
            console.log("Elliptic-curve cryptography:");
            console.log(`--> Edwards-curve Digital Signature Algorithm (EdDSA - Ed25519)`);
            console.log(`Private Key: ${keypair.privateKey.toString('hex')}`);
            console.log(`Public Key: ${keypair.publicKey.toString('hex')}`);
            break;
    }
}
async function featureExtraction(user, imgpath, currpath) {
    let options = {
        pythonPath: path.resolve(__dirname, '..', '..', '..', '..', 'feature_extraction', 'iris', 'bin', 'python3.8'),
        args: [imgpath, user, currpath]
    };
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
//# sourceMappingURL=app.js.map