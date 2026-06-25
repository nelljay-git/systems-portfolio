const InventoryModule = {
  searchQuery: '',
  statusFilter: 'All',

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-primary" onclick="InventoryModule.showAddModal()">+ Add Item</button>';

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-label">In Stock</div><div class="stat-value" id="inv-instock">0</div></div></div>
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-exclamation-triangle"></i></div><div class="stat-info"><div class="stat-label">Low Stock</div><div class="stat-value" id="inv-lowstock">0</div></div></div>
        <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-times-circle"></i></div><div class="stat-info"><div class="stat-label">Out of Stock</div><div class="stat-value" id="inv-outstock">0</div></div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-clipboard"></i></div><div class="stat-info"><div class="stat-label">Total Items</div><div class="stat-value" id="inv-total">0</div></div></div>
      </div>
      <div class="card">
        <div class="filter-bar">
          <div class="search-bar">
            <span><i class="fas fa-search"></i></span>
            <input type="text" placeholder="Search inventory..." id="inv-search" oninput="InventoryModule.onSearch(this.value)">
          </div>
          <select id="inv-status-filter" onchange="InventoryModule.onStatusFilter(this.value)">
            <option value="All">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <button class="btn btn-sm btn-warning" onclick="InventoryModule.simulateConsumption()"><i class="fas fa-chart-line"></i> Simulate Consumption</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr><th>Item Name</th><th>Quantity</th><th>Unit</th><th>Supplier</th><th>Cost/Unit</th><th>Status</th><th style="width:120px">Actions</th></tr>
            </thead>
            <tbody id="inventory-table-body"></tbody>
          </table>
        </div>
      </div>
    `;
    this.updateStats();
    this.renderTable();
  },

  getFilteredData() {
    let items = [...App.getData('inventory')];
    if (this.statusFilter !== 'All') items = items.filter(i => i.status === this.statusFilter);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  },

  updateStats() {
    const inv = App.getData('inventory');
    const inStock = inv.filter(i => i.status === 'In Stock').length;
    const lowStock = inv.filter(i => i.status === 'Low Stock').length;
    const outStock = inv.filter(i => i.status === 'Out of Stock').length;
    document.getElementById('inv-instock').textContent = inStock;
    document.getElementById('inv-lowstock').textContent = lowStock;
    document.getElementById('inv-outstock').textContent = outStock;
    document.getElementById('inv-total').textContent = inv.length;
  },

  renderTable() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
    const items = this.getFilteredData();
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon"><i class="fas fa-box"></i></div><h3>No inventory items found</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = items.map(i => {
      const badgeClass = i.status === 'In Stock' ? 'badge-success' : i.status === 'Low Stock' ? 'badge-warning' : 'badge-danger';
      return `<tr>
        <td><strong>${i.name}</strong></td>
        <td><span class="${i.status === 'Out of Stock' ? 'badge badge-danger' : i.status === 'Low Stock' ? 'badge badge-warning' : ''}">${i.quantity}</span></td>
        <td>${i.unit}</td>
        <td>${i.supplier}</td>
        <td>${App.formatCurrency(i.cost)}</td>
        <td><span class="badge ${badgeClass}">${i.status}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" onclick="InventoryModule.showEditModal(${i.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="InventoryModule.deleteItem(${i.id})">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  },

  onSearch(value) { this.searchQuery = value; this.renderTable(); },
  onStatusFilter(value) { this.statusFilter = value; this.renderTable(); },

  showAddModal() {
    Modal.show({
      title: 'Add Inventory Item',
      content: this.getFormHtml({}),
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="InventoryModule.saveItem()">Save Item</button>'
    });
  },

  showEditModal(id) {
    const item = App.getData('inventory').find(i => i.id === id);
    if (!item) return;
    Modal.show({
      title: 'Edit Inventory Item',
      content: this.getFormHtml(item),
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="InventoryModule.saveItem(' + id + ')">Update Item</button>'
    });
  },

  getFormHtml(item) {
    const i = item || {};
    return `
      <div class="form-group"><label class="form-label">Item Name</label><input class="form-input" id="inv-name" value="${i.name || ''}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Quantity</label><input class="form-input" id="inv-qty" type="number" value="${i.quantity || 0}"></div>
        <div class="form-group"><label class="form-label">Unit</label><input class="form-input" id="inv-unit" value="${i.unit || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Supplier</label><input class="form-input" id="inv-supplier" value="${i.supplier || ''}"></div>
        <div class="form-group"><label class="form-label">Cost (₱)</label><input class="form-input" id="inv-cost" type="number" step="0.01" value="${i.cost || 0}"></div>
      </div>
    `;
  },

  saveItem(editId) {
    const name = document.getElementById('inv-name')?.value.trim();
    if (!name) { App.showToast('Item name is required', 'error'); return; }
    const quantity = parseInt(document.getElementById('inv-qty')?.value) || 0;
    const unit = document.getElementById('inv-unit')?.value || '';
    const supplier = document.getElementById('inv-supplier')?.value || '';
    const cost = parseFloat(document.getElementById('inv-cost')?.value) || 0;
    const status = quantity === 0 ? 'Out of Stock' : quantity < 5 ? 'Low Stock' : 'In Stock';

    if (editId) {
      const item = App.getData('inventory').find(i => i.id === editId);
      if (item) {
        Object.assign(item, { name, quantity, unit, supplier, cost, status });
        App.showToast('Item updated', 'success');
      }
    } else {
      const inv = App.getData('inventory');
      inv.push({ id: Math.max(...inv.map(i => i.id), 0) + 1, name, quantity, unit, supplier, cost, status });
      App.showToast('Item added', 'success');
    }
    Modal.close();
    this.updateStats();
    this.renderTable();
  },

  deleteItem(id) {
    App.confirm('Delete this inventory item?', () => {
      const inv = App.getData('inventory');
      const idx = inv.findIndex(i => i.id === id);
      if (idx !== -1) { inv.splice(idx, 1); App.showToast('Item deleted', 'success'); this.updateStats(); this.renderTable(); }
    });
  },

  simulateConsumption() {
    const inv = App.getData('inventory');
    const alerts = [];
    inv.forEach(item => {
      if (item.quantity > 0) {
        const consume = Math.floor(Math.random() * 3) + 1;
        item.quantity = Math.max(0, item.quantity - consume);
        item.status = item.quantity === 0 ? 'Out of Stock' : item.quantity < 5 ? 'Low Stock' : 'In Stock';
        if (item.status !== 'In Stock') alerts.push(item.name + ' - ' + item.status);
      }
    });
    this.updateStats();
    this.renderTable();
    App.showToast('Stock consumption simulated', 'info');
    if (alerts.length > 0 && SettingsModule.isEnabled('inventoryAlerts')) {
      App.showToast('Inventory alert: ' + alerts.join(', '), 'warning');
    }
  },
};
