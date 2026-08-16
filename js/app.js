let loginScreen = null;
let dashboardContent = null;

/* 
  R4Realty Real Estate Portal - Global JavaScript Logic
  Handles: Navigation, Calculator Widget, Lead Capture, Local Storage Lead Dashboard, CSV Exports
*/

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initCalculator();
  initFormHandler();
  initLeadDashboard();
  initScrollAnimations();
  initConsultationModal();
  initPrivacyModal();
  initAboutModal();
  initFaqAccordion();
  initProximityMap();
  initHomepageFeatures();
  initCatalogSearch();
  initProjectSpecificFeatures();
  initChatbot();
});

/* ==========================================================================
   1. Navigation & Mobile Menu
   ========================================================================== */
function initNavigation() {
  const header = document.querySelector('header');
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = hamburger.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) {
          icon.className = 'fas fa-times';
        } else {
          icon.className = 'fas fa-bars';
        }
      }
    });

    // Close mobile menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = hamburger.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      });
    });
  }
}

/* ==========================================================================
   2. Interactive Investment Calculator
   ========================================================================== */
function initCalculator() {
  const sizeSlider = document.getElementById('calc-size-slider');
  const rateSelect = document.getElementById('calc-type-select');
  
  if (!sizeSlider) return; // Only run if slider exists (e.g., on project pages)

  const sizeVal = document.getElementById('calc-size-val');
  const totalCostVal = document.getElementById('calc-total-cost');
  const returnRateVal = document.getElementById('calc-return-rate');
  const monthlyReturnVal = document.getElementById('calc-monthly-return');
  const yearlyReturnVal = document.getElementById('calc-yearly-return');

  function calculate() {
    const size = parseInt(sizeSlider.value);
    sizeVal.textContent = size.toLocaleString();

    // Rates per sq.ft based on type
    // Food Court: 35,000 | Office Space: 7,500 | Retail: 25,000
    const spaceType = rateSelect.value;
    let rate = 7500;
    let assuredReturnPercent = 0.12; // 12% Assured return

    if (spaceType === 'foodcourt') {
      rate = 34000;
      assuredReturnPercent = 0.12; // 12%
    } else if (spaceType === 'office') {
      rate = 7500;
      assuredReturnPercent = 0.10; // 10%
    } else if (spaceType === 'retail') {
      rate = 25000;
      assuredReturnPercent = 0.11; // 11%
    }

    const totalInvestment = size * rate;
    const yearlyReturn = totalInvestment * assuredReturnPercent;
    const monthlyReturn = yearlyReturn / 12;

    totalCostVal.textContent = `₹ ${(totalInvestment / 100000).toFixed(2)} Lakh`;
    returnRateVal.textContent = `${(assuredReturnPercent * 100).toFixed(0)}% Assured Return`;
    monthlyReturnVal.textContent = `₹ ${Math.round(monthlyReturn).toLocaleString('en-IN')}`;
    yearlyReturnVal.textContent = `₹ ${Math.round(yearlyReturn).toLocaleString('en-IN')}`;
  }

  sizeSlider.addEventListener('input', calculate);
  rateSelect.addEventListener('change', calculate);
  
  // Initial calculation
  calculate();
}

/* ==========================================================================
   3. Lead Forms Submission and Local Storage Storage
   ========================================================================== */
function initFormHandler() {
  const leadForms = document.querySelectorAll('.lead-capture-form');

  leadForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]').value.trim();
      const phone = form.querySelector('[name="phone"]').value.trim();
      const email = form.querySelector('[name="email"]') ? form.querySelector('[name="email"]').value.trim() : 'N/A';
      const project = form.querySelector('[name="project"]') ? form.querySelector('[name="project"]').value : 'General Inquiry';
      
      let message = form.querySelector('[name="message"]') ? form.querySelector('[name="message"]').value.trim() : '';
      const extraMsgEl = form.querySelector('[name="message_extra"]');
      if (extraMsgEl && extraMsgEl.value.trim()) {
        message = message ? `${message} | Details: ${extraMsgEl.value.trim()}` : extraMsgEl.value.trim();
      }
      if (!message) {
        message = 'Interested in this property.';
      }
      
      // Simple validation
      if (!name || !phone) {
        showToast('Error', 'Please enter your name and phone number.', 'error');
        return;
      }

      if (phone.length < 10) {
        showToast('Error', 'Please enter a valid 10-digit phone number.', 'error');
        return;
      }

      const lead = {
        id: 'lead_' + Date.now(),
        name,
        phone,
        email,
        project,
        message,
        timestamp: new Date().toLocaleString(),
        status: 'New'
      };

      // Save lead to Local Storage
      saveLead(lead);

      // Reset form
      form.reset();

      // Show beautiful success notification
      showToast('Inquiry Submitted!', 'Our certified property expert will contact you within 15 minutes.', 'success');
      
      // Refresh admin dashboard table if it is open
      refreshLeadsTable();
    });
  });
}

function saveLead(lead) {
  // 1. Try saving to MySQL database backend
  fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead)
  })
  .then(res => {
    if (!res.ok) console.warn('Backend API rejected lead insertion, saving to localStorage only.');
  })
  .catch(err => {
    console.warn('Backend offline, lead saved locally. Error:', err.message);
  });

  // 2. Always save to Local Storage as a fallback/hybrid backup
  let leads = [];
  try {
    const existingLeads = localStorage.getItem('r4realty_leads');
    if (existingLeads) {
      leads = JSON.parse(existingLeads);
    }
  } catch (e) {
    console.error('Error parsing leads from localStorage', e);
  }
  
  leads.unshift(lead); // Put new lead at the top
  localStorage.setItem('r4realty_leads', JSON.stringify(leads));
}

/* ==========================================================================
   4. Visual Toast Notifications
   ========================================================================== */
function showToast(title, message, type = 'success') {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  
  const iconClass = type === 'success' ? 'fas fa-check-circle success' : 'fas fa-exclamation-circle error';
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="${iconClass}"></i>
    </div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove toast after 4.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4500);
}

/* ==========================================================================
   5. Lead Management Dashboard (Local & Free CRM)
   ========================================================================== */
function initLeadDashboard() {
  const adminBtn = document.getElementById('admin-dashboard-trigger');
  let activeAdminPin = '';
  
  if (!adminBtn) return;

  // Create modal markup in DOM
  const modalHTML = `
    <div class="modal-backdrop" id="admin-leads-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-chart-line"></i> R4Realty Lead Manager (Local CRM)</h3>
          <button class="close-modal-btn" id="close-leads-modal">&times;</button>
        </div>
        <div class="modal-body">
          <div id="admin-login-screen">
            <div class="admin-auth-container">
              <i class="fas fa-lock"></i>
              <h4>Security Check</h4>
              <p>Please enter the administrator access pin to view captured leads.</p>
              <div class="form-group" style="width: 100%;">
                <input type="password" id="admin-pass-input" class="form-input" placeholder="Enter Access Pin (default: admin123)" />
              </div>
              <button class="cta-button" id="admin-login-btn">Unlock Dashboard</button>
            </div>
          </div>
          <div id="admin-dashboard-content" style="display: none;">
            <div class="modal-actions">
              <div class="dashboard-stats">
                <div class="dashboard-stat-card">
                  <span>Total Leads</span>
                  <h4 id="stat-total-leads">0</h4>
                </div>
                <div class="dashboard-stat-card">
                  <span>Export Format</span>
                  <h4>CSV / Excel</h4>
                </div>
              </div>
              <div style="display: flex; gap: 1rem;">
                <button class="cta-button secondary" id="clear-leads-btn"><i class="fas fa-trash"></i> Reset Database</button>
                <button class="cta-button" id="export-leads-btn"><i class="fas fa-file-csv"></i> Export to Excel</button>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="leads-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Lead Name</th>
                    <th>Phone Number</th>
                    <th>Email</th>
                    <th>Project</th>
                    <th>Inquiry Details</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="leads-table-body">
                  <!-- Leads will be injected here -->
                </tbody>
              </table>
            </div>
            <div id="no-leads-message" class="empty-leads-state" style="display: none;">
              <i class="far fa-folder-open"></i>
              <p>No organic leads captured yet. Start sharing your project listings to get views!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('admin-leads-modal');
  const closeBtn = document.getElementById('close-leads-modal');
  loginScreen = document.getElementById('admin-login-screen');
  dashboardContent = document.getElementById('admin-dashboard-content');
  const loginBtn = document.getElementById('admin-login-btn');
  const passInput = document.getElementById('admin-pass-input');
  const exportBtn = document.getElementById('export-leads-btn');
  const clearBtn = document.getElementById('clear-leads-btn');

  // Trigger modal display
  adminBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
    // Always prompt for login when opening
    loginScreen.style.display = 'block';
    dashboardContent.style.display = 'none';
    passInput.value = '';
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Handle Close clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Dashboard Login Check
  loginBtn.addEventListener('click', () => {
    const pass = passInput.value;
    
    // Try fetching with the typed PIN to let the server verify it
    fetch('/api/leads', {
      headers: { 'X-Admin-Pin': pass }
    })
    .then(res => {
      if (res.status === 401) {
        showToast('Access Denied', 'Invalid administrator security pin.', 'error');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Server error');
      return res.json();
    })
    .then(data => {
      // Success! Save PIN for subsequent actions
      activeAdminPin = pass;
      loginScreen.style.display = 'none';
      dashboardContent.style.display = 'block';
      // Cache leads and render
      localStorage.setItem('r4realty_leads', JSON.stringify(data));
      refreshLeadsTable();
    })
    .catch(err => {
      if (err.message === 'Unauthorized') return;

      // Server unreachable or other error — do NOT accept a local fallback PIN
      console.warn('Authentication server unreachable. Admin actions are disabled until the server is reachable.', err.message);
      showToast('Server Unavailable', 'Authentication server unreachable. Admin actions are temporarily disabled.', 'error');
    });
  });

  passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  // Export Leads to CSV
  exportBtn.addEventListener('click', () => {
    // Try server-side export first (preferred)
    if (activeAdminPin) {
      const url = '/api/leads/export';
      fetch(url, { headers: { 'X-Admin-Pin': activeAdminPin } })
        .then(res => {
          if (!res.ok) throw new Error('Export failed');
          return res.blob();
        })
        .then(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `R4Realty_Leads_${new Date().toISOString().slice(0,10)}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast('Export Successful', 'Leads downloaded successfully as CSV.', 'success');
        })
        .catch(err => {
          console.warn('Server export failed, falling back to local CSV export.', err.message);
          exportLeadsToCSV();
        });
    } else {
      // If not authenticated, fall back to client-side export from localStorage
      exportLeadsToCSV();
    }
  });

  // Clear Database
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all captured leads from both MySQL and Local Storage? This action cannot be undone.')) {
      // 1. Try to clear MySQL leads
      fetch('/api/leads', { 
        method: 'DELETE',
        headers: { 'X-Admin-Pin': activeAdminPin }
      })
      .then(res => {
        if (!res.ok) console.warn('MySQL clear failed.');
      })
      .catch(err => {
        console.warn('Backend offline, clearing local cache only. Error:', err.message);
      });

      // 2. Clear Local Storage leads
      localStorage.removeItem('r4realty_leads');
      refreshLeadsTable();
      showToast('Database Reset', 'All lead history has been cleared.', 'success');
    }
  });
}

function refreshLeadsTable() {
  const tableBody = document.getElementById('leads-table-body');
  const noLeadsMsg = document.getElementById('no-leads-message');
  const totalCounter = document.getElementById('stat-total-leads');
  
  if (!tableBody) return;

  function renderLeads(leads) {
    totalCounter.textContent = leads.length;
    tableBody.innerHTML = '';

    if (leads.length === 0) {
      noLeadsMsg.style.display = 'block';
      tableBody.closest('table').style.display = 'none';
    } else {
      noLeadsMsg.style.display = 'none';
      tableBody.closest('table').style.display = 'table';

      leads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${lead.timestamp}</strong></td>
          <td>${escapeHTML(lead.name)}</td>
          <td><a href="tel:${escapeHTML(lead.phone)}" style="color: var(--color-gold); text-decoration: underline;"><i class="fas fa-phone-alt" style="font-size:0.75rem;"></i> ${escapeHTML(lead.phone)}</a></td>
          <td>${escapeHTML(lead.email)}</td>
          <td><span class="badge-lead-status">${escapeHTML(lead.project)}</span></td>
          <td><small>${escapeHTML(lead.message)}</small></td>
          <td><span class="badge-lead-status" style="background: rgba(16, 185, 129, 0.1); color: var(--color-success); border-color: rgba(16, 185, 129, 0.2);">${lead.status || 'New'}</span></td>
        `;
        tableBody.appendChild(row);
      });
    }
  }

  // 1. Try to fetch leads from MySQL/JSON server API
  fetch('/api/leads', {
    headers: { 'X-Admin-Pin': activeAdminPin }
  })
  .then(res => {
    if (res.status === 401) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('API server error');
    return res.json();
  })
  .then(data => {
    console.log('Fetched leads from server successfully.');
    // Cache to localStorage to keep backups in sync
    localStorage.setItem('r4realty_leads', JSON.stringify(data));
    renderLeads(data);
  })
  .catch(err => {
    if (err.message === 'Unauthorized') {
      showToast('Session Expired', 'Please log in again.', 'error');
      loginScreen.style.display = 'block';
      dashboardContent.style.display = 'none';
      return;
    }
    console.warn('Backend server offline. Fetching from Local Storage cache instead.', err.message);
    // Fallback to local storage
    let localLeads = [];
    try {
      const stored = localStorage.getItem('r4realty_leads');
      if (stored) {
        localLeads = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error fetching leads from local storage', e);
    }
    renderLeads(localLeads);
  });
}

function exportLeadsToCSV() {
  let leads = [];
  try {
    const stored = localStorage.getItem('r4realty_leads');
    if (stored) {
      leads = JSON.parse(stored);
    }
  } catch (e) {
    console.error(e);
  }

  if (leads.length === 0) {
    showToast('Export Failed', 'There are no leads in the database to export.', 'error');
    return;
  }

  // Create CSV header
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date & Time,Name,Phone,Email,Project,Message,Status\r\n";

  // Add data rows
  leads.forEach(lead => {
    let row = [
      `"${lead.timestamp}"`,
      `"${lead.name.replace(/"/g, '""')}"`,
      `"${lead.phone}"`,
      `"${lead.email.replace(/"/g, '""')}"`,
      `"${lead.project.replace(/"/g, '""')}"`,
      `"${lead.message.replace(/"/g, '""')}"`,
      `"${lead.status || 'New'}"`
    ];
    csvContent += row.join(",") + "\r\n";
  });

  // Trigger browser download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `R4Realty_Leads_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link); // Required for FF
  link.click();
  document.body.removeChild(link);

  showToast('Export Successful', 'Leads downloaded successfully as CSV.', 'success');
}

// Simple HTML escaping helper to prevent XSS in leads viewer
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/* ==========================================================================
   6. Scroll-Based Fade-In Animations (Micro-interactions)
   ========================================================================== */
function initScrollAnimations() {
  const animElements = document.querySelectorAll('.feature-card, .project-card, .glass-card');
  
  if (animElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
}

/* ==========================================================================
   7. Free Property Consultation Booking Modal
   ========================================================================== */
function initConsultationModal() {
  const modalHTML = `
    <div class="modal-backdrop" id="consultation-modal">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3><i class="far fa-calendar-check"></i> Book Free Consultation</h3>
          <button class="close-modal-btn" id="close-consult-modal">&times;</button>
        </div>
        <div class="modal-body">
          <form class="spec-sheet lead-capture-form" id="consultationLeadForm" style="border: none; padding: 0;">
            <input type="hidden" name="project" value="Free Consultation Booking">
            
            <div class="field">
              <label for="cname">Your Name</label>
              <input type="text" id="cname" name="name" placeholder="e.g. Amit Verma" required>
            </div>
            
            <div class="field">
              <label for="cphone">Phone Number</label>
              <input type="tel" id="cphone" name="phone" placeholder="10-digit mobile number" required>
            </div>
            
            <div class="field">
              <label for="cemail">Email Address (Optional)</label>
              <input type="email" id="cemail" name="email" placeholder="e.g. amit@gmail.com">
            </div>
            
            <div class="field">
              <label for="ctype">Consultation Focus</label>
              <select id="ctype" name="message">
                <option value="Commercial Yield Investment">Commercial Yield Investment (8-11% Rents)</option>
                <option value="Residential Buying">Residential Buying (Sector 150/143 Noida)</option>
                <option value="Plot Selection & Registry">Plots Selection &amp; Legal Registry</option>
                <option value="General Property Advisory">General Real Estate Advisory</option>
              </select>
            </div>
            
            <div class="field-row">
              <div class="field">
                <label for="cmode">Preferred Contact Mode</label>
                <select id="cmode" name="message_mode">
                  <option value="WhatsApp Chat">WhatsApp Chat</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="In-Person Meeting">In-Person Meeting</option>
                </select>
              </div>
              <div class="field">
                <label for="ctime">Preferred Time Slot</label>
                <select id="ctime" name="message_time">
                  <option value="Morning (10 AM - 1 PM)">Morning (10 AM - 1 PM)</option>
                  <option value="Afternoon (1 PM - 5 PM)">Afternoon (1 PM - 5 PM)</option>
                  <option value="Evening (5 PM - 8 PM)">Evening (5 PM - 8 PM)</option>
                </select>
              </div>
            </div>

            <div class="submit-row" style="margin-top: 10px;">
              <button type="submit" class="cta-button" style="width: 100%; justify-content: center;">
                <i class="far fa-calendar-check"></i> Book Consultation Slot
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('consultation-modal');
  const closeBtn = document.getElementById('close-consult-modal');
  const consultBtns = document.querySelectorAll('.open-consultation-btn');
  const consultForm = document.getElementById('consultationLeadForm');

  // Trigger modal display
  consultBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Handle Close clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Handle submit specifically for WhatsApp details formatting
  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      const name = document.getElementById('cname').value.trim();
      const phone = document.getElementById('cphone').value.trim();
      const email = document.getElementById('cemail').value.trim();
      const focus = document.getElementById('ctype').value;
      const mode = document.getElementById('cmode').value;
      const time = document.getElementById('ctime').value;

      // Construct lead and save it to database
      const lead = {
        id: 'lead_' + Date.now(),
        name,
        phone,
        email: email || 'N/A',
        project: 'Consultation Booking',
        message: `Focus: ${focus} | Mode: ${mode} | Time: ${time}`,
        timestamp: new Date().toLocaleString(),
        status: 'New'
      };
      
      saveLead(lead);
      refreshLeadsTable();

      let text = `Hi Rajveer, I would like to book a Free Property Consultation.%0A%0A`;
      text += `*Consultation Booking:* R4Realty Consultation%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      text += `*Focus:* ${encodeURIComponent(focus)}%0A`;
      text += `*Preferred Mode:* ${encodeURIComponent(mode)}%0A`;
      text += `*Time Slot:* ${encodeURIComponent(time)}%0A`;
      text += `Please confirm my scheduling slot.`;

      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
        modal.classList.remove('active');
        consultForm.reset();
      }, 150);
    });
  }
}

/* ==========================================================================
   8. Privacy Policy Modal
   ========================================================================== */
function initPrivacyModal() {
  const modalHTML = `
    <div class="modal-backdrop" id="privacy-modal">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-user-shield"></i> Privacy Policy — R4Realty</h3>
          <button class="close-modal-btn" id="close-privacy-modal">&times;</button>
        </div>
        <div class="modal-body" style="font-family: var(--font-body); font-size: 13px; line-height: 1.6; color: var(--ink-soft);">
          <p style="margin-bottom: 12px;">At R4Realty, we value the confidentiality of our clients and site visitors. This Privacy Policy describes how we collect, store, and protect your persona[...]</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">1. Data Collection</h4>
          <p style="margin-bottom: 12px;">We only collect name, phone number, email address, and specific property requirements when you voluntarily submit them through our inquiry and consultati[...]</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">2. Data Storage &amp; Safety</h4>
          <p style="margin-bottom: 12px;">All submitted information is processed through server-side request verification and securely stored in our offline file database (leads_db.json) or local[...]</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">3. Third-Party Sharing</h4>
          <p style="margin-bottom: 12px;">R4Realty never sells, rents, or shares your personal contact credentials with third-party brokers or advertisers. We redirect form submissions to WhatsAp[...]</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">4. Your Rights</h4>
          <p style="margin-bottom: 12px;">You can request to view, edit, or permanently erase your lead entry logs from our local database at any time by calling or messaging us directly.</p>
          
          <p style="margin-top: 20px; font-size: 11.5px; color: var(--muted); font-family: var(--font-mono);">Last updated: August 2026 &bull; R4Realty Noida</p>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('privacy-modal');
  const closeBtn = document.getElementById('close-privacy-modal');
  const openBtns = document.querySelectorAll('.open-privacy-btn');

  // Trigger modal display
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Handle Close clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

/* ==========================================================================
   9. About Us Modal
   ========================================================================== */
function initAboutModal() {
  const modalHTML = `
    <div class="modal-backdrop" id="about-modal">
      <div class="modal-content" style="max-width: 820px;">
        <div class="modal-header">
          <div>
            <h3 style="margin: 0; font-size: 17px;"><i class="fas fa-building" style="color: var(--accent);"></i> About R4Realty</h3>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent); margin-top: 2px;">Redefining Real Estate Advisory Through Precision, Integrity, and Institutional Rigor</div>
          </div>
          <button class="close-modal-btn" id="close-about-modal">&times;</button>
        </div>
        <div class="modal-body" style="font-family: var(--font-body); font-size: 13px; line-height: 1.6; color: var(--ink-soft);">
          
          <p style="margin-bottom: 12px; font-size: 13.5px;"><strong>R4Realty</strong> is a forward-thinking property consultancy and strategic advisory firm headquartered in North India. Founded and spearheaded by <strong>Rajveer Singh</strong>, R4Realty bridges the gap between sophisticated real estate investors, luxury homebuyers, and Tier-1 institutional developers.</p>
          
          <p style="margin-bottom: 16px;">Built on a foundation of zero-brokerage transparency, data-backed portfolio curation, and uncompromising legal due diligence, we provide end-to-end consultancy for institutional-grade commercial spaces, low-density luxury residential developments, and high-yield strategic land acquisitions.</p>
          
          <h4 style="font-size: 14px; margin-top: 18px; margin-bottom: 10px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 0.05em;"><i class="fas fa-compass" style="color: var(--accent);"></i> Our Philosophy: Direct Institutional Access, Zero Friction</h4>
          
          <div class="philosophy-grid" style="margin: 12px 0 20px;">
            <div class="philosophy-card" style="padding: 14px 12px;">
              <div class="ph-icon" style="font-size: 18px; margin-bottom: 8px;"><i class="fas fa-hand-holding-usd"></i></div>
              <h4 style="font-size: 13px; margin-bottom: 6px;">Zero Brokerage for Buyers</h4>
              <p style="font-size: 12px;">We charge no brokerage or advisory commission to our investors and homebuyers. Our revenue models are aligned directly with master developer partnerships, ensuring clients retain 100% of their purchasing power.</p>
            </div>
            <div class="philosophy-card" style="padding: 14px 12px;">
              <div class="ph-icon" style="font-size: 18px; margin-bottom: 8px;"><i class="fas fa-file-contract"></i></div>
              <h4 style="font-size: 13px; margin-bottom: 6px;">Direct Inventory Allocation</h4>
              <p style="font-size: 12px;">Holding authorized representation agreements with leading builders—including Bhutani Infra, Sikka Group, and Ebrix Developers—we secure direct-from-developer pricing, exclusive pre-launch allocations, and preferential inventory before public listing.</p>
            </div>
            <div class="philosophy-card" style="padding: 14px 12px;">
              <div class="ph-icon" style="font-size: 18px; margin-bottom: 8px;"><i class="fas fa-shield-check"></i></div>
              <h4 style="font-size: 13px; margin-bottom: 6px;">100% Verified Due Diligence</h4>
              <p style="font-size: 12px;">Every asset in our portfolio undergoes exhaustive legal title checks, financial structure audits, and strict statutory compliance under UP RERA, Goa RERA, and local planning authorities.</p>
            </div>
          </div>

          <h4 style="font-size: 14px; margin-top: 20px; margin-bottom: 10px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 0.05em;"><i class="fas fa-layer-group" style="color: var(--accent);"></i> Our Strategic Investment Verticals</h4>
          
          <div class="verticals-grid" style="margin: 12px 0 20px;">
            <div class="vertical-card" style="padding: 16px 14px;">
              <div class="v-num">01 / COMMERCIAL</div>
              <h4 style="font-size: 14px; margin-bottom: 8px;">High-Yield Pre-Leased Commercial Assets</h4>
              <p class="v-desc" style="font-size: 12px; margin-bottom: 10px;">Commercial real estate remains the premier engine for passive wealth creation when supported by strong tenant profiles, long lock-in agreements, and robust catchment fundamentals.</p>
              <div class="vertical-subbox">
                <strong>Strategy &amp; Flagships:</strong>
                <ul>
                  <li>Gross rental yields up to 11% with structured lease escalations &amp; long lock-ins.</li>
                  <li><strong>GYGY Mentis (Sec 140A Noida Exp):</strong> High-density IT/retail corporate catchment.</li>
                  <li><strong>Sikka Mall of Expressway:</strong> Transit hub near Pari Chowk with pre-leased retail stability.</li>
                </ul>
              </div>
            </div>

            <div class="vertical-card" style="padding: 16px 14px;">
              <div class="v-num">02 / RESIDENTIAL</div>
              <h4 style="font-size: 14px; margin-bottom: 8px;">Low-Density Premium Residential Living</h4>
              <p class="v-desc" style="font-size: 12px; margin-bottom: 10px;">Urban living requires a balance between seamless business connectivity and personal sanctuary. We curate residential properties focused on biophilic design, privacy, and long-term asset value.</p>
              <div class="vertical-subbox">
                <strong>Focus Corridor — Sector-150 Noida:</strong>
                <ul>
                  <li>Recognized as the "Green Lung of Noida" with 80% green-cover mandate &amp; sports-centric master planning.</li>
                  <li>Direct links to Noida Expressway, Yamuna Expressway &amp; Jewar Airport.</li>
                  <li>Low-rise configurations, elevated privacy &amp; capital appreciation.</li>
                </ul>
              </div>
            </div>

            <div class="vertical-card" style="padding: 16px 14px;">
              <div class="v-num">03 / PLOTS &amp; LAND</div>
              <h4 style="font-size: 14px; margin-bottom: 8px;">Appreciating Strategic Land &amp; Township Plots</h4>
              <p class="v-desc" style="font-size: 12px; margin-bottom: 10px;">Land ownership offers unmatched long-term wealth compounding and total control over layout, architecture, and lifestyle along emerging infrastructure corridors.</p>
              <div class="vertical-subbox">
                <strong>Key Growth Corridors:</strong>
                <ul>
                  <li><strong>North Goa (Vedic City):</strong> Near MOPA Airport &amp; NH-66 corridor. Master-planned RERA wellness plots (Graama &amp; Soma) for custom villas &amp; holiday rentals.</li>
                  <li><strong>Greater Noida Freehold Corridors:</strong> RERA-approved parcels along Eastern Peripheral &amp; Yamuna Expressways.</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="framework-container" style="padding: 18px; margin: 16px 0;">
            <div class="framework-banner" style="font-size: 12px;">THE R4REALTY ADVISORY CYCLE</div>
            <div class="framework-cycle-grid">
              <div class="framework-col" style="padding: 12px;">
                <h5>1. Curation</h5>
                <ul>
                  <li>Macro Research</li>
                  <li>Yield Modeling</li>
                  <li>Developer Audit</li>
                </ul>
              </div>
              <div class="framework-col" style="padding: 12px;">
                <h5>2. Diligence</h5>
                <ul>
                  <li>Title Search</li>
                  <li>RERA Compliance</li>
                  <li>Rental Escalation</li>
                </ul>
              </div>
              <div class="framework-col" style="padding: 12px;">
                <h5>3. Execution</h5>
                <ul>
                  <li>Direct Allocation</li>
                  <li>Zero Brokerage</li>
                  <li>Post-Sales &amp; Leasing</li>
                </ul>
              </div>
            </div>
            
            <div class="framework-details-grid">
              <div class="framework-detail-item">
                <h6>Macroeconomic Micro-Targeting</h6>
                <p>We do not sell open catalogs. Every project is selected using traffic flow analytics, infrastructure pipelines (metro extensions, expressways, airports), and demographic absorption rates.</p>
              </div>
              <div class="framework-detail-item">
                <h6>Tenant &amp; Cash Flow Verification</h6>
                <p>For commercial assets, our financial modeling verifies tenant creditworthiness, weighted average unexpired lease terms (WAULT), and realistic net yield projections rather than inflated developer estimates.</p>
              </div>
              <div class="framework-detail-item">
                <h6>Turnkey Acquisition Support</h6>
                <p>From initial site inspection and inventory reservation to documentation, registration, and post-possession leasing support, we handle the entire transaction lifecycle.</p>
              </div>
            </div>
          </div>

          <h4 style="font-size: 14px; margin-top: 20px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase; letter-spacing: 0.05em;"><i class="fas fa-certificate" style="color: var(--accent);"></i> Institutional Credibility &amp; Compliance</h4>
          <table class="compliance-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Registration &amp; Verification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Enterprise Registration</td>
                <td>Ministry of MSME / Government of India (UDYAM-RJ-11-0089088)</td>
              </tr>
              <tr>
                <td>Regulatory Compliance</td>
                <td>UP RERA &amp; Goa RERA Verified Portfolios</td>
              </tr>
              <tr>
                <td>Developer Partnerships</td>
                <td>Authorized Direct Channel Partner (Bhutani Infra, Sikka Group, Ebrix Developers)</td>
              </tr>
              <tr>
                <td>Business Model</td>
                <td>100% Direct Developer Allocation (Zero Brokerage for Buyers)</td>
              </tr>
            </tbody>
          </table>

          <div class="quote-box">
            <h4 style="font-size: 14px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase;"><i class="fas fa-quote-left" style="color: var(--accent);"></i> Leadership &amp; Vision</h4>
            <p style="font-size: 12.5px; line-height: 1.6; margin-bottom: 10px; color: var(--ink-soft);">Under the leadership of founder <strong>Rajveer Singh</strong>, R4Realty was established to transform real estate from a speculative, opaque marketplace into an analytical, investor-first wealth discipline.</p>
            <blockquote>"Real estate wealth is not created by chasing market momentum; it is created by identifying infrastructure inflection points early, securing institutional-grade inventory at fair valuation, and holding fundamentally sound, income-generating assets."</blockquote>
            <div class="author">— Rajveer Singh, Founder &amp; Managing Director</div>
          </div>

          <p style="font-size: 12.5px; line-height: 1.6; color: var(--ink-soft); margin-top: 12px;">Whether you are an individual investor seeking double-digit monthly rental cash flows, a family looking for a private green home in Sector-150 Noida, or an NRI portfolio manager acquiring high-appreciation land in North Goa, R4Realty provides the strategic clarity and direct developer access required to grow your real estate footprint with complete peace of mind.</p>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('about-modal');
  const closeBtn = document.getElementById('close-about-modal');
  const openBtns = document.querySelectorAll('.open-about-btn');

  // Trigger modal display
  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Handle Close clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}

/* ==========================================================================
   10. Dark Blueprint Theme Switcher
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('r4realty_theme');
  const isDark = savedTheme === 'dark';
  
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  // Find container for header action buttons across all page variants
  const btnWrapper = document.querySelector('header .nav-wrapper div[style*="display: flex"]') ||
                     document.querySelector('header .nav-wrapper .nav-actions') ||
                     document.querySelector('header .nav-wrapper');

  let themeToggle = document.getElementById('themeToggle');
  
  if (!themeToggle && btnWrapper) {
    const currentIsDark = document.body.classList.contains('dark-theme');
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'theme-toggle-btn';
    toggleBtn.id = 'themeToggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('title', currentIsDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    toggleBtn.setAttribute('aria-label', currentIsDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    toggleBtn.innerHTML = `<i class="fas ${currentIsDark ? 'fa-sun' : 'fa-moon'}"></i>`;
    
    if (btnWrapper.classList.contains('nav-wrapper')) {
      btnWrapper.appendChild(toggleBtn);
    } else {
      btnWrapper.insertBefore(toggleBtn, btnWrapper.firstChild);
    }
    themeToggle = toggleBtn;
  }

  function syncThemeState(dark) {
    if (dark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('r4realty_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('r4realty_theme', 'light');
    }

    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (icon) {
        icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
      }
      themeToggle.setAttribute('title', dark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      themeToggle.setAttribute('aria-label', dark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
  }

  if (themeToggle) {
    // Ensure icon and attributes match initial state
    syncThemeState(document.body.classList.contains('dark-theme'));

    themeToggle.onclick = (e) => {
      e.preventDefault();
      const willBeDark = !document.body.classList.contains('dark-theme');
      syncThemeState(willBeDark);
      
      if (typeof showToast === 'function') {
        showToast(
          willBeDark ? 'Dark Mode' : 'Light Mode',
          willBeDark ? 'Dark blueprint theme activated.' : 'Light drafting-sheet theme activated.',
          'success'
        );
      }
    };
  }
}

/* ==========================================================================
   11. FAQ Collapsible Accordions
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        faqItems.forEach(otherItem => {
          otherItem.classList.remove('active');
        });
        
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   12. Interactive Proximity Map
   ========================================================================== */
function initProximityMap() {
  const mapNodes = document.querySelectorAll('.map-node');
  const tooltip = document.getElementById('map-tooltip');
  const title = document.getElementById('tooltip-title');
  const loc = document.getElementById('tooltip-location');
  const desc = document.getElementById('tooltip-desc');
  const cta = document.getElementById('tooltip-cta');

  if (!tooltip || mapNodes.length === 0) return;

  const projectData = {
    gygy: {
      title: "GYGY Mentis",
      location: "Sector 140, Noida Expressway",
      desc: "Premium commercial IT park & retail food court. Just 2 mins walking distance to Sector 142 Metro Exchange station.",
      cta: "RERA: UPRERAPRJ251909"
    },
    belfair: {
      title: "Bhutani Belfair",
      location: "Sector 150, Noida Expressway",
      desc: "Luxury low-rise 3 & 4 BHK residences. Located in Sector 150, Noida's lowest density greenest sector.",
      cta: "30:70 payment schedule"
    },
    farmlands: {
      title: "Sector 151 Farmlands",
      location: "Near Noida Sector 151",
      desc: "300 acres gated farmhouses township. Walking distance to Bikanerwala, Haldiram's, and metro link.",
      cta: "Starts at 85 Lakhs"
    },
    mall: {
      title: "Mall of Expressway",
      location: "Pari Chowk, Noida Expressway",
      desc: "Pre-leased retail mall space. High-end food court & anchor stores (leased to D-Mart).",
      cta: "Pre-leased 60 Years"
    },
    sunrise: {
      title: "Sunrise City",
      location: "Yamuna Exp, behind Galgotias",
      desc: "Affordable freehold residential plot development. High student/family rental catchment zone.",
      cta: "Direct Registry & Mutation"
    },
    epe: {
      title: "EPE Interchange",
      location: "Yamuna Expressway Intersection",
      desc: "Cloverleaf highway intersection connecting Yamuna Expressway with the Eastern Peripheral Expressway (connecting KMP & Meerut).",
      cta: "Under Construction (Completion 2027)"
    },
    filmcity: {
      title: "International Film City",
      location: "Sector 21, Yamuna Expressway",
      desc: "YEIDA's upcoming 1000-acre media hub. Positioned next to Jewar Airport, projected to generate over 50,000 local jobs.",
      cta: "Initial Phase Approved"
    },
    medicalpark: {
      title: "YEIDA Industrial Park",
      location: "Sector 28, Yamuna Expressway",
      desc: "Dedicated 350-acre medical manufacturing park. Hosts biotech firms, pharmaceutical units, and warehousing hubs.",
      cta: "350+ Industrial Operations"
    }
  };

  mapNodes.forEach(node => {
    node.style.cursor = 'pointer';

    node.addEventListener('mouseenter', (e) => {
      const projId = node.getAttribute('data-project');
      const data = projectData[projId];
      if (!data) return;

      title.textContent = data.title;
      loc.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${data.location}`;
      desc.textContent = data.desc;
      cta.textContent = data.cta;

      tooltip.style.display = 'block';
      tooltip.style.opacity = '1';
    });

    node.addEventListener('mousemove', (e) => {
      const mapRect = node.closest('.blueprint-map').getBoundingClientRect();
      const x = e.clientX - mapRect.left;
      const y = e.clientY - mapRect.top;

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    });

    node.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
      tooltip.style.opacity = '0';
    });
  });
}

/* ==========================================================================
   13. Homepage Specific Event Listeners (Eliminates Inline Script Blocks)
   ========================================================================== */
function initHomepageFeatures() {
  const cards = document.querySelectorAll('.type-card');
  const hiddenType = document.getElementById('hiddenProjectType');
  
  if (cards.length > 0) {
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const selectedVal = card.getAttribute('data-type');
        if (hiddenType) {
          hiddenType.value = selectedVal + " Search Inquiry";
        }
      });
    });
  }

  const mainForm = document.getElementById('mainLeadForm');
  if (mainForm) {
    mainForm.addEventListener('submit', (e) => {
      const name = document.getElementById('fname').value.trim();
      const phone = document.getElementById('fphone').value.trim();
      const email = document.getElementById('femail').value.trim();
      const budget = document.getElementById('fbudget').value;
      const extraMsg = document.getElementById('fsector').value.trim();
      const selectedTypeElement = document.querySelector('.type-card.active');
      const selectedType = selectedTypeElement ? selectedTypeElement.getAttribute('data-type') : 'Commercial/Residential';

      let text = `Hi Rajveer, I found R4Realty online.%0A%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      text += `*Looking for:* ${encodeURIComponent(selectedType)}%0A`;
      if (budget) text += `*Budget:* ${encodeURIComponent(budget)}%0A`;
      if (extraMsg) text += `*Details:* ${encodeURIComponent(extraMsg)}%0A`;

      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }
}

/* ==========================================================================
   14. Project Catalog Live Search & Filter (Eliminates Inline Script Blocks)
   ========================================================================== */
function initCatalogSearch() {
  const searchInput = document.getElementById('projectSearch');
  const filterButtons = document.querySelectorAll('#filterBadges button, #filterBadges .type-pill');
  const cityButtons = document.querySelectorAll('.city-nav-bar .city-pill');
  const projectCards = document.querySelectorAll('#projectsCatalog .mockup-project-card, #projectsCatalog .project-card');

  if (!searchInput || projectCards.length === 0) return;

  let currentTypeFilter = 'all';
  let currentCityFilter = 'all';
  let searchQuery = '';

  function filterProjects() {
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const city = card.getAttribute('data-city');
      const keywords = card.getAttribute('data-keywords') ? card.getAttribute('data-keywords').toLowerCase() : '';
      
      const matchesType = (currentTypeFilter === 'all' || category === currentTypeFilter);
      const matchesCity = (currentCityFilter === 'all' || city === currentCityFilter);
      const matchesSearch = !searchQuery || keywords.includes(searchQuery);

      if (matchesType && matchesCity && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    filterProjects();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentTypeFilter = btn.getAttribute('data-filter') || 'all';
      filterProjects();
    });
  });

  cityButtons.forEach(btn => {
    // Only intercept if button has data-city="all" or doesn't have an href
    if (btn.tagName === 'BUTTON' || btn.getAttribute('data-city') === 'all') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        cityButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentCityFilter = btn.getAttribute('data-city') || 'all';
        filterProjects();
      });
    }
  });
}

/* ==========================================================================
   15. Project Specific Calculators and Form Submissions (No Inline Scripts)
   ========================================================================== */
function initProjectSpecificFeatures() {
  // 1. Bhutani Belfair
  const belfairSelect = document.getElementById('belfair-type-select');
  const belfairCost = document.getElementById('belfair-total-cost');
  const belfairBooking = document.getElementById('belfair-booking-val');
  const belfairPossession = document.getElementById('belfair-possession-val');
  const belfairForm = document.getElementById('belfairLeadForm');

  if (belfairSelect && belfairCost) {
    const calculateBelfair = () => {
      const size = parseInt(belfairSelect.value);
      const rate = 20000;
      const totalCost = size * rate;
      const booking = totalCost * 0.30;
      const possession = totalCost * 0.70;
      belfairCost.textContent = `₹ ${(totalCost / 10000000).toFixed(3)} Cr`;
      belfairBooking.textContent = `₹ ${(booking / 10000000).toFixed(3)} Cr`;
      belfairPossession.textContent = `₹ ${(possession / 10000000).toFixed(3)} Cr`;
    };
    belfairSelect.addEventListener('change', calculateBelfair);
    calculateBelfair();
  }
  if (belfairForm) {
    belfairForm.addEventListener('submit', (e) => {
      const name = document.getElementById('bname_f').value.trim();
      const phone = document.getElementById('bphone_f').value.trim();
      const email = document.getElementById('bemail_f').value.trim();
      const selectedOption = document.getElementById('btype').value;
      const extraMsg = document.getElementById('bmsg_f').value.trim();
      let text = `Hi Rajveer, I'm interested in Bhutani Belfair Sector-150 Noida.%0A%0A`;
      text += `*Project:* Bhutani Belfair (Low-Rise Luxury)%0A`;
      text += `*Size Selected:* ${encodeURIComponent(selectedOption)}%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      if (extraMsg) text += `*Details:* ${encodeURIComponent(extraMsg)}%0A`;
      text += `Please send the floor layout plans and book a private site visit.`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }

  // 2. GYGY Mentis
  const gygyForm = document.getElementById('gygyLeadForm');
  if (gygyForm) {
    gygyForm.addEventListener('submit', (e) => {
      const name = document.getElementById('gname').value.trim();
      const phone = document.getElementById('gphone').value.trim();
      const email = document.getElementById('gemail').value.trim();
      const userMsg = document.getElementById('gmsg').value.trim();
      let text = `Hi Rajveer, I'm interested in the GYGY Mentis Food Court unit.%0A%0A`;
      text += `*Project:* GYGY Mentis, Sector 140, Noida Expressway%0A`;
      text += `*Unit:* Food Court, 200 sq.ft%0A`;
      text += `*Price:* Rs 25,000/sq.ft (Rs 50,00,000 total)%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      if (userMsg) text += `*Details:* ${encodeURIComponent(userMsg)}%0A`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }

  // 3. Mall of Expressway
  const mallSlider = document.getElementById('mall-size-slider');
  const mallSizeVal = document.getElementById('mall-size-val');
  const mallCostVal = document.getElementById('mall-total-cost');
  const mallBookingVal = document.getElementById('mall-booking-val');
  const mallAssuredVal = document.getElementById('mall-assured-val');
  const mallRentVal = document.getElementById('mall-rent-val');
  const mallForm = document.getElementById('mallLeadForm');

  if (mallSlider && mallSizeVal) {
    const calculateYield = () => {
      const size = parseInt(mallSlider.value);
      mallSizeVal.textContent = size.toLocaleString();
      const bsp = 32000;
      const totalCost = size * bsp;
      const booking = totalCost * 0.5;
      const monthlyAssured = booking * 0.02;
      const dmartRent = size * 175;
      if (totalCost >= 10000000) {
        mallCostVal.textContent = `₹ ${(totalCost / 10000000).toFixed(2)} Cr`;
      } else {
        mallCostVal.textContent = `₹ ${(totalCost / 100000).toFixed(2)} Lakh`;
      }
      mallBookingVal.textContent = `₹ ${Math.round(booking).toLocaleString('en-IN')}`;
      mallAssuredVal.textContent = `₹ ${Math.round(monthlyAssured).toLocaleString('en-IN')} / mo`;
      mallRentVal.textContent = `₹ ${Math.round(dmartRent).toLocaleString('en-IN')} / mo`;
    };
    mallSlider.addEventListener('input', calculateYield);
    calculateYield();
  }
  if (mallForm) {
    mallForm.addEventListener('submit', (e) => {
      const name = document.getElementById('mname').value.trim();
      const phone = document.getElementById('mphone').value.trim();
      const email = document.getElementById('memail').value.trim();
      const userMsg = document.getElementById('mmsg').value.trim();
      let text = `Hi Rajveer, I'm interested in Sikka Mall of Expressway pre-leased commercial unit.%0A%0A`;
      text += `*Project:* Sikka Mall of Expressway, Pari Chowk%0A`;
      text += `*Unit:* Pre-Leased Unit (Min. 100 sq.ft)%0A`;
      text += `*Price:* ₹32,000/sq.ft (₹32,00,000 total)%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      if (userMsg) text += `*Details:* ${encodeURIComponent(userMsg)}%0A`;
      text += `Please share DMart lease terms and booking details.`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }

  // 4. Sector 151 Farmlands
  const farmSlider = document.getElementById('farm-size-slider');
  const farmSizeVal = document.getElementById('farm-size-val');
  const farmCostVal = document.getElementById('farm-total-cost');
  const farmBookingVal = document.getElementById('farm-booking-val');
  const farmAgreementVal = document.getElementById('farm-agreement-val');
  const farmRegistrationVal = document.getElementById('farm-registration-val');
  const farmForm = document.getElementById('farmLeadForm');

  if (farmSlider && farmSizeVal) {
    const calculateFarms = () => {
      const size = parseInt(farmSlider.value);
      farmSizeVal.textContent = size.toLocaleString();
      const rate = 8500;
      const totalCost = size * rate;
      const booking = totalCost * 0.10;
      const agreement = totalCost * 0.40;
      const registration = totalCost * 0.50;
      if (totalCost >= 10000000) {
        farmCostVal.textContent = `₹ ${(totalCost / 10000000).toFixed(2)} Cr`;
      } else {
        farmCostVal.textContent = `₹ ${(totalCost / 100000).toFixed(2)} Lakh`;
      }
      farmBookingVal.textContent = `₹ ${Math.round(booking).toLocaleString('en-IN')}`;
      farmAgreementVal.textContent = `₹ ${Math.round(agreement).toLocaleString('en-IN')}`;
      farmRegistrationVal.textContent = `₹ ${Math.round(registration).toLocaleString('en-IN')}`;
    };
    farmSlider.addEventListener('input', calculateFarms);
    calculateFarms();
  }
  if (farmForm) {
    farmForm.addEventListener('submit', (e) => {
      const name = document.getElementById('fname_f').value.trim();
      const phone = document.getElementById('fphone_f').value.trim();
      const email = document.getElementById('femail_f').value.trim();
      const userMsg = document.getElementById('fmsg_f').value.trim();
      let text = `Hi Rajveer, I'm interested in the Noida Sector 151 Farmland Township.%0A%0A`;
      text += `*Project:* Noida Sector 151 Farmland plots%0A`;
      text += `*Size Selected:* ${encodeURIComponent(farmSlider.value)} sq. yards%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      if (userMsg) text += `*Details:* ${encodeURIComponent(userMsg)}%0A`;
      text += `Please share the master plan layout and site visit schedule.`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }

  // 5. Sunrise City
  const sunriseSlider = document.getElementById('sunrise-size-slider');
  const sunriseSizeVal = document.getElementById('sunrise-size-val');
  const sunriseCostVal = document.getElementById('sunrise-total-cost');
  const sunriseBalanceVal = document.getElementById('sunrise-balance-val');
  const sunriseForm = document.getElementById('sunriseLeadForm');

  if (sunriseSlider && sunriseSizeVal) {
    const calculateSunrise = () => {
      const size = parseInt(sunriseSlider.value);
      sunriseSizeVal.textContent = size.toLocaleString();
      const rate = 36500;
      const totalCost = size * rate;
      const appFee = 51000;
      const balance = totalCost - appFee;
      if (totalCost >= 10000000) {
        sunriseCostVal.textContent = `₹ ${(totalCost / 10000000).toFixed(2)} Cr`;
      } else {
        sunriseCostVal.textContent = `₹ ${(totalCost / 100000).toFixed(2)} Lakh`;
      }
      if (balance > 0) {
        if (balance >= 10000000) {
          sunriseBalanceVal.textContent = `₹ ${(balance / 10000000).toFixed(2)} Cr`;
        } else {
          sunriseBalanceVal.textContent = `₹ ${(balance / 100000).toFixed(2)} Lakh`;
        }
      } else {
        sunriseBalanceVal.textContent = `₹ 0`;
      }
    };
    sunriseSlider.addEventListener('input', calculateSunrise);
    calculateSunrise();
  }
  if (sunriseForm) {
    sunriseForm.addEventListener('submit', (e) => {
      const name = document.getElementById('sname_f').value.trim();
      const phone = document.getElementById('sphone_f').value.trim();
      const email = document.getElementById('semail_f').value.trim();
      const selectedOption = document.getElementById('stype').value;
      const extraMsg = document.getElementById('smsg_f').value.trim();
      let text = `Hi Rajveer, I'm interested in Sunrise City Greater Noida.%0A%0A`;
      text += `*Project:* Sunrise City (Behind Galgotias Uni)%0A`;
      text += `*Size Selected:* ${encodeURIComponent(selectedOption)}%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      if (extraMsg) text += `*Details:* ${encodeURIComponent(extraMsg)}%0A`;
      text += `Please send the Phase 1 & 2 layouts and application guidelines.`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }

  // 6. Vedic City Goa
  const goaSelect = document.getElementById('goa-type-select');
  const goaSlider = document.getElementById('goa-size-slider');
  const goaSizeVal = document.getElementById('goa-size-val');
  const goaRateVal = document.getElementById('goa-rate-val');
  const goaCostVal = document.getElementById('goa-total-cost');
  const goaBookingVal = document.getElementById('goa-booking-val');
  const goaAgreementVal = document.getElementById('goa-agreement-val');
  const goaForm = document.getElementById('goaLeadForm');

  if (goaSlider && goaSelect) {
    const calculatePlots = () => {
      const size = parseInt(goaSlider.value);
      goaSizeVal.textContent = size.toLocaleString();
      const type = goaSelect.value;
      let rate = 23500;
      if (type === 'graama') {
        rate = 34500;
      } else if (type === 'anandam') {
        rate = 23500;
      } else if (type === 'praana') {
        rate = 23500;
      }
      goaRateVal.textContent = `₹ ${rate.toLocaleString()}/sq yd`;
      const totalCost = size * rate;
      const reservation = totalCost * 0.10;
      const agreement = totalCost * 0.30;
      if (totalCost >= 10000000) {
        goaCostVal.textContent = `₹ ${(totalCost / 10000000).toFixed(2)} Cr`;
      } else {
        goaCostVal.textContent = `₹ ${(totalCost / 100000).toFixed(2)} Lakh`;
      }
      goaBookingVal.textContent = `₹ ${Math.round(reservation).toLocaleString('en-IN')}`;
      goaAgreementVal.textContent = `₹ ${Math.round(agreement).toLocaleString('en-IN')}`;
    };

    goaSelect.addEventListener('change', () => {
      const val = goaSelect.value;
      if (val === 'graama') {
        goaSlider.min = 200;
        goaSlider.max = 800;
        goaSlider.value = 300;
      } else if (val === 'anandam') {
        goaSlider.min = 150;
        goaSlider.max = 600;
        goaSlider.value = 240;
      } else if (val === 'praana') {
        goaSlider.min = 500;
        goaSlider.max = 3000;
        goaSlider.value = 1380;
      }
      calculatePlots();
    });

    goaSlider.addEventListener('input', calculatePlots);
    calculatePlots();
  }
  if (goaForm) {
    goaForm.addEventListener('submit', (e) => {
      const name = document.getElementById('vname').value.trim();
      const phone = document.getElementById('vphone').value.trim();
      const email = document.getElementById('vemail').value.trim();
      const selectedPlot = document.getElementById('vtype').value;
      const extraMsg = document.getElementById('vmsg').value.trim();
      let text = `Hi Rajveer, I'm interested in Vedic City North Goa.%0A%0A`;
      text += `*Project:* Vedic City Goa (NH-66)%0A`;
      text += `*Plot Choice:* ${encodeURIComponent(selectedPlot)}%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      if (extraMsg) text += `*Details:* ${encodeURIComponent(extraMsg)}%0A`;
      text += `Please send the plot layout maps and booking formalities.`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }

  // 7. Template Page
  const typeSelect = document.getElementById('calc-type-select');
  const templateSlider = document.getElementById('calc-size-slider');
  const templateSizeVal = document.getElementById('calc-size-val');
  const templateCostVal = document.getElementById('calc-total-cost');
  const templateBookingVal = document.getElementById('calc-booking-milestone');
  const templateRentVal = document.getElementById('calc-monthly-rent');
  const templateForm = document.getElementById('templateProjectInquiryForm');

  if (templateSlider && typeSelect) {
    const calculateTemplateCosts = () => {
      const size = parseInt(templateSlider.value);
      templateSizeVal.textContent = size.toLocaleString();
      const type = typeSelect.value;
      let rate = 8000;
      let rentalRateSqFt = 22;
      if (type === 'optionA') {
        rate = 8500;
        rentalRateSqFt = 24;
      } else if (type === 'optionB') {
        rate = 7800;
        rentalRateSqFt = 20;
      }
      const totalCost = size * rate;
      const bookingAmount = totalCost * 0.10;
      const monthlyRent = size * rentalRateSqFt;
      if (totalCost >= 10000000) {
        templateCostVal.textContent = `₹ ${(totalCost / 10000000).toFixed(2)} Cr`;
      } else {
        templateCostVal.textContent = `₹ ${(totalCost / 100000).toFixed(2)} Lakh`;
      }
      templateBookingVal.textContent = `₹ ${Math.round(bookingAmount).toLocaleString('en-IN')}`;
      templateRentVal.textContent = `₹ ${Math.round(monthlyRent).toLocaleString('en-IN')} /mo`;
    };
    typeSelect.addEventListener('change', calculateTemplateCosts);
    templateSlider.addEventListener('input', calculateTemplateCosts);
    calculateTemplateCosts();
  }
  if (templateForm) {
    templateForm.addEventListener('submit', (e) => {
      const name = document.getElementById('tpname').value.trim();
      const phone = document.getElementById('tpphone').value.trim();
      const email = document.getElementById('tpemail').value.trim();
      const unit = document.getElementById('tpmsg').value;
      const projectName = document.getElementById('projectTrackingName').value;
      let text = `Hi Rajveer, I found your property listing online for: ${projectName}.%0A%0A`;
      text += `*Name:* ${encodeURIComponent(name)}%0A`;
      text += `*Phone:* ${encodeURIComponent(phone)}%0A`;
      if (email) text += `*Email:* ${encodeURIComponent(email)}%0A`;
      text += `*Preferred Unit:* ${encodeURIComponent(unit)}%0A`;
      text += `Please send the digital brochure and location pricing sheet.`;
      setTimeout(() => {
        window.open(`https://wa.me/917838416570?text=${text}`, '_blank');
      }, 100);
    });
  }
}

/* ==========================================================================
   13. Interactive R4Realty AI Advisory Chatbot
   ========================================================================== */
function initChatbot() {
  if (document.getElementById('r4ChatLauncher')) return;

  // Render launcher and chat window markup
  const chatHTML = `
    <div class="r4-chatbot-launcher" id="r4ChatLauncher" title="Chat with R4Realty Property Advisor">
      <div class="r4-launcher-icon">
        <i class="fas fa-comment-dots"></i>
        <div class="r4-launcher-pulse"></div>
      </div>
      <span>Ask Advisor</span>
    </div>

    <div class="r4-chat-window" id="r4ChatWindow">
      <div class="r4-chat-header">
        <div class="r4-chat-header-info">
          <div class="r4-chat-avatar"><i class="fas fa-user-tie"></i></div>
          <div>
            <div class="r4-chat-title">Rajveer Singh · R4Realty</div>
            <div class="r4-chat-status"><span class="r4-chat-status-dot"></span> Online · Property Advisory</div>
          </div>
        </div>
        <div class="r4-chat-header-actions">
          <button class="r4-chat-action-btn" id="r4ChatClose" title="Close Chat" aria-label="Close Chat"><i class="fas fa-times"></i></button>
        </div>
      </div>
      <div class="r4-chat-body">
        <div class="r4-chat-messages" id="r4ChatMessages"></div>
        <div class="r4-chat-chips-container" id="r4ChatChips">
          <button class="r4-chip" data-query="commercial">🏢 11% Yield Commercial</button>
          <button class="r4-chip" data-query="sector 150">🏡 Sector-150 Luxury</button>
          <button class="r4-chip" data-query="goa">🌴 Goa Vedic City Plots</button>
          <button class="r4-chip" data-query="zero brokerage">⚖️ Zero Brokerage Policy</button>
          <button class="r4-chip" data-query="contact">📞 Talk to Rajveer</button>
        </div>
        <form class="r4-chat-input-area" id="r4ChatForm">
          <input type="text" class="r4-chat-input" id="r4ChatInput" placeholder="Ask about projects, yields, RERA..." autocomplete="off" />
          <button type="submit" class="r4-chat-send-btn" title="Send message" aria-label="Send message"><i class="fas fa-paper-plane"></i></button>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);

  const launcher = document.getElementById('r4ChatLauncher');
  const chatWindow = document.getElementById('r4ChatWindow');
  const closeBtn = document.getElementById('r4ChatClose');
  const messagesContainer = document.getElementById('r4ChatMessages');
  const chatForm = document.getElementById('r4ChatForm');
  const chatInput = document.getElementById('r4ChatInput');
  const chipsContainer = document.getElementById('r4ChatChips');

  let hasGreeted = false;

  function toggleChat(open) {
    if (open === undefined) {
      chatWindow.classList.toggle('active');
    } else if (open) {
      chatWindow.classList.add('active');
    } else {
      chatWindow.classList.remove('active');
    }

    if (chatWindow.classList.contains('active')) {
      if (!hasGreeted) {
        hasGreeted = true;
        sendBotGreeting();
      }
      setTimeout(() => chatInput.focus(), 150);
    }
  }

  launcher.addEventListener('click', () => toggleChat());
  closeBtn.addEventListener('click', () => toggleChat(false));

  function getCurrentTimeString() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function appendUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'r4-msg user';
    msgDiv.innerHTML = `
      <div class="r4-bubble">${escapeHTML(text)}</div>
      <span class="r4-msg-time">${getCurrentTimeString()}</span>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function appendBotMessage(htmlContent, showWhatsAppCTA = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'r4-msg bot';

    let ctaHTML = '';
    if (showWhatsAppCTA) {
      ctaHTML = `
        <div class="r4-chat-btn-group">
          <a class="r4-chat-btn" href="https://wa.me/917838416570?text=Hi%20Rajveer,%20I%20am%20chatting%20on%20R4Realty%20and%20need%20investment%20details." target="_blank">
            <i class="fab fa-whatsapp"></i> Chat directly on WhatsApp (+91 78384 16570) &rarr;
          </a>
        </div>
      `;
    }

    msgDiv.innerHTML = `
      <div class="r4-bubble">${htmlContent} ${ctaHTML}</div>
      <span class="r4-msg-time">${getCurrentTimeString()}</span>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'r4-msg bot r4-typing-wrapper';
    typingDiv.innerHTML = `
      <div class="r4-typing">
        <div class="r4-dot"></div>
        <div class="r4-dot"></div>
        <div class="r4-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    return typingDiv;
  }

  function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sendBotGreeting() {
    const typing = showTypingIndicator();
    setTimeout(() => {
      removeTypingIndicator(typing);
      appendBotMessage(`
        <strong>Welcome to R4Realty!</strong> I'm Rajveer Singh's AI Property Advisor.<br><br>
        How can I help you today? You can ask about:
        <ul style="padding-left: 16px; margin: 6px 0;">
          <li><strong>Pre-leased commercial</strong> with up to 11% rental yield (GYGY Mentis, Sikka Mall)</li>
          <li><strong>Low-density residences</strong> in Sector-150 Noida</li>
          <li><strong>RERA township plots</strong> in Vedic City Goa (MOPA Airport)</li>
          <li>Zero brokerage policy &amp; RERA compliance</li>
        </ul>
        What type of property or investment are you looking for?
      `);
    }, 400);
  }

  function processQuery(query) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    appendUserMessage(query);
    chatInput.value = '';

    // Check for phone number / lead capture attempt
    const phoneMatch = query.match(/(\+?\d{1,4}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/);
    if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
      const extractedPhone = phoneMatch[0].replace(/\D/g, '');
      
      // Save lead asynchronously
      try {
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Chatbot Lead',
            phone: extractedPhone,
            email: '',
            property_type: 'Advisory Consultation',
            budget: 'General Inquiry',
            timeline: 'Immediate',
            message: `Lead captured via Chatbot conversation: "${query}"`
          })
        }).catch(() => {});
      } catch (err) {}

      const typing = showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator(typing);
        appendBotMessage(`
          <strong>Thank you!</strong> I have logged your contact (${extractedPhone}).<br><br>
          Rajveer Singh will connect with you shortly with verified inventory sheets and pre-launch pricing. You can also message him right away on WhatsApp:
        `, true);
      }, 500);
      return;
    }

    const typing = showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator(typing);
      generateBotResponse(q, query);
    }, 450);
  }

  function generateBotResponse(q, rawQuery) {
    // Commercial
    if (q.includes('commercial') || q.includes('gygy') || q.includes('sikka') || q.includes('mall of expressway') || q.includes('mentis') || q.includes('retail') || q.includes('office') || q.includes('yield') || q.includes('11%')) {
      appendBotMessage(`
        <strong>High-Yield Commercial Opportunities:</strong><br>
        We specialize in pre-leased assets delivering up to <strong>11% gross rental yield</strong> with institutional lock-in leases:<br>
        <ul style="padding-left: 16px; margin: 6px 0;">
          <li><strong>GYGY Mentis (Sector 140A, Noida Expressway):</strong> High-density corporate catchment, Grade-A IT/retail dual towers.</li>
          <li><strong>Sikka Mall of Expressway (Greater Noida):</strong> Near Pari Chowk transit corridor with steady day-one footfalls and strong pre-leased retail returns.</li>
          <li><strong>Bhutani Belfair (Sector 140A):</strong> High-footfall entertainment and commercial avenue.</li>
        </ul>
        <div class="r4-chat-btn-group">
          <a class="r4-chat-btn" href="/projects/gygy-mentis.html"><i class="fas fa-arrow-right"></i> View GYGY Mentis Spec Sheet</a>
          <a class="r4-chat-btn" href="/projects/mall-of-expressway.html"><i class="fas fa-arrow-right"></i> View Sikka Mall of Expressway</a>
        </div>
      `, true);
      return;
    }

    // Residential / Sector 150
    if (q.includes('residential') || q.includes('150') || q.includes('apartment') || q.includes('flat') || q.includes('villa') || q.includes('home') || q.includes('luxury')) {
      appendBotMessage(`
        <strong>Low-Density Premium Residential (Sector-150, Noida):</strong><br>
        Known as the <em>"Green Lung of Noida"</em>, Sector-150 offers:
        <ul style="padding-left: 16px; margin: 6px 0;">
          <li>80% green cover mandate &amp; sports-centric master planning.</li>
          <li>Direct connectivity to Noida Expressway, Yamuna Expressway &amp; Jewar Airport.</li>
          <li>Low-density, biophilic luxury towers with maximum privacy and high capital appreciation.</li>
        </ul>
        Would you like Rajveer to share available 3 BHK / 4 BHK floor plans and pricing?
      `, true);
      return;
    }

    // Goa / Plots / Vedic City
    if (q.includes('goa') || q.includes('vedic') || q.includes('plot') || q.includes('land') || q.includes('farmland') || q.includes('sunrise') || q.includes('soma') || q.includes('graama')) {
      appendBotMessage(`
        <strong>Appreciating Land &amp; Township Plots:</strong><br>
        <ul style="padding-left: 16px; margin: 6px 0;">
          <li><strong>Vedic City (North Goa):</strong> Located near Manohar International Airport (MOPA) &amp; NH-66 corridor. Master-planned, RERA-approved wellness plots (<strong>Graama</strong> from 300 gaj, <strong>Anandam</strong> from 240 gaj, <strong>Praana</strong> farmhouses from 1380 gaj) ideal for custom luxury villas &amp; high-yield holiday rentals.</li>
          <li><strong>Sunrise City &amp; Greater Noida Corridors:</strong> Freehold RERA-registered land parcels with rapid infrastructure upside.</li>
        </ul>
        <div class="r4-chat-btn-group">
          <a class="r4-chat-btn" href="/projects/vedic-city-goa.html"><i class="fas fa-arrow-right"></i> Explore Vedic City Goa Plots</a>
        </div>
      `, true);
      return;
    }

    // Brokerage & Legal Due Diligence
    if (q.includes('brokerage') || q.includes('commission') || q.includes('fee') || q.includes('rera') || q.includes('legal') || q.includes('msme') || q.includes('free') || q.includes('due diligence')) {
      appendBotMessage(`
        <strong>Zero Brokerage &amp; 100% Legal Rigor:</strong><br>
        <ul style="padding-left: 16px; margin: 6px 0;">
          <li><strong>Zero Brokerage for Buyers:</strong> We do not charge brokerage or advisory commission. Master developer partnerships ensure you retain 100% purchasing power.</li>
          <li><strong>Direct Inventory Allocation:</strong> Authorized channel partner with Bhutani Infra, Sikka Group, and Ebrix Developers.</li>
          <li><strong>Statutory Compliance:</strong> Registered under Ministry of MSME (<strong>UDYAM-RJ-11-0089088</strong>) with 100% UP RERA &amp; Goa RERA verified titles.</li>
        </ul>
      `);
      return;
    }

    // Contact / Phone / Meeting / Site visit
    if (q.includes('contact') || q.includes('call') || q.includes('phone') || q.includes('whatsapp') || q.includes('number') || q.includes('talk') || q.includes('meet') || q.includes('visit') || q.includes('rajveer')) {
      appendBotMessage(`
        <strong>Connect Directly with Rajveer Singh:</strong><br>
        📍 R4Realty, Noida / NCR<br>
        📞 <strong>Phone:</strong> <a href="tel:+917838416570" style="color: var(--accent); text-decoration: underline;">+91 78384 16570</a><br>
        💬 <strong>WhatsApp:</strong> Instant chat available 7 days a week.<br><br>
        Feel free to share your phone number here or click below to start a WhatsApp conversation.
      `, true);
      return;
    }

    // General fallback answer
    appendBotMessage(`
      I can help you explore verified real estate investments in Noida, Greater Noida, and North Goa with <strong>zero brokerage</strong>.<br><br>
      Feel free to ask about:
      <ul style="padding-left: 16px; margin: 6px 0;">
        <li>Commercial returns &amp; pre-leased options (up to 11% yield)</li>
        <li>Sector-150 Noida luxury residential developments</li>
        <li>North Goa (MOPA Airport) RERA villa plots</li>
        <li>Scheduling a 1-on-1 portfolio review with Rajveer Singh</li>
      </ul>
      Or drop your phone number here to receive the latest rate sheets!
    `, true);
  }

  // Handle Form Submit
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (query) {
      processQuery(query);
    }
  });

  // Handle Quick Chips
  chipsContainer.querySelectorAll('.r4-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      processQuery(q);
    });
  });
}
