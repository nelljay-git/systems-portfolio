const ReportsModule = {
  charts: {},

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-secondary" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button><button class="btn btn-primary" onclick="App.showToast(\'PDF download ready (demo)\', \'info\')"><i class="fas fa-file-pdf"></i> Export PDF</button>';

    const orders = App.getData('orders').filter(o => o.status === 'Completed');
    const products = App.getData('products');
    const inventory = App.getData('inventory');

    const dailySales = orders.filter(o => o.date && o.date.startsWith('2024-12-21')).reduce((s, o) => s + o.total, 0);
    const weeklySales = orders.reduce((s, o) => s + o.total, 0);
    const monthlySales = weeklySales;

    const categorySales = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const p = products.find(pr => pr.name === item.product);
        const cat = p ? p.category : 'Other';
        categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.qty);
      });
    });

    container.innerHTML = `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon success"><i class="fas fa-chart-line"></i></div><div class="stat-info"><div class="stat-label">Daily Sales</div><div class="stat-value">${App.formatCurrency(dailySales)}</div></div></div>
        <div class="stat-card"><div class="stat-icon primary"><i class="fas fa-chart-line"></i></div><div class="stat-info"><div class="stat-label">Weekly Sales</div><div class="stat-value">${App.formatCurrency(weeklySales)}</div></div></div>
        <div class="stat-card"><div class="stat-icon info"><i class="fas fa-chart-line"></i></div><div class="stat-info"><div class="stat-label">Monthly Sales</div><div class="stat-value">${App.formatCurrency(monthlySales)}</div></div></div>
        <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-chart-pie"></i></div><div class="stat-info"><div class="stat-label">Total Orders</div><div class="stat-value">${orders.length}</div></div></div>
      </div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Revenue Trend</h3></div>
          <div class="chart-container"><canvas id="revenueTrendChart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Sales by Category</h3></div>
          <div class="chart-container"><canvas id="categoryPieChart"></canvas></div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Top Selling Products</h3></div>
          <div id="top-products-list">
            ${this.getTopProductsHtml()}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3 class="card-title">Best Selling Categories</h3></div>
          <div id="best-categories-list">
            ${Object.entries(categorySales).sort((a, b) => b[1] - a[1]).map(([cat, total]) =>
              `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color)">
                <span><span class="badge badge-info">${cat}</span></span>
                <span style="font-weight:600">${App.formatCurrency(total)}</span>
              </div>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">Inventory Report</h3></div>
        <div class="table-container">
          <table>
            <thead><tr><th>Item</th><th>Quantity</th><th>Status</th><th>Value</th></tr></thead>
            <tbody>
              ${inventory.map(i => `<tr><td>${i.name}</td><td>${i.quantity} ${i.unit}</td><td><span class="badge ${i.status === 'In Stock' ? 'badge-success' : i.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}">${i.status}</span></td><td>${App.formatCurrency(i.quantity * i.cost)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    this.initCharts(categorySales, orders);
  },

  getTopProductsHtml() {
    const productSales = {};
    App.getData('orders').filter(o => o.status === 'Completed').forEach(o => {
      o.items.forEach(item => {
        productSales[item.product] = (productSales[item.product] || 0) + item.qty;
      });
    });
    const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return sorted.map(([name, qty], i) =>
      `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-color)">
        <span><strong>${i + 1}.</strong> ${name}</span>
        <span class="badge badge-primary" style="background:rgba(196,122,60,0.15);color:var(--primary-light)">${qty} sold</span>
      </div>`
    ).join('');
  },

  initCharts(categorySales) {
    const commonOptions = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#c4b5a5', font: { size: 11 } } } },
      scales: { x: { ticks: { color: '#8a7a6a' }, grid: { color: '#3d2e1e' } }, y: { ticks: { color: '#8a7a6a' }, grid: { color: '#3d2e1e' } } }
    };

    const ctx1 = document.getElementById('revenueTrendChart');
    if (ctx1) {
      this.charts.revenueTrend = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Revenue',
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

    const ctx2 = document.getElementById('categoryPieChart');
    if (ctx2) {
      const labels = Object.keys(categorySales);
      const data = Object.values(categorySales);
      const colors = ['#c47a3c', '#d4945a', '#a05f2c', '#e8c9a0', '#3d2e1e'];
      this.charts.categoryPie = new Chart(ctx2, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#c4b5a5', font: { size: 11 } } } } }
      });
    }
  },
};
