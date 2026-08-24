'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, MapPin, Phone, User, RefreshCw, X, FileText, ChevronLeft, ChevronRight, Download, Loader2, Edit, Plus, Minus, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminHeader } from '@/components/admin/admin-header';

// --- IMPORTS FOR PDF ---
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { InvoiceTemplate } from '@/components/admin/InvoiceTemplate';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);

  // --- MASTER EDIT MODAL STATES ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', address: '', createdAt: '' });
  const [editItems, setEditItems] = useState<any[]>([]);
  const [orderedSearchTerm, setOrderedSearchTerm] = useState(''); // Search for already ordered items
  
  // --- ADD PRODUCT MODAL STATES ---
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState(''); // Search for catalog products
  
  // Main Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Filter & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchOrders();
  }, []);

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
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      alert('Failed to update status: ' + error.message);
      fetchOrders(true);
    }
  };

  const formatDate = (dateStr: string) => {
    const safeDate = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : `${dateStr}Z`;
    return new Date(safeDate).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  // --- OPEN MASTER EDIT MODAL ---
  const openEditModal = async () => {
    const safeDate = selectedOrder.created_at.includes('Z') || selectedOrder.created_at.includes('+') ? selectedOrder.created_at : `${selectedOrder.created_at}Z`;
    const formattedDate = new Date(safeDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    setEditForm({
      fullName: selectedOrder.profiles?.full_name || '',
      phone: selectedOrder.profiles?.phone_number || '',
      address: selectedOrder.profiles?.delivery_address || '',
      createdAt: formattedDate
    });

    // Deep copy and track original quantity for the badge memory
    const cleanItems = JSON.parse(JSON.stringify(selectedOrder.order_items || [])).map((i: any) => ({
      ...i, 
      isNew: false,
      originalQuantity: i.quantity 
    }));
    
    setEditItems(cleanItems);
    setOrderedSearchTerm('');
    setShowEditModal(true);

    if (allProducts.length === 0) {
      const { data, error } = await supabase.from('products').select('*');
      if (data && !error) setAllProducts(data);
    }
  };

  // --- CART EDITING LOGIC ---
  const updateItemQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setEditItems(prev => prev.map(item => {
      if (item.id === id) {
        // If it matches the original amount, turn off the New badge
        const isModified = item.originalQuantity !== undefined ? item.originalQuantity !== newQty : true;
        return { ...item, quantity: newQty, isNew: isModified };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setEditItems(prev => prev.filter(item => item.id !== id));
  };

  const addProductToOrder = (product: any) => {
    const existingIndex = editItems.findIndex(item => item.id === product.id);
    
    if (existingIndex >= 0) {
      const newItems = [...editItems];
      // FLAW 1 FIX: Create a strict new copy of the item object before modifying it
      const currentItem = newItems[existingIndex];
      
      newItems[existingIndex] = {
        ...currentItem,
        quantity: currentItem.quantity + 1,
        isNew: currentItem.originalQuantity !== (currentItem.quantity + 1)
      };
      
      setEditItems(newItems);
    } else {
      setEditItems([{
        id: product.id,
        title: product.title || product.name, 
        name: product.name || product.title,
        category: product.category,
        price: product.price,
        quantity: 1,
        unit: product.unit || 'piece',
        isNew: true 
      }, ...editItems]);
    }
    
    setCatalogSearchTerm('');
    setShowAddProductModal(false);
    setOrderedSearchTerm(''); 
  };

  // --- SEARCH FILTERS ---
  const filteredEditItems = editItems.filter(item => {
    const safeTitle = item.name || item.title || '';
    const safeCategory = item.category || '';
    return safeTitle.toLowerCase().includes(orderedSearchTerm.toLowerCase()) || 
           safeCategory.toLowerCase().includes(orderedSearchTerm.toLowerCase());
  });

  const filteredCatalogProducts = catalogSearchTerm.trim() === '' ? [] : allProducts.filter(p => {
    const safeTitle = p.name || p.title || '';
    const safeCategory = p.category || '';
    return safeTitle.toLowerCase().includes(catalogSearchTerm.toLowerCase()) || 
           safeCategory.toLowerCase().includes(catalogSearchTerm.toLowerCase());
  }).slice(0, 10); 

  const newEditTotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- SAVE LOGIC ---
  const handleSaveOrder = async (generatePdf = false) => {
    if (!editForm.fullName.trim() || !editForm.phone.trim() || !editForm.createdAt) {
      alert("Name, Phone, and Date are required.");
      return;
    }
    if (editItems.length === 0 || newEditTotal <= 0) {
      alert("Order must have at least one valid item.");
      return;
    }

    generatePdf ? setIsDownloading(true) : setIsSaving(true);

    try {
      if (selectedOrder.user_id) {
        const { error: profileError } = await supabase.from('profiles')
          .update({ 
            full_name: editForm.fullName, 
            phone_number: editForm.phone,
            delivery_address: editForm.address 
          })
          .eq('id', selectedOrder.user_id);
        if (profileError) throw new Error('Profile Update Blocked: ' + profileError.message);
      }

      // Strip UI tags before saving to DB
      const cleanItemsToSave = editItems.map(({ isNew, originalQuantity, ...rest }) => rest);
      const updatedDate = new Date(`${editForm.createdAt}T12:00:00+05:30`).toISOString();
      
      const { error: orderError } = await supabase.from('orders')
        .update({ 
          created_at: updatedDate,
          order_items: cleanItemsToSave,
          total_amount: newEditTotal
        })
        .eq('id', selectedOrder.id);
      if (orderError) throw new Error('Order Update Blocked: ' + orderError.message);

      const updatedOrder = {
        ...selectedOrder,
        created_at: updatedDate,
        order_items: cleanItemsToSave,
        total_amount: newEditTotal,
        profiles: {
          ...selectedOrder.profiles,
          full_name: editForm.fullName,
          phone_number: editForm.phone,
          delivery_address: editForm.address
        }
      };
      
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

      if (generatePdf) {
        setTimeout(async () => {
          await handleDownloadPDF(); 
          setShowEditModal(false);
          setIsDownloading(false);
        }, 500);
      } else {
        setShowEditModal(false);
        setIsSaving(false);
      }
    } catch (error: any) {
      console.error("Error saving:", error);
      alert(error.message || "Failed to save updates.");
      setIsDownloading(false);
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const container = document.getElementById('invoice-capture-container');
      if (!container) return;
      await new Promise(resolve => setTimeout(resolve, 150));
      const pages = document.querySelectorAll('.invoice-page');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < pages.length; i++) {
        const dataUrl = await htmlToImage.toJpeg(pages[i] as HTMLElement, { pixelRatio: 2, backgroundColor: '#ffffff', quality: 0.75 });
        if (i > 0) { pdf.addPage(); pdf.setPage(i + 1); }
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      pdf.save(`Invoice_${selectedOrder.displayId}.pdf`);
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const customerName = order.profiles?.full_name?.toLowerCase() || '';
    const customerPhone = order.profiles?.phone_number || '';
    const displayId = (order.displayId || '').toLowerCase();
    return (displayId.includes(searchLower) || customerName.includes(searchLower) || customerPhone.includes(searchLower)) && 
           (statusFilter === 'All' || order.status === statusFilter);
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 font-noto pb-20 relative overflow-hidden">
      <AdminHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">Order Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Manage customer pre-orders, edit details, and update statuses.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
              <span className="font-poppins text-xs font-bold text-gray-500 uppercase">Visible Orders:</span>
              <span className="font-bold text-blue-600 text-lg leading-none">{filteredOrders.length}</span>
            </div>
            <button onClick={() => fetchOrders(true)} disabled={isRefreshing} className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by Order ID, Name, or Phone..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-gray-800 font-semibold cursor-pointer">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Packed">Packed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-gray-700">No Orders Found</h3>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedOrders.map(order => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="bg-slate-100 px-5 py-4 border-b border-slate-200 flex justify-between items-center group-hover:bg-blue-50/50 transition-colors">
                    <div>
                      <h2 className="font-poppins font-bold text-gray-900">#{order.displayId}</h2>
                      <span className="text-[10px] text-gray-500 font-medium uppercase mt-1 block">{formatDate(order.created_at)}</span>
                    </div>
                    <span className={`font-bold text-[10px] uppercase px-3 py-1.5 rounded-full border shadow-sm ${order.status === 'Pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : order.status === 'Packed' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{order.status}</span>
                  </div>
                  <div className="p-5 border-b border-slate-100 flex-shrink-0">
                    <div className="flex justify-between items-center mb-3">
                       <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Details</h3>
                       <span className="font-serif font-bold text-blue-700 text-lg">₹{order.total_amount}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2.5"><User className="w-4 h-4 text-gray-400 mt-0.5" /><div><p className="font-serif font-bold text-gray-900 truncate">{order.profiles?.full_name}</p><p className="font-noto text-xs text-gray-500 mt-0.5">{order.profiles?.phone_number}</p></div></div>
                      <div className="flex items-start gap-2.5"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><p className="font-noto text-xs text-gray-600 line-clamp-2 leading-tight">{order.profiles?.delivery_address}</p></div>
                    </div>
                  </div>
                  <div className="p-5 flex-1 bg-slate-50 flex flex-col pointer-events-none">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items ({order.order_items.length})</h3>
                    </div>
                    <div className="space-y-2 max-h-[140px] overflow-hidden relative">
                      {order.order_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center"><Package className="w-3.5 h-3.5 text-slate-400" /></div>
                            <div><p className="font-serif text-xs font-bold text-gray-900 line-clamp-1">{item.title}</p></div>
                          </div>
                          <p className="font-poppins text-[10px] text-gray-500 font-medium">x {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="mt-8 flex justify-between items-center bg-white px-6 py-4 rounded-xl shadow-sm border gap-4">
                <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{Math.min(startIndex + itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-gray-800">{filteredOrders.length}</span></p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:text-blue-600 disabled:opacity-50 text-gray-800"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:text-blue-600 disabled:opacity-50 text-gray-800"><ChevronRight className="w-5 h-5" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedOrder && !showEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div><h2 className="font-serif text-xl font-bold">Order #{selectedOrder.displayId}</h2><p className="text-xs text-slate-400 mt-1">{formatDate(selectedOrder.created_at)}</p></div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-300" /></button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-gray-50 flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Customer Contact</h3>
                  <div className="space-y-3"><p className="font-bold text-gray-900 flex items-center gap-2"><User className="w-4 h-4 text-blue-500"/> {selectedOrder.profiles?.full_name}</p><p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-500"/> {selectedOrder.profiles?.phone_number}</p></div>
                </div>
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Delivery Address</h3>
                  <p className="text-sm text-gray-600 flex items-start gap-2 leading-relaxed"><MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/> {selectedOrder.profiles?.delivery_address}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm relative">
                <div className="sticky -top-6 z-10 bg-white px-5 py-4 flex justify-between items-center border-b rounded-t-xl shadow-sm">
                  <h3 className="font-poppins text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedOrder.order_items.length} Order Line Items</h3>
                  <span className="font-serif font-bold text-gray-900">Total: <span className="text-blue-600">₹{selectedOrder.total_amount}</span></span>
                </div>
                <div className="p-3 sm:p-5 space-y-3">
                  {selectedOrder.order_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white border rounded flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div>
                        <div><p className="font-serif text-sm font-bold text-gray-900">{item.title}</p><p className="font-poppins text-[10px] text-gray-500 uppercase mt-1">{item.category}</p></div>
                      </div>
                      <div className="text-right">
                        <p className="font-poppins text-sm font-bold text-gray-800">₹{item.price}</p>
                        <p className="font-poppins text-[10px] text-gray-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-5 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={openEditModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 rounded-lg shadow-sm">
                  <Edit className="w-4 h-4" /> Edit Order
                </button>
                {selectedOrder.status === 'Delivered' && (
                   <button onClick={openEditModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-3 rounded-lg shadow-sm">
                     <Download className="w-4 h-4" /> Bill
                   </button>
                )}
              </div>
              <select value={selectedOrder.status} onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)} className={`w-full sm:w-48 font-bold text-sm uppercase px-4 py-3 rounded-lg border outline-none cursor-pointer shadow-sm text-gray-800 ${selectedOrder.status === 'Pending' ? 'bg-yellow-50 text-yellow-800' : selectedOrder.status === 'Packed' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                <option value="Pending">Mark Pending</option>
                <option value="Packed">Mark Packed</option>
                <option value="Delivered">Mark Delivered</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* --- MASTER EDIT MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-serif text-lg font-bold">Edit Order Details</h2>
                <p className="text-xs text-slate-400 mt-1">Modify customer information or update the requested items.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-800 rounded-full"><X className="w-5 h-5 text-slate-300" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col md:flex-row gap-6">
              
              {/* Left Column: User Details */}
              <div className="w-full md:w-1/3 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-widest border-b pb-2">Customer Info</h3>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Name</label>
                    <input type="text" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-gray-800 outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-gray-800 outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Address</label>
                    <textarea rows={3} value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 resize-none"/>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Order Date</label>
                    <input type="date" value={editForm.createdAt} onChange={e => setEditForm({...editForm, createdAt: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm font-semibold text-gray-800 outline-none focus:border-blue-500"/>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Items */}
              <div className="w-full md:w-2/3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-end border-b pb-3 mb-4">
                  <div>
                    <h3 className="font-poppins text-xs font-bold text-gray-500 uppercase tracking-widest">Order Items</h3>
                    <div className="font-serif text-lg font-bold text-blue-700 mt-1">Total: ₹{newEditTotal}</div>
                  </div>
                  
                  {/* --- Add Product Button --- */}
                  <button 
                    onClick={() => setShowAddProductModal(true)} 
                    className="text-xs bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-blue-200 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4"/> Add Product
                  </button>
                </div>

                {/* Filter currently ordered items */}
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search added items..." 
                    value={orderedSearchTerm}
                    onChange={e => setOrderedSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                {/* Ordered Items List */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                  {filteredEditItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${
                        item.isNew ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.name || item.title}</p>
                          {item.isNew && (
                            <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">New</span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 mt-0.5">₹{item.price} / {item.unit || 'pc'}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-300 rounded bg-white shadow-sm">
                          <button onClick={() => updateItemQty(item.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-100 text-gray-600 cursor-pointer"><Minus className="w-3 h-3"/></button>
                          <span className="text-xs font-bold w-7 text-center text-gray-800">{item.quantity}</span>
                          <button onClick={() => updateItemQty(item.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-100 text-gray-600 cursor-pointer"><Plus className="w-3 h-3"/></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded transition-colors cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  ))}
                  {filteredEditItems.length === 0 && (
                    <div className="text-center py-8 text-gray-400 font-bold text-sm">No items match your search.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0">
              <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={() => handleSaveOrder(false)} disabled={isSaving || isDownloading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save Changes"}
              </button>
              <button onClick={() => handleSaveOrder(true)} disabled={isSaving || isDownloading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Download className="w-4 h-4"/> Save & Download Bill</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD NEW PRODUCT MODAL --- */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="bg-white px-5 py-4 border-b flex justify-between items-center shrink-0">
              <h2 className="font-serif text-lg font-bold text-gray-900">Add to Order</h2>
              <button onClick={() => setShowAddProductModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 flex flex-col flex-1 overflow-hidden">
              <div className="relative mb-4 shrink-0">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-blue-500" />
                <input 
                  type="text" 
                  placeholder="Search catalog by name or category..." 
                  value={catalogSearchTerm}
                  onChange={e => setCatalogSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 border-2 border-blue-100 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {catalogSearchTerm.trim() === '' ? (
                  <div className="text-center py-10 text-gray-400 font-medium text-sm">
                    Start typing to search your catalog...
                  </div>
                ) : filteredCatalogProducts.length > 0 ? (
                  filteredCatalogProducts.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => addProductToOrder(p)} 
                      className="p-3 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg cursor-pointer flex justify-between items-center transition-all shadow-sm"
                    >
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{p.name || p.title}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">{p.category}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs">₹{p.price}</div>
                        <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Click to add</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 font-bold text-sm">No catalog products found.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- HIDDEN INVOICE TEMPLATE --- */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -100 }}>
        {selectedOrder && (
          <InvoiceTemplate 
            order={selectedOrder} 
            customer={{
              name: selectedOrder.profiles?.full_name || 'Customer',
              phone: selectedOrder.profiles?.phone_number || 'N/A'
            }} 
          />
        )}
      </div>

    </div>
  );
}