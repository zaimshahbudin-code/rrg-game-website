import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Users, CheckCircle2, XCircle, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const usersCol = collection(db, 'users');
      const userSnapshot = await getDocs(usersCol);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort: Pending users first, then by date
      userList.sort((a, b) => {
        if (a.isApproved === b.isApproved) {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return a.isApproved ? 1 : -1;
      });
      
      setUsers(userList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Gagal memuat turun senarai pengguna dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleApproval = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isApproved: !currentStatus
      });
      
      // Update local state without refetching to be faster
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: !currentStatus } : u));
    } catch (err) {
      console.error("Error updating approval status:", err);
      alert('Gagal mengemas kini status pengguna.');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'Pelajar' : 'admin';
    if (!window.confirm(`Adakah anda pasti mahu menukar peranan pengguna ini kepada ${newRole}?`)) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole
      });
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Error updating role:", err);
      alert('Gagal mengemas kini peranan pengguna.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p>Memuatkan data pelajar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
              Admin Dashboard
            </h2>
            <p className="text-slate-300 mt-2">Uruskan kelulusan dan peranan pelajar yang mendaftar.</p>
          </div>
          <button 
            onClick={fetchUsers}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>

        {/* Content */}
        <div className="p-0 overflow-x-auto">
          {error && (
            <div className="p-4 m-6 bg-red-50 text-red-600 rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">Nama / Emel</th>
                <th className="p-4 font-semibold">Status Kelulusan</th>
                <th className="p-4 font-semibold">Peranan (Role)</th>
                <th className="p-4 font-semibold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Belum ada pengguna yang mendaftar.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                      <div className="text-xs text-slate-400 mt-1">Daftar: {new Date(user.createdAt).toLocaleDateString('ms-MY')}</div>
                    </td>
                    <td className="p-4">
                      {user.isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Diluluskan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold animate-pulse">
                          <XCircle className="w-3.5 h-3.5" /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproval(user.id, user.isApproved)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${user.isApproved ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20'}`}
                        >
                          {user.isApproved ? 'Tarik Balik' : 'Luluskan'}
                        </button>
                        
                        <button
                          onClick={() => handleToggleRole(user.id, user.role)}
                          title="Tukar Peranan"
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
