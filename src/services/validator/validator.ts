import { Cell, Dictionary, TonClient } from "@ton/ton";
import { Client, MetadataFeature, NftOutput, hexToUtf8 } from "@iota/sdk";
import { AssetID, decimals, evaaMaster, NFT_ID } from "../../config";
import { Prices } from "./types";
import { bigIntMax, bigIntMin, createAssetConfig, createAssetData } from "./helpers";
import { MyDatabase } from "../../db/database";
import { isAxiosError } from "axios";

// Liquidate a debt in Token A backed by Token B, then convert Token B to Token A
async function liquidate(db: MyDatabase, tonClient: tonClient, iotaClient: Client) {
  // Get the tasks from the database
  const tasks = await db.getTasks();
  // Loop through the tasks
  for (const task of tasks) {
    // Get the user and contract addresses
    const { user_address, contract_address } = task;
    // Get the prices and signature from the task
    const pricesCell = Cell.fromBoc(Buffer.from(task.prices, 'base64'))[0];
    const pricesSignature = task.pricesSignature;
    // Get the query ID from the task
    const queryID = task.queryID;
    // Get the loan and collateral assets from the task
    const loanAsset = task.loanAsset;
    const collateralAsset = task.collateralAsset;
    // Get the liquidation and collateral amounts from the task
    const liquidationAmount = task.liquidationAmount;
    const minCollateralAmount = task.minCollateralAmount;
    // Get the user's balances from the contract
    const balancesResult = await tonClient.runMethod(contract_address, 'getBalances');
    const balancesDict = balancesResult.stack.readCell().beginParse()
      .loadDictDirect(Dictionary.Keys.BigUint(256), Dictionary.Values.BigUint(256));
    // Check if the user has enough collateral balance
    const collateralBalance = balancesDict.get(collateralAsset);
    if (collateralBalance < minCollateralAmount) {
      console.log(`Not enough collateral balance for ${user_address}`);
      continue;
    }
    // Check if the user has enough loan balance
    const loanBalance = balancesDict.get(loanAsset);
    if (loanBalance < liquidationAmount) {
      console.log(`Not enough loan balance for ${user_address}`);
      continue;
    }
    // Prepare the message body for liquidation
    const body = new Builder()
      .storeInt(queryID, 64)
      .storeInt(loanAsset, 256)
      .storeInt(collateralAsset, 256)
      .storeInt(liquidationAmount, 256)
      .storeInt(minCollateralAmount, 256)
      .storeCell(pricesCell)
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeRef(new Cell())
      .storeBytes(pricesSignature)
      .build();
    // Send the message to the contract
    const message = await tonClient.createRunMessage(contract_address, 'liquidate', body);
    const result = await tonClient.sendMessage(message);
    // Check the result
    if (result.status === 'ok') {
      console.log(`Liquidation successful for ${user_address}`);
      // Delete the task from the database
      await db.deleteTask(user_address);
    } else {
      console.log(`Liquidation failed for ${user_address}`);
    }
  }
}
