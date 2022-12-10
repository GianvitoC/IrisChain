/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as grpc from '@grpc/grpc-js';
import { stringToSubchannelAddress } from '@grpc/grpc-js/build/src/subchannel-address';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP');
const user = 'User1';

// Path to current biometric materials.
const currPath = envOrDefault('CURR_PATH', path.resolve(__dirname, '..', '..', '..', 'organizations', 'peerOrganizations', 'org1.irischain.com', 'peers', 
'peer0.org1.irischain.com', 'submissions', user));

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
const assetId = `asset${Date.now()}`;

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

        // Return all the current assets on the ledger.
        //await getAllAssets(contract);

        // Create a new asset on the ledger.
        //await createAsset(contract);
        
        // Return all the current assets on the ledger.
        //await getAllAssets(contract);
        
        // Update an existing asset asynchronously.
        // await transferAssetAsync(contract);

        // Get the asset details by assetID.
        // await readAssetByID(contract);

        // Get the Organization a User belongs to.
        //await getOrga(contract, user);

        // Get the Template of a User.
        await templateCompare(contract, user);

        // Return all the current assets on the ledger.
        await getAllAssets(contract);

        // Update an asset which does not exist.
        // await updateNonExistentAsset(contract)
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

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function createAsset(contract: Contract): Promise<void> {
    const crypto = require("crypto");
    const certfl = await fs.readFile(certPath);
    const cert = new crypto.X509Certificate(certfl);
    const value = cert.subject;
    let position = value.search("CN=");
    let cname = value.slice(position+3,value.length);
    console.log('\n--> User Identity:  ' + cname);
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, UserID, Node, Port, FragmentNumber and Flag arguments');

    await contract.submitTransaction(
        'CreateAsset',
        assetId,
        cname,
        'peer0.org1.irischain.com',
        '7051',
        '0',
        '1',
    );

    console.log('*** Transaction committed successfully');
}

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function transferAssetAsync(contract: Contract): Promise<void> {
    console.log('\n--> Async Submit Transaction: TransferAsset, updates existing asset owner');

    const commit = await contract.submitAsync('TransferAsset', {
        arguments: [assetId, 'Saptha'],
    });
    const oldOwner = utf8Decoder.decode(commit.getResult());

    console.log(`*** Successfully submitted transaction to transfer ownership from ${oldOwner} to Saptha`);
    console.log('*** Waiting for transaction commit');

    const status = await commit.getStatus();
    if (!status.successful) {
        throw new Error(`Transaction ${status.transactionId} failed to commit with status code ${status.code}`);
    }

    console.log('*** Transaction committed successfully');
}

async function readAssetByID(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: ReadAsset, function returns asset attributes');

    const resultBytes = await contract.evaluateTransaction('ReadAsset', assetId);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

async function getOrga(contract:Contract, user: string): Promise<void> {
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
    } else {
        throw new Error(`Organization of ${user} not found!`);
    }
}

async function templateCompare(contract: Contract, user: string): Promise<void> {
    console.log(`\n--> Search template location for ${user}, function returns Location, Port and FragmentNumber`);

    const resultBytes = await contract.evaluateTransaction('SearchTemplate', user);
    const resultOBytes = await contract.evaluateTransaction('SearchOrga', user);

    const resultJson = utf8Decoder.decode(resultBytes);
    const resultOJson = utf8Decoder.decode(resultOBytes);

    if (resultOJson.length>0) {
        const resultO = JSON.parse(resultOJson);
        var plh = resultO[0];
        for (let idx=0; idx<resultO.length; idx++) {
            if (plh !== resultO[idx]) {
                throw new Error(`Organization of ${user} not unique!`);
            }
        } 

        if (resultJson.length>0) {
            const result = JSON.parse(resultJson);
            console.log('*** Result:', result);
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
            const cur1Pth = path.resolve(currPath, user+"_fragment1.txt")
            const cur1 = await (await fs.readFile(cur1Pth,"utf-8")).split(/\n/);
            const cur2Pth = path.resolve(currPath, user+"_fragment2.txt")
            const cur2 = await (await fs.readFile(cur2Pth,"utf-8")).split(/\n/);
            const cur3Pth = path.resolve(currPath, user+"_fragment3.txt")
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
            console.log(`\n--> Register Authentication result of ${user} on Ledger: Flag = 1 --> "Authentication Granted", Flag = -1 --> "Authentication Denied"`);
            if (cosineDistance<0.1) {
                console.log(`Authentication Granted for ${user}`);
                await contract.submitTransaction(
                    'CreateAsset',
                    assetId,
                    user,
                    'peer0.org1.irischain.com',
                    '7051',
                    '0',
                    '1',
                );
            } else {
                console.log(`Authentication Denied for ${user}`);
                await contract.submitTransaction(
                    'CreateAsset',
                    assetId,
                    user,
                    'peer0.org1.irischain.com',
                    '7051',
                    '0',
                    '-1',
                );
            }        
            console.log('*** Transaction committed successfully');
        } else {
            throw new Error(`${user} not registered!`);
        }

    } else {
        throw new Error(`Organization of ${user} not found!`);
    }

}

/**
 * submitTransaction() will throw an error containing details of any error responses from the smart contract.
 */
async function updateNonExistentAsset(contract: Contract): Promise<void>{
    console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');

    try {
        await contract.submitTransaction(
            'UpdateAsset',
            'asset70',
            'blue',
            '5',
            'Tomoko',
            '300',
        );
        console.log('******** FAILED to return an error');
    } catch (error) {
        console.log('*** Successfully caught the error: \n', error);
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

/** User Authentication 

async function authenticateUser(contract: Contract): Promise<void> {
    const crypto = require("crypto");
    const certfl = await fs.readFile(certPath);
    const cert = new crypto.X509Certificate(certfl);
    const value = cert.subject;
    let position = value.search("CN=");
    let cname = value.slice(position+3,value.length);
    console.log('\n--> User Identity:  ' + cname);
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, UserID, Node, Port, FragmentNumber and Flag arguments');

    await contract.submitTransaction(
        'CreateAsset',
        assetId,
        cname,
        'peer0.org1.irischain.com',
        '7051',
        '0',
        '1',
    );

    console.log('*** Transaction committed successfully');
}
*/