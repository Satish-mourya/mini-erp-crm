import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCustomerById, updateCustomer } from '../api';
import { User, Phone, Mail, Building, MapPin, Calendar, ArrowLeft } from 'lucide-react';

const CustomerDetail = ({ user }) => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const fetchCustomer = async () => {
    try {
      const res = await getCustomerById(id);
      setCustomer(res.data);
      setNotes(res.data.notes || '');
      setFollowUpDate(res.data.follow_up_date ? new Date(res.data.follow_up_date).toISOString().split('T')[0] : '');
    } catch (error) {
      console.error('Error fetching customer details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleSaveNotes = async () => {
    try {
      await updateCustomer(id, {
        notes,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null
      });
      setEditingNotes(false);
      fetchCustomer();
    } catch (error) {
      alert('Error saving notes');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!customer) return <div className="p-8 text-center text-danger">Customer not found</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/customers" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-6">
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{customer.name}</h1>
                <span className={`badge ${customer.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} mt-1`}>
                  {customer.status} • {customer.type}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Building size={18} /> <strong>Business:</strong> {customer.business_name || 'N/A'}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Building size={18} style={{ opacity: 0 }} /> <strong>GST Number:</strong> {customer.gst_number || 'N/A'}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={18} /> <strong>Mobile:</strong> {customer.mobile}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={18} /> <strong>Email:</strong> {customer.email || 'N/A'}
              </div>
              <div className="flex items-start gap-3 text-gray-600">
                <MapPin size={18} className="mt-1" /> <strong>Address:</strong> {customer.address || 'N/A'}
              </div>
            </div>
          </div>

          {/* CRM Notes */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">CRM & Follow-up</h2>
              {!editingNotes && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
                <button className="btn btn-secondary text-sm" onClick={() => setEditingNotes(true)}>
                  Edit Notes
                </button>
              )}
            </div>

            {editingNotes ? (
              <div className="space-y-4">
                <div className="form-group">
                  <label>Next Follow-up Date</label>
                  <input type="date" className="input-field" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="input-field" rows="4" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add sales notes here..."></textarea>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={handleSaveNotes}>Save</button>
                  <button className="btn btn-secondary" onClick={() => { setEditingNotes(false); setNotes(customer.notes || ''); setFollowUpDate(customer.follow_up_date ? new Date(customer.follow_up_date).toISOString().split('T')[0] : ''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={18} /> <strong>Follow-up:</strong> {customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString() : 'Not scheduled'}
                </div>
                <div>
                  <strong>Notes:</strong>
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">{customer.notes || 'No notes added yet.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Challans (We would fetch related challans here eventually) */}
        <div className="flex-1">
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Recent Challans</h2>
            <p className="text-gray-500 italic">This customer's order history will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
