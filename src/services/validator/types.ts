import {Address} from "@ton/ton";

// AssetData represents the state of an asset in the DeFi protocol
type AssetData = {
  id: string; // the unique identifier of the asset
  name: string; // the human-readable name of the asset
  symbol: string; // the ticker symbol of the asset
  decimals: number; // the number of decimal places of the asset
  address: string; // the smart contract address of the asset
  logo: string; // the URL of the logo image of the asset
};

// Prices represents the latest price data of an asset
type Prices = {
  id: string; // the asset id
  price: bigint; // the current price of the asset in USD
  change: bigint; // the percentage change of the price in the last 24 hours
  status: Status; // the status of the price data
};

// Status is an enum that defines the possible values for the status field in Prices
enum Status {
  OK = "OK", // the price data is valid and up-to-date
  ERROR = "ERROR", // the price data is invalid or outdated
}

// AssetConfig represents the configuration of an asset in the DeFi protocol
type AssetConfig = {
  id: string; // the asset id
  enabled: boolean; // whether the asset is enabled or disabled in the protocol
  reserveFactor: bigint; // the percentage of interest that is allocated to the protocol reserve
  liquidationThreshold: bigint; // the percentage of collateral value that triggers liquidation
  liquidationBonus: bigint; // the percentage of bonus that liquidators receive
  interestModel: string; // the smart contract address of the interest model
};
