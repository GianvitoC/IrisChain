#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${PEER}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${PEER}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

#ORG1
ORG=1
PEER=0
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/org1.irischain.com/tlsca/tlsca.org1.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org1.irischain.com/ca/ca.org1.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.irischain.com/connection-org1.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.irischain.com/connection-org1.yaml

ORG=1
PEER=1
P0PORT=17051
CAPORT=17054
PEERPEM=organizations/peerOrganizations/org1.irischain.com/tlsca/tlsca.org1.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org1.irischain.com/ca/ca.org1.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.irischain.com/connection-org1.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.irischain.com/connection-org1.yaml

ORG=1
PEER=2
P0PORT=27051
CAPORT=27054
PEERPEM=organizations/peerOrganizations/org1.irischain.com/tlsca/tlsca.org1.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org1.irischain.com/ca/ca.org1.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.irischain.com/connection-org1.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.irischain.com/connection-org1.yaml

#ORG2
ORG=2
PEER=0
P0PORT=9051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/org2.irischain.com/tlsca/tlsca.org2.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org2.irischain.com/ca/ca.org2.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.irischain.com/connection-org2.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.irischain.com/connection-org2.yaml

ORG=2
PEER=1
P0PORT=19051
CAPORT=18054
PEERPEM=organizations/peerOrganizations/org2.irischain.com/tlsca/tlsca.org2.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org2.irischain.com/ca/ca.org2.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.irischain.com/connection-org2.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.irischain.com/connection-org2.yaml

ORG=2
PEER=2
P0PORT=29051
CAPORT=28054
PEERPEM=organizations/peerOrganizations/org2.irischain.com/tlsca/tlsca.org2.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org2.irischain.com/ca/ca.org2.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.irischain.com/connection-org2.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.irischain.com/connection-org2.yaml

#ORG3
ORG=3
PEER=0
P0PORT=11051
CAPORT=11054
PEERPEM=organizations/peerOrganizations/org3.irischain.com/tlsca/tlsca.org3.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org3.irischain.com/ca/ca.org3.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.irischain.com/connection-org3.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.irischain.com/connection-org3.yaml

ORG=3
PEER=1
P0PORT=11061
CAPORT=11064
PEERPEM=organizations/peerOrganizations/org3.irischain.com/tlsca/tlsca.org3.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org3.irischain.com/ca/ca.org3.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.irischain.com/connection-org3.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.irischain.com/connection-org3.yaml

ORG=3
PEER=2
P0PORT=11071
CAPORT=11074
PEERPEM=organizations/peerOrganizations/org3.irischain.com/tlsca/tlsca.org3.irischain.com-cert.pem
CAPEM=organizations/peerOrganizations/org3.irischain.com/ca/ca.org3.irischain.com-cert.pem

echo "$(json_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.irischain.com/connection-org3.json
echo "$(yaml_ccp $ORG $PEER $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.irischain.com/connection-org3.yaml

