const ProductsModule = {
  currentFilter: 'All',
  currentSort: 'name',
  searchQuery: '',

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-primary" onclick="ProductsModule.showAddModal()">+ Add Product</button>';

    container.innerHTML = `
      <div class="card">
        <div class="filter-bar">
          <div class="search-bar">
            <span><i class="fas fa-search"></i></span>
            <input type="text" placeholder="Search products..." id="product-search" oninput="ProductsModule.onSearch(this.value)">
          </div>
          <select id="product-category-filter" onchange="ProductsModule.onFilter(this.value)">
            <option value="All">All Categories</option>
            <option value="Coffee">Coffee</option>
            <option value="Milk Tea">Milk Tea</option>
            <option value="Snacks">Snacks</option>
            <option value="Desserts">Desserts</option>
            <option value="Add-ons">Add-ons</option>
          </select>
          <select id="product-sort" onchange="ProductsModule.onSort(this.value)">
            <option value="name">Sort by Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock">Sort by Stock</option>
          </select>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width:50px">Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style="width:160px">Actions</th>
              </tr>
            </thead>
            <tbody id="products-table-body"></tbody>
          </table>
        </div>
      </div>
    `;
    this.renderTable();
  },

  getFilteredData() {
    let products = [...App.getData('products')];
    if (this.currentFilter !== 'All') {
      products = products.filter(p => p.category === this.currentFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q));
    }
    products.sort((a, b) => {
      if (this.currentSort === 'price-asc') return a.price - b.price;
      if (this.currentSort === 'price-desc') return b.price - a.price;
      if (this.currentSort === 'stock') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
    return products;
  },

  renderTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    const products = this.getFilteredData();
    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon"><i class="fas fa-box"></i></div><h3>No products found</h3><p>Try adjusting your search or filter</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image}" alt="${p.name}" style="width:40px;height:40px;border-radius:8px;object-fit:cover" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23c47a3c%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22white%22>&#9749;</text></svg>'"></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-info">${p.category}</span></td>
        <td>${App.formatCurrency(p.price)}</td>
        <td><span class="${p.stock === 0 ? 'badge badge-danger' : p.stock < 20 ? 'badge badge-warning' : ''}">${p.stock}</span></td>
        <td><span class="badge ${p.status === 'Active' ? 'badge-success' : 'badge-secondary'}">${p.status}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" onclick="ProductsModule.showEditModal(${p.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="ProductsModule.deleteProduct(${p.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  onSearch(value) { this.searchQuery = value; this.renderTable(); },
  onFilter(value) { this.currentFilter = value; this.renderTable(); },
  onSort(value) { this.currentSort = value; this.renderTable(); },

  showAddModal() {
    Modal.show({
      title: 'Add Product',
      content: this.getFormHtml({}),
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="ProductsModule.saveProduct()">Save Product</button>'
    });
  },

  showEditModal(id) {
    const product = App.getData('products').find(p => p.id === id);
    if (!product) return;
    Modal.show({
      title: 'Edit Product',
      content: this.getFormHtml(product),
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="ProductsModule.saveProduct(' + id + ')">Update Product</button>'
    });
  },

  getFormHtml(product) {
    const p = product || {};
    return `
      <div class="form-group">
        <label class="form-label">Product Name</label>
        <input class="form-input" id="product-name" value="${p.name || ''}" placeholder="Enter product name">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="product-category">
            <option value="Coffee" ${p.category === 'Coffee' ? 'selected' : ''}>Coffee</option>
            <option value="Milk Tea" ${p.category === 'Milk Tea' ? 'selected' : ''}>Milk Tea</option>
            <option value="Snacks" ${p.category === 'Snacks' ? 'selected' : ''}>Snacks</option>
            <option value="Desserts" ${p.category === 'Desserts' ? 'selected' : ''}>Desserts</option>
            <option value="Add-ons" ${p.category === 'Add-ons' ? 'selected' : ''}>Add-ons</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Price (₱)</label>
          <input class="form-input" id="product-price" type="number" step="0.01" value="${p.price || ''}" placeholder="0.00">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Stock</label>
          <input class="form-input" id="product-stock" type="number" value="${p.stock || 0}" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="product-status">
            <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Inactive" ${p.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Image URL</label>
        <input class="form-input" id="product-image" value="${p.image || ''}" placeholder="https://...">
      </div>
    `;
  },

  saveProduct(editId) {
    const name = document.getElementById('product-name')?.value.trim();
    if (!name) { App.showToast('Product name is required', 'error'); return; }
    const category = document.getElementById('product-category')?.value;
    const price = parseFloat(document.getElementById('product-price')?.value) || 0;
    const stock = parseInt(document.getElementById('product-stock')?.value) || 0;
    const status = document.getElementById('product-status')?.value;
    const image = document.getElementById('product-image')?.value || '';

    if (editId) {
      const product = App.getData('products').find(p => p.id === editId);
      if (product) {
        Object.assign(product, { name, category, price, stock, status, image });
        App.showToast('Product updated successfully', 'success');
      }
    } else {
      const products = App.getData('products');
      products.push({
        id: Math.max(...products.map(p => p.id), 0) + 1,
        name, category, price, stock, status, image
      });
      App.showToast('Product added successfully', 'success');
    }
    Modal.close();
    this.renderTable();
  },

  deleteProduct(id) {
    App.confirm('Are you sure you want to delete this product?', () => {
      const products = App.getData('products');
      const idx = products.findIndex(p => p.id === id);
      if (idx !== -1) {
        products.splice(idx, 1);
        App.showToast('Product deleted', 'success');
        this.renderTable();
      }
    });
  },
};
