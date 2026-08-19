'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Phone, MapPin, Loader2, X, ShoppingBag, TrendingUp, Calendar, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // --- NEW: Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 is perfect for a 3 or 4 column grid

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchCustomersAndOrders();
  }, []);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCustomersAndOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin-login');
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData && !profilesError) {
      const enrichedCustomers = profilesData.map(profile => {
        const userOrders = (ordersData || []).filter(o => o.user_id === profile.id);
        const totalSpent = userOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        
        return {
          ...profile,
          total_orders: userOrders.length,
          total_spent: totalSpent,
          order_history: userOrders,
          latest_order: userOrders.length > 0 ? userOrders[0] : null
        };
      });

      enrichedCustomers.sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(enrichedCustomers);
    }
    
    setLoading(false);
    setIsRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit'
    });
  };

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (c.full_name || '').toLowerCase().includes(searchLower);
    const phoneMatch = (c.phone_number || '').includes(searchLower);
    const addressMatch = (c.delivery_address || '').toLowerCase().includes(searchLower);
    
    return nameMatch || phoneMatch || addressMatch;
  });

  // --- NEW: Pagination Logic ---
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Customer CRM</h1>
            <p className="text-sm text-gray-500 mt-1">Analyze lifetime value and view complete order histories.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2 flex-1 md:flex-none justify-center">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-poppins text-xs font-bold text-gray-500 uppercase">Total Users:</span>
              <span className="font-bold text-gray-900 text-lg leading-none">{filteredCustomers.length}</span>
            </div>
            
            <button 
              onClick={() => fetchCustomersAndOrders(true)}
              disabled={isRefreshing}
              className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              title="Refresh Customers"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or delivery address..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-black shadow-inner"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-gray-700">No Customers Found</h3>
            <p className="text-gray-500 text-sm mt-1">Adjust your search criteria.</p>
          </div>
        ) : (
          <>
            {/* CHANGED: Mapping over paginatedCustomers instead of filteredCustomers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedCustomers.map(customer => (
                <div 
                  key={customer.id} 
                  onClick={() => setSelectedCustomer(customer)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative flex flex-col h-full group"
                >
                  
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-serif font-bold text-lg border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {(customer.full_name || 'N').charAt(0)}
                  </div>

                  <div className="pr-12 mb-4">
                    <h3 className="font-serif font-bold text-gray-900 truncate text-lg leading-tight group-hover:text-blue-600 transition-colors">
                      {customer.full_name || 'Anonymous User'}
                    </h3>
                    <p className="font-noto text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400"/> {customer.phone_number || 'No phone'}
                    </p>
                  </div>

                  <div className="flex bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
                    <div className="flex-1 text-center border-r border-slate-200">
                      <p className="font-poppins text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Spent</p>
                      <p className="font-poppins text-sm font-bold text-green-600">₹{customer.total_spent.toLocaleString()}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-poppins text-[9px] font-bold text-gray-400 uppercase tracking-widest">Orders</p>
                      <p className="font-poppins text-sm font-bold text-blue-600">{customer.total_orders}</p>
                    </div>
                  </div>

                  <div className="mb-4 text-xs font-noto text-gray-600 line-clamp-2 leading-relaxed">
                    <MapPin className="inline w-3.5 h-3.5 text-gray-400 mr-1 shrink-0 -mt-0.5"/>
                    <span className="italic">{customer.delivery_address || 'No address provided'}</span>
                  </div>

                  <div className="flex-1"></div>

                  {customer.latest_order ? (
                    <div className="pt-3 border-t border-gray-100 mt-auto">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="font-poppins text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1">
                          <Package className="w-3 h-3"/> Recent Purchase
                        </p>
                        <span className="text-[9px] text-gray-400 font-medium">{formatDate(customer.latest_order.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <p className="text-gray-600 truncate pr-3 flex-1 font-medium">
                          {customer.latest_order.order_items.map((i: any) => `${i.quantity}x ${i.title}`).join(', ')}
                        </p>
                        <span className="font-bold text-gray-900 shrink-0">₹{customer.latest_order.total_amount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-gray-100 mt-auto text-center">
                      <p className="text-[10px] text-gray-400 italic">No orders placed yet</p>
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* --- NEW: Pagination Controls --- */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                <p className="text-sm text-gray-500 font-poppins">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(endIndex, filteredCustomers.length)}</span> of <span className="font-bold text-gray-900">{filteredCustomers.length}</span> customers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none custom-scrollbar">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      // Simple logic to show current, first, last, and nearby pages
                      if (
                        idx === 0 || 
                        idx === totalPages - 1 || 
                        Math.abs(currentPage - 1 - idx) <= 1
                      ) {
                        return (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`w-10 h-10 shrink-0 rounded-lg text-sm font-bold transition-colors ${
                              currentPage === idx + 1 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      } else if (
                        (idx === 1 && currentPage > 3) || 
                        (idx === totalPages - 2 && currentPage < totalPages - 2)
                      ) {
                        return <span key={idx} className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- CUSTOMER CRM MODAL --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full max-w-4xl rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col h-[85vh] md:h-auto md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-5 md:zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <h2 className="font-serif text-lg font-bold">Customer Overview</h2>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              <div className="w-full md:w-1/3 bg-slate-50 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-200 shrink-0 flex flex-col md:block gap-3">
                
                <div className="flex md:flex-col items-center md:text-center gap-4 md:gap-0 md:mb-6">
                  <div className="w-12 h-12 md:w-20 md:h-20 md:mx-auto rounded-full bg-white flex items-center justify-center border-2 md:border-4 border-blue-50 shadow-sm shrink-0">
                      <span className="font-serif font-bold text-2xl md:text-4xl text-blue-600">{(selectedCustomer.full_name || 'N').charAt(0)}</span>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-gray-900 line-clamp-1">{selectedCustomer.full_name || 'Anonymous'}</h2>
                    <p className="font-noto text-xs md:text-sm text-gray-500 mt-0.5">{selectedCustomer.phone_number || 'No phone'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3 md:mb-6">
                  <div className="bg-white p-2.5 md:p-4 rounded-lg md:rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center">
                    <span className="font-poppins text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-0 flex items-center gap-1.5"><TrendingUp className="w-3 h-3"/> Total Spent</span>
                    <span className="font-poppins font-bold text-sm md:text-lg text-green-600">₹{selectedCustomer.total_spent.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2.5 md:p-4 rounded-lg md:rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center">
                    <span className="font-poppins text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 md:mb-0 flex items-center gap-1.5"><ShoppingBag className="w-3 h-3"/> Orders</span>
                    <span className="font-poppins font-bold text-sm md:text-lg text-blue-600">{selectedCustomer.total_orders}</span>
                  </div>
                </div>

                <div className="hidden sm:block bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Address</h3>
                  <p className="font-noto text-xs md:text-sm text-gray-700 leading-relaxed italic line-clamp-2 md:line-clamp-none">
                    {selectedCustomer.delivery_address || 'No address provided.'}
                  </p>
                </div>
              </div>

              <div className="flex-1 p-3 md:p-6 overflow-y-auto bg-white">
                <h3 className="font-poppins text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 md:mb-4 border-b border-gray-100 pb-2">
                  Order History ({selectedCustomer.order_history?.length || 0})
                </h3>

                {selectedCustomer.order_history?.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-8 h-8 md:w-10 md:h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs md:text-sm font-bold text-gray-400">No orders placed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.order_history.map((order: any, idx: number) => {
                       const displayId = order.id ? `ORD-${order.id.split('-')[0].toUpperCase()}` : `ORD-UNK`;
                       
                       return (
                        <div key={order.id || idx} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors bg-slate-50/50">
                          <div className="flex justify-between items-start mb-2.5">
                            <div>
                              <p className="font-poppins font-bold text-gray-900 text-xs md:text-sm">#{displayId}</p>
                              <p className="text-[9px] md:text-[10px] text-gray-500 font-medium uppercase mt-0.5">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-serif font-bold text-sm md:text-lg text-blue-700 leading-none mb-1.5">₹{order.total_amount}</p>
                              <span className={`inline-block text-[8px] md:text-[9px] font-bold uppercase px-1.5 md:px-2 py-0.5 rounded border shadow-sm
                                ${order.status === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                                  order.status === 'Packed' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                                  'bg-green-50 border-green-200 text-green-700'}`}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-md p-1.5 md:p-2 border border-gray-100 flex flex-wrap gap-1 md:gap-1.5">
                            {order.order_items.map((item: any, i: number) => (
                              <span key={i} className="bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-medium px-1.5 py-0.5 rounded">
                                {item.quantity}x {item.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}