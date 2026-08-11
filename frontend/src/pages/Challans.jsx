import React, { useState, useEffect } from 'react';
import { getChallans, getCustomers, getProducts, createChallan, updateChallanStatus, getChallanById } from '../api';
import { FileText, Plus, CheckCircle, XCircle, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import { useSearchParams } from 'react-router-dom';

const Challans = ({ user }) => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  
  const [challans, setChallans] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  
  // Create Challan State
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    challan_number: `CH-${Date.now().toString().slice(-6)}`,
    customer_id: '',
    status: 'DRAFT',
    items: [{ product_id: '', quantity: 1 }]
  });

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 6 };
      if (initialStatus) {
        params.status = initialStatus;
      }
      const [cRes, custRes, prodRes] = await Promise.all([
        getChallans(params),
        getCustomers({ limit: 100 }), // get enough for dropdown
        getProducts({ limit: 100 })
      ]);
      setChallans(cRes.data.data);
      setMeta(cRes.data.meta);
      setCustomers(custRes.data.data);
      setProducts(prodRes.data.data);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1 }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const cleanedItems = formData.items
        .filter(item => item.product_id)
        .map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        }));

      if (cleanedItems.length === 0) {
        alert("Please add at least one valid product");
        return;
      }

      await createChallan({
        challan_number: formData.challan_number,
        customer_id: parseInt(formData.customer_id),
        status: formData.status,
        items: cleanedItems
      });

      setShowModal(false);
      setFormData({
        challan_number: `CH-${Date.now().toString().slice(-6)}`,
        customer_id: '',
        status: 'DRAFT',
        items: [{ product_id: '', quantity: 1 }]
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating challan');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (status === 'CANCELLED' && !window.confirm('Are you sure you want to cancel this challan?')) {
      return;
    }
    try {
      await updateChallanStatus(id, status);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating status');
    }
  };

  const handleExportPDF = async (id) => {
    try {
      // We need to fetch the full challan to get the items
      const res = await getChallanById(id);
      generateInvoicePDF(res.data);
    } catch (error) {
      alert(`Error: ${error.message}\n\nStack: ${error.stack}\n\nResponse: ${JSON.stringify(error.response?.data)}`);
      console.error(error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Challans</h1>
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} className="mr-2" /> Create Challan
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>
            ) : challans.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4 text-muted">No challans found</td></tr>
            ) : (
              challans.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      <span className="font-bold">{c.challan_number}</span>
                    </div>
                  </td>
                  <td>{c.customer?.name}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${c.status === 'CONFIRMED' ? 'badge-success' : c.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-xs" onClick={() => handleStatusUpdate(c.id, 'CONFIRMED')}>
                          <CheckCircle size={14} className="mr-1 text-success" /> Confirm
                        </button>
                        <button className="text-danger hover:bg-red-50 p-1 rounded text-xs flex items-center" onClick={() => handleStatusUpdate(c.id, 'CANCELLED')}>
                          <XCircle size={14} className="mr-1" /> Cancel
                        </button>
                      </div>
                    )}
                    {c.status === 'CONFIRMED' && (
                      <button className="btn btn-primary text-xs" onClick={() => handleExportPDF(c.id)}>
                        <Download size={14} className="mr-1" /> Export PDF
                      </button>
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

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Create Sales Challan</h2>
            <form onSubmit={handleCreate}>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label>Challan Number *</label>
                  <input required className="input-field bg-gray-50" value={formData.challan_number} onChange={e => setFormData({...formData, challan_number: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label>Customer *</label>
                  <select required className="input-field" value={formData.customer_id} onChange={e => setFormData({...formData, customer_id: e.target.value})}>
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.business_name || 'Retail'})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Initial Status *</label>
                  <select required className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="DRAFT">Save as Draft (No stock deduction)</option>
                    <option value="CONFIRMED">Confirm Immediately (Deduct stock)</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-bold mb-2">Products</h3>
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2 items-start">
                    <div className="flex-1">
                      <select required className="input-field" value={item.product_id} onChange={e => handleItemChange(index, 'product_id', e.target.value)}>
                        <option value="">Select Product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {p.sku} (Stock: {p.current_stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input required type="number" min="1" className="input-field" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-secondary text-danger px-3" onClick={() => handleRemoveItem(index)}>X</button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary text-sm mt-2" onClick={handleAddItem}>
                  + Add another item
                </button>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Challan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challans;
