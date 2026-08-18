'use client';

import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function MyRequestsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Functional States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Requests');
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch User Profile (for the Customer Details section)
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUserProfile(profile);

        // Fetch Orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          // Add a readable display ID (e.g., #KANNAN-001) for searching
          const mappedOrders = ordersData.map((order, idx) => ({
            ...order,
            displayId: `KANNAN-${String(ordersData.length - idx).padStart(3, '0')}`
          }));
          setOrders(mappedOrders);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatDaysAgo = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    return days === 0 ? 'Submitted today' : `Submitted ${days} days ago`;
  };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // FILTER & SEARCH LOGIC
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.displayId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Requests' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-[#fafafa] font-noto pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold text-[#1a1f36] mb-3">My Requests</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Track the requests you've submitted to Kannan. Review status updates, estimated values, and finalize your celebratory selections.
            </p>
          </div>
          <div className="bg-gray-200/60 px-4 py-2 rounded-full text-xs font-bold text-gray-700 h-fit whitespace-nowrap">
            {filteredOrders.length} Active Requests
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Request ID (e.g. KANNAN-001)" 
              /* FIXED: Explicitly added text-black and placeholder colors */
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold min-w-[160px] outline-none cursor-pointer text-black"
            >
              <option value="All Requests">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Packed">Packed</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Request Cards */}
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-poppins flex flex-col items-center">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p>No requests found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrders[order.id];

              return (
                <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm transition-all">
                  
                  {/* Card Header (Always Visible) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-poppins font-bold text-sm text-[#1a1f36] flex items-center">
                        #{order.displayId}
                        <span className="text-gray-400 font-normal ml-3 text-xs">• {formatDaysAgo(order.created_at)}</span>
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit
                      ${order.status === 'Pending' ? 'bg-[#fef3c7] text-[#b45309]' : 
                        order.status === 'Packed' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* EXPANDABLE CONTENT */}
                  {isExpanded && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                      
                      {/* Products List Thumbnail Row */}
                      <div className="flex flex-wrap gap-3 mb-8">
                        {order.order_items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-lg p-2 pr-4">
                            <div className="w-10 h-10 bg-gray-200 rounded text-[8px] text-gray-400 flex items-center justify-center">IMG</div>
                            <div>
                              <p className="font-serif text-xs font-bold text-black line-clamp-1 max-w-[120px]">{item.title}</p>
                              <p className="font-poppins text-[10px] text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Progress Bar (Visual) */}
                      <div className="relative pt-2 pb-10 mb-2">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200"></div>
                        
                        {/* Dynamic Progress Line */}
                        <div className={`absolute top-4 left-0 h-0.5 bg-[#d97706] transition-all
                          ${order.status === 'Pending' ? 'w-1/3' : order.status === 'Packed' ? 'w-2/3' : 'w-full'}
                        `}></div>
                        
                        <div className="flex justify-between relative z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#1a1f36]"></div>
                            <span className="text-[10px] font-bold text-black absolute top-6">Submitted</span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${order.status !== 'Pending' ? 'bg-[#1a1f36]' : 'bg-[#d97706]'}`}></div>
                            <span className={`text-[10px] font-bold absolute top-6 whitespace-nowrap ${order.status === 'Pending' ? 'text-[#d97706]' : 'text-black'}`}>
                              {order.status === 'Pending' ? 'Under Review' : 'Reviewed'}
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${order.status === 'Packed' || order.status === 'Delivered' ? 'bg-[#d97706]' : 'bg-gray-200 border-2 border-white'}`}></div>
                            <span className={`text-[10px] font-semibold absolute top-6 ${order.status === 'Packed' || order.status === 'Delivered' ? 'text-[#d97706]' : 'text-gray-400'}`}>Packed</span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${order.status === 'Delivered' ? 'bg-[#d97706]' : 'bg-gray-200 border-2 border-white'}`}></div>
                            <span className={`text-[10px] font-semibold absolute top-6 ${order.status === 'Delivered' ? 'text-[#d97706]' : 'text-gray-400'}`}>Delivered</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Details Block */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-poppins text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">Customer Details</h4>
                          <p className="font-serif font-bold text-black text-sm">{userProfile?.full_name || 'N/A'}</p>
                          <p className="font-noto text-xs text-gray-600 mt-1">{userProfile?.phone_number}</p>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                          <h4 className="font-poppins text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-3">Delivery Address</h4>
                          <p className="font-noto text-xs text-gray-600 leading-relaxed italic">
                            "{userProfile?.delivery_address || 'Address pending'}"
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Footer Totals & Toggle Button (Always Visible) */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex gap-8 sm:gap-12">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                        <p className="font-serif font-bold text-lg">{order.order_items.length} <span className="font-noto font-normal text-sm text-gray-500">Products</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Value</p>
                        <p className="font-serif font-bold text-lg">₹{order.total_amount}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleOrderDetails(order.id)}
                      className="flex items-center gap-2 border border-gray-300 hover:border-gray-500 px-4 py-2 rounded-md font-poppins text-xs font-semibold transition-colors"
                    >
                      {isExpanded ? (
                        <>Close Details <ChevronUp className="w-4 h-4" /></>
                      ) : (
                        <>View Details <ChevronDown className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}