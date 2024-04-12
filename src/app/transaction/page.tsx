"use client";

import { useEffect, useState } from "react";
import AccountSidebar from "../_components/Account";
import TransactionItem, { TRANSACTION_TYPE } from "../_components/Transaction";
import { getTx as getBTCTx } from "@/query/btc/memepool";
import { getTx as getCKBTx } from "@/query/ckb/tools";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { btcGroupedTransaction, ckb_TxInfo, groupedTransaction } from "@/types/BTC";
import { BI } from "@ckb-lumos/lumos";

export default function Transaction() {
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
  const [chain, setChain] = useState<string>("");
  const [groupedData, setGroupedData] = useState<groupedTransaction>()
  const [btcGroupData, setBtcGroupData] = useState<btcGroupedTransaction> ()

  const groupTransaction = (transactions: ckb_TxInfo[]) => {
    const grouped: groupedTransaction = {};
    if(!transactions) return
    transactions.forEach(transaction => {
        const date = transaction.attributes.created_at.split(' ')[0]; // 提取日期部分
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(transaction);
    });
    return grouped;
  }

  const _getCKBTx = async() => {
    const list = await getCKBTx(currentAddress!!);
    const groupedTx = groupTransaction(list.data);
    console.log(groupedTx);
    setGroupedData(groupedTx);
  }

  const _getBTCTx = async() => {
    const list = await getBTCTx(currentAddress!!);
    console.log(list);
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
                (chain && chain === 'btc') && <div className="pb-10 flex-1 pr-4 border-l border-t border-primary004">
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
          </div>
        </div>
      </div>
    </main>
  );
}
