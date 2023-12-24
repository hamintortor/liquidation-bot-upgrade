import { MyDatabase } from "./db/database";
import { TonClient, WalletContractV4 } from "@ton/ton";
import { iotaEndpoint, rpcEndpoint, serviceChatID, tonApiEndpoint } from "./config";
import axios from "axios";
import { Client } from "@iota/sdk";
import { handleTransactions } from "./services/indexer/indexer";
import { validateBalances } from "./services/validator/validator";
import { configDotenv } from "dotenv";
import { handleLiquidates } from "./services/liquidator";
import { mnemonicToWalletKey } from "@ton/crypto";
import { Bot } from "grammy";
import * as https from "https";
import { sleep } from "./helpers";

async function main(bot) {
  configDotenv();
  const db = new MyDatabase();
  await db.init();
  const tonApi = axios.create({
    baseURL: tonApiEndpoint,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: { Authorization: process.env.tonAPI_KEY },
  });
  //mainnet
  const tonClient = new tonClient({
    endpoint: rpcEndpoint,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    apiKey: process.env.RPC_API_KEY,
  });
  //testnet
  // const tonClient = new tonClient({
  //   endpoint: rpcEndpoint,
  //   apiKey: process.env.tonCENTER_API_KEY
  // });
  const { nodes } = iotaEndpoint;
  const iotaClient = new Client({ nodes });
  const keys = await mnemonicToWalletKey(process.env.WALLET_PRIVATE_KEY.split(' '));
  const { publicKey } = keys;
  const wallet = WalletContractV4.create({ workchain: 0, publicKey });
  const contract = tonClient.open(wallet);
  try {
    await handleTransactions(db, tonApi, tonClient);
  } catch (e) {
    console.log(e);
    await bot.api.sendMessage(serviceChatID, `[Indexer]: ${JSON.stringify(e)}`);
  } finally {
    console.log('Exiting from handleTransactions...');
  }
  const validatorID = setInterval(async () => {
    try {
      await validateBalances(db, tonClient, iotaClient);
    } catch (e) {
      console.log(e);
      await bot.api.sendMessage(serviceChatID, `[Validator]: ${JSON.stringify(e)}`);
    }
  }, 5000);
  const liquidatorID = setInterval(async () => {
    try {
      await handleLiquidates(db, tonClient, contract, keys, bot);
    } catch (e) {
      console.log(e);
      await bot.api.sendMessage(serviceChatID, `[Liquidator]: ${JSON.stringify(e)}`);
    }
  }, 20000);
  setInterval(async () => {
    const blacklistedUsers = await db.handleFailedTasks();
    for (const user of blacklistedUsers) {
      await bot.api.sendMessage(serviceChatID, `❌ User ${user} blacklisted`);
      await sleep(100);
    }
  }, 3000);
}

(async () => {
  configDotenv();
  const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  try {
    await main(bot);
  } catch (e) {
    console.log(e);
    await bot.api.sendMessage(serviceChatID, `Fatal error: ${JSON.stringify(e)}`);
  } finally {
    console.log('Exiting...');
  }
})();
