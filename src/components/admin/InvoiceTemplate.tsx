import React from 'react';
import { numberToWords } from '@/utils/numberToWords';

export const InvoiceTemplate = ({ order, customer }: { order: any, customer: any }) => {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');
  const dueDateObj = new Date(order.created_at);
  dueDateObj.setDate(dueDateObj.getDate() + 7);
  const dueDate = dueDateObj.toLocaleDateString('en-GB');
  const shortInvoiceNo = order.id.split('-')[0].toUpperCase();
  
  const allItems = order.order_items || [];
  const totalAmount = allItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const receivedAmount = 0; 

  // --- MULTI-PAGE CHUNKING LOGIC ---
  const ITEMS_PER_PAGE = 25;
  const pages = [];
  
  for (let i = 0; i < allItems.length; i += ITEMS_PER_PAGE) {
    pages.push(allItems.slice(i, i + ITEMS_PER_PAGE));
  }
  
  // Fallback if order has 0 items
  if (pages.length === 0) pages.push([]);

  return (
    <div id="invoice-capture-container" className="flex flex-col gap-10">
      {pages.map((pageItems, pageIndex) => (
        // Each page is a strict A4 Canvas
        <div 
          key={pageIndex} 
          className="invoice-page relative bg-white text-black font-sans box-border px-10 py-12 flex flex-col" 
          style={{ width: '800px', height: '1131px' }}
        >
          {/* TOP TITLE */}
          <div className="absolute top-5 left-10 flex items-center gap-2 pl-1">
            <h2 className="text-[13px] font-extrabold text-gray-900 tracking-wide uppercase">BILL OF SUPPLY</h2>
            <div className="border border-gray-600 text-gray-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm bg-white">
              Original For Recipient
            </div>
          </div>

          {/* PAGE INDICATOR (Top Right) */}
          <div className="absolute top-5 right-10 text-[11px] font-bold text-gray-500">
            Page {pageIndex + 1} of {pages.length}
          </div>

          {/* ================= BOX 1 (Header, Meta, Table, Totals) ================= */}
          <div className="border border-gray-600 flex flex-col flex-1 overflow-hidden bg-white mt-1">
            
            {/* Company Header Block */}
            <div className="relative border-b border-gray-600 py-4 px-4 flex flex-col justify-center items-center flex-none min-h-[110px]">
              <img src="/assests/logo.png" alt="Kannan Pyro Park Logo" className="absolute top-4 left-4 w-32 h-16 object-contain" />
              <div className="text-center ml-12 leading-tight">
                <h1 className="text-xl font-bold text-[#800080] tracking-wide mb-1">KANNAN PYRO PARK</h1>
                <p className="text-[11px] text-gray-800">
                  SRI KANNAN FIREWORKS TRADERS Sithurajapuram, Sivakasi, Tamil Nadu 626124, India,
                </p>
                <p className="text-[11px] text-gray-800 mt-0.5">Virudhunagar, 626189,</p>
                <p className="text-[11px] text-gray-900 font-bold mt-1">Mobile: 8190078401</p>
              </div>
            </div>

            {/* Bill To & Invoice Meta */}
            <div className="flex border-b border-gray-600 h-[65px] flex-none">
              <div className="w-[50%] border-r border-gray-600 p-3 flex flex-col justify-center leading-tight">
                <p className="text-[10px] font-bold mb-1">BILL TO</p>
                <p className="text-[13px] font-bold uppercase text-gray-900">{customer.name || 'CUSTOMER'}</p>
                <p className="text-[11px] text-gray-800 mt-0.5">Mobile: {customer.phone || 'N/A'}</p>
              </div>
              <div className="w-[50%] flex justify-around items-center px-2 leading-tight">
                <div className="text-center w-1/3">
                  <p className="text-[11px] font-bold text-gray-900 mb-1">Invoice No.</p>
                  <p className="text-[11px] text-gray-700">{shortInvoiceNo}</p>
                </div>
                <div className="text-center w-1/3">
                  <p className="text-[11px] font-bold text-gray-900 mb-1">Invoice Date</p>
                  <p className="text-[11px] text-gray-700">{orderDate}</p>
                </div>
                <div className="text-center w-1/3">
                  <p className="text-[11px] font-bold text-gray-900 mb-1">Due Date</p>
                  <p className="text-[11px] text-gray-700">{dueDate}</p>
                </div>
              </div>
            </div>

            {/* Table Header (Purple) */}
            <div className="flex border-b border-gray-600 bg-[#ebd7f5] text-center font-bold text-[11px] h-7 items-center flex-none">
              <div className="w-[8%] border-r border-gray-600 h-full flex items-center justify-center">S.NO.</div>
              <div className="w-[56%] border-r border-gray-600 h-full flex items-center justify-center">ITEMS</div>
              <div className="w-[12%] border-r border-gray-600 h-full flex items-center justify-center">QTY.</div>
              <div className="w-[12%] border-r border-gray-600 h-full flex items-center justify-center">RATE</div>
              <div className="w-[12%] h-full flex items-center justify-center">AMOUNT</div>
            </div>

            {/* Table Body (Fills exact remaining space) */}
            <div className="flex-1 relative bg-white overflow-hidden">
              <div className="absolute top-0 bottom-0 left-[8%] border-l border-gray-600"></div>
              <div className="absolute top-0 bottom-0 left-[64%] border-l border-gray-600"></div>
              <div className="absolute top-0 bottom-0 left-[76%] border-l border-gray-600"></div>
              <div className="absolute top-0 bottom-0 left-[88%] border-l border-gray-600"></div>

              <div className="absolute inset-0 w-full text-[11px] py-2 flex flex-col gap-1.5 z-10">
                {pageItems.map((item: any, index: number) => {
                  const globalIndex = (pageIndex * ITEMS_PER_PAGE) + index + 1; // Correct S.NO across pages
                  return (
                    <div className="flex w-full" key={index}>
                      <div className="w-[8%] text-center text-gray-800">{globalIndex}</div>
                      <div className="w-[56%] pl-2 text-gray-900 uppercase leading-snug">{item.title || item.name}</div>
                      <div className="w-[12%] text-center pr-2 text-gray-800">{item.quantity}</div>
                      <div className="w-[12%] text-right pr-2 text-gray-800">{item.price}</div>
                      <div className="w-[12%] text-right pr-2 text-gray-900">{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  );
                })}
              </div>

              {pageIndex < pages.length - 1 && (
                <div className="absolute bottom-3 right-4 z-20 text-[10px] font-bold italic text-gray-500 bg-white px-2">
                  Products continued on next page...
                </div>
              )}
            </div>

            {/* Totals Section (Always shows Grand Total) */}
            <div className="flex border-t border-gray-600 bg-[#ebd7f5] text-[11px] h-7 items-center flex-none">
              <div className="w-[88%] border-r border-gray-600 h-full flex items-center justify-end pr-4 font-bold uppercase">TOTAL</div>
              <div className="w-[12%] h-full flex items-center justify-end pr-2 font-bold">₹ {totalAmount.toLocaleString('en-IN')}</div>
            </div>
            
            {/* Received Amount Section */}
            <div className="flex border-t border-gray-600 text-[11px] h-7 items-center flex-none bg-white">
              <div className="w-[88%] border-r border-gray-600 h-full flex items-center justify-end pr-4 font-bold uppercase">RECEIVED AMOUNT</div>
              <div className="w-[12%] h-full flex items-center justify-end pr-2 font-bold">₹ {receivedAmount}</div>
            </div>

          </div> 
          
          <div className="h-3 flex-none"></div>

          {/* ================= BOX 2 (Words, Terms, Signature) ================= */}
          <div className="border border-gray-600 flex flex-col flex-none bg-white">
            <div className="border-b border-gray-600 p-2.5 leading-tight">
              <p className="text-[11px] text-gray-900 font-bold mb-0.5">Total Amount (in words)</p>
              <p className="text-[12px] font-medium text-gray-800 capitalize">{numberToWords(totalAmount)}</p>
            </div>

            <div className="flex h-[75px]">
              <div className="w-[50%] border-r border-gray-600 p-2.5 flex flex-col justify-start leading-tight">
                <p className="text-[11px] font-bold mb-1 text-gray-900">Terms and Conditions</p>
                <p className="text-[9px] text-gray-800">1. Goods once sold will not be taken back or exchanged</p>
                <p className="text-[9px] text-gray-800 mt-0.5">2. All disputes are subject to Sivakasi jurisdiction only</p>
              </div>
              
              <div className="w-[50%] flex flex-col justify-end items-center text-center pb-2 leading-tight">
                <img src="/assests/signature.png" alt="Signature" className="w-24 h-10 mb-0.5 object-contain" />
                <p className="text-[9px] text-gray-700">Authorised Signatory For</p>
                <p className="text-[10px] font-bold text-gray-900 uppercase mt-0.5 tracking-wide">KANNAN PYRO PARK</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};