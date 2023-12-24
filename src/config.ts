import { Address } from "@ton/core";

// ------------------ Constants ------------------ //
const TON_DECIMALS = 1_000_000_000n;
const JETTON_DECIMALS = 1_000_000n;
const DOLLAR_DECIMALS = 1_000_000_000n;

// ------------------ Config File ------------------ //
export default {
  evaaMaster: Address.parse(process.env.EVAA_MASTER),
  AssetID: {
    ton: process.env.TON_ID,
    usdt: process.env.USDT_ID,
    usdc: process.env.USDC_ID,
  },
  rpcEndpoint: process.env.RPC_ENDPOINT,
  tonApiEndpoint: process.env.TON_API_ENDPOINT,
  isTestnet: process.env.IS_TESTNET,
  decimals: {
    ton: TON_DECIMALS,
    jetton: JETTON_DECIMALS,
    dollar: DOLLAR_DECIMALS,
  },
  jettonWallets: {
    usdt: process.env.USDT_WALLET,
    usdc: process.env.USDC_WALLET,
  },
  iotaEndpoint: process.env.IOTA_ENDPOINT,
  NFT_ID: process.env.NFT_ID,
  serviceChatID: process.env.SERVICE_CHAT_ID,
};
