export default function UDTList() {
  return (
    <div className="mt-4 w-full">
      <table className="w-full">
        <thead>
          <tr className="font-SourceSanPro font-semibold text-primary003 text-right lg:text-left grid grid-cols-12 py-2">
            <th className="col-span-7 lg:col-span-5 cursor-pointer px-2">
              Token
            </th>
            <th className="text-right lg:text-left col-span-4 lg:col-span-2 cursor-pointer px-2">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="text-white">
          <tr className="hover:bg-primary010 grid grid-cols-12 group py-2 border-t border-gray-500">
            <td className="col-span-7 lg:col-span-5 px-2">SUDT</td>
            <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
              111
            </td>
          </tr>
          <tr className="hover:bg-primary010 grid grid-cols-12 group py-2 border-t border-gray-500">
            <td className="col-span-7 lg:col-span-5 px-2">SUDT</td>
            <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
              111
            </td>
          </tr>
          <tr className="hover:bg-primary010 grid grid-cols-12 group py-2 border-t border-gray-500">
            <td className="col-span-7 lg:col-span-5 px-2">SUDT</td>
            <td className="px-2 whitespace-nowrap sm:w-auto col-span-3 lg:col-span-2">
              111
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
