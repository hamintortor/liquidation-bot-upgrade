import {KeyPair} from "@ton/crypto";
import {Address, internal, OpenedContract, SendMode} from "@ton/core";
import {beginCell, Cell, toNano, TonClient, WalletContractV4} from "@ton/ton";
import {MyDatabase} from "../db/database";
import {AssetID, evaaMaster, jettonWallets, serviceChatID} from "../config";
import {getAddressFriendly} from "./indexer/helpers";
import {getJettonWallet} from "../helpers";
import {Bot} from "grammy";

type MyBalance = { ton: bigint, usdt: bigint, usdc: bigint }
export async function handleLiquidates(db: MyDatabase, tonClient: tonClient, contract: OpenedContract<WalletContractV4>, keys: KeyPair, bot: Bot) {[^1^][1]
  await db.cancelOldTasks();
  const tasks = await db.getTasks();
  const myBalance: MyBalance = { ton: 0n, usdt: 0n, usdc: 0n };
  try {
    myBalance.ton = await tonClient.getBalance(contract.address);
    myBalance.usdt = (await tonClient.runMethod(jettonWallets.usdt, 'get_wallet_data')).stack.readBigNumber();
    myBalance.usdc = (await tonClient.runMethod(jettonWallets.usdc, 'get_wallet_data')).stack.readBigNumber();
  } catch (e) {
    console.log(e);
    return;
  }
  for (const task of tasks) {
    if (!hasEnoughBalance(task, myBalance)) {
      console.log(`Not enough balance for liquidation task ${task.id}`);
      await bot.api.sendMessage(serviceChatID, `❌ Not enough balance for liquidation task ${task.id} <b>Loan asset:</b> ${task.loanAsset.toString()} <b>Liquidation amount:</b> ${task.liquidationAmount.toLocaleString()} <b>My balance:</b> <b>- ton:</b> ${myBalance.ton.toLocaleString()} <b>- USDT:</b> ${myBalance.usdt.toLocaleString()} <b>- USDC:</b> ${myBalance.usdc.toLocaleString()}`, {parse_mode: 'HTML'});
      await db.cancelTaskNoBalance(task.id);
      continue;
    }
    const pricesCell = createPricesCell(task);
    let liquidationBody = Cell.EMPTY;
    let amount = 0n;
    let destAddr: string;
    if (task.loanAsset === AssetID.ton) {
      liquidationBody = createtonLiquidationBody(task, pricesCell);
      amount = task.liquidationAmount;
      destAddr = getAddressFriendly(evaaMaster);
    } else {
      liquidationBody = createTokenLiquidationBody(task, pricesCell);
      amount = tonano('1');
      destAddr = getJettonWallet(task.loanAsset);
    }
    await contract.sendTransfer({
      seqno: await contract.getSeqno(),
      secretKey: keys.secretKey,
      messages: [
        internal({
          value: amount,
          to: destAddr,
          body: liquidationBody
        })
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY
    });
    await db.liquidateSent(task.id);
    console.log(`Liquidation task ${task.id} sent for ${task.walletAddress}`);
    break;
  }
}

function hasEnoughBalance(task: LiquidationTask, myBalance: MyBalance) {
  return (task.loanAsset === AssetID.ton && myBalance.ton >= task.liquidationAmount) ||
    (task.loanAsset === AssetID.usdt && myBalance.usdt >= task.liquidationAmount) ||
    (task.loanAsset === AssetID.usdc && myBalance.usdc >= task.liquidationAmount);
}

function createPricesCell(task: LiquidationTask) {
  return beginCell()
    .storeRef(Cell.fromBase64(task.pricesCell))
    .storeBuffer(Buffer.from(task.signature, 'hex'))
    .endCell();
}

function createtonLiquidationBody(task: LiquidationTask, pricesCell: Cell) {
  return beginCell()
    .storeUint(0x3, 32)
    .storeUint(task.queryID, 64)
    .storeAddress(Address.parse(task.walletAddress))
    .storeUint(task.collateralAsset, 256)
    .storeUint(task.minCollateralAmount, 64)
    .storeInt(-1, 2)
    .storeRef(pricesCell)
    .endCell();
}

function createTokenLiquidationBody(task: LiquidationTask, pricesCell: Cell) {
  return beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(task.queryID, 64)
    .storetons(task.liquidationAmount)
    .storeAddress(evaaMaster)
    .storeAddress(contract.address)
    .storeBit(0)
    .storetons(tonano('0.7'))
    .storeBit(1)
    .storeRef(createtonLiquidationBody(task, pricesCell))
    .endCell()
}
