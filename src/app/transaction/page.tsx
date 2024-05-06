"use client";

import { useEffect, useState } from "react";
import AccountSidebar from "@/app/_components/Account";
import TransactionItem, { TRANSACTION_TYPE } from "@/app/_components/TransactionComponent";
import { getTx as getBTCTx } from "@/query/btc/memepool";
import { getTx as getCKBTx } from "@/query/ckb/tools";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { btc_TxInfo, btcGroupedTransaction, BTCTxInfo, ckb_TxInfo, groupedTransaction, GroupedTransactions, BitcoinTransaction, TransactionDetails } from "@/types/BTC";
import { BI, BIish } from "@ckb-lumos/lumos";
import { formatUnit } from "@ckb-lumos/bi";
import Image from 'next/image';
import { getEnv } from "@/settings/env";
import Loading from "@/app/_components/loading";
import {BookDashed} from "lucide-react";

const Transaction = () => {
  const currentAddress = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const currentWallet = wallets.find(wallet => wallet.address === currentAddress);
  const [chain, setChain] = useState<string>("");
  const [groupedData, setGroupedData] = useState<groupedTransaction | null>()
  const [btcGroupData, setBtcGroupData] = useState<GroupedTransactions | null> ()
  const [isListLoading, setIsListLoading] = useState<boolean>(false)
  const [isEmptyList, setIsEmptyList] = useState<boolean>(false)

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
    let inputValue = {

    }
    let outputValue = {

    }
    transaction.vin.forEach(input => {
      //@ts-ignore
      if(inputValue[input.prevout.scriptpubkey_address]) {
        //@ts-ignore
        inputValue[input.prevout.scriptpubkey_address] = inputValue[input.prevout.scriptpubkey_address].add(BI.from(input.prevout.value))
      } else {
        //@ts-ignore
        inputValue[input.prevout.scriptpubkey_address] = BI.from(input.prevout.value)
      }
    });

    // Calculate the value being transferred to different addresses
    transaction.vout.forEach(output => {
      if(!output.scriptpubkey_address) return
      //@ts-ignore
      if(outputValue[output.scriptpubkey_address]) {
        //@ts-ignore
        outputValue[output.scriptpubkey_address] = outputValue[output.scriptpubkey_address].add(BI.from(output.value))
      } else {
        //@ts-ignore
        outputValue[output.scriptpubkey_address] = BI.from(output.value)
      }
    });

    let value: string = '0';
    if(!currentAddress) { value = '0'}
    //@ts-ignore
    if(outputValue[currentAddress!!]) {
      //@ts-ignore
      value = outputValue[currentAddress!!].sub(inputValue[currentAddress] || 0).toString()
    } else {
      //@ts-ignore
      value = '-' + inputValue[currentAddress!!].toString()
    }

    const transactionTime = transaction.status.block_time ? new Date(transaction.status.block_time * 1000).toLocaleTimeString('en-US') : '';

    return {
        fromAddress: fromAddresses.join(', '),
        toAddress,
        value: value ,
        txid: transaction.txid,
        transactionTime
    };
  }



  function groupTransactionsByDate(transactions: BTCTxInfo[]): GroupedTransactions {
    const grouped: GroupedTransactions = {};
    transactions.forEach(transaction => {
      const transactionDetails = processTransaction(transaction);
      // Convert the block_time to a date string
      const date = transaction.status.block_time ? new Date(transaction.status.block_time * 1000).toISOString().split('T')[0]: 'pending transaction';

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



  const _getCKBTx = async () => {
      setIsListLoading(true);
      setIsEmptyList(true);
      setGroupedData(null);
      try {
          const list = await getCKBTx(currentAddress!!);
          const groupedTx = groupTransaction(list.data);
          setIsEmptyList(list.data.length === 0);
          setGroupedData(groupedTx);
      } catch (error) {
          console.error("Failed to fetch CKB transactions:", error);
          setIsEmptyList(true);
      } finally {
          setIsListLoading(false);
      }
  }

  const _getBTCTx = async () => {
      setIsListLoading(true);
      setIsEmptyList(true);
      setBtcGroupData(null);
      try {
          const list = await getBTCTx(currentAddress!!);
          if (list && list.length > 0) {
              setBtcGroupData(groupTransactionsByDate(list));
              setIsEmptyList(false);
          } else {
              setIsEmptyList(true);

          }
      } catch (error) {
          console.error("Failed to fetch BTC transactions:", error);
          setIsEmptyList(true);
      } finally {
          setIsListLoading(false);
      }
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
    <main className="flex flex-col flex-1 h-full bg-gray-100 text-black">
      <div className="h-full w-full flex flex-col">
        <div className="sm:mt-20 flex text-black text-hd1mb border-b border-gray-300 w-full py-10 px-8 font-Montserrat font-bold">
          Transaction
        </div>
        <div className="w-full h-full flex flex-1 min-h-0 no-scrollbar">
          <div className=" h-full bg-primary010">
            <AccountSidebar />
          </div>
          <div className="flex-1 sm:pr-0 sm:border-none overflow-scroll no-scrollbar relative">
            {
              (isListLoading || isEmptyList) &&
              <div className="w-full h-full flex flex-col items-center justify-center gap-8">
                {/*<Image*/}
                {/*  src={'/img/joker.png'}*/}
                {/*  width={256}*/}
                {/*  height={256}*/}
                {/*  alt="is empty"*/}
                {/*/>*/}
                <div className="text-black opacity-30 uppercase">
                  {/*{isListLoading && 'Your data is on the way'}*/}
                  {/*{(!isListLoading && isEmptyList) && 'Your Wallet in Gottam is empty'}*/}
                    {(!isListLoading && isEmptyList) && <div className="flex gap-4"><BookDashed />No data</div>}
                </div>
              </div>
            }
            {
            isListLoading && <Loading />
        }
            {
                (chain && chain === 'ckb' && !isEmptyList) &&

                <div className="pb-10 flex-1 lg:pr-4 md:pr-4 sm:border-none ">
                    {groupedData && Object.keys(groupedData).map(date => (
                        <div key={date} className="top-0 font-medium text-sm py-4">
                            <div className="px-6 text-sm text-subdued mb-2 font-din font-semibold">
                                {date}
                            </div>
                            {groupedData[date].map((transaction, index) => (
                                <TransactionItem
                                    key={index}
                                    transaction={`https://${getEnv() === 'Mainnet' ? '': 'pudge.'}explorer.nervos.org/transaction/${transaction.attributes.transaction_hash}`}
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
                (chain && chain === 'btc' && !isEmptyList) &&

                <div className="pb-10 flex-1 pr-4 ">
                    {btcGroupData && Object.keys(btcGroupData).map(date => (
                        <div key={date} className="top-0 font-medium text-sm py-4">
                            <div className="px-4 text-sm text-subdued mb-2 capitalize">
                                {date}
                            </div>
                            {btcGroupData[date].map((transaction, index) => (
                                <TransactionItem
                                    key={index}
                                    transaction={`https://mempool.space/${getEnv() === 'Testnet' && 'testnet'}/tx/${transaction.txid}`}
                                    from={transaction.fromAddress}
                                    to={transaction.toAddress!!}
                                    hours={transaction.transactionTime}
                                    type={BI.from(transaction.value).gt(0) ? TRANSACTION_TYPE.RECEIVE : TRANSACTION_TYPE.SEND}
                                    amount={
                                      formatUnit(transaction.value, 'ckb')
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

export default Transaction
