const App = {
  state: {
    currentPage: 'dashboard',
    theme: localStorage.getItem('coffee-theme') || 'dark',
    data: {},
    cart: [],
    toastId: 0,
    notifications: [],
    unreadCount: 0,
  },

  async init() {
    this.applyTheme();
    this.setupSidebar();
    this.setupNavbar();
    this.setupGlobalListeners();
    await this.loadData();
    this.renderPage(this.state.currentPage);
    const link = document.querySelector('.sidebar-link[data-page="dashboard"]');
    if (link) link.classList.add('active');
  },

  async loadData() {
    const files = ['products', 'inventory', 'customers', 'orders', 'employees'];
    try {
      const promises = files.map(f =>
        fetch('assets/data/' + f + '.json').then(r => r.json())
      );
      const results = await Promise.all(promises);
      files.forEach((f, i) => { this.state.data[f] = results[i]; });
      this.generateNotifications();
    } catch (e) {
      console.warn('Data load fallback:', e);
    }
  },

  generateNotifications() {
    const orders = this.state.data.orders || [];
    const inventory = this.state.data.inventory || [];
    const notifs = [];

    orders.slice(0, 5).forEach(o => {
      const isRecent = o.status === 'Pending' || o.status === 'Preparing';
      notifs.push({
        id: 'order-' + o.id,
        icon: isRecent ? 'primary' : 'success',
        iconClass: isRecent ? 'fa-clock' : 'fa-check-circle',
        title: 'Order #' + o.id + ' ' + o.status,
        desc: o.customer + ' - ' + o.items.map(i => i.product).join(', '),
        time: o.date,
        unread: isRecent,
      });
    });

    inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').slice(0, 3).forEach(i => {
      notifs.push({
        id: 'inv-' + i.id,
        icon: 'warning',
        iconClass: 'fa-exclamation-triangle',
        title: i.name + ' is ' + i.status,
        desc: 'Only ' + i.quantity + ' ' + i.unit + ' remaining',
        time: 'Now',
        unread: true,
      });
    });

    this.state.notifications = notifs.sort((a, b) => a.unread === b.unread ? 0 : a.unread ? -1 : 1);
    this.state.unreadCount = notifs.filter(n => n.unread).length;
    this.updateNotificationDot();
  },

  updateNotificationDot() {
    const dot = document.querySelector('.nav-btn .dot');
    if (dot) {
      dot.style.display = this.state.unreadCount > 0 ? 'block' : 'none';
    }
  },

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.state.theme);
    localStorage.setItem('coffee-theme', this.state.theme);
  },

  toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    const toggles = document.querySelectorAll('.theme-toggle-switch');
    toggles.forEach(t => t.classList.toggle('active', this.state.theme === 'light'));
  },

  setupSidebar() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar-link');
      if (!link || link.closest('.sidebar-footer')) return;
      const page = link.dataset.page;
      if (page) {
        e.preventDefault();
        this.navigate(page);
        document.querySelector('.sidebar')?.classList.remove('open');
      }
    });
  },

  setupNavbar() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-toggle')) {
        document.querySelector('.sidebar')?.classList.toggle('open');
      }
      if (e.target.closest('.theme-toggle-btn')) {
        Utils.toggleTheme();
        this.closeDropdowns();
      }
      if (e.target.closest('#notif-btn')) {
        e.stopPropagation();
        this.toggleNotifications();
      }
      if (e.target.closest('#profile-btn')) {
        e.stopPropagation();
        this.toggleProfile();
      }
      if (!e.target.closest('.dropdown') && !e.target.closest('.nav-btn')) {
        this.closeDropdowns();
      }
    });
  },

  closeDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('open'));
  },

  toggleNotifications() {
    this.closeDropdowns();
    const menu = document.getElementById('notif-dropdown');
    if (menu) {
      const list = document.getElementById('notif-list');
      if (list) list.innerHTML = this.getNotificationsHtml();
      menu.classList.toggle('open');
    }
  },

  markAllRead() {
    this.state.notifications.forEach(n => n.unread = false);
    this.state.unreadCount = 0;
    this.updateNotificationDot();
    const list = document.getElementById('notif-list');
    if (list) list.innerHTML = this.getNotificationsHtml();
    App.showToast('All notifications marked as read', 'success');
  },

  toggleProfile() {
    this.closeDropdowns();
    const menu = document.getElementById('profile-dropdown');
    if (menu) menu.classList.toggle('open');
  },

  getNotificationsHtml() {
    const notifs = this.state.notifications;
    if (notifs.length === 0) {
      return '<div class="dropdown-item"><div class="item-text"><div class="title" style="text-align:center;color:var(--text-muted)">No notifications</div></div></div>';
    }
    return notifs.map(n => `
      <div class="dropdown-item ${n.unread ? 'unread' : ''}">
        <div class="item-icon ${n.icon}"><i class="fas ${n.iconClass}"></i></div>
        <div class="item-text">
          <div class="title">${n.title}</div>
          <div class="desc">${n.desc}</div>
          <div class="time">${n.time}</div>
        </div>
      </div>
    `).join('');
  },

  setupGlobalListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-overlay:not(.no-close-on-click)') && !e.target.closest('.modal')) {
        Modal.close();
      }
      if (e.target.closest('#logout-btn')) {
        e.preventDefault();
        window.location.href = 'assets/pages/login.html';
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Modal.close();
    });
  },

  navigate(page) {
    this.state.currentPage = page;
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const link = document.querySelector('.sidebar-link[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    this.renderPage(page);
  },

  renderPage(page) {
    const container = document.getElementById('page-content');
    if (!container) return;
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const pages = {
      dashboard: {
        render: () => DashboardModule.render(),
        title: 'Dashboard',
        sub: 'Overview of your coffee shop'
      },
      products: {
        render: () => ProductsModule.render(),
        title: 'Products',
        sub: 'Manage your product catalog'
      },
      inventory: {
        render: () => InventoryModule.render(),
        title: 'Inventory',
        sub: 'Track your stock and supplies'
      },
      pos: {
        render: () => POSModule.render(),
        title: 'Point of Sale',
        sub: 'Create and process orders'
      },
      orders: {
        render: () => OrdersModule.render(),
        title: 'Orders',
        sub: 'View and manage all orders'
      },
      customers: {
        render: () => CustomersModule.render(),
        title: 'Customers',
        sub: 'Manage customer relationships'
      },
      employees: {
        render: () => EmployeesModule.render(),
        title: 'Employees',
        sub: 'Manage your team'
      },
      reports: {
        render: () => ReportsModule.render(),
        title: 'Reports',
        sub: 'Analytics and business insights'
      },
      settings: {
        render: () => SettingsModule.render(),
        title: 'Settings',
        sub: 'Configure your coffee shop'
      },
    };

    const pg = pages[page] || pages.dashboard;
    if (pageTitle) pageTitle.textContent = pg.title;
    if (pageSubtitle) pageSubtitle.textContent = pg.sub;
    container.innerHTML = '';
    pg.render();
  },

  getData(key) {
    return this.state.data[key] || [];
  },

  showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    if (!container) return;
    const id = ++this.state.toastId;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span><i class="fas ' + (icons[type] || 'fa-info-circle') + '"></i></span><span>' + message + '</span><button class="toast-close" data-id="' + id + '">&times;</button>';
    toast.dataset.id = id;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  },

  confirm(message, callback) {
    Modal.show({
      title: 'Confirm Action',
      content: '<div class="confirm-dialog"><div class="modal-body" style="text-align:center"><div class="icon warning-icon" style="font-size:48px;color:var(--warning);margin-bottom:16px"><i class="fas fa-exclamation-triangle"></i></div><h3>' + message + '</h3><p style="color:var(--text-muted);font-size:14px;margin-bottom:24px">This action cannot be undone.</p></div></div>',
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-danger" id="confirm-yes">Yes, Proceed</button>'
    });
    document.getElementById('confirm-yes')?.addEventListener('click', () => { Modal.close(); if (callback) callback(); });
  },

  formatCurrency(amount) {
    return '₱' + parseFloat(amount).toFixed(2);
  },

  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
};

const Utils = {
  toggleTheme() {
    App.toggleTheme();
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
};

const Modal = {
  show(opts) {
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<div class="modal"><div class="modal-header"><h3 class="modal-title">' + (opts.title || '') + '</h3><button class="modal-close" onclick="Modal.close()">&times;</button></div><div class="modal-body">' + (opts.content || '') + '</div>' + (opts.footer ? '<div class="modal-footer">' + opts.footer + '</div>' : '') + '</div>';
    overlay.classList.add('open');
    if (opts.onOpen) opts.onOpen();
  },

  close() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  setContent(html) {
    const body = document.querySelector('.modal .modal-body');
    if (body) body.innerHTML = html;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
