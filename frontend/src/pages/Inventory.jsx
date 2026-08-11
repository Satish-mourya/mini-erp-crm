import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, addStock, getStockLogs } from '../api';
import { Plus, Package, Search, ArrowUpRight, Edit, ChevronLeft, ChevronRight, History } from 'lucide-react';

const Inventory = ({ user }) => {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || '';
  
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Modals State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', sku: '', category: '', unit_price: 0, min_stock_alert: 0, location: '' });

  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockForm, setStockForm] = useState({ qty: 1, reason: '' });

  // Logs State
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState(null);
  const [logsPage, setLogsPage] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchProducts = async (p = page) => {
    setLoading(true);
    try {
      const params = { search, page: p, limit: 6 };
      if (initialFilter) params.filter = initialFilter;
      const res = await getProducts(params);
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchLogs = async (p = logsPage) => {
    setLoadingLogs(true);
    try {
      const res = await getStockLogs({ page: p, limit: 6 });
      setLogs(res.data.data);
      setLogsMeta(res.data.meta);
    } catch (error) {
      console.error('Error fetching logs', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (showLogsModal) {
      fetchLogs(logsPage);
    }
  }, [logsPage, showLogsModal]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const openAddModal = () => {
    setEditingId(null);
    setProductForm({ name: '', sku: '', category: '', unit_price: 0, min_stock_alert: 0, location: '' });
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setProductForm({ 
      name: p.name, 
      sku: p.sku, 
      category: p.category || '', 
      unit_price: p.unit_price, 
      min_stock_alert: p.min_stock_alert || 0,
      location: p.location || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...productForm, unit_price: parseFloat(productForm.unit_price), min_stock_alert: parseInt(productForm.min_stock_alert) || 0 };
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving product');
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      await addStock({ 
        product_id: selectedProduct.id, 
        qty: parseInt(stockForm.qty), 
        reason: stockForm.reason 
      });
      setShowStockModal(false);
      setStockForm({ qty: 1, reason: '' });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.error || 'Error adding stock');
    }
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => { setLogsPage(1); setShowLogsModal(true); }}>
            <History size={18} className="mr-2" /> Stock Movement Log
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} className="mr-2" /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="text" 
            className="input-field flex-1" 
            placeholder="Search products by SKU or Name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            <Search size={18} className="mr-2" /> Search
          </button>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Current Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">No products found</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-primary">
                        <Package size={16} />
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td><span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{p.sku}</span></td>
                  <td>{p.category || '-'}</td>
                  <td>₹{p.unit_price.toFixed(2)}</td>
                  <td>
                    <span className={`font-bold ${p.current_stock <= p.min_stock_alert ? 'text-danger' : 'text-success'}`}>
                      {p.current_stock}
                    </span>
                  </td>
                  <td>
                    {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-xs" onClick={() => openStockModal(p)}>
                          <ArrowUpRight size={14} className="mr-1" /> Add Stock
                        </button>
                        <button className="text-primary hover:bg-blue-50 p-1 rounded" onClick={() => openEditModal(p)}>
                          <Edit size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {meta && meta.total > 0 && (
          <div className="flex justify-between items-center mt-4 p-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-secondary px-3 py-1 text-sm" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                className="btn btn-secondary px-3 py-1 text-sm" 
                disabled={page === meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group mb-4">
                <label>Name *</label>
                <input required className="input-field" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label>SKU *</label>
                <input required className="input-field" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label>Category</label>
                  <input className="input-field" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label>Unit Price *</label>
                  <input required type="number" step="0.01" min="0" className="input-field" value={productForm.unit_price} onChange={e => setProductForm({...productForm, unit_price: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label>Min Stock Alert</label>
                  <input type="number" min="0" className="input-field" value={productForm.min_stock_alert} onChange={e => setProductForm({...productForm, min_stock_alert: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label>Location</label>
                  <input className="input-field" value={productForm.location} onChange={e => setProductForm({...productForm, location: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-sm">
            <h2 className="text-xl font-bold mb-1">Add Stock</h2>
            <p className="text-muted text-sm mb-4">Adding inventory for <strong>{selectedProduct.name}</strong></p>
            <form onSubmit={handleAddStock}>
              <div className="form-group mb-4">
                <label>Quantity *</label>
                <input required type="number" min="1" className="input-field" value={stockForm.qty} onChange={e => setStockForm({...stockForm, qty: e.target.value})} />
              </div>
              <div className="form-group mb-4">
                <label>Reason / Reference</label>
                <input className="input-field" placeholder="e.g. PO-1234" value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="card w-full max-w-4xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Stock Movement Log</h2>
              <button className="btn btn-secondary text-sm" onClick={() => setShowLogsModal(false)}>Close</button>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty Changed</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Created By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr><td colSpan="6" className="text-center py-4">Loading logs...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No stock movements recorded yet.</td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id}>
                        <td className="font-medium">{log.product?.name || `Product #${log.product_id}`}</td>
                        <td className="font-bold">{log.qty_changed}</td>
                        <td>
                          <span className={`badge ${log.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="text-muted">{log.reason || '-'}</td>
                        <td>User #{log.created_by}</td>
                        <td className="text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {logsMeta && logsMeta.total > 0 && (
                <div className="flex justify-between items-center mt-4 p-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Showing page {logsMeta.page} of {logsMeta.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-secondary px-3 py-1 text-sm" 
                      disabled={logsPage === 1}
                      onClick={() => setLogsPage(logsPage - 1)}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button 
                      className="btn btn-secondary px-3 py-1 text-sm" 
                      disabled={logsPage === logsMeta.totalPages}
                      onClick={() => setLogsPage(logsPage + 1)}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
