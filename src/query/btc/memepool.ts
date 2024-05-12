import { getEnv } from "../../settings/env";
import { BTCAccountInfo, BTCTxInfo } from "../../types/BTC";
import superagent from "superagent";


async function fetchFromMempoolSpace(endpoint: string): Promise<any> {
  try {
    const url = `https://mempool.space${getEnv() === 'Mainnet' ? '' : '/testnet'}/${endpoint}`;
    const result = await superagent.get(url);
    if (result.status === 200) {
      return JSON.parse(result.text);
    }
  } catch (err) {
    throw err;
  }
}


export const getBTC = async (address: string): Promise<BTCAccountInfo | undefined> => {
  return await fetchFromMempoolSpace(`api/address/${address}`);
}

export const getUtxo = async (address: string): Promise<any> => {
  return await fetchFromMempoolSpace(`api/address/${address}/utxo`);
}

export const getTx = async(address: string, after_txid?: string): Promise<BTCTxInfo[] | undefined> => {
  const endpoint = `api/address/${address}/txs${after_txid ? `?after_txid=${after_txid}` : ''}`;
  return await fetchFromMempoolSpace(endpoint);
}
