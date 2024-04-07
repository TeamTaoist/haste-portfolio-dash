"use client";

import { useState } from "react";

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
              <td className="col-span-7 lg:col-span-5 px-2">SUDT</td>
              <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
                0.000001
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
