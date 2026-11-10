import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { showToast } from '../../redux/uiSlice';
import { initiales } from '../../utils/format';
import Icon from '../Icon';

export default function AdminUsers() {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const response = await axiosClient.get('/users');
        setUsers(response.data);
      } catch (err) {
        dispatch(
          showToast({
            message: err.response?.data?.message || 'Impossible de charger les clients.',
            type: 'error'
          })
        );
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [dispatch]);

  if (loading) return <div className="loading-box">Chargement des clients...</div>;

  const clients = users.filter((u) => u.role === 'client').length;

  return (
    <div className="admin-content">
      <section className="panel">
        <div className="panel-head">
          <div className="panel-title-row">
            <h3>Comptes</h3>
            <span className="count-pill">{users.length}</span>
          </div>
          <span className="panel-sub">
            {clients} client(s) &middot; {users.length - clients} administrateur(s)
          </span>
        </div>

        {users.length === 0 ? (
          <p className="muted-note">Aucun compte enregistré.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="cell-client">
                        <span className={u.role === 'admin' ? 't-avatar violet' : 't-avatar'}>
                          {initiales(u.name)}
                        </span>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={u.role === 'admin' ? 'role-tag admin' : 'role-tag'}>
                        {u.role === 'admin' ? (
                          <>
                            <Icon name="sparkle" size={11} /> Admin
                          </>
                        ) : (
                          'Client'
                        )}
                      </span>
                    </td>
                    <td>
                      {new Date(u.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
