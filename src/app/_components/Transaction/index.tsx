import Image from "next/image";
import {
  Copy,
  ChevronRight,
  CircleArrowOutUpRight,
  CircleArrowOutDownLeft,
  ExternalLink,
} from "lucide-react";
import { formatString } from "@/utils/common";
import { getEnv } from "@/settings/env";
import { enqueueSnackbar } from "notistack";

export enum TRANSACTION_TYPE {
  SEND,
  RECEIVE,
}

const TokenBlock = ({
  amount,
  type,
  token,
}: {
  amount: number | string;
  type: TRANSACTION_TYPE;
  token: string;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Image
        width={32}
        height={32}
        src={`/img/${token}.png`}
        alt="USDT"
        className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
      />
      <div className="">
        {type === TRANSACTION_TYPE.RECEIVE ? (
          <div className="text-lime-600">+{amount}</div>
        ) : (
          <div className="text-red-600">-{amount}</div>
        )}
        <div className="text-slate-600 uppercase">{token}</div>
      </div>
    </div>
  );
};

const AccountBlock = ({token, address,type}:{ token: string, address: string,type:TRANSACTION_TYPE;}) => {
  return (
    <div className="flex items-center gap-2">
      <Image
        width={32}
        height={32}
        src={`/img/${token}.png`}
        alt=""
        className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
      />
      <div className="">
        <span>{type === TRANSACTION_TYPE.SEND ? "To" : "From"}</span>
        <div className="text-slate-600">{address}</div>
      </div>
    </div>
  );
};

const ReceiveBlock = ({ amount, token, address,type }: { amount: number | string, token: string, address: string ,type:TRANSACTION_TYPE}) => {
  return (
    <div className="flex sm:flex-1 sm:justify-start items-center space-x-2 sm:space-x-4">
      <AccountBlock token={token} address={address} type={type} />
      <div className="mx-1 sm:mx-2 text-sm">
        <ChevronRight />
      </div>
      <TokenBlock amount={amount} type={TRANSACTION_TYPE.RECEIVE} token={ token } />
    </div>
  );
};

const SendBlock = ({ amount, token, address,type }: { amount: number | string, token: string, address: string ,type:TRANSACTION_TYPE }) => {
  return (
    <div className="flex sm:flex-1 sm:justify-start items-center space-x-2 sm:space-x-4">
      <TokenBlock amount={amount} type={TRANSACTION_TYPE.SEND} token={token} />
      <div className="mx-1 sm:mx-2 text-sm">
        <ChevronRight />
      </div>
      <AccountBlock token={token} address={address}  type={type} />
    </div>
  );
};

interface ITransactionItemProps {
  type: TRANSACTION_TYPE;
  amount: number | string;
  token: 'btc' | 'ckb';
  from: string;
  to: string;
  hours?: string;
  transaction: string;
}

export default function TransactionItem({
  type,
  amount,
  token,
  from,
  to,
  hours,
  transaction,
}: ITransactionItemProps) {

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      enqueueSnackbar('Copied Successful', {variant: 'success'})
    } catch (err) {
      enqueueSnackbar('Copied Fail', {variant: 'error'})
    }
  };

  return (
    <div className="hover:bg-gray-200  cursor-pointer p-4 sm:border-b last:border-none border-gray-500 bg-white  rounded-lg mb-4 ml-4">
      <div className="flex items-center">
        <div className="relative rounded-full flex w-8 h-8 items-center justify-center">
          {type === TRANSACTION_TYPE.SEND ? (
            <CircleArrowOutUpRight className="text-green-600" />
          ) : (
            <CircleArrowOutDownLeft className="text-primary011" />
          )}
        </div>
        <div className="overflow-y-visible overflow-x-auto sm:overflow-x-visible whitespace-nowrap text-ellipsis flex flex-wrap flex-1 justify-between lg:grid grid-cols-12 gap-4 lg:gap-5 xl:gap-6 items-center pl-4">
          <div className="flex items-center space-x-4 col-span-4 2xl:col-span-3">
            <div className="flex sm:block">
              <div className={type === TRANSACTION_TYPE.SEND ?"font-semibold whitespace-nowrap sm:pr-1 text-green-600":"font-semibold whitespace-nowrap sm:pr-1 text-primary011"}>
                {type === TRANSACTION_TYPE.SEND ? "Send " : "Receive "}
              </div>
              <div className="ml-4 sm:ml-0 text-slate-600 whitespace-nowrap">
                {hours}
              </div>
            </div>
            <div className="flex items-center text-slate-300 space-x-1 hover:bg-primary011 hover:text-white rounded-full">
              <button className="p-2 items-center flex cursor-pointer w-fit" onClick={()=>handleCopy(transaction)}>
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="col-span-7 2xl:col-span-5 sm:flex-1 hidden lg:flex truncate">
            {type === TRANSACTION_TYPE.SEND ? (
              <SendBlock amount={amount} token={token} address={formatString(to, 5)} type={type} />
            ) : (
              <ReceiveBlock amount={amount} token={token} address={formatString(from, 5)} type={type} />
            )}
          </div>
          <div className="flex items-center justify-end space-x-2 col-span-1 2xl:col-span-2">
            <a
              href={transaction}
              className="text-slate-400 hover:bg-primary011 hover:text-white p-2 rounded-full flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink  size={20} />
            </a>
          </div>
        </div>
      </div>
      <div className="lg:hidden col-span-7 2xl:col-span-5 sm:flex-1 mt-4 visible bg-gray-100 rounded-lg p-2">
        {type === TRANSACTION_TYPE.SEND ? (
          <SendBlock amount={amount} token={token} address={formatString(to, 5)} type={type} />
        ) : (
          <ReceiveBlock amount={amount} token={token} address={formatString(from, 5)} type={type} />
        )}
      </div>
    </div>
  );
}
