const DashboardModule = {
  charts: {},

  render() {
    const container = document.getElementById('page-content');
    const products = App.getData('products');
    const inventory = App.getData('inventory');
    const customers = App.getData('customers');
    const orders = App.getData('orders');

    const totalSales = orders.filter(o => o.status === 'Completed').reduce((s, o) => s + o.total, 0);
    const todayOrders = orders.filter(o => o.date && o.date.startsWith('2024-12-21')).length;
    const activeProducts = products.filter(p => p.status === 'Active').length;
    const lowStock = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length;

    const html = `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-icon primary">₱</div><div class="stat-info"><div class="stat-label">Total Sales</div><div class="stat-value">${App.formatCurrency(totalSales)}</div><div class="stat-change up"><i class="fas fa-arrow-up"></i> +12.5%</div></div></div>
        <div class="stat-card"><div class="stat-icon success"><i class="fas fa-clipboard-list"></i></div><div class="stat-info"><div class="stat-label">Today's Orders</div><div class="stat-value">${todayOrders}</div><div class="stat-change up"><i class="fas fa-arrow-up"></i> +8.3%</div></div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-mug-hot"></i></div><div class="stat-info"><div class="stat-label">Active Products</div><div class="stat-value">${activeProducts}</div><div class="stat-change up"><i class="fas fa-arrow-up"></i> +3</div></div></div>
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-exclamation-triangle"></i></div><div class="stat-info"><div class="stat-label">Low Stock Items</div><div class="stat-value">${lowStock}</div><div class="stat-change down"><i class="fas fa-arrow-down"></i> Needs attention</div></div></div>
        <div class="stat-card"><div class="stat-icon primary"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-label">Total Customers</div><div class="stat-value">${customers.length}</div><div class="stat-change up"><i class="fas fa-arrow-up"></i> +5</div></div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-user-tie"></i></div><div class="stat-info"><div class="stat-label">Employees</div><div class="stat-value">${App.getData('employees').filter(e => e.status === 'Active').length}</div><div class="stat-change up"><i class="fas fa-arrow-up"></i> Fully staffed</div></div></div>
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <div class="card"><div class="card-header"><h3 class="card-title">Weekly Sales</h3></div><div class="chart-container"><canvas id="weeklySalesChart"></canvas></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">Monthly Revenue</h3></div><div class="chart-container"><canvas id="monthlyRevenueChart"></canvas></div></div>
      </div>

      <div class="grid-2" style="margin-bottom:24px">
        <div class="card"><div class="card-header"><h3 class="card-title">Top Products</h3></div><div class="chart-container-sm"><canvas id="topProductsChart"></canvas></div></div>
        <div class="card"><div class="card-header"><h3 class="card-title">Inventory Status</h3></div><div class="chart-container-sm"><canvas id="inventoryChart"></canvas></div></div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Recent Activities</h3></div>
          <div class="activity-list">
            ${this.getRecentActivities(orders)}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Quick Actions</h3></div>
          <div class="quick-actions">
            <button class="quick-action-btn" onclick="App.navigate('products')"><div class="icon" style="background:rgba(196,122,60,0.15);color:var(--primary-light)">+</div><div class="info"><h4>Add Product</h4><p>Create a new menu item</p></div></button>
            <button class="quick-action-btn" onclick="App.navigate('pos')"><div class="icon" style="background:rgba(74,222,128,0.15);color:var(--success)"><i class="fas fa-shopping-cart"></i></div><div class="info"><h4>Create Order</h4><p>Start a new sale</p></div></button>
            <button class="quick-action-btn" onclick="App.navigate('customers')"><div class="icon" style="background:rgba(96,165,250,0.15);color:var(--info)">+</div><div class="info"><h4>Add Customer</h4><p>Register a new customer</p></div></button>
            <button class="quick-action-btn" onclick="App.navigate('reports')"><div class="icon" style="background:rgba(251,191,36,0.15);color:var(--warning)"><i class="fas fa-chart-bar"></i></div><div class="info"><h4>Generate Report</h4><p>View business analytics</p></div></button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    this.initCharts();
  },

  getRecentActivities(orders) {
    const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    return recent.map(o => {
      const dotClass = o.status === 'Completed' ? 'order' : o.status === 'Cancelled' ? 'inventory' : 'product';
      return `<div class="activity-item"><span class="activity-dot ${dotClass}"></span><div class="activity-content"><div class="text"><strong>${o.customer}</strong> - ${o.items.map(i => i.product).join(', ')}</div><div class="time">${o.status} &middot; ${o.date}</div></div></div>`;
    }).join('');
  },

  initCharts() {
    this.charts = {};
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#c4b5a5', font: { size: 11 } } } },
      scales: { x: { ticks: { color: '#8a7a6a' }, grid: { color: '#3d2e1e' } }, y: { ticks: { color: '#8a7a6a' }, grid: { color: '#3d2e1e' } } }
    };

    const ctx1 = document.getElementById('weeklySalesChart');
    if (ctx1) {
      this.charts.weeklySales = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Sales (₱)',
            data: [420, 580, 490, 720, 890, 1100, 950],
            backgroundColor: 'rgba(196, 122, 60, 0.6)',
            borderColor: '#c47a3c',
            borderWidth: 2,
            borderRadius: 6,
          }]
        },
        options: commonOptions
      });
    }

    const ctx2 = document.getElementById('monthlyRevenueChart');
    if (ctx2) {
      this.charts.monthlyRevenue = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Revenue (₱)',
            data: [8500, 9200, 10100, 11800, 13500, 15200],
            borderColor: '#c47a3c',
            backgroundColor: 'rgba(196, 122, 60, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#c47a3c',
          }]
        },
        options: commonOptions
      });
    }

    const ctx3 = document.getElementById('topProductsChart');
    if (ctx3) {
      this.charts.topProducts = new Chart(ctx3, {
        type: 'doughnut',
        data: {
          labels: ['Classic Espresso', 'Caramel Macchiato', 'Iced Americano', 'Matcha Latte', 'Others'],
          datasets: [{
            data: [35, 25, 20, 12, 8],
            backgroundColor: ['#c47a3c', '#d4945a', '#a05f2c', '#e8c9a0', '#3d2e1e'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#c4b5a5', font: { size: 11 } } } }
        }
      });
    }

    const ctx4 = document.getElementById('inventoryChart');
    if (ctx4) {
      const inv = App.getData('inventory');
      const inStock = inv.filter(i => i.status === 'In Stock').length;
      const lowStock = inv.filter(i => i.status === 'Low Stock').length;
      const outStock = inv.filter(i => i.status === 'Out of Stock').length;
      this.charts.inventory = new Chart(ctx4, {
        type: 'doughnut',
        data: {
          labels: ['In Stock', 'Low Stock', 'Out of Stock'],
          datasets: [{
            data: [inStock, lowStock, outStock],
            backgroundColor: ['#4ade80', '#fbbf24', '#f87171'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#c4b5a5', font: { size: 11 } } } }
        }
      });
    }
  }
};
