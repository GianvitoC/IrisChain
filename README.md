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
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'

### Interact with Org2 - Environment variables for Org2
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.irischain.com/users/Admin@org2.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:9051

### Ledger query - Read specific asset
peer chaincode query -C mychannel -n basic -c '{"Args":["ReadAsset","User2"]}'

### Ledger update through Smart Contract (chaincode)
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.irischain.com --tls --cafile "${PWD}/organizations/ordererOrganizations/irischain.com/orderers/orderer.irischain.com/msp/tlscacerts/tlsca.irischain.com-cert.pem" -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.irischain.com/peers/peer0.org1.irischain.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.irischain.com/peers/peer0.org2.irischain.com/tls/ca.crt" --peerAddresses localhost:11051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt" -c '{"function":"CreateAsset","Args":["User4","peer0.org3.irischain.com","11051","1"]}'

### Interact with Org3 - Environment variables for Org3
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.irischain.com/peers/peer0.org3.irischain.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.irischain.com/users/Admin@org3.irischain.com/msp
export CORE_PEER_ADDRESS=localhost:11051

### Ledger query - all
peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'
