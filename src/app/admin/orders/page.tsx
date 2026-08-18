'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, MapPin, Phone, User, RefreshCw, X, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');

  // --- NEW: Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- NEW: Reset to page 1 whenever filters change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchOrders = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/admin-login');
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone_number, delivery_address)')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mapped = data.map((order, idx) => ({
        ...order,
        displayId: order.id ? `ORD-${order.id.split('-')[0].toUpperCase()}` : `ORD-${idx + 1}`
      }));
      setOrders(mapped);
    }
    
    setLoading(false);
    setIsRefreshing(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Failed to update status: ' + error.message);
      fetchOrders(true);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  // 1. First, get all filtered orders
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = order.profiles?.full_name?.toLowerCase() || '';
    const customerPhone = order.profiles?.phone_number || '';
    const displayId = (order.displayId || '').toLowerCase();

    const matchesSearch = displayId.includes(searchLower) || customerName.includes(searchLower) || customerPhone.includes(searchLower);
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- NEW: 2. Calculate pagination metrics ---
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // --- NEW: 3. Slice the array to get only the current page's orders ---
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Order Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage customer pre-orders and update dispatch statuses.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
              <span className="font-poppins text-xs font-bold text-gray-500 uppercase">Visible Orders:</span>
              <span className="font-bold text-blue-600 text-lg leading-none">{filteredOrders.length}</span>
            </div>
            
            <button 
              onClick={() => fetchOrders(true)}
              disabled={isRefreshing}
              className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Name, or Phone..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-black font-semibold cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Packed">Packed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Orders Fixed Grid Layout */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-gray-700">No {statusFilter === 'All' ? 'Orders' : statusFilter + ' Orders'} Found</h3>
            <p className="text-gray-500 text-sm mt-1">You're all caught up for now.</p>
          </div>
        ) : (
          <>
            {/* CHANGED: Mapping over paginatedOrders instead of filteredOrders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedOrders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                >
                  
                  {/* Order Header */}
                  <div className="bg-slate-100 px-5 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0 group-hover:bg-blue-50/50 transition-colors">
                    <div>
                      <h2 className="font-poppins font-bold text-gray-900 flex items-center gap-2">
                        #{order.displayId}
                      </h2>
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-1 block">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <span className={`font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border shadow-sm
                      ${order.status === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                        order.status === 'Packed' ? 'bg-blue-50 border-blue-200 text-blue-700' : 
                        'bg-green-50 border-green-200 text-green-700'}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Customer Details Strip */}
                  <div className="p-5 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Details</h3>
                       <span className="font-serif font-bold text-blue-700 text-lg">₹{order.total_amount}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="font-serif font-bold text-gray-900 truncate">{order.profiles?.full_name || 'N/A'}</p>
                          <p className="font-noto text-xs text-gray-500 mt-0.5">{order.profiles?.phone_number || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <p className="font-noto text-xs text-gray-600 line-clamp-2 leading-tight">
                          {order.profiles?.delivery_address || 'Address pending'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items List Preview */}
                  <div className="p-5 flex-1 bg-slate-50 flex flex-col pointer-events-none">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Items Requested ({order.order_items.length})
                      </h3>
                      <span className="text-[10px] font-bold text-blue-600 group-hover:underline">Click to view full details</span>
                    </div>
                    
                    <div className="space-y-2 max-h-[140px] overflow-hidden relative">
                      {order.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center shrink-0">
                              <Package className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div>
                              <p className="font-serif text-xs font-bold text-gray-900 line-clamp-1">{item.title}</p>
                              <p className="font-poppins text-[9px] text-gray-500 font-semibold uppercase mt-0.5">{item.category}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="font-poppins text-[10px] text-gray-500 font-medium">x {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.order_items.length > 2 && (
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* --- NEW: Pagination Controls --- */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                <p className="text-sm text-gray-500 font-poppins">
                  Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(endIndex, filteredOrders.length)}</span> of <span className="font-bold text-gray-900">{filteredOrders.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
                          currentPage === idx + 1 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
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

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-serif text-xl font-bold">Order #{selectedOrder.displayId}</h2>
                <p className="text-xs text-slate-400 mt-1 font-poppins">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto bg-gray-50 flex-1 font-noto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Details */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Contact</h3>
                  <div className="space-y-3">
                    <p className="font-serif font-bold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-blue-500"/> {selectedOrder.profiles?.full_name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500"/> {selectedOrder.profiles?.phone_number}</p>
                  </div>
                </div>
                {/* Delivery Address */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Delivery Address</h3>
                  <p className="text-sm text-gray-600 flex items-start gap-2 leading-relaxed">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/> 
                    {selectedOrder.profiles?.delivery_address}
                  </p>
                </div>
              </div>

              {/* Items Detail */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Order Line Items
                  </h3>
                  <span className="font-serif font-bold text-gray-900">Total: <span className="text-blue-600">₹{selectedOrder.total_amount}</span></span>
                </div>
                
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-serif text-sm font-bold text-gray-900">{item.title}</p>
                          <p className="font-poppins text-[10px] text-gray-500 uppercase mt-1">Category: {item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-poppins text-sm font-bold text-gray-800">₹{item.price}</p>
                        <p className="font-poppins text-[10px] text-gray-500 mt-1">Qty: {item.quantity}</p>
                        <p className="font-poppins text-xs font-bold text-blue-600 mt-1">Total: ₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer / Action Area */}
            <div className="bg-white px-6 py-5 border-t border-gray-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-poppins text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Update Status</p>
                <p className="text-xs text-gray-400">Notifies customer immediately.</p>
              </div>
              
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className={`w-full sm:w-48 font-bold text-sm uppercase px-4 py-3 rounded-lg border outline-none cursor-pointer transition-colors shadow-sm
                  ${selectedOrder.status === 'Pending' ? 'bg-yellow-50 border-yellow-300 text-yellow-800' : 
                    selectedOrder.status === 'Packed' ? 'bg-blue-50 border-blue-300 text-blue-800' : 
                    'bg-green-50 border-green-300 text-green-800'}`}
              >
                <option value="Pending">Mark Pending</option>
                <option value="Packed">Mark Packed</option>
                <option value="Delivered">Mark Delivered</option>
              </select>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}