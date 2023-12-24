import {AssetID, jettonWallets} from "./config";

// A function to pause the execution for a given time
export const sleep = async (ms = 1000) => {
  try {
    await new Promise(resolve => setTimeout(resolve, ms));
  } catch (error) {
    console.error(error);
  }
};

// A function to get the jetton wallet address for a given asset ID
export const getJettonWallet = (assetID) => {
  // Use a switch statement to match the asset ID with the corresponding jetton wallet
  switch (assetID) {
    case AssetID.usdt:
      return jettonWallets.usdt;
    case AssetID.usdc:
      return jettonWallets.usdc;
    // Add more cases for other assets as needed
    default:
      return `Unknown asset ID: ${assetID}`;
  }
};
