import React from 'react';

interface InvoiceProps {
  order: any;
  customer: { name: string; phone: string; address?: string };
}

// Custom function to convert numbers to Indian Rupee Words
const numberToWords = (num: number): string => {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  const numStr = num.toString();
  if (numStr.length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) : '';
  
  return str.trim();
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB'); // Formats exactly as DD/MM/YYYY
};

export const InvoiceTemplate: React.FC<InvoiceProps> = ({ order, customer }) => {
  if (!order) return null;

  const items = order.order_items || [];
  const pages = [];
  let remaining = [...items];
  let pageNum = 0;

  // --- SMART PAGINATION LOGIC ---
  // Page 1 holds fewer items because of the massive Header block.
  // Subsequent pages hold more because they only have the table.
  while (remaining.length > 0) {
    if (pageNum === 0) {
      if (remaining.length <= 13) {
        pages.push(remaining); // Fits completely with footer
        remaining = [];
      } else {
        pages.push(remaining.slice(0, 18)); // Fill page 1, push rest to page 2
        remaining = remaining.slice(18);
      }
    } else {
      if (remaining.length <= 20) {
        pages.push(remaining); // Fits completely with footer
        remaining = [];
      } else {
        pages.push(remaining.slice(0, 25)); // Fill middle page, push rest
        remaining = remaining.slice(25);
      }
    }
    pageNum++;
  }

  // Calculate starting index for Serial Numbers across dynamic pages
  let currentStartIndex = 0;
  const pageStartIndices = pages.map(p => {
    const idx = currentStartIndex;
    currentStartIndex += p.length;
    return idx;
  });

  const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
  const invoiceDate = formatDate(order.created_at);

  return (
    <div id="invoice-capture-container" className="bg-white text-black font-sans w-[210mm] text-[13px] leading-tight" style={{ color: '#000' }}>
      {pages.map((pageItems, pageIndex) => (
        <div key={pageIndex} className="invoice-page w-[210mm] h-[297mm] px-12 pt-14 pb-16 relative box-border bg-white flex flex-col">

          {/* ================= PAGE 1 ONLY HEADER ================= */}
          {pageIndex === 0 && (
            <>
              {/* ABSOLUTE BADGE (Pushed perfectly into the top padding space) */}
              <div className="absolute top-6 left-12 flex items-center gap-3">
                <span className="font-bold text-sm tracking-wide">BILL OF SUPPLY</span>
                <span className="border border-gray-400 px-1.5 py-0.5 text-[10px] text-gray-500 rounded-sm uppercase">ORIGINAL</span>
              </div>

              {/* BRAND & LOGO */}
              <div className="flex items-center gap-6 mb-4 mt-2 shrink-0">
                <img src="/assests/logo.png" alt="Logo" className="w-24 h-24 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                <div>
                  <h1 className="text-3xl font-extrabold mb-1 tracking-tight">Kannan pyro park</h1>
                  <p className="font-bold">Mobile: <span className="font-normal">9787771865</span></p>
                  <p className="font-bold">Email: <span className="font-normal">kannanpyropark@gmail.com</span></p>
                </div>
              </div>

              {/* Thick Black Divider */}
              <div className="h-2.5 bg-black w-full mb-1 shrink-0"></div>

              {/* GRAY METADATA BAR */}
              <div className="bg-gray-200 flex justify-between items-center px-4 py-2.5 mb-6 font-bold shrink-0">
                <div>Invoice No.: <span className="font-normal">{order.displayId}</span></div>
                <div>Invoice Date: <span className="font-normal">{invoiceDate}</span></div>
                <div>Due Date: <span className="font-normal">{invoiceDate}</span></div>
              </div>

              {/* BILL TO SECTION */}
              <div className="mb-6 shrink-0">
                <h3 className="font-bold mb-2">BILL TO</h3>
                <p className="uppercase">{customer.name}</p>
                <p>{customer.phone}</p>
                {order.profiles?.delivery_address && (
                  <p className="whitespace-pre-wrap max-w-[60%] mt-0.5">{order.profiles?.delivery_address}</p>
                )}
              </div>
            </>
          )}

          {/* ================= SUBSEQUENT PAGE MINI-HEADER ================= */}
          {pageIndex > 0 && (
             <div className="text-[11px] font-bold text-gray-500 mb-4 text-right uppercase tracking-wider shrink-0">
               Invoice No: {order.displayId} (Continued)
             </div>
          )}

          {/* ================= ITEMS TABLE ================= */}
          <div className="flex-1 flex flex-col">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-t-2 border-b-2 border-black">
                  <th className="py-2.5 font-bold w-[8%] text-center">S.NO</th>
                  <th className="py-2.5 font-bold w-[47%] pl-2">ITEMS</th>
                  <th className="py-2.5 font-bold text-right w-[15%]">QTY.</th>
                  <th className="py-2.5 font-bold text-right w-[15%]">RATE</th>
                  <th className="py-2.5 font-bold text-right w-[15%]">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item: any, idx: number) => {
                  const serialNumber = pageStartIndices[pageIndex] + idx + 1;
                  return (
                    <tr key={idx} className="border-b border-gray-200 last:border-none">
                      <td className="py-2.5 text-center text-gray-600">{serialNumber}</td>
                      <td className="py-2.5 pl-2 uppercase">{item.name || item.title}</td>
                      <td className="py-2.5 text-right uppercase">{item.quantity} {item.unit || 'PCS'}</td>
                      <td className="py-2.5 text-right">{item.price}</td>
                      <td className="py-2.5 text-right">{item.price * item.quantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= CONTINUATION UNDERLINE ================= */}
          {pageIndex < pages.length - 1 && (
            <div className="absolute bottom-16 left-12 right-12 border-b-[3px] border-black opacity-80 shrink-0"></div>
          )}

          {/* ================= FOOTER (FINAL PAGE ONLY) ================= */}
          {pageIndex === pages.length - 1 && (
            <div className="shrink-0 pt-4">
              
              {/* Subtotal Row */}
              <table className="w-full text-left border-collapse mb-6">
                <tbody>
                  <tr className="border-t-[1.5px] border-black font-bold">
                    <td className="py-2.5 w-[8%]"></td>
                    <td className="py-2.5 pl-2 w-[47%] uppercase">SUBTOTAL</td>
                    <td className="py-2.5 text-right w-[15%]">{totalQty}</td>
                    <td className="py-2.5 text-right w-[15%]"></td>
                    <td className="py-2.5 text-right w-[15%]">₹ {order.total_amount}</td>
                  </tr>
                </tbody>
              </table>

              {/* Terms and Totals Split Section */}
              <div className="grid grid-cols-2 gap-8 border-t-[1.5px] border-gray-300 pt-4">
                
                {/* Left: Terms */}
                <div>
                  <h4 className="font-bold mb-1.5 uppercase text-xs">TERMS AND CONDITIONS</h4>
                  <ol className="list-decimal pl-4 text-xs space-y-1 text-gray-800">
                    <li>Goods once sold will not be taken back or exchanged</li>
                    <li>All disputes are subject to Sivakasi jurisdiction only</li>
                  </ol>
                </div>

                {/* Right: Totals block */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Total Amount</span>
                    <span>₹ {order.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Received Amount</span>
                    <span>₹ 0</span>
                  </div>
                  
                  <div className="text-right pt-4">
                    <div className="font-bold text-xs mb-1">Total Amount (in words)</div>
                    <div className="text-xs text-gray-800 capitalize">{numberToWords(order.total_amount)} Rupees</div>
                  </div>
                </div>
                
              </div>
            </div>
          )}

        </div>
      ))}
    </div>
  );
};