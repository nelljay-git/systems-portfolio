const EmployeesModule = {
  searchQuery: '',
  roleFilter: 'All',

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-primary" onclick="EmployeesModule.showAddModal()">+ Add Employee</button>';

    container.innerHTML = `
      <div class="card">
        <div class="filter-bar">
          <div class="search-bar"><span><i class="fas fa-search"></i></span><input type="text" placeholder="Search employees..." id="emp-search" oninput="EmployeesModule.onSearch(this.value)"></div>
          <select onchange="EmployeesModule.onRoleFilter(this.value)">
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
            <option value="Barista">Barista</option>
          </select>
        </div>
        <div class="table-container">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Schedule</th><th>Status</th><th style="width:160px">Actions</th></tr></thead>
            <tbody id="employees-table-body"></tbody>
          </table>
        </div>
      </div>
      <div class="card" style="margin-top:20px">
        <div class="card-header"><h3 class="card-title">Attendance Overview</h3></div>
        <div id="attendance-content">
          <div class="stats-grid" style="margin-bottom:0">
            <div class="stat-card"><div class="stat-icon success"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-label">Present Today</div><div class="stat-value" id="attendance-present">5</div></div></div>
            <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-label">On Leave</div><div class="stat-value" id="attendance-leave">1</div></div></div>
            <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><div class="stat-label">Absent</div><div class="stat-value" id="attendance-absent">1</div></div></div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="App.showToast('Attendance refreshed','info')"><i class="fas fa-sync"></i> Refresh Attendance</button>
        </div>
      </div>
    `;
    this.renderTable();
  },

  getFilteredData() {
    let employees = [...App.getData('employees')];
    if (this.roleFilter !== 'All') employees = employees.filter(e => e.role === this.roleFilter);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      employees = employees.filter(e => e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q));
    }
    return employees;
  },

  renderTable() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;
    const employees = this.getFilteredData();
    if (employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon"><i class="fas fa-user-tie"></i></div><h3>No employees found</h3></div></td></tr>';
      return;
    }
    const roleColors = { Admin: 'badge-danger', Manager: 'badge-warning', Cashier: 'badge-info', Barista: 'badge-success' };
    tbody.innerHTML = employees.map(e => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td><span class="badge ${roleColors[e.role] || 'badge-secondary'}">${e.role}</span></td>
        <td>${e.email}</td>
        <td>${e.phone}</td>
        <td>${e.schedule}</td>
        <td><span class="badge ${e.status === 'Active' ? 'badge-success' : 'badge-secondary'}">${e.status}</span></td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-secondary" onclick="EmployeesModule.showEditModal(${e.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="EmployeesModule.deleteEmployee(${e.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  onSearch(value) { this.searchQuery = value; this.renderTable(); },
  onRoleFilter(value) { this.roleFilter = value; this.renderTable(); },

  showAddModal() {
    Modal.show({
      title: 'Add Employee',
      content: this.getFormHtml({}),
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="EmployeesModule.saveEmployee()">Save Employee</button>'
    });
  },

  showEditModal(id) {
    const e = App.getData('employees').find(e => e.id === id);
    if (!e) return;
    Modal.show({
      title: 'Edit Employee',
      content: this.getFormHtml(e),
      footer: '<button class="btn btn-secondary" onclick="Modal.close()">Cancel</button><button class="btn btn-primary" onclick="EmployeesModule.saveEmployee(' + id + ')">Update Employee</button>'
    });
  },

  getFormHtml(emp) {
    const e = emp || {};
    const roles = ['Admin', 'Manager', 'Cashier', 'Barista'];
    return `<div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="emp-name" value="${e.name || ''}"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Role</label><select class="form-select" id="emp-role">${roles.map(r => `<option value="${r}" ${e.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="emp-status"><option value="Active" ${e.status === 'Active' ? 'selected' : ''}>Active</option><option value="Inactive" ${e.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></div></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="emp-email" value="${e.email || ''}"></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="emp-phone" value="${e.phone || ''}"></div></div>
      <div class="form-group"><label class="form-label">Schedule</label><input class="form-input" id="emp-schedule" value="${e.schedule || ''}"></div>`;
  },

  saveEmployee(editId) {
    const name = document.getElementById('emp-name')?.value.trim();
    if (!name) { App.showToast('Name is required', 'error'); return; }
    const role = document.getElementById('emp-role')?.value;
    const status = document.getElementById('emp-status')?.value;
    const email = document.getElementById('emp-email')?.value || '';
    const phone = document.getElementById('emp-phone')?.value || '';
    const schedule = document.getElementById('emp-schedule')?.value || '';

    if (editId) {
      const e = App.getData('employees').find(e => e.id === editId);
      if (e) { Object.assign(e, { name, role, email, phone, schedule, status }); App.showToast('Employee updated', 'success'); }
    } else {
      const employees = App.getData('employees');
      employees.push({ id: Math.max(...employees.map(e => e.id), 0) + 1, name, role, email, phone, schedule, status, avatar: '' });
      App.showToast('Employee added', 'success');
    }
    Modal.close();
    this.renderTable();
  },

  deleteEmployee(id) {
    App.confirm('Delete this employee?', () => {
      const employees = App.getData('employees');
      const idx = employees.findIndex(e => e.id === id);
      if (idx !== -1) { employees.splice(idx, 1); App.showToast('Employee deleted', 'success'); this.renderTable(); }
    });
  },
};
