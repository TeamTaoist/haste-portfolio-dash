import { BIish } from "@ckb-lumos/bi";
import { BI, Script } from "@ckb-lumos/lumos";
export interface AccountData {
  chain: string;
  addr: string;
}

export interface btc_Address {
  hash160: string;
  address: string;
  n_tx: number;
  n_unredeemed?: number;
  total_received: number;
  total_sent: number;
  final_balance: number;
  txs?: btc_Transaction[];
}

export interface btc_Transaction {
  hash: string;
  ver: number;
  vin_sz: number;
  vout_sz: number;
  lock_time: string;
  size: number;
  relayed_by: string;
  block_height: number;
  tx_index: string;
  inputs: btc_tx_Input[];
  out: btc_tx_Out[];
}

export interface btc_tx_Input {
  prev_out: {
    hash: string;
    value: string;
    tx_index: string;
    n: string;
  };
  script: string;
}

export interface btc_tx_Out {
  value: string;
  hash: string;
  script: string;
}

export interface ckb_AddressInfo {
  addressInfo: {
    data: {
      id: string;
      type: string;
      attributes: {
        lock_info: string | null;
        address_hash: string;
        balance: string;
        transactions_count: string;
        dao_deposit: string;
        interest: string;
        is_special: string;
        live_cells_count: string;
        mined_blocks_count: string;
        average_deposit_time: string;
        udt_accounts: {
          symbol: string;
          amount: string;
          type_hash: string;
          collection: {
            type_hash: string;
          };
          udt_icon_file: string;
          udt_type: string;
        }[];
        lock_script: {
          args: string;
          code_hash: string;
          hash_type: string;
        };
        dao_compensation: string;
        balance_occupied: string;
      };
    };
  };
  address: string;
}

export interface AssetInfo {
  chain: string;
  balance: BI;
}

export interface ckb_TxInfo {
  objects: {
    txHash: string;
    txIndex: string;
    blockNumber: string;
    cells: string[][];
  }[];
  lastCursor: string;
}

export interface txInfo {
  txHash: string;
  txIndex: string;
  blockNumber: string;
}

export interface tokensInfo {
  udt: { type: string; balance: string; symbol: string }[];
  spore: string[];
}

export interface ckb_TransferOptions {
  from: string;
  to: string;
  amount: BIish;
  typeScript?: Script;
}

export interface btc_utxo {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export interface UdtInfo {
  type: string;
  typeScriptHex: string;
  balance: BI;
}

// type
export type WalletType = "none" | "unisat" | "okx" | "joyid";
