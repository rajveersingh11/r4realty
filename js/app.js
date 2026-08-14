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
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardContent = document.getElementById('admin-dashboard-content');
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
      
      // Fallback: If server is offline (failed fetch), compare locally
      console.warn('Authentication server offline. Checking local PIN fallback.', err.message);
      if (pass === 'r4realty@123') {
        activeAdminPin = pass;
        loginScreen.style.display = 'none';
        dashboardContent.style.display = 'block';
        refreshLeadsTable();
      } else {
        showToast('Access Denied', 'Invalid administrator security pin.', 'error');
      }
    });
  });

  passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  // Export Leads to CSV
  exportBtn.addEventListener('click', () => {
    exportLeadsToCSV();
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
          <p style="margin-bottom: 12px;">At R4Realty, we value the confidentiality of our clients and site visitors. This Privacy Policy describes how we collect, store, and protect your personal information.</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">1. Data Collection</h4>
          <p style="margin-bottom: 12px;">We only collect name, phone number, email address, and specific property requirements when you voluntarily submit them through our inquiry and consultation booking forms.</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">2. Data Storage &amp; Safety</h4>
          <p style="margin-bottom: 12px;">All submitted information is processed through server-side request verification and securely stored in our offline file database (leads_db.json) or localized MySQL schemas. We implement headers authorization to protect your records from unauthorized scraping.</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">3. Third-Party Sharing</h4>
          <p style="margin-bottom: 12px;">R4Realty never sells, rents, or shares your personal contact credentials with third-party brokers or advertisers. We redirect form submissions to WhatsApp solely to establish direct communication between you and Rajveer Singh.</p>
          
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
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-info-circle"></i> About R4Realty</h3>
          <button class="close-modal-btn" id="close-about-modal">&times;</button>
        </div>
        <div class="modal-body" style="font-family: var(--font-body); font-size: 13px; line-height: 1.6; color: var(--ink-soft);">
          <p style="margin-bottom: 12px;"><strong>R4Realty</strong> is a premier property consultancy founded and led by <strong>Rajveer Singh</strong>. We represent institutional-grade commercial spaces, luxury low-density housing, and secure freehold plotting developments in high-appreciation micro-markets.</p>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">Our Core Verticals</h4>
          <ul style="margin-bottom: 12px; padding-left: 18px; list-style-type: square;">
            <li style="margin-bottom: 4px;"><strong>High-Yield Commercial</strong>: Pre-leased assets (like Mall of Expressway &amp; GYGY Mentis) offering up to 11% rental returns with long-term lock-ins.</li>
            <li style="margin-bottom: 4px;"><strong>Premium Residential</strong>: Low-rise, low-density residences in Sector-150 Noida focusing on green living and high privacy.</li>
            <li style="margin-bottom: 4px;"><strong>Appreciating Land Plots</strong>: RERA-approved township plots in Goa (Vedic City) and Greater Noida freehold locations.</li>
          </ul>
          
          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 6px; color: var(--ink); font-family: var(--font-heading);">Why Invest Through Us?</h4>
          <p style="margin-bottom: 12px;">We do not charge brokerage to our buyers. By working directly with developer builders (Sikka Group, Bhutani, Ebrix Developers), we guarantee direct developer inventory allocation, authentic pre-launch prices, and end-to-end registry paperwork assistance.</p>
          
          <p style="margin-top: 20px; font-size: 11.5px; color: var(--muted); font-family: var(--font-mono);">R4Realty Noida &bull; RERA Verified Portfolios</p>
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
  }

  const btnWrapper = document.querySelector('header .nav-wrapper div[style*="display: flex"]');
  if (btnWrapper) {
    const toggleHTML = `
      <button class="theme-toggle-btn" id="themeToggle" title="Toggle Theme" style="background: none; border: var(--border-thin); color: var(--ink); width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); margin-right: 4px; font-size: 13px; border-radius: var(--radius); outline: none;">
        <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
      </button>
    `;
    btnWrapper.insertAdjacentHTML('afterbegin', toggleHTML);
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const body = document.body;
      body.classList.toggle('dark-theme');
      
      const icon = themeToggle.querySelector('i');
      if (body.classList.contains('dark-theme')) {
        localStorage.setItem('r4realty_theme', 'dark');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        showToast('Dark Mode', 'Dark blueprint theme activated.', 'success');
      } else {
        localStorage.setItem('r4realty_theme', 'light');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        showToast('Light Mode', 'Light drafting-sheet theme activated.', 'success');
      }
    });
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

