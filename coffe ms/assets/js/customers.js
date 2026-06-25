const CustomersModule = {
  searchQuery: '',

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-primary" onclick="CustomersModule.showAddModal()">+ Add Customer</button>';

    container.innerHTML = `
      <div class="card">
        <div class="filter-bar">
          <div class="search-bar"><span><i class="fas fa-search"></i></span><input type="text" placeholder="Search customers..." id="customer-search" oninput="CustomersModule.onSearch(this.value)"></div>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Loyalty Points</th><th>Total Orders</th><th>Joined</th><th style="width:160px">Actions</th></tr></thead>
            <tbody id="customers-table-body"></tbody>
          </table>
        </div>
      </div>
    `;
    this.renderTable();
  },

  getFilteredData() {
    let customers = [...App.getData('customers')];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return customers;
  },

  renderTable() {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    const customers = this.getFilteredData();
    if (customers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon"><i class="fas fa-user"></i></div><h3>No customers found</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = customers.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.phone}</td>
        <td><span class="badge badge-warning">${c.loyalty_points} pts</span></td>
        <td>${c.total_orders}</td>
        <td>${App.formatDate(c.joined)}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" onclick="CustomersModule.showProfile(${c.id})">Profile</button>
            <button class="btn btn-sm btn-primary" onclick="CustomersModule.showEditModal(${c.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="CustomersModule.deleteCustomer(${c.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  onSearch(value) { this.searchQuery = value; this.renderTable(); },

  showAddModal() {
    Modal.show({
      title: 'Add Customer',
      content: `<div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="cust-name"></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cust-email" type="email"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="cust-phone"></div></div>`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="CustomersModule.saveCustomer()">Save Customer</button>'
    });
  },

  showEditModal(id) {
    const c = App.getData('customers').find(c => c.id === id);
    if (!c) return;
    Modal.show({
      title: 'Edit Customer',
      content: `<div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="cust-name" value="${c.name}"></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cust-email" type="email" value="${c.email}"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="cust-phone" value="${c.phone}"></div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Loyalty Points</label><input class="form-input" id="cust-points" type="number" value="${c.loyalty_points}"></div></div>`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="CustomersModule.saveCustomer(' + id + ')">Update Customer</button>'
    });
  },

  saveCustomer(editId) {
    const name = document.getElementById('cust-name')?.value.trim();
    if (!name) { App.showToast('Name is required', 'error'); return; }
    const email = document.getElementById('cust-email')?.value || '';
    const phone = document.getElementById('cust-phone')?.value || '';

    if (editId) {
      const c = App.getData('customers').find(c => c.id === editId);
      if (c) {
        c.name = name; c.email = email; c.phone = phone;
        const pts = document.getElementById('cust-points');
        if (pts) c.loyalty_points = parseInt(pts.value) || 0;
        App.showToast('Customer updated', 'success');
      }
    } else {
      const customers = App.getData('customers');
      customers.push({ id: Math.max(...customers.map(c => c.id), 0) + 1, name, email, phone, loyalty_points: 0, total_orders: 0, joined: new Date().toISOString().split('T')[0] });
      App.showToast('Customer added', 'success');
    }
    Modal.close();
    this.renderTable();
  },

  deleteCustomer(id) {
    App.confirm('Delete this customer?', () => {
      const customers = App.getData('customers');
      const idx = customers.findIndex(c => c.id === id);
      if (idx !== -1) { customers.splice(idx, 1); App.showToast('Customer deleted', 'success'); this.renderTable(); }
    });
  },

  showProfile(id) {
    const c = App.getData('customers').find(c => c.id === id);
    if (!c) return;
    const orders = App.getData('orders').filter(o => o.customer === c.name);
    Modal.show({
      title: 'Customer Profile',
      content: `<div class="profile-header"><div class="profile-avatar">${c.name.charAt(0)}</div><div class="profile-info"><h2>${c.name}</h2><div class="detail">${c.email} &middot; ${c.phone}</div><div class="detail" style="margin-top:8px"><span class="badge badge-warning">${c.loyalty_points} Loyalty Points</span> <span class="badge badge-info">${c.total_orders} Orders</span></div></div></div>
        <h4 style="margin-bottom:12px">Purchase History</h4>
        ${orders.length === 0 ? '<div style="color:var(--text-muted);padding:20px;text-align:center">No purchases yet</div>' :
          orders.map(o => `<div style="display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid var(--border-color)">
            <span><strong>#${o.id}</strong> - ${o.items.map(i => i.product).join(', ')}</span>
            <span>${App.formatCurrency(o.total)} <span class="badge ${o.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${o.status}</span></span>
          </div>`).join('')}`,
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Close</button>'
    });
  },
};
