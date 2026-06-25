const SettingsModule = {
  getPrefs() {
    const stored = localStorage.getItem('coffee-notif-prefs');
    return stored ? JSON.parse(stored) : { emailAlerts: true, inventoryAlerts: true, dailyReports: false };
  },

  savePrefs(prefs) {
    localStorage.setItem('coffee-notif-prefs', JSON.stringify(prefs));
  },

  render() {
    const container = document.getElementById('page-content');
    const actions = document.getElementById('page-actions');
    actions.innerHTML = '<button class="btn btn-primary" onclick="SettingsModule.saveSettings()">Save Settings</button>';

    const store = App.getData('store') || {};
    const prefs = this.getPrefs();

    container.innerHTML = `
      <div class="card" style="margin-bottom:20px">
        <div class="settings-section">
          <h3>Store Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Store Name</label>
              <input class="form-input" id="setting-store-name" value="Brew & Co. Coffee Shop">
            </div>
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input class="form-input" id="setting-contact" value="+1 (555) 123-4567">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea class="form-textarea" id="setting-address" rows="2">123 Coffee Street, Bean Town, CO 80201</textarea>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="settings-section">
          <h3>Appearance</h3>
          <div class="theme-switch" onclick="SettingsModule.toggleTheme()">
            <div style="font-size:24px">${App.state.theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>'}</div>
            <div class="info">
              <h4>Dark Mode</h4>
              <p>Switch between light and dark themes</p>
            </div>
            <div class="toggle-switch theme-toggle-switch ${App.state.theme === 'light' ? 'active' : ''}" onclick="event.stopPropagation();SettingsModule.toggleTheme()">
              <div class="knob"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="settings-section">
          <h3>Notifications</h3>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="theme-switch" onclick="SettingsModule.togglePref('emailAlerts')">
              <div style="font-size:20px"><i class="fas fa-envelope"></i></div>
              <div class="info">
                <h4>Email Alerts</h4>
                <p>Receive email notifications for new orders</p>
              </div>
              <div class="toggle-switch ${prefs.emailAlerts ? 'active' : ''}"><div class="knob"></div></div>
            </div>
            <div class="theme-switch" onclick="SettingsModule.togglePref('inventoryAlerts')">
              <div style="font-size:20px"><i class="fas fa-boxes"></i></div>
              <div class="info">
                <h4>Inventory Alerts</h4>
                <p>Get notified when stock is running low</p>
              </div>
              <div class="toggle-switch ${prefs.inventoryAlerts ? 'active' : ''}"><div class="knob"></div></div>
            </div>
            <div class="theme-switch" onclick="SettingsModule.togglePref('dailyReports')">
              <div style="font-size:20px"><i class="fas fa-chart-line"></i></div>
              <div class="info">
                <h4>Daily Reports</h4>
                <p>Receive end-of-day sales summary</p>
              </div>
              <div class="toggle-switch ${prefs.dailyReports ? 'active' : ''}"><div class="knob"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  toggleTheme() {
    App.toggleTheme();
    const icon = document.querySelector('.theme-switch div:first-child');
    if (icon) icon.innerHTML = App.state.theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
  },

  togglePref(key) {
    const prefs = this.getPrefs();
    prefs[key] = !prefs[key];
    this.savePrefs(prefs);
    const toggle = event.currentTarget.querySelector('.toggle-switch');
    if (toggle) toggle.classList.toggle('active', prefs[key]);
    const label = { emailAlerts: 'Email alerts', inventoryAlerts: 'Inventory alerts', dailyReports: 'Daily reports' }[key];
    App.showToast(label + ' ' + (prefs[key] ? 'enabled' : 'disabled'), 'info');
  },

  isEnabled(key) {
    return this.getPrefs()[key];
  },

  saveSettings() {
    App.showToast('Settings saved successfully', 'success');
  },
};
