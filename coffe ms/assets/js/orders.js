const OrdersModule = {
  searchQuery: '',
  statusFilter: 'All',

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-primary" onclick="App.navigate(\'pos\')">+ New Order</button>';

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-clipboard-list"></i></div><div class="stat-info"><div class="stat-label">Total Orders</div><div class="stat-value" id="order-total">0</div></div></div>
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-label">Pending</div><div class="stat-value" id="order-pending">0</div></div></div>
        <div class="stat-card"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-label">Completed</div><div class="stat-value" id="order-completed">0</div></div></div>
        <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-times-circle"></i></div><div class="stat-info"><div class="stat-label">Cancelled</div><div class="stat-value" id="order-cancelled">0</div></div></div>
      </div>
      <div class="card">
        <div class="filter-bar">
          <div class="search-bar"><span><i class="fas fa-search"></i></span><input type="text" placeholder="Search orders..." id="order-search" oninput="OrdersModule.onSearch(this.value)"></div>
          <select id="order-status-filter" onchange="OrdersModule.onStatusFilter(this.value)">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th style="width:180px">Actions</th></tr></thead>
            <tbody id="orders-table-body"></tbody>
          </table>
        </div>
      </div>
    `;
    this.updateStats();
    this.renderTable();
  },

  getFilteredData() {
    let orders = [...App.getData('orders')];
    if (this.statusFilter !== 'All') orders = orders.filter(o => o.status === this.statusFilter);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      orders = orders.filter(o => o.customer.toLowerCase().includes(q) || o.id.toString().includes(q));
    }
    return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  updateStats() {
    const orders = App.getData('orders');
    document.getElementById('order-total').textContent = orders.length;
    document.getElementById('order-pending').textContent = orders.filter(o => o.status === 'Pending').length;
    document.getElementById('order-completed').textContent = orders.filter(o => o.status === 'Completed').length;
    document.getElementById('order-cancelled').textContent = orders.filter(o => o.status === 'Cancelled').length;
  },

  renderTable() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    const orders = this.getFilteredData();
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon"><i class="fas fa-box"></i></div><h3>No orders found</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => {
      const badgeClass = o.status === 'Completed' ? 'badge-success' : o.status === 'Pending' ? 'badge-warning' : o.status === 'Preparing' ? 'badge-info' : o.status === 'Ready' ? 'badge-info' : 'badge-danger';
      const nextStatus = this.getNextStatus(o.status);
      return `<tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.items.map(i => i.product + ' x' + i.qty).join(', ')}</td>
        <td>${App.formatCurrency(o.total)}</td>
        <td>${o.payment}</td>
        <td><span class="badge ${badgeClass}">${o.status}</span></td>
        <td>${o.date}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-info" onclick="OrdersModule.viewDetails(${o.id})">View</button>
            ${nextStatus ? '<button class="btn btn-sm btn-primary" onclick="OrdersModule.updateStatus(' + o.id + ')">' + nextStatus + '</button>' : ''}
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  getNextStatus(status) {
    const map = { 'Pending': 'Preparing', 'Preparing': 'Ready', 'Ready': 'Completed' };
    return map[status] || null;
  },

  onSearch(value) { this.searchQuery = value; this.renderTable(); },
  onStatusFilter(value) { this.statusFilter = value; this.renderTable(); },

  updateStatus(id) {
    const order = App.getData('orders').find(o => o.id === id);
    if (!order) return;
    const next = this.getNextStatus(order.status);
    if (next) {
      order.status = next;
      this.updateStats();
      this.renderTable();
      App.showToast('Order #' + id + ' updated to ' + next, 'success');
    }
  },

  viewDetails(id) {
    const order = App.getData('orders').find(o => o.id === id);
    if (!order) return;
    const badgeClass = order.status === 'Completed' ? 'badge-success' : order.status === 'Pending' ? 'badge-warning' : order.status === 'Preparing' ? 'badge-info' : order.status === 'Ready' ? 'badge-info' : 'badge-danger';
    Modal.show({
      title: 'Order #' + order.id,
      content: '<div class="profile-header"><div class="profile-avatar"><i class="fas fa-box"></i></div><div class="profile-info"><h2>' + order.customer + '</h2><div class="detail">' + order.date + ' &middot; <span class="badge ' + badgeClass + '">' + order.status + '</span></div></div></div><div class="card" style="margin-bottom:16px"><h4 style="margin-bottom:12px">Order Items</h4>' + order.items.map(i => '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)"><span>' + i.product + ' x' + i.qty + '</span><span>' + App.formatCurrency(i.price * i.qty) + '</span></div>').join('') + '<div style="display:flex;justify-content:space-between;padding:12px 0 0;font-size:18px;font-weight:700"><span>Total</span><span style="color:var(--primary-light)">' + App.formatCurrency(order.total) + '</span></div></div><div class="form-row"><div class="form-group"><label class="form-label">Payment Method</label><div style="padding:8px 0;font-weight:600">' + order.payment + '</div></div><div class="form-group"><label class="form-label">Notes</label><div style="padding:8px 0;color:var(--text-muted)">' + (order.notes || 'None') + '</div></div></div>',
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Close</button>'
    });
  },
};
