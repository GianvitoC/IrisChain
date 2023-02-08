package chaincode

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type SmartContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
// Insert struct field in alphabetic order => to achieve determinism across languages
// golang keeps the order when marshal to json but doesn't order automatically
type Asset struct {
	ID             string `json:"AssetID"`
	UserID         string `json:"UserID"`
	Location       string `json:"Location"`
	Port           int    `json:"Port"`
	FragmentNumber int    `json:"FragmentNumber"`
	Flag           int    `json:"Flag"`
}

type User struct {
	ID             string `json:"AssetID"`
	Location       string `json:"Location"`
	Port           int    `json:"Port"`
	FragmentNumber int    `json:"FragmentNumber"`
}

func getFieldString(a *Asset, field string) string {
	r := reflect.ValueOf(a)
	f := reflect.Indirect(r).FieldByName(field)
	return f.String()
}
func getFieldInteger(a *Asset, field string) int {
	r := reflect.ValueOf(a)
	f := reflect.Indirect(r).FieldByName(field)
	return int(f.Int())
}

// InitLedger adds a base set of assets to the ledger
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	assets := []Asset{
		{ID: "asset10", UserID: "User1@org1.irischain.com", Location: "peer0.org1.irischain.com", Port: 7051, FragmentNumber: 1, Flag: 0},
		{ID: "asset11", UserID: "User1@org1.irischain.com", Location: "peer1.org1.irischain.com", Port: 7051, FragmentNumber: 1, Flag: 0},
		{ID: "asset12", UserID: "User1@org1.irischain.com", Location: "peer0.org2.irischain.com", Port: 9051, FragmentNumber: 2, Flag: 0},
		{ID: "asset13", UserID: "User1@org1.irischain.com", Location: "peer1.org2.irischain.com", Port: 9051, FragmentNumber: 2, Flag: 0},
		{ID: "asset14", UserID: "User1@org1.irischain.com", Location: "peer0.org3.irischain.com", Port: 11051, FragmentNumber: 3, Flag: 0},
		{ID: "asset15", UserID: "User1@org1.irischain.com", Location: "peer1.org3.irischain.com", Port: 11051, FragmentNumber: 3, Flag: 0},
	}

	for _, asset := range assets {
		assetJSON, err := json.Marshal(asset)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(asset.ID, assetJSON)
		if err != nil {
			return fmt.Errorf("failed to put to world state. %v", err)
		}
	}

	return nil
}

// CreateAsset issues a new asset to the world state with given details.
func (s *SmartContract) CreateAsset(ctx contractapi.TransactionContextInterface, id string, us string, loc string, port int, frgnum int, flg int) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the asset %s already exists", id)
	}

	asset := Asset{
		ID:             id,
		UserID:         us,
		Location:       loc,
		Port:           port,
		FragmentNumber: frgnum,
		Flag:           flg,
	}
	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, assetJSON)
}

// ReadAsset returns the asset stored in the world state with given id.
func (s *SmartContract) ReadAsset(ctx contractapi.TransactionContextInterface, id string) (*Asset, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("the asset %s does not exist", id)
	}

	var asset Asset
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

// AssetExists returns true when asset with given ID exists in world state
func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

// GetAllAssets returns all assets found in world state
func (s *SmartContract) GetAllAssets(ctx contractapi.TransactionContextInterface) ([]*Asset, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all assets in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*Asset
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

// Search the Organization the User belongs to.
func (s *SmartContract) SearchOrga(ctx contractapi.TransactionContextInterface, userid string) ([]string, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all assets in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var orgas []string
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		var orga = strings.Index(getFieldString(&asset, "UserID"), "@")
		if orga > -1 {
			if getFieldString(&asset, "UserID")[:orga] == userid && getFieldInteger(&asset, "Flag") == 0 {
				orgas = append(orgas, getFieldString(&asset, "UserID")[orga+1:])
			}
		}
	}

	return orgas, nil

}

// Search the Ledger by for User Template.
func (s *SmartContract) SearchTemplate(ctx contractapi.TransactionContextInterface, userid string) ([]*User, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all assets in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	var age1 = 0
	var age2 = 0
	var age3 = 0
	var frg1 User
	var frg2 User
	var frg3 User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		var orga = strings.Index(getFieldString(&asset, "UserID"), "@")
		if orga > -1 {
			if getFieldString(&asset, "UserID")[:orga] == userid && getFieldInteger(&asset, "Flag") == 0 {
				var assetAge = asset.ID[5:]
				intVar, _ := strconv.Atoi(assetAge)
				if getFieldInteger(&asset, "FragmentNumber") == 1 {
					if intVar > age1 {
						frg1 = User{
							ID:             asset.ID,
							Location:       getFieldString(&asset, "Location"),
							Port:           getFieldInteger(&asset, "Port"),
							FragmentNumber: getFieldInteger(&asset, "FragmentNumber"),
						}
					}
				} else if getFieldInteger(&asset, "FragmentNumber") == 2 {
					if intVar > age2 {
						frg2 = User{
							ID:             asset.ID,
							Location:       getFieldString(&asset, "Location"),
							Port:           getFieldInteger(&asset, "Port"),
							FragmentNumber: getFieldInteger(&asset, "FragmentNumber"),
						}
					}
				} else if getFieldInteger(&asset, "FragmentNumber") == 3 {
					if intVar > age3 {
						frg3 = User{
							ID:             asset.ID,
							Location:       getFieldString(&asset, "Location"),
							Port:           getFieldInteger(&asset, "Port"),
							FragmentNumber: getFieldInteger(&asset, "FragmentNumber"),
						}
					}
				}
			}
		}
	}
	users = append(users, &frg1, &frg2, &frg3)
	return users, nil

}

// Search User presence inside the Ledger.
func (s *SmartContract) SearchUser(ctx contractapi.TransactionContextInterface, userid string) ([]string, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all assets in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []string
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset Asset
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		var orga = strings.Index(getFieldString(&asset, "UserID"), "@")
		if orga > -1 {
			if getFieldString(&asset, "UserID")[:orga] == userid {
				users = append(users, getFieldString(&asset, "UserID"))
			}
		}
	}

	return users, nil

}
