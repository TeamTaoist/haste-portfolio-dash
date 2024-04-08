"use client";

import { useState } from "react";
import Image from 'next/image';

export default function UDTList() {
  const [tokens] = useState(new Array(100).fill(0));

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="font-SourceSanPro font-semibold text-primary003 grid grid-cols-12 py-2 text-left">
            <th className="col-span-7 lg:col-span-5 cursor-pointer px-2">
              Token
            </th>
            <th className="col-span-4 lg:col-span-2 cursor-pointer px-2">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="text-white">
          {tokens.map((_, index) => (
            <tr
              key={index}
              className="hover:bg-primary010 grid grid-cols-12 group py-2 border-t border-gray-500"
            >
              <td className="col-span-7 lg:col-span-5 px-2">
                <div className="flex gap-3 items-center">
                  <div>
                    <Image
                      width={32}
                      height={32}
                      src="/img/btc.png"
                      alt="USDT"
                      className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">SUDT</p>
                    <p className="text-sm text-slate-500 truncate sm:max-w-none max-w-[8rem]">
                      sudtsudt
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
                <p className="text-sm sm:text-base text-default font-semibold truncate">
                  0.000001
                </p>
                <p className="text-xs sm:text-sm leading-5 font-normal text-slate-300 truncate">
                  $1.23
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
