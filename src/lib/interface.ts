import { BIish } from "@ckb-lumos/bi";
import { BI, Cell, Script } from "@ckb-lumos/lumos";
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

export interface AssetInfo {
  chain: string;
  balance: BI;
  symbol?: string;
  icon?: string;
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
  txHash?: string;
  txIndex?: string;
  block?: string;
  balance?: bigint;
}

export interface tokensInfo {
  udt: ckb_UDTInfo[];
  spore: ckb_SporeInfo[];
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

export interface btc_AddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

export interface ckb_SporeInfo {
  symbol: string;
  amount: string;
  type_hash: string;
  udt_icon_file: string;
  udt_type: "spore_cell" | "sudt";
  decimal?: string;
  display_name?: string;
  uan?: string;
}

export interface ckb_UDTInfo {
  symbol: string;
  amount: string;
  type_hash: string;
  udt_icon_file: string;
  udt_type: "spore_cell" | "sudt";
}

export interface ckb_AddressInfo {
  data: {
    id: string;
    type: "address";
    attributes: {
      lock_info: null;
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
        udt_icon_file: string;
        udt_type: "spore_cell" | "sudt";
        collection?: {
          type_hash: string;
        };
        decimal?: string;
        display_name?: string;
        uan?: string;
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
}

export interface btc_TxInfo {
  txid: string;
  version: number;
  locktime: number;
  vin: { [key: string]: string }[];
  vout: { [key: string]: string }[];
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
}

export interface ckb_TxInfo {
  id: string;
  type: "ckb_transactions";
  attributes: {
    is_cellbase: boolean;
    transaction_hash: string;
    block_number: string;
    block_timestamp: string;
    display_inputs_count: number;
    display_outputs_count: number;
    display_inputs: {
      id: string;
      from_cellbase: boolean;
      capacity: string;
      occupied_capacity: string;
      address_hash: string;
      generated_tx_hash: string;
      cell_index: string;
      cell_type: string;
      since: {
        raw: string;
        median_timestamp: string;
      };
    }[];
    display_outputs: {
      id: string;
      capacity: string;
      occupied_capacity: string;
      address_hash: string;
      status: string;
      consumed_tx_hash: string;
      cell_type: string;
    }[];
    income: string;
    created_at: string;
    create_timestamp: string;
  };
}

export interface WalletInfo {
  address: string;
  pubkey: string;
  type: WalletType;
  chain: "BTC" | "CKB";
}

export interface RgbAssert {
  txHash: string;
  idx: number;
  ckbCell: Cell;
}

// type
export type WalletType = "none" | "unisat" | "okx" | "joyid";
