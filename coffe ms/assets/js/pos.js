const POSModule = {
  cart: [],
  selectedCategory: 'All',
  paymentMethod: 'Cash',
  discount: 0,


  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '';

    const products = App.getData('products').filter(p => p.status === 'Active' && p.stock > 0);
    const categories = ['All', ...new Set(products.map(p => p.category))];

    container.innerHTML = `
      <div class="pos-layout">
        <div class="pos-products">
          <div class="pos-categories">
            ${categories.map(c => `<button class="pos-cat-btn ${c === this.selectedCategory ? 'active' : ''}" onclick="POSModule.selectCategory('${c}')">${c}</button>`).join('')}
          </div>
          <div class="pos-product-grid" id="pos-product-grid"></div>
        </div>
        <div class="pos-cart" id="pos-cart">
          <div class="pos-cart-header">
            <h3>Current Order</h3>
            <button class="btn btn-sm btn-danger" onclick="POSModule.clearCart()">Clear All</button>
          </div>
          <div class="pos-cart-items" id="pos-cart-items">
            <div class="empty-state"><div class="icon"><i class="fas fa-shopping-cart"></i></div><h3>Cart is empty</h3><p>Click products to add them</p></div>
          </div>
          <div class="pos-cart-summary">
            <div class="row"><span>Subtotal</span><span id="pos-subtotal">₱0.00</span></div>
            <div class="row"><span>Discount</span><span id="pos-discount">₱0.00</span></div>
            <div class="row total"><span>Total</span><span class="value" id="pos-total">₱0.00</span></div>
            <div class="pos-payment-options">
              <button class="pos-payment-btn active" onclick="POSModule.selectPayment('Cash')"><i class="fas fa-money-bill-wave"></i> Cash</button>
              <button class="pos-payment-btn" onclick="POSModule.selectPayment('GCash')"><i class="fas fa-credit-card"></i> GCash</button>
              <button class="pos-payment-btn" onclick="POSModule.selectPayment('Card')"><i class="fas fa-credit-card"></i> Card</button>
            </div>
            <div class="form-group" style="margin:8px 0">
              <input class="form-input" id="pos-notes" placeholder="Order notes..." style="font-size:12px;padding:6px 10px">
            </div>
            <button class="btn btn-primary btn-lg" style="width:100%" onclick="POSModule.placeOrder()"><i class="fas fa-shopping-cart"></i> Place Order</button>
          </div>
        </div>
      </div>
    `;
    this.renderProducts();
  },

  selectCategory(cat) {
    this.selectedCategory = cat;
    document.querySelectorAll('.pos-cat-btn').forEach(b => b.classList.toggle('active', b.textContent === cat));
    this.renderProducts();
  },

  renderProducts() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;
    let products = App.getData('products').filter(p => p.status === 'Active' && p.stock > 0);
    if (this.selectedCategory !== 'All') products = products.filter(p => p.category === this.selectedCategory);

    const icons = { 'Coffee': '<i class="fas fa-mug-hot"></i>', 'Milk Tea': '<i class="fas fa-glass-cheers"></i>', 'Snacks': '<i class="fas fa-cookie-bite"></i>', 'Desserts': '<i class="fas fa-birthday-cake"></i>', 'Add-ons': '<i class="fas fa-candy-cane"></i>' };
    grid.innerHTML = products.map(p => `
      <div class="pos-product-item" onclick="POSModule.addToCart(${p.id})">
        <div class="product-icon">${icons[p.category] || '<i class="fas fa-mug-hot"></i>'}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${App.formatCurrency(p.price)}</div>
      </div>
    `).join('');
  },

  addToCart(productId) {
    const product = App.getData('products').find(p => p.id === productId);
    if (!product) return;
    const existing = this.cart.find(c => c.productId === productId);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ productId: product.id, name: product.name, price: product.price, qty: 1 });
    }
    this.renderCart();
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(c => c.productId !== productId);
    this.renderCart();
  },

  updateQty(productId, delta) {
    const item = this.cart.find(c => c.productId === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.cart = this.cart.filter(c => c.productId !== productId);
    this.renderCart();
  },

  clearCart() {
    this.cart = [];
    this.renderCart();
  },

  selectPayment(method) {
    this.paymentMethod = method;
    document.querySelectorAll('.pos-payment-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().includes(method)));
  },

  renderCart() {
    const itemsContainer = document.getElementById('pos-cart-items');
    const subtotalEl = document.getElementById('pos-subtotal');
    const discountEl = document.getElementById('pos-discount');
    const totalEl = document.getElementById('pos-total');

    if (!itemsContainer) return;

    if (this.cart.length === 0) {
      itemsContainer.innerHTML = '<div class="empty-state"><div class="icon"><i class="fas fa-shopping-cart"></i></div><h3>Cart is empty</h3><p>Click products to add them</p></div>';
      if (subtotalEl) subtotalEl.textContent = '₱0.00';
      if (discountEl) discountEl.textContent = '₱0.00';
      if (totalEl) totalEl.textContent = '₱0.00';
      return;
    }

    itemsContainer.innerHTML = this.cart.map(item => `
      <div class="pos-cart-item">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-price">${App.formatCurrency(item.price)}</div>
        </div>
        <div class="qty-control">
          <button onclick="POSModule.updateQty(${item.productId}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="POSModule.updateQty(${item.productId}, 1)">+</button>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="POSModule.removeFromCart(${item.productId})" style="color:var(--danger)"><i class="fas fa-times"></i></button>
      </div>
    `).join('');

    this.updateSummary();
  },

  updateSummary() {
    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = this.discount;
    const total = subtotal - discount;

    document.getElementById('pos-subtotal').textContent = App.formatCurrency(subtotal);
    document.getElementById('pos-discount').textContent = App.formatCurrency(discount);
    document.getElementById('pos-total').textContent = App.formatCurrency(total);
  },

  placeOrder() {
    if (this.cart.length === 0) {
      App.showToast('Cart is empty. Add items first.', 'error');
      return;
    }
    const subtotal = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const total = subtotal - this.discount;
    const notes = document.getElementById('pos-notes')?.value || '';

    const orders = App.getData('orders');
    orders.unshift({
      id: 1000 + orders.length + 1,
      customer: 'Walk-in',
      items: this.cart.map(c => ({ product: c.name, qty: c.qty, price: c.price })),
      total: Math.round(total * 100) / 100,
      status: 'Pending',
      payment: this.paymentMethod,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: notes,
    });

    if (SettingsModule.isEnabled('emailAlerts')) {
      App.showToast('Email notification sent: New order #' + (1000 + orders.length) + ' received', 'info');
    }

    this.cart = [];
    this.renderCart();
    App.showToast('Order placed successfully!', 'success');
  },
};
