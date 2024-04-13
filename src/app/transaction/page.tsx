"use client";

import { useEffect, useState } from "react";
import AccountSidebar from "../_components/Account";
import TransactionItem, { TRANSACTION_TYPE } from "../_components/Transaction";
import { getTx as getBTCTx } from "@/query/btc/memepool";
import { getTx as getCKBTx } from "@/query/ckb/tools";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { btc_TxInfo, btcGroupedTransaction, BTCTxInfo, ckb_TxInfo, groupedTransaction, GroupedTransactions, BitcoinTransaction, TransactionDetails } from "@/types/BTC";
import { BI, BIish } from "@ckb-lumos/lumos";

export default function Transaction() {
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
  const [chain, setChain] = useState<string>("");
  const [groupedData, setGroupedData] = useState<groupedTransaction>()
  const [btcGroupData, setBtcGroupData] = useState<GroupedTransactions> ()

  const groupTransaction = (transactions: ckb_TxInfo[]) => {
    const grouped: groupedTransaction = {};
    if(!transactions) return
    transactions.forEach(transaction => {
        const date = transaction.attributes.created_at.split(' ')[0]; 
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(transaction);
    });
    return grouped;
  }

function processTransaction(transaction: BTCTxInfo): TransactionDetails {
    //@ts-ignore
    const fromAddresses = transaction.vin.map(input => input.prevout.scriptpubkey_address);
    let toAddress = currentAddress;
    let transferredValue = BI.from(0);

    // Calculate the value being transferred to different addresses
    transaction.vout.forEach(output => {
        if (output.scriptpubkey_address && output.scriptpubkey_address !== currentAddress) {
            if (fromAddresses.includes(currentAddress)) {
                if (output.scriptpubkey_address !== currentAddress) {
                    toAddress = output.scriptpubkey_address;
                    transferredValue = BI.from(transferredValue).add(output.value);
                }
            } else {
                transferredValue = BI.from(transferredValue).add(output.value);
            }
        }
    });

    const transactionTime = new Date(transaction.status.block_time * 1000).toLocaleTimeString('en-US');

    return {
        fromAddress: fromAddresses.join(', '),
        toAddress,
        value: transferredValue.toString(),
        txid: transaction.txid,
        transactionTime
    };
  }



  function groupTransactionsByDate(transactions: BTCTxInfo[]): GroupedTransactions {
    const grouped: GroupedTransactions = {};

    transactions.forEach(transaction => {
      const transactionDetails = processTransaction(transaction);
      
      // Convert the block_time to a date string
      const date = new Date(transaction.status.block_time * 1000).toISOString().split('T')[0];

      // Initialize the date key if it does not exist
      if (!grouped[date]) {
          grouped[date] = [];
      }

      // Add the processed transaction to the appropriate date
      //@ts-ignore
      grouped[date].push(transactionDetails);
    });
    return grouped;
  }



  const _getCKBTx = async() => {
    const list = await getCKBTx(currentAddress!!);
    const groupedTx = groupTransaction(list.data);
    setGroupedData(groupedTx);
  }

  const _getBTCTx = async() => {
    const list = await getBTCTx(currentAddress!!);
    if(!list) return
    setBtcGroupData(groupTransactionsByDate(list!!));
  }

  useEffect(() => {
    let chainName = currentWallet?.chain
    if(!chainName) {
      return
    }
    setChain(chainName)

    if(chainName === 'ckb') {
      _getCKBTx();
    } else if(chainName === 'btc')  {
      _getBTCTx();
    }
  }, [currentAddress])
  return (
    <main className="flex flex-col flex-1 h-full bg-primary008 text-white001">
      <div className="h-full w-full flex flex-col">
        <div className="md:mx-4 lg:mx-8 text-hd1mb py-4 px-4 font-Montserrat my-4">
          Transaction
        </div>
        <div className="w-full h-full flex flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="border-t border-primary004">
            <AccountSidebar />
          </div>
          <div className="pb-10 flex-1 pr-4 border-l border-t border-primary004">
            {
                (chain && chain === 'ckb') && 
                
                <div className="pb-10 flex-1 pr-4 border-l border-t border-primary004">
                    {groupedData && Object.keys(groupedData).map(date => (
                        <div key={date} className="top-0 font-medium text-sm py-4">
                            <div className="px-4 text-sm text-subdued mb-2">
                                {date} 
                            </div>
                            {groupedData[date].map((transaction, index) => (
                                <TransactionItem
                                    key={index}
                                    transaction={transaction.attributes.transaction_hash}
                                    from={transaction.attributes.display_inputs[0].address_hash}
                                    to={transaction.attributes.display_outputs[0].address_hash}
                                    hours={transaction.attributes.created_at.split(' ')[1]}
                                    type={BI.from(transaction.attributes.income.split('.')[0]).gt(0) ? TRANSACTION_TYPE.RECEIVE : TRANSACTION_TYPE.SEND} 
                                    amount={
                                      BI.from(transaction.attributes.income.split('.')[0]).abs().div((BI.from(10).pow(8))).toString()
                                    } 
                                    token={transaction.type === 'ckb_transactions' ? 'ckb': 'btc'}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            }
            {
                (chain && chain === 'btc') && 
                
                <div className="pb-10 flex-1 pr-4 border-l border-t border-primary004">
                    {btcGroupData && Object.keys(btcGroupData).map(date => (
                        <div key={date} className="top-0 font-medium text-sm py-4">
                            <div className="px-4 text-sm text-subdued mb-2">
                                {date} 
                            </div>
                            {btcGroupData[date].map((transaction, index) => (
                                <TransactionItem
                                    key={index}
                                    transaction={transaction.txid}
                                    from={transaction.fromAddress}
                                    to={transaction.toAddress!!}
                                    hours={transaction.transactionTime}
                                    type={BI.from(transaction.value).gt(0) ? TRANSACTION_TYPE.RECEIVE : TRANSACTION_TYPE.SEND} 
                                    amount={
                                      BI.from(transaction.value).abs().div((BI.from(10).pow(9))).toString()
                                    } 
                                    token={'btc'}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            }
          </div>
        </div>
      </div>
    </main>
  );
}
