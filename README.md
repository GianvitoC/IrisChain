# IrisChain
### To work with "IrisChain": 
### copy the folder "iris-network" into HyperLedger-Fabric's folder "fabric-samples"
#
## CLI commands
### Go into iris-network folder
cd /yourHyperledgerFabricPath/fabric-samples/iris-network

### Remove artifacts from previous run
./iris-network.sh down

### Create a Fabric network consisting of three peer nodes, one ordering node and one (default) channel.
./iris-network.sh up createChannel

### Smart contracts - chaincode
./iris-network.sh deployCC -ccn basic -ccp ./asset-transfer-basic/chaincode-go -ccl go

### Export environmental variables for peer CLI
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

### Interact with Org1 - Environment variables for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.irischain.com/users/Admin@org1.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:7051

### Initialize ledger
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem" -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt" -c '{"function":"InitLedger","Args":[]}'

### Ledger query - all
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}' | jq

### Interact with Org2 - Environment variables for Org2
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.irischain.com/users/Admin@org2.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:9051

### Ledger query - Read specific asset
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","User2"]}' | jq
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset01"]}' | jq
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset02"]}' | jq
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","asset03"]}' | jq

### Ledger update through Smart Contract (chaincode)
#### Create new asset
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem" -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt" -c '{"function":"CreateAsset","Args":["asset04","User4","peer0.org3.irischain.com","11051","1","0"]}'

### Interact with Org3 - Environment variables for Org3
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.irischain.com/users/Admin@org3.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:11051

### Ledger query - all
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}' | jq



# Javascript Smart Contract
### Smart contract installation
### cd localpath/iris-network/asset-transfer-basic/chaincode-javascript
### npm install

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/

peer lifecycle chaincode package basic.tar.gz --path ./asset-transfer-basic/chaincode-javascript/ --lang node --label basic_1.0

### Environment variables for Org1
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.irischain.com/users/Admin@org1.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:7051

### Org1 Chaincode installation
peer lifecycle chaincode install basic.tar.gz

### Environment variables for Org2
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.irischain.com/users/Admin@org2.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:9051

### Org2 Chaincode installation
peer lifecycle chaincode install basic.tar.gz

### Environment variables for Org3
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.irischain.com/users/Admin@org3.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:11051

### Org3 Chaincode installation
peer lifecycle chaincode install basic.tar.gz

### Approve chaincode definition
peer lifecycle chaincode queryinstalled
### Installed Package ID: basic_1.0:6e70a5a2531ab81154910083f297827f144200955cbd685f43b3b50199678a55 (depends on the user, copy from result of previous command!!!)
export CC_PACKAGE_ID=basic_1.0:6e70a5a2531ab81154910083f297827f144200955cbd685f43b3b50199678a55

### Approve chaincode definition - Org3 
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.irischain.com/users/Admin@org3.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:11051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --channelID mychannel --name basic --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem"

### Approve chaincode definition - Org2 
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.irischain.com/users/Admin@org2.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --channelID mychannel --name basic --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem"

### Approve chaincode definition - Org1 
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.irischain.com/users/Admin@org1.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:7051
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --channelID mychannel --name basic --version 1.0 --package-id $CC_PACKAGE_ID --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem"

### Commit chaincode definition
peer lifecycle chaincode checkcommitreadiness --channelID mychannel --name basic --version 1.0 --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem" --output json

peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --channelID mychannel --name basic --version 1.0 --sequence 1 --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt"

peer lifecycle chaincode querycommitted --channelID mychannel --name basic --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem"

### Invoking the chaincode
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem" -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt" -c '{"function":"InitLedger","Args":[]}'

### Query all assets
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'



# Run Fabric App
### cd localpath/iris-network/asset-transfer-basic/application-gateway-typescript
npm install
npm start

