import {isTestnet} from "../../config";
import {Address} from "@ton/core";

export function getAddressFriendly(addr: Address) {
  return addr.toString({ bounceable: true, testOnly: isTestnet });
}

export function getRequest(address: Address, before_lt: number = 0) {
  return `v2/blockchain/accounts/${address.toRawString()}/transactions?limit=100${before_lt ? `&before_lt=${before_lt}` : ''}`;
}
