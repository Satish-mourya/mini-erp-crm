import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api';
import { Plus, Search, User, Edit, Eye, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Customers = ({ user }) => {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    business_name: '',
    gst_number: '',
    address: '',
    type: 'RETAIL',
    status: 'ACTIVE'
  });

  const fetchCustomers = async (p = page) => {
    setLoading(true);
    try {
      const res = await getCustomers({ search, page: p, limit: 6 });
      setCustomers(res.data.data);
      setMeta(res.data.meta);
    } catch (error) {
      console.error('Error fetching customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(1);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', mobile: '', email: '', business_name: '', gst_number: '', address: '', type: 'RETAIL', status: 'LEAD' });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name || '',
      mobile: c.mobile || '',
      email: c.email || '',
      business_name: c.business_name || '',
      gst_number: c.gst_number || '',
      address: c.address || '',
      type: c.type || 'RETAIL',
      status: c.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
      } else {
        await createCustomer(formData);
      }
      setShowModal(false);
      fetchCustomers();
    } catch (error) {
      alert('Error saving customer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting customer');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} className="mr-2" /> Add Customer
          </button>
        )}
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="text" 
            className="input-field flex-1" 
            placeholder="Search by name, mobile or business name..." 
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
              <th>Name</th>
              <th>Business Name</th>
              <th>Mobile</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">No customers found</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        <User size={16} />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td>{c.business_name || '-'}</td>
                  <td>{c.mobile}</td>
                  <td>
                    <span className="badge badge-secondary">{c.type}</span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : c.status === 'LEAD' ? 'badge-warning' : 'badge-danger'}`}>{c.status}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/customers/${c.id}`} className="text-primary hover:bg-blue-50 p-1 rounded">
                        <Eye size={18} />
                      </Link>
                      {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
                        <>
                          <button className="text-primary hover:bg-blue-50 p-1 rounded" onClick={() => openEditModal(c)}>
                            <Edit size={18} />
                          </button>
                          <button className="text-danger hover:bg-red-50 p-1 rounded" onClick={() => handleDelete(c.id)}>
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSave}>
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1 mb-0">
                  <label>Name *</label>
                  <input required className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group flex-1 mb-0">
                  <label>Mobile *</label>
                  <input required type="tel" pattern="[0-9]{10,15}" title="Please enter a valid 10-15 digit mobile number" className="input-field" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value.replace(/[^0-9]/g, '')})} />
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1 mb-0">
                  <label>Email</label>
                  <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group flex-1 mb-0">
                  <label>Business Name</label>
                  <input className="input-field" value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} />
                </div>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1 mb-0">
                  <label>GST Number</label>
                  <input className="input-field" maxLength="15" placeholder="Optional" value={formData.gst_number} onChange={e => setFormData({...formData, gst_number: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group flex-1 mb-0">
                  <label>Type</label>
                  <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group flex-1 mb-0">
                  <label>Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group mb-4">
                <label>Address</label>
                <textarea className="input-field" rows="2" style={{ resize: 'none' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              
              <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
