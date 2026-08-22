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
  initLegalModal();
  initFaqAccordion();
  initProximityMap();
  initHomepageFeatures();
  initCatalogSearch();
  initProjectSpecificFeatures();
  initDynamicCareers();
  applyProjectOverrides();
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
   5. Lead Management Dashboard (Advanced R4Realty CRM)
   ========================================================================== */
let activeAdminPin = '';
let crmAllLeads = [];
let crmCurrentFilter = 'ALL';
let crmCurrentSearch = '';

function initLeadDashboard() {
  const adminBtn = document.getElementById('admin-dashboard-trigger');
  if (!adminBtn) return;

  const DEFAULT_DIALER_CONTACTS = [{"id": 1, "name": "Ranbir Singh", "phone": "9811580277", "type": "Individual"}, {"id": 2, "name": "Pravin Kumar Makkar", "phone": "9911867586", "type": "Individual"}, {"id": 3, "name": "Rani", "phone": "9818939030", "type": "Individual"}, {"id": 4, "name": "Preeti Verma", "phone": "9899976994", "type": "Individual"}, {"id": 5, "name": "Ranjan Kumar", "phone": "8860449977", "type": "Individual"}, {"id": 6, "name": "Priti Kinner", "phone": "9911726491", "type": "Individual"}, {"id": 7, "name": "Rattan Kumar", "phone": "9910433651", "type": "Individual"}, {"id": 8, "name": "Priyanka Juneja", "phone": "9818026346", "type": "Individual"}, {"id": 9, "name": "Ravinder Dhaka", "phone": "8527360220", "type": "Individual"}, {"id": 10, "name": "Priyum Grover", "phone": "9711327377", "type": "Individual"}, {"id": 11, "name": "Ravinder Kumar", "phone": "9999832833", "type": "Individual"}, {"id": 12, "name": "Promila Katariya", "phone": "9811281232", "type": "Individual"}, {"id": 13, "name": "Ravinder Singh", "phone": "8920298748", "type": "Individual"}, {"id": 14, "name": "Prosenjit Patra", "phone": "8447826430", "type": "Individual"}, {"id": 15, "name": "Ravinder Singh", "phone": "9466167223", "type": "Individual"}, {"id": 16, "name": "Pulipati Ramakrishna", "phone": "9810096194", "type": "Individual"}, {"id": 17, "name": "Ravinder Singh Lather", "phone": "9818809709", "type": "Individual"}, {"id": 18, "name": "Purvi Lhila", "phone": "9923330414", "type": "Individual"}, {"id": 19, "name": "Rekha Sapru", "phone": "9990105454", "type": "Individual"}, {"id": 20, "name": "Pushpendra Singh", "phone": "9716375475", "type": "Individual"}, {"id": 21, "name": "Riso Kumar", "phone": "9821404107", "type": "Individual"}, {"id": 22, "name": "R K SALES", "phone": "9911914201", "type": "Company"}, {"id": 23, "name": "Rita Tyagi", "phone": "9650444008", "type": "Individual"}, {"id": 24, "name": "Rachit Raman Mehrotra", "phone": "9811329439", "type": "Individual"}, {"id": 25, "name": "Ritesh Behal", "phone": "9315871667", "type": "Individual"}, {"id": 26, "name": "Rahis Ahmed", "phone": "9654396412", "type": "Individual"}, {"id": 27, "name": "Rohit", "phone": "9953697004", "type": "Individual"}, {"id": 28, "name": "Rahul Badola", "phone": "9013216844", "type": "Individual"}, {"id": 29, "name": "Rohit Arora", "phone": "9810656691", "type": "Individual"}, {"id": 30, "name": "Rahul Bhardwaj", "phone": "7859882135", "type": "Individual"}, {"id": 31, "name": "Rohit Jain", "phone": "9811880563", "type": "Individual"}, {"id": 32, "name": "Rahul Dev Bhardwaj", "phone": "9810329882", "type": "Individual"}, {"id": 33, "name": "Rohtash Singh Dalal", "phone": "8586871236", "type": "Individual"}, {"id": 34, "name": "Rahul Jerath", "phone": "9650431851", "type": "Individual"}, {"id": 35, "name": "ROOP AUTOMOTIVES LIMITED", "phone": "7903091945", "type": "Company"}, {"id": 36, "name": "Rahul Kumar", "phone": "9013610119", "type": "Individual"}, {"id": 37, "name": "Rukiya Begum Choudhury", "phone": "8403885230", "type": "Individual"}, {"id": 38, "name": "Rahul Saini", "phone": "9711016306", "type": "Individual"}, {"id": 39, "name": "Rupali Jowel", "phone": "8527368099", "type": "Individual"}, {"id": 40, "name": "Rahul Sharma", "phone": "9458958833", "type": "Individual"}, {"id": 41, "name": "Sachin Grover", "phone": "9811434576", "type": "Individual"}, {"id": 42, "name": "Rahul Srivastava", "phone": "7042486561", "type": "Individual"}, {"id": 43, "name": "Sachin Gupta", "phone": "9811975510", "type": "Individual"}, {"id": 44, "name": "Rahul Yadav", "phone": "7754972280", "type": "Individual"}, {"id": 45, "name": "Safdar Ejaz Khan", "phone": "8130463731", "type": "Individual"}, {"id": 46, "name": "Raj Kishor", "phone": "9997059915", "type": "Individual"}, {"id": 47, "name": "Sahil Virmani", "phone": "9892153172", "type": "Individual"}, {"id": 48, "name": "Raj Kishor", "phone": "9211323441", "type": "Individual"}, {"id": 49, "name": "Sakindra Kumar", "phone": "9871982906", "type": "Individual"}, {"id": 50, "name": "Raj Kumar", "phone": "8132870750", "type": "Individual"}, {"id": 51, "name": "Salim Khan", "phone": "9540501819", "type": "Individual"}, {"id": 52, "name": "Rajan Kumar Chourasia", "phone": "9891055902", "type": "Individual"}, {"id": 53, "name": "Sameer Ahamad", "phone": "9004915137", "type": "Individual"}, {"id": 54, "name": "Rajat Bajaj", "phone": "9999433655", "type": "Individual"}, {"id": 55, "name": "Sandeep Jain", "phone": "9891291212", "type": "Individual"}, {"id": 56, "name": "Rajbir Karhana", "phone": "9211488544", "type": "Individual"}, {"id": 57, "name": "Sandeep Kumar", "phone": "7840023399", "type": "Individual"}, {"id": 58, "name": "Rajeev Kumar", "phone": "9650617471", "type": "Individual"}, {"id": 59, "name": "Sandhya Mundeja", "phone": "9811550735", "type": "Individual"}, {"id": 60, "name": "Rajeev Kumar Jain", "phone": "9210714856", "type": "Individual"}, {"id": 61, "name": "Sangeeta Singh", "phone": "9818811537", "type": "Individual"}, {"id": 62, "name": "Rajendra Bafna", "phone": "9811299032", "type": "Individual"}, {"id": 63, "name": "Sanjay Gambhir", "phone": "9312224578", "type": "Individual"}, {"id": 64, "name": "Rajendra Kumar Sharma", "phone": "8800303131", "type": "Individual"}, {"id": 65, "name": "Sanjay Gupta", "phone": "9810380203", "type": "Individual"}, {"id": 66, "name": "Rajesh Kumar Goyal", "phone": "9311123637", "type": "Individual"}, {"id": 67, "name": "Sanjay Kumar", "phone": "9871028670", "type": "Individual"}, {"id": 68, "name": "Rajesh Kumar M", "phone": "9940248243", "type": "Individual"}, {"id": 69, "name": "Sanjay Kumar Chandel", "phone": "8600990784", "type": "Individual"}, {"id": 70, "name": "Rajesh Kumar Mahajan", "phone": "9810003854", "type": "Individual"}, {"id": 71, "name": "Sanjay Kumar Yadav", "phone": "9711069789", "type": "Individual"}, {"id": 72, "name": "Rajinder Mohan Seth", "phone": "9654247015", "type": "Individual"}, {"id": 73, "name": "Sanjay Nagpal", "phone": "9810020593", "type": "Individual"}, {"id": 74, "name": "Rajiv Kumar Aggarwal", "phone": "9968930606", "type": "Individual"}, {"id": 75, "name": "Sanjeev Dureja", "phone": "9810039679", "type": "Individual"}, {"id": 76, "name": "Rajiv Malhotra", "phone": "9899747475", "type": "Individual"}, {"id": 77, "name": "Sanjeev Kumar", "phone": "9731046174", "type": "Individual"}, {"id": 78, "name": "Raju", "phone": "8638083839", "type": "Individual"}, {"id": 79, "name": "Santosh Devi", "phone": "9991525414", "type": "Individual"}, {"id": 80, "name": "Rakesh Rawat", "phone": "9650059581", "type": "Individual"}, {"id": 81, "name": "Santosh Pal", "phone": "8802035611", "type": "Individual"}, {"id": 82, "name": "Ram Chander", "phone": "9818210937", "type": "Individual"}, {"id": 83, "name": "Sanyam Trivedi", "phone": "8109694089", "type": "Individual"}, {"id": 84, "name": "Ranjeet Kumar Pandey", "phone": "9999421214", "type": "Individual"}, {"id": 85, "name": "SAP LABS INDIA PRIVATE LIMITED", "phone": "9999450221", "type": "Company"}, {"id": 86, "name": "Ranvir Singh", "phone": "9810311415", "type": "Individual"}, {"id": 87, "name": "Sarang S Deshpande", "phone": "9987088931", "type": "Individual"}, {"id": 88, "name": "Rashi Rustagi", "phone": "9811237127", "type": "Individual"}, {"id": 89, "name": "Sarita", "phone": "8708397987", "type": "Individual"}, {"id": 90, "name": "RASHTRIYA SARVODAYA PARTY", "phone": "8920013126", "type": "Company"}, {"id": 91, "name": "Satbir", "phone": "7988609787", "type": "Individual"}, {"id": 92, "name": "Ravi", "phone": "9643249317", "type": "Individual"}, {"id": 93, "name": "Satinder Singh Chauhan", "phone": "9999653266", "type": "Individual"}, {"id": 94, "name": "Ravi Sharma", "phone": "9810812012", "type": "Individual"}, {"id": 95, "name": "Satish Kumar", "phone": "8750852546", "type": "Individual"}, {"id": 96, "name": "Ravinder Sharma", "phone": "9213125139", "type": "Individual"}, {"id": 97, "name": "Satnam Singh", "phone": "8178455727", "type": "Individual"}, {"id": 98, "name": "REALPRO REALTY SOLUTIONS PVT LTD", "phone": "9650322121", "type": "Company"}, {"id": 99, "name": "Satpal", "phone": "9728913420", "type": "Individual"}, {"id": 100, "name": "Rengkhumphak Aning Koireng", "phone": "9582834267", "type": "Individual"}, {"id": 101, "name": "SAXO GROUP INDIA PRIVATE LIMITED", "phone": "9810554700", "type": "Company"}, {"id": 102, "name": "Renu Kumari", "phone": "9654862322", "type": "Individual"}, {"id": 103, "name": "SAXO GROUP INDIA PVT LTD", "phone": "8010818190", "type": "Company"}, {"id": 104, "name": "Renuka Arora", "phone": "9717888540", "type": "Individual"}, {"id": 105, "name": "SCHNEIDER ELCECTRIC PVT LTD", "phone": "9811044443", "type": "Company"}, {"id": 106, "name": "Reshma", "phone": "8586991331", "type": "Individual"}, {"id": 107, "name": "SCHNEIDER ELECTRIC PVT LTD", "phone": "8860622226", "type": "Company"}, {"id": 108, "name": "Rishabh Jain", "phone": "8447662861", "type": "Individual"}, {"id": 109, "name": "Seema Makkar", "phone": "9958875522", "type": "Individual"}, {"id": 110, "name": "Rishabh Kapoor", "phone": "9711141143", "type": "Individual"}, {"id": 111, "name": "Seema Rani", "phone": "9990116919", "type": "Individual"}, {"id": 112, "name": "Rishabh Kumar", "phone": "9650862481", "type": "Individual"}, {"id": 113, "name": "Shail Gupta", "phone": "9811102332", "type": "Individual"}, {"id": 114, "name": "Rishi Kant", "phone": "8860970480", "type": "Individual"}, {"id": 115, "name": "Shalini Ramaul", "phone": "9872154440", "type": "Individual"}, {"id": 116, "name": "Rohit Dhawan", "phone": "9971536451", "type": "Individual"}, {"id": 117, "name": "Shammi Kumar", "phone": "9891824474", "type": "Individual"}, {"id": 118, "name": "Roshan Lal Batra", "phone": "9891482878", "type": "Individual"}, {"id": 119, "name": "Shefali Singh", "phone": "9654180813", "type": "Individual"}, {"id": 120, "name": "Ruby Khan", "phone": "9871601786", "type": "Individual"}, {"id": 121, "name": "Shivam Makhija", "phone": "8527745730", "type": "Individual"}, {"id": 122, "name": "S Aji Viswanath", "phone": "8800103137", "type": "Individual"}, {"id": 123, "name": "Shivam Sharma", "phone": "9311683093", "type": "Individual"}, {"id": 124, "name": "S Ram Mohan", "phone": "9481587367", "type": "Individual"}, {"id": 125, "name": "Shivani Rana", "phone": "8130327035", "type": "Individual"}, {"id": 126, "name": "Sachin", "phone": "9911170391", "type": "Individual"}, {"id": 127, "name": "Shivendra Singh Chauhan", "phone": "7060474253", "type": "Individual"}, {"id": 128, "name": "Sagar Giri", "phone": "9837994690", "type": "Individual"}, {"id": 129, "name": "Shobhit Mishra", "phone": "8130437845", "type": "Individual"}, {"id": 130, "name": "Sahil", "phone": "8750990992", "type": "Individual"}, {"id": 131, "name": "Shubhang Srivastava", "phone": "8800512156", "type": "Individual"}, {"id": 132, "name": "Sahil Mahajan", "phone": "9015668564", "type": "Individual"}, {"id": 133, "name": "Shubika Goel", "phone": "8527193222", "type": "Individual"}, {"id": 134, "name": "Sahil Mathur", "phone": "9999737752", "type": "Individual"}, {"id": 135, "name": "Shukla Wassan", "phone": "9811203597", "type": "Individual"}, {"id": 136, "name": "Samta Chopra", "phone": "9540589889", "type": "Individual"}, {"id": 137, "name": "Shweta Verma", "phone": "8130598033", "type": "Individual"}, {"id": 138, "name": "Sanchita Khanna", "phone": "9999280387", "type": "Individual"}, {"id": 139, "name": "SIGNATURE GLOBAL INDIA LIMITED", "phone": "9810997975", "type": "Company"}, {"id": 140, "name": "Sandeep Kumar", "phone": "9911330652", "type": "Individual"}, {"id": 141, "name": "SOLANKI HYDRAULICS", "phone": "9910496594", "type": "Company"}, {"id": 142, "name": "Sandeep Sharma", "phone": "9811082259", "type": "Individual"}, {"id": 143, "name": "Sonika Aggarwal", "phone": "9625539905", "type": "Individual"}, {"id": 144, "name": "Sandeep Singh", "phone": "9213811301", "type": "Individual"}, {"id": 145, "name": "Sonu Yadav", "phone": "9064337322", "type": "Individual"}, {"id": 146, "name": "Sanjay Kumar", "phone": "9999348036", "type": "Individual"}, {"id": 147, "name": "Sparsh Khandelwal", "phone": "7665077732", "type": "Individual"}, {"id": 148, "name": "Sanjay Kumar", "phone": "9910947778", "type": "Individual"}, {"id": 149, "name": "Srishti Chhabra", "phone": "9611542240", "type": "Individual"}, {"id": 150, "name": "Sanjay Kumar", "phone": "9810959972", "type": "Individual"}, {"id": 151, "name": "ST PATRICKS REALTY PVT LTD", "phone": "9999038266", "type": "Company"}, {"id": 152, "name": "Sanjay Kumar Agarwal", "phone": "9968436855", "type": "Individual"}, {"id": 153, "name": "Sudhanshu Ahuja", "phone": "8859333798", "type": "Individual"}, {"id": 154, "name": "Sanjay Kumar Mudgil", "phone": "9811946012", "type": "Individual"}, {"id": 155, "name": "Sukhbir", "phone": "8510860072", "type": "Individual"}, {"id": 156, "name": "Sanjay Kumar Sahni", "phone": "9818965257", "type": "Individual"}, {"id": 157, "name": "Sulinder Kumar", "phone": "9560220147", "type": "Individual"}, {"id": 158, "name": "Sanjeet Kumar Singh", "phone": "8287666721", "type": "Individual"}, {"id": 159, "name": "Suman Ghanghas", "phone": "8802894000", "type": "Individual"}, {"id": 160, "name": "Sanjeev Kumar Jha", "phone": "9643924907", "type": "Individual"}, {"id": 161, "name": "Suman Thakur", "phone": "9599598294", "type": "Individual"}, {"id": 162, "name": "Sanjeev Mehta", "phone": "9818877599", "type": "Individual"}, {"id": 163, "name": "Sumeet Rana", "phone": "8077513199", "type": "Individual"}, {"id": 164, "name": "Santosh Kumar Gupta", "phone": "9873146145", "type": "Individual"}, {"id": 165, "name": "Sumit Bhati", "phone": "8447790906", "type": "Individual"}, {"id": 166, "name": "Sapna Razdan", "phone": "9818428466", "type": "Individual"}, {"id": 167, "name": "SUN PHARMACEUTICAL INDUSTRIES LT", "phone": "9711779907", "type": "Company"}, {"id": 168, "name": "Sarika Sharma", "phone": "9811402447", "type": "Individual"}, {"id": 169, "name": "Sunil Kumar", "phone": "9811776012", "type": "Individual"}, {"id": 170, "name": "Sarvesh Kumar", "phone": "7503007998", "type": "Individual"}, {"id": 171, "name": "Sunny Dagar", "phone": "9813611022", "type": "Individual"}, {"id": 172, "name": "Satender", "phone": "9212171259", "type": "Individual"}, {"id": 173, "name": "Sunny Naagar", "phone": "9990755388", "type": "Individual"}, {"id": 174, "name": "Satnarain Sharma", "phone": "9416874264", "type": "Individual"}, {"id": 175, "name": "Suraj Singh", "phone": "8510847878", "type": "Individual"}, {"id": 176, "name": "Satya Narain Sharma", "phone": "9818797586", "type": "Individual"}, {"id": 177, "name": "Surender Kumar Kapoor", "phone": "9811068678", "type": "Individual"}, {"id": 178, "name": "Satya Prakash Dhariwal", "phone": "9717534706", "type": "Individual"}, {"id": 179, "name": "Surender Singh", "phone": "9910360970", "type": "Individual"}, {"id": 180, "name": "Satyendra Kumar", "phone": "9350842218", "type": "Individual"}, {"id": 181, "name": "Surendra Pal Singh Chauhan", "phone": "9909367960", "type": "Individual"}, {"id": 182, "name": "Saurabh Kumar Pandey", "phone": "8826395804", "type": "Individual"}, {"id": 183, "name": "Suresh Chand", "phone": "9350951263", "type": "Individual"}, {"id": 184, "name": "Saurabh Pandey", "phone": "9350996158", "type": "Individual"}, {"id": 185, "name": "Surinder Jaswal", "phone": "9891124441", "type": "Individual"}, {"id": 186, "name": "Shabana Gulzar", "phone": "9910269624", "type": "Individual"}, {"id": 187, "name": "Surjeet Singh", "phone": "9875208566", "type": "Individual"}, {"id": 188, "name": "Shailender Kumar Sharma", "phone": "9999442159", "type": "Individual"}, {"id": 189, "name": "Sushil Kumar Rathore", "phone": "9582186514", "type": "Individual"}, {"id": 190, "name": "Shailendra Singh", "phone": "9818414103", "type": "Individual"}, {"id": 191, "name": "Sushila Yadav", "phone": "8901235244", "type": "Individual"}, {"id": 192, "name": "SHAKUN ENTERPRISES", "phone": "9810188693", "type": "Company"}, {"id": 193, "name": "Swati Arora Sood", "phone": "9899868888", "type": "Individual"}, {"id": 194, "name": "Shalini Singh", "phone": "8130135720", "type": "Individual"}, {"id": 195, "name": "Tanmaya Sharma", "phone": "7073509747", "type": "Individual"}, {"id": 196, "name": "Shamsuddin Shams", "phone": "9953524321", "type": "Individual"}, {"id": 197, "name": "Tanshita Srivastava", "phone": "7032921701", "type": "Individual"}, {"id": 198, "name": "Shanky Jain", "phone": "9312869696", "type": "Individual"}, {"id": 199, "name": "Tanveer Singh", "phone": "9588568840", "type": "Individual"}, {"id": 200, "name": "Shashi Bhatt", "phone": "7838401182", "type": "Individual"}];

  // Load custom jobs or default 4 jobs
  const DEFAULT_CAREER_JOBS = [
    {
      id: "job-1",
      title: "Senior Portfolio Advisor — Luxury & Commercial",
      department: "Advisory & Capital Markets",
      location: "Noida Sector 140A / Hybrid",
      experience: "3-6 Years",
      package: "₹8.0 - 15.0 LPA + High Performance Incentives",
      type: "Full-Time",
      description: "Drive high-ticket residential and commercial advisory across Noida Expressway and Yamuna Expressway corridors. Act as the trusted fiduciary advisor for high-net-worth investors.",
      active: true
    },
    {
      id: "job-2",
      title: "Commercial Real Estate Strategist",
      department: "Commercial & Retail Leasing",
      location: "Noida / Greater Noida",
      experience: "2-5 Years",
      package: "₹6.5 - 12.0 LPA + Uncapped Commission",
      type: "Full-Time",
      description: "Manage relationships with corporate tenants and retail investors. Underwrite lease agreements, rental yield models, and secure pre-leased allocations.",
      active: true
    },
    {
      id: "job-3",
      title: "Luxury Vacation Homes & Land Consultant",
      department: "Regional Land & Holiday Homes",
      location: "Noida / North Goa (MOPA Corridor)",
      experience: "2-4 Years",
      package: "₹6.0 - 11.0 LPA + Deal Incentives",
      type: "Full-Time",
      description: "Advise clients on strategic land acquisitions, RERA township plots, and holiday home developments in emerging corridors including North Goa and Greater Noida.",
      active: true
    },
    {
      id: "job-4",
      title: "Digital Growth & Content Strategist",
      department: "Marketing & Institutional Growth",
      location: "Noida / Hybrid",
      experience: "1-3 Years",
      package: "₹4.5 - 8.0 LPA + Performance Bonus",
      type: "Full-Time",
      description: "Lead R4Realty's digital footprint across real estate analytics, architectural blueprints, case studies, and high-conversion client acquisition channels.",
      active: true
    }
  ];

  if (!document.getElementById('admin-leads-modal')) {
    const modalHTML = `
      <div class="modal-backdrop" id="admin-leads-modal">
        <div class="modal-content" style="max-width: 1140px; max-height: 92vh; display: flex; flex-direction: column;">
          <div class="modal-header" style="flex-shrink: 0;">
            <div>
              <h3 style="margin: 0; font-size: 17px;"><i class="fas fa-chart-line" style="color: var(--accent);"></i> R4Realty Multi-Module Admin CRM Suite</h3>
              <div style="font-family: var(--font-mono); font-size: 10.5px; color: var(--muted); margin-top: 2px;">Inbound Leads &middot; 200 Contacts Tele-Calling Dialer &middot; Live Career Manager &middot; Project Editor</div>
            </div>
            <button class="close-modal-btn" id="close-leads-modal">&times;</button>
          </div>

          <div class="modal-body" style="padding: 18px; overflow-y: auto; flex: 1;">
            
            <!-- 1. PIN Security Login Screen -->
            <div id="admin-login-screen">
              <div class="admin-auth-container">
                <i class="fas fa-shield-alt"></i>
                <h4>Admin Security Check</h4>
                <p>Please enter the administrator access PIN to unlock the CRM dashboard.</p>
                <div class="form-group" style="width: 100%; margin: 12px 0;">
                  <input type="password" id="admin-pass-input" class="form-input" placeholder="Enter Access PIN" autofocus />
                </div>
                <button class="cta-button" id="admin-login-btn"><i class="fas fa-unlock"></i> Unlock Dashboard</button>
              </div>
            </div>

            <!-- 2. Multi-Tab Admin Suite Content -->
            <div id="admin-dashboard-content" style="display: none;">
              
              <!-- Tab Navigation Bar -->
              <div class="admin-tab-nav">
                <button type="button" class="admin-tab-btn active" data-tab="tab-inbound-leads">
                  <i class="fas fa-inbox"></i> Inbound Pipeline (<span id="tab-inbound-count">0</span>)
                </button>
                <button type="button" class="admin-tab-btn" data-tab="tab-dialer-console">
                  <i class="fas fa-phone-volume"></i> Outbound Dialer (<span id="dialer-tab-count">200</span> Leads)
                </button>
                <button type="button" class="admin-tab-btn" data-tab="tab-career-manager">
                  <i class="fas fa-briefcase"></i> Post &amp; Manage Jobs
                </button>
                <button type="button" class="admin-tab-btn" data-tab="tab-project-editor">
                  <i class="fas fa-building"></i> Project &amp; Price Editor
                </button>
                <button type="button" class="admin-tab-btn" data-tab="tab-portal-settings">
                  <i class="fas fa-sliders-h"></i> Portal Settings
                </button>
              </div>

              <!-- ==============================================================
                   TAB 1: INBOUND LEADS & TALENT PIPELINE
                   ============================================================== -->
              <div class="admin-tab-panel active" id="tab-inbound-leads">
                <!-- Stats Row -->
                <div class="modal-actions" style="margin-bottom: 12px;">
                  <div class="dashboard-stats" id="crmStatsContainer">
                    <div class="dashboard-stat-card active" data-status-filter="ALL">
                      <span>Total Leads</span>
                      <h4 id="stat-total-leads">0</h4>
                    </div>
                    <div class="dashboard-stat-card" data-status-filter="New">
                      <span style="color: #2196f3;">New</span>
                      <h4 id="stat-new-leads" style="color: #2196f3;">0</h4>
                    </div>
                    <div class="dashboard-stat-card" data-status-filter="Contacted">
                      <span style="color: #ff9800;">Contacted</span>
                      <h4 id="stat-contacted-leads" style="color: #ff9800;">0</h4>
                    </div>
                    <div class="dashboard-stat-card" data-status-filter="Qualified">
                      <span style="color: #9c27b0;">Qualified</span>
                      <h4 id="stat-qualified-leads" style="color: #9c27b0;">0</h4>
                    </div>
                    <div class="dashboard-stat-card" data-status-filter="Closed">
                      <span style="color: #4caf50;">Closed</span>
                      <h4 id="stat-closed-leads" style="color: #4caf50;">0</h4>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="cta-button secondary" id="refresh-crm-btn" title="Refresh Live Database"><i class="fas fa-sync-alt"></i> Sync</button>
                    <button class="cta-button secondary" id="clear-leads-btn" title="Clear all records"><i class="fas fa-trash"></i> Reset</button>
                    <button class="cta-button" id="export-leads-btn" title="Export as CSV/Excel"><i class="fas fa-file-csv"></i> Export CSV</button>
                  </div>
                </div>

                <!-- Filter & Search Controls Bar -->
                <div class="crm-controls-bar">
                  <div class="crm-search-box">
                    <i class="fas fa-search" style="color: var(--muted);"></i>
                    <input type="text" id="crmSearchInput" placeholder="Search inquiries by name, phone, project, email, or notes..." />
                  </div>
                </div>
                
                <!-- Leads Table -->
                <div class="table-responsive" style="max-height: 440px; overflow-y: auto;">
                  <table class="leads-table">
                    <thead>
                      <tr>
                        <th style="width: 130px;">Date &amp; Time</th>
                        <th style="width: 190px;">Contact Info</th>
                        <th style="width: 170px;">Project / Role</th>
                        <th>Inquiry / Notes</th>
                        <th style="width: 120px;">Status</th>
                        <th style="width: 110px; text-align: center;">Actions</th>
                      </tr>
                    </thead>
                    <tbody id="leads-table-body">
                      <!-- Dynamic Rows -->
                    </tbody>
                  </table>
                </div>
                <div id="no-leads-message" class="empty-leads-state" style="display: none;">
                  <i class="far fa-folder-open"></i>
                  <p>No matching inquiries or job applications found.</p>
                </div>
              </div>

              <!-- ==============================================================
                   TAB 2: OUTBOUND CALL CONSOLE (200 LEADS DIALER)
                   ============================================================== -->
              <div class="admin-tab-panel" id="tab-dialer-console">
                <div class="dialer-container">
                  <div class="dialer-header-card">
                    <div class="dialer-stats-row">
                      <div class="dialer-ring-box">
                        <svg width="58" height="58" viewBox="0 0 58 58">
                          <circle class="dialer-ring-track" cx="29" cy="29" r="25"></circle>
                          <circle id="dialerRingFill" class="dialer-ring-fill" cx="29" cy="29" r="25" stroke-dasharray="0 157"></circle>
                        </svg>
                        <div class="dialer-ring-pct" id="dialerRingPct">0%</div>
                      </div>
                      
                      <div class="dialer-chips-row">
                        <div class="dialer-stat-chip">
                          <div class="val" id="dialer-total-val">200</div>
                          <div class="lbl">Total List</div>
                        </div>
                        <div class="dialer-stat-chip">
                          <div class="val" style="color: #2196f3;" id="dialer-called-val">0</div>
                          <div class="lbl">Called</div>
                        </div>
                        <div class="dialer-stat-chip">
                          <div class="val" style="color: #4caf50;" id="dialer-interested-val">0</div>
                          <div class="lbl">Interested</div>
                        </div>
                        <div class="dialer-stat-chip">
                          <div class="val" style="color: #ff9800;" id="dialer-callback-val">0</div>
                          <div class="lbl">Call Back</div>
                        </div>
                        <div class="dialer-stat-chip">
                          <div class="val" style="color: #2e7d32;" id="dialer-closed-val">0</div>
                          <div class="lbl">Closed</div>
                        </div>
                      </div>

                      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <input type="file" id="dialerCsvFileInput" accept=".csv, .txt" style="display: none;" />
                        <button type="button" class="cta-button" id="import-dialer-csv-trigger" title="Upload custom CSV leads list">
                          <i class="fas fa-file-upload"></i> Upload CSV
                        </button>
                        <button type="button" class="cta-button secondary" id="export-dialer-csv-btn">
                          <i class="fas fa-download"></i> Save CSV
                        </button>
                        <button type="button" class="cta-button secondary" id="download-dialer-template-btn" title="Download sample CSV format">
                          <i class="fas fa-file-alt"></i> Template
                        </button>
                        <button type="button" class="cta-button secondary" id="reset-dialer-btn" title="Reset dialer progress">
                          <i class="fas fa-undo"></i> Reset
                        </button>
                      </div>
                    </div>

                    <!-- Dialer Search & Filter Row -->
                    <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
                      <div class="crm-search-box" style="flex: 1; min-width: 220px;">
                        <i class="fas fa-search" style="color: var(--muted);"></i>
                        <input type="text" id="dialerSearchInput" placeholder="Search by contact name or phone number..." />
                      </div>
                      <select id="dialerFilterSelect" class="dialer-status-select" style="min-width: 150px; font-weight: 600;">
                        <option value="ALL">All Contacts (200)</option>
                        <option value="not_called">Not Called</option>
                        <option value="interested">Interested</option>
                        <option value="call_back">Call Back</option>
                        <option value="no_answer">No Answer</option>
                        <option value="deal_closed">Deal Closed</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                    </div>
                  </div>

                  <!-- Dialer Lead Cards Grid -->
                  <div class="dialer-cards-list" id="dialerCardsContainer">
                    <!-- Dynamic dialer lead cards -->
                  </div>
                </div>
              </div>

              <!-- ==============================================================
                   TAB 3: POST & MANAGE CAREER JOBS
                   ============================================================== -->
              <div class="admin-tab-panel" id="tab-career-manager">
                <div class="crm-job-grid">
                  <!-- Left: Job Creation Form -->
                  <div class="crm-form-card">
                    <div class="crm-form-title"><i class="fas fa-plus-circle"></i> Post New Job Opening</div>
                    <form id="crmPostJobForm">
                      <div class="form-group" style="margin-bottom: 10px;">
                        <label class="form-label">Job Title *</label>
                        <input type="text" id="newJobTitle" class="form-input" placeholder="e.g. Senior Commercial Asset Consultant" required />
                      </div>

                      <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <div>
                          <label class="form-label">Department *</label>
                          <select id="newJobDept" class="form-select" required>
                            <option value="Advisory &amp; Sales">Advisory &amp; Sales</option>
                            <option value="Commercial &amp; Retail Leasing">Commercial &amp; Retail Leasing</option>
                            <option value="Regional Land &amp; Holiday Homes">Regional Land &amp; Holiday Homes</option>
                            <option value="Marketing &amp; Digital Growth">Marketing &amp; Digital Growth</option>
                            <option value="Operations &amp; Legal Compliance">Operations &amp; Legal Compliance</option>
                          </select>
                        </div>
                        <div>
                          <label class="form-label">Location &amp; Work Mode *</label>
                          <input type="text" id="newJobLoc" class="form-input" placeholder="e.g. Noida Sector 140A / Hybrid" required />
                        </div>
                      </div>

                      <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                        <div>
                          <label class="form-label">Experience Required</label>
                          <input type="text" id="newJobExp" class="form-input" placeholder="e.g. 2-5 Years" required />
                        </div>
                        <div>
                          <label class="form-label">Compensation / CTC</label>
                          <input type="text" id="newJobPackage" class="form-input" placeholder="e.g. ₹6.0 - 12.0 LPA + Incentives" required />
                        </div>
                      </div>

                      <div class="form-group" style="margin-bottom: 14px;">
                        <label class="form-label">Role Overview &amp; Key Responsibilities *</label>
                        <textarea id="newJobDesc" class="form-textarea" rows="3" placeholder="Brief outline of duties, deal types, and candidate profile..." required></textarea>
                      </div>

                      <button type="submit" class="cta-button" style="width: 100%; justify-content: center;">
                        <i class="fas fa-check-circle"></i> Publish Job to Careers Page
                      </button>
                    </form>
                  </div>

                  <!-- Right: Live Active Job Postings -->
                  <div>
                    <div class="crm-form-title"><i class="fas fa-list-ul"></i> Active Career Postings (<span id="activeJobsCount">4</span>)</div>
                    <div class="crm-job-list" id="crmLiveJobsContainer">
                      <!-- Dynamic Job Items -->
                    </div>
                  </div>
                </div>
              </div>

              <!-- ==============================================================
                   TAB 4: PROJECT CATALOG & PRICING EDITOR
                   ============================================================== -->
              <div class="admin-tab-panel" id="tab-project-editor">
                <div class="crm-form-card" style="margin-bottom: 16px;">
                  <div class="crm-form-title"><i class="fas fa-tags"></i> Live Project Pricing &amp; Inventory Data Editor</div>
                  <p style="font-size: 12px; color: var(--muted); margin-bottom: 14px;">
                    Update listed price ranges, sizes, and highlight tags. Changes immediately sync with local cache and portal listings.
                  </p>

                  <div class="table-responsive">
                    <table class="crm-project-editor-table">
                      <thead>
                        <tr>
                          <th style="width: 180px;">Project Name</th>
                          <th style="width: 150px;">Location</th>
                          <th style="width: 180px;">Starting Price</th>
                          <th style="width: 160px;">Sizes Range</th>
                          <th>Highlight Tag</th>
                        </tr>
                      </thead>
                      <tbody id="crmProjectEditorRows">
                        <!-- Dynamic Project Rows -->
                      </tbody>
                    </table>
                  </div>

                  <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px;">
                    <button type="button" class="cta-button" id="save-project-data-btn">
                      <i class="fas fa-save"></i> Save Project Changes
                    </button>
                  </div>
                </div>
              </div>

              <!-- ==============================================================
                   TAB 5: PORTAL SETTINGS & CONFIGURATION
                   ============================================================== -->
              <div class="admin-tab-panel" id="tab-portal-settings">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  
                  <!-- Security Settings Card -->
                  <div class="crm-form-card">
                    <div class="crm-form-title"><i class="fas fa-key"></i> Administrator Security PIN</div>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Change the security passcode required to access this CRM panel.</p>
                    
                    <div class="form-group" style="margin-bottom: 10px;">
                      <label class="form-label">Current PIN</label>
                      <input type="password" id="settingsCurrentPin" class="form-input" placeholder="Current PIN" />
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                      <label class="form-label">New PIN</label>
                      <input type="password" id="settingsNewPin" class="form-input" placeholder="Enter new PIN" />
                    </div>
                    <button type="button" class="cta-button secondary" id="update-pin-btn">
                      <i class="fas fa-lock"></i> Update Access PIN
                    </button>
                  </div>

                  <!-- Fiduciary & Contact Details Card -->
                  <div class="crm-form-card">
                    <div class="crm-form-title"><i class="fas fa-id-badge"></i> Consultant Contact Info</div>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Primary contact numbers displayed across WhatsApp and call triggers.</p>
                    
                    <div class="form-group" style="margin-bottom: 10px;">
                      <label class="form-label">Primary Hotline / WhatsApp</label>
                      <input type="text" id="settingsPhone" class="form-input" value="+91 78384 16570" />
                    </div>
                    <div class="form-group" style="margin-bottom: 12px;">
                      <label class="form-label">Inquiry Email Address</label>
                      <input type="email" id="settingsEmail" class="form-input" value="info@r4realty.in" />
                    </div>
                    <button type="button" class="cta-button secondary" id="save-contact-info-btn">
                      <i class="fas fa-save"></i> Save Contact Info
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  const modal = document.getElementById('admin-leads-modal');
  const closeBtn = document.getElementById('close-leads-modal');
  const loginScreen = document.getElementById('admin-login-screen');
  const dashboardContent = document.getElementById('admin-dashboard-content');
  const loginBtn = document.getElementById('admin-login-btn');
  const passInput = document.getElementById('admin-pass-input');
  const exportBtn = document.getElementById('export-leads-btn');
  const clearBtn = document.getElementById('clear-leads-btn');
  const refreshBtn = document.getElementById('refresh-crm-btn');
  const searchInput = document.getElementById('crmSearchInput');
  const statCards = document.querySelectorAll('#crmStatsContainer .dashboard-stat-card');

  // Multi-Tab Switching Logic
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetTab = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetTab);
      if (targetPanel) targetPanel.classList.add('active');

      if (targetTab === 'tab-dialer-console') {
        renderDialerConsole();
      } else if (targetTab === 'tab-career-manager') {
        renderCareerManager();
      } else if (targetTab === 'tab-project-editor') {
        renderProjectEditor();
      }
    });
  });

  // Open modal trigger
  adminBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
    if (!activeAdminPin) {
      loginScreen.style.display = 'block';
      dashboardContent.style.display = 'none';
      passInput.value = '';
      setTimeout(() => passInput.focus(), 150);
    } else {
      loginScreen.style.display = 'none';
      dashboardContent.style.display = 'block';
      refreshLeadsTable();
      renderDialerConsole();
      renderCareerManager();
      renderProjectEditor();
    }
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Login handler
  loginBtn.addEventListener('click', () => {
    const pass = passInput.value.trim();
    if (!pass) {
      showToast('PIN Required', 'Please enter your administrator PIN.', 'error');
      return;
    }

    // Authenticate exclusively via Server PIN Header
    fetch('/api/leads', {
      headers: { 'X-Admin-Pin': pass }
    })
    .then(res => {
      if (res.status === 401) {
        showToast('Access Denied', 'Invalid administrator security PIN.', 'error');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Server error');
      return res.json();
    })
    .then(data => {
      activeAdminPin = pass;
      loginScreen.style.display = 'none';
      dashboardContent.style.display = 'block';
      if (Array.isArray(data)) {
        crmAllLeads = data;
        localStorage.setItem('r4realty_leads', JSON.stringify(crmAllLeads));
      }
      renderCrmTable();
      renderDialerConsole();
      renderCareerManager();
      renderProjectEditor();
      showToast('Authenticated', 'Admin CRM Suite unlocked successfully.', 'success');
    })
    .catch(err => {
      if (err.message === 'Unauthorized') return;
      showToast('Connection Error', 'Failed to connect to backend server for verification.', 'error');
    });
  });

  passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  // Inbound Leads Search & Filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      crmCurrentSearch = e.target.value.toLowerCase().trim();
      renderCrmTable();
    });
  }

  statCards.forEach(card => {
    card.addEventListener('click', () => {
      statCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      crmCurrentFilter = card.getAttribute('data-status-filter') || 'ALL';
      renderCrmTable();
    });
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshLeadsTable();
      showToast('Syncing', 'Refreshing latest leads from database...', 'info');
    });
  }

  // Export Inbound Leads to CSV
  exportBtn.addEventListener('click', () => {
    if (crmAllLeads.length === 0) {
      showToast('No Records', 'There are no leads to export.', 'info');
      return;
    }
    const headers = ['ID', 'Timestamp', 'Name', 'Phone', 'Email', 'Project_Role', 'Status', 'Message'];
    const csvRows = [headers.join(',')];
    crmAllLeads.forEach(l => {
      const row = [
        csvSafeCell(l.id),
        csvSafeCell(l.timestamp),
        csvSafeCell(l.name),
        csvSafeCell(l.phone),
        csvSafeCell(l.email),
        csvSafeCell(l.project),
        csvSafeCell(l.status || 'New'),
        csvSafeCell(l.message)
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `R4Realty_Inbound_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Inbound leads CSV generated.', 'success');
  });

  // Clear Inbound Leads
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all inbound leads history? This action cannot be undone.')) {
      if (activeAdminPin) {
        fetch('/api/leads', {
          method: 'DELETE',
          headers: { 'X-Admin-Pin': activeAdminPin }
        }).catch(() => {});
      }
      localStorage.removeItem('r4realty_leads');
      crmAllLeads = [];
      renderCrmTable();
      showToast('Database Reset', 'All inbound lead records cleared.', 'success');
    }
  });

  // =========================================================================
  // MODULE 2: OUTBOUND CALL CONSOLE & CSV IMPORTER LOGIC
  // =========================================================================
  let currentDialerContacts = [];
  try {
    const savedContacts = localStorage.getItem('r4realty_custom_dialer_contacts');
    if (savedContacts) {
      currentDialerContacts = JSON.parse(savedContacts);
    } else {
      currentDialerContacts = DEFAULT_DIALER_CONTACTS;
      localStorage.setItem('r4realty_custom_dialer_contacts', JSON.stringify(currentDialerContacts));
    }
  } catch (e) {
    currentDialerContacts = DEFAULT_DIALER_CONTACTS;
  }

  let dialerState = {};
  try {
    const savedDialer = localStorage.getItem('r4realty_dialer_state');
    if (savedDialer) dialerState = JSON.parse(savedDialer);
  } catch (e) {}

  function saveDialerState() {
    localStorage.setItem('r4realty_dialer_state', JSON.stringify(dialerState));
  }

  function saveDialerContacts() {
    localStorage.setItem('r4realty_custom_dialer_contacts', JSON.stringify(currentDialerContacts));
  }

  function renderDialerConsole() {
    const container = document.getElementById('dialerCardsContainer');
    const searchEl = document.getElementById('dialerSearchInput');
    const filterEl = document.getElementById('dialerFilterSelect');
    if (!container) return;

    const searchTerm = (searchEl ? searchEl.value : '').toLowerCase().trim();
    const filterStatus = filterEl ? filterEl.value : 'ALL';

    // Calculate metrics
    let calledCount = 0;
    let interestedCount = 0;
    let callbackCount = 0;
    let closedCount = 0;

    currentDialerContacts.forEach(contact => {
      const state = dialerState[contact.id] || { status: 'not_called', note: '' };
      if (state.status && state.status !== 'not_called') calledCount++;
      if (state.status === 'interested') interestedCount++;
      if (state.status === 'call_back') callbackCount++;
      if (state.status === 'deal_closed') closedCount++;
    });

    const total = currentDialerContacts.length;
    const pct = total > 0 ? Math.round((calledCount / total) * 100) : 0;

    const tabCountEl = document.getElementById('dialer-tab-count');
    if (tabCountEl) tabCountEl.textContent = total;
    if (filterEl && filterEl.options[0]) filterEl.options[0].textContent = `All Contacts (${total})`;

    const totalValEl = document.getElementById('dialer-total-val');
    const calledValEl = document.getElementById('dialer-called-val');
    const interestedValEl = document.getElementById('dialer-interested-val');
    const callbackValEl = document.getElementById('dialer-callback-val');
    const closedValEl = document.getElementById('dialer-closed-val');
    const ringPctEl = document.getElementById('dialerRingPct');
    const ringFillEl = document.getElementById('dialerRingFill');

    if (totalValEl) totalValEl.textContent = total;
    if (calledValEl) calledValEl.textContent = calledCount;
    if (interestedValEl) interestedValEl.textContent = interestedCount;
    if (callbackValEl) callbackValEl.textContent = callbackCount;
    if (closedValEl) closedValEl.textContent = closedCount;
    if (ringPctEl) ringPctEl.textContent = `${pct}%`;
    if (ringFillEl) {
      const offset = (pct / 100) * 157;
      ringFillEl.setAttribute('stroke-dasharray', `${offset} 157`);
    }

    // Filter contacts
    const filteredContacts = currentDialerContacts.filter(contact => {
      const state = dialerState[contact.id] || { status: 'not_called', note: '' };
      if (filterStatus !== 'ALL' && state.status !== filterStatus) return false;

      if (searchTerm) {
        const text = `${contact.name} ${contact.phone} ${contact.type}`.toLowerCase();
        if (!text.includes(searchTerm)) return false;
      }
      return true;
    });

    container.innerHTML = '';

    if (filteredContacts.length === 0) {
      container.innerHTML = `
        <div class="empty-leads-state">
          <i class="fas fa-phone-slash"></i>
          <p>No contacts match the active filter or search.</p>
        </div>
      `;
      return;
    }

    filteredContacts.forEach(contact => {
      const state = dialerState[contact.id] || { status: 'not_called', note: '' };
      const isDone = state.status && state.status !== 'not_called';
      const cleanPhone = (contact.phone || '').replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      const waMsg = `Hi ${encodeURIComponent(contact.name)}, this is Rajveer Singh from R4Realty. Sharing verified property investment opportunities across Noida Expressway &amp; Goa.`;

      const card = document.createElement('div');
      card.className = `dialer-lead-card ${isDone ? 'done' : ''}`;
      card.innerHTML = `
        <div class="dialer-card-top">
          <div>
            <div class="dialer-lead-name">#${contact.id} &middot; ${escapeHTML(contact.name)}</div>
            <div class="dialer-lead-phone">${escapeHTML(contact.phone)} &middot; <span style="font-size: 10px; color: var(--muted); text-transform: uppercase;">${escapeHTML(contact.type)}</span></div>
          </div>
          <div class="dialer-actions">
            <a href="tel:${contact.phone}" class="dialer-call-btn" title="Call directly">
              <i class="fas fa-phone-alt"></i> Call
            </a>
            <a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="dialer-call-btn" style="background: #2e7d32; border-color: #2e7d32;" title="WhatsApp Chat">
              <i class="fab fa-whatsapp"></i> Chat
            </a>
          </div>
        </div>
        <div class="dialer-card-bottom">
          <select class="dialer-status-select" data-contact-id="${contact.id}">
            <option value="not_called" ${state.status === 'not_called' ? 'selected' : ''}>Not Called</option>
            <option value="interested" ${state.status === 'interested' ? 'selected' : ''}>Interested</option>
            <option value="call_back" ${state.status === 'call_back' ? 'selected' : ''}>Call Back</option>
            <option value="no_answer" ${state.status === 'no_answer' ? 'selected' : ''}>No Answer</option>
            <option value="deal_closed" ${state.status === 'deal_closed' ? 'selected' : ''}>Deal Closed</option>
            <option value="not_interested" ${state.status === 'not_interested' ? 'selected' : ''}>Not Interested</option>
            <option value="wrong_number" ${state.status === 'wrong_number' ? 'selected' : ''}>Wrong Number</option>
          </select>
          <input type="text" class="dialer-note-input" data-contact-id="${contact.id}" placeholder="Quick notes (e.g. Budget 2Cr, wants Sec 150 3BHK)..." value="${escapeHTML(state.note || '')}" />
        </div>
      `;

      // Attach Status Change Listener
      const selectEl = card.querySelector('select');
      selectEl.addEventListener('change', (e) => {
        const id = contact.id;
        if (!dialerState[id]) dialerState[id] = { status: 'not_called', note: '' };
        dialerState[id].status = e.target.value;
        saveDialerState();
        renderDialerConsole();
      });

      // Attach Note Input Listener
      const noteInput = card.querySelector('input.dialer-note-input');
      noteInput.addEventListener('blur', (e) => {
        const id = contact.id;
        if (!dialerState[id]) dialerState[id] = { status: 'not_called', note: '' };
        dialerState[id].note = e.target.value;
        saveDialerState();
      });

      container.appendChild(card);
    });
  }

  // Dialer Search and Filter Listeners
  const dialerSearchInput = document.getElementById('dialerSearchInput');
  if (dialerSearchInput) {
    dialerSearchInput.addEventListener('input', () => renderDialerConsole());
  }

  const dialerFilterSelect = document.getElementById('dialerFilterSelect');
  if (dialerFilterSelect) {
    dialerFilterSelect.addEventListener('change', () => renderDialerConsole());
  }

  // Export Dialer CSV
  const exportDialerCsvBtn = document.getElementById('export-dialer-csv-btn');
  if (exportDialerCsvBtn) {
    exportDialerCsvBtn.addEventListener('click', () => {
      const headers = ['ID', 'Name', 'Phone', 'Type', 'Status', 'Notes'];
      const csvRows = [headers.join(',')];
      currentDialerContacts.forEach(c => {
        const st = dialerState[c.id] || { status: 'not_called', note: '' };
        const row = [
          csvSafeCell(c.id),
          csvSafeCell(c.name),
          csvSafeCell(c.phone),
          csvSafeCell(c.type),
          csvSafeCell(st.status || 'not_called'),
          csvSafeCell(st.note || '')
        ];
        csvRows.push(row.join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `R4Realty_Outbound_Dialer_Progress_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported', 'Tele-calling campaign CSV downloaded.', 'success');
    });
  }

  // Helper function to parse CSV lines safely handling quotes
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    function parseLine(line) {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    let nameIdx = headers.findIndex(h => h.includes('name') || h.includes('client') || h.includes('lead') || h.includes('customer'));
    let phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('number') || h.includes('tel'));
    let typeIdx = headers.findIndex(h => h.includes('type') || h.includes('category') || h.includes('account'));
    let statusIdx = headers.findIndex(h => h.includes('status') || h.includes('stage'));
    let noteIdx = headers.findIndex(h => h.includes('note') || h.includes('remark') || h.includes('comment'));

    let startLine = 1;
    if (nameIdx === -1 && phoneIdx === -1) {
      // No header row, default column 0 = Name, column 1 = Phone, column 2 = Type
      nameIdx = 0;
      phoneIdx = 1;
      typeIdx = 2;
      statusIdx = 3;
      noteIdx = 4;
      startLine = 0;
    } else {
      if (nameIdx === -1) nameIdx = 0;
      if (phoneIdx === -1) phoneIdx = 1;
    }

    const parsedContacts = [];
    for (let i = startLine; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (!cols[nameIdx] && !cols[phoneIdx]) continue;

      const rawName = cols[nameIdx] || 'Lead';
      const rawPhone = cols[phoneIdx] || '';
      const rawType = (typeIdx !== -1 && cols[typeIdx]) ? cols[typeIdx] : 'Individual';
      const rawStatus = (statusIdx !== -1 && cols[statusIdx]) ? cols[statusIdx] : 'not_called';
      const rawNote = (noteIdx !== -1 && cols[noteIdx]) ? cols[noteIdx] : '';

      parsedContacts.push({
        name: rawName,
        phone: rawPhone,
        type: rawType,
        status: rawStatus,
        note: rawNote
      });
    }
    return parsedContacts;
  }

  // Trigger CSV File Upload
  const importCsvTrigger = document.getElementById('import-dialer-csv-trigger');
  const dialerCsvFileInput = document.getElementById('dialerCsvFileInput');

  if (importCsvTrigger && dialerCsvFileInput) {
    importCsvTrigger.addEventListener('click', () => {
      dialerCsvFileInput.value = '';
      dialerCsvFileInput.click();
    });

    dialerCsvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const csvText = event.target.result;
          const parsed = parseCSV(csvText);

          if (parsed.length === 0) {
            showToast('Empty CSV', 'No valid contact records found in the uploaded file.', 'error');
            return;
          }

          const shouldAppend = confirm(
            `Found ${parsed.length} contacts in "${file.name}".\n\nClick [OK] to APPEND to your current list (${currentDialerContacts.length} contacts).\nClick [Cancel] to REPLACE your entire list with these ${parsed.length} contacts.`
          );

          if (shouldAppend) {
            let nextId = currentDialerContacts.length + 1;
            parsed.forEach(c => {
              const newId = nextId++;
              currentDialerContacts.push({
                id: newId,
                name: c.name,
                phone: c.phone,
                type: c.type
              });
              if (c.status && c.status !== 'not_called') {
                dialerState[newId] = { status: c.status, note: c.note || '' };
              } else if (c.note) {
                dialerState[newId] = { status: 'not_called', note: c.note };
              }
            });
          } else {
            currentDialerContacts = parsed.map((c, idx) => ({
              id: idx + 1,
              name: c.name,
              phone: c.phone,
              type: c.type
            }));
            dialerState = {};
            parsed.forEach((c, idx) => {
              const newId = idx + 1;
              if (c.status && c.status !== 'not_called') {
                dialerState[newId] = { status: c.status, note: c.note || '' };
              } else if (c.note) {
                dialerState[newId] = { status: 'not_called', note: c.note };
              }
            });
          }

          saveDialerContacts();
          saveDialerState();
          renderDialerConsole();
          showToast('Import Complete', `Loaded ${parsed.length} contacts successfully into Outbound Dialer.`, 'success');
        } catch (err) {
          console.error('CSV parse error:', err);
          showToast('Import Error', 'Failed to read or parse the CSV file. Please check format.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  // Download Sample CSV Template
  const downloadTemplateBtn = document.getElementById('download-dialer-template-btn');
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener('click', () => {
      const templateContent = "Name,Phone,Type,Status,Notes\r\nRajesh Sharma,9811001122,Individual,not_called,Looking for 3BHK Sector 150\r\nAcme Global Solutions,9899003344,Company,not_called,Office lease inquiry 1500 sqft\r\nPooja Verma,9818556677,Individual,interested,Budget 1.5Cr Noida Expressway";
      const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'R4Realty_Leads_Upload_Template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Template Downloaded', 'Sample CSV format saved.', 'info');
    });
  }

  // Reset Dialer Progress
  const resetDialerBtn = document.getElementById('reset-dialer-btn');
  if (resetDialerBtn) {
    resetDialerBtn.addEventListener('click', () => {
      const choice = confirm('Reset calling progress or restore default 200 list?\n\nClick [OK] to reset progress only.\nClick [Cancel] to keep current progress.');
      if (choice) {
        dialerState = {};
        saveDialerState();
        renderDialerConsole();
        showToast('Dialer Reset', 'Tele-calling progress has been reset.', 'success');
      }
    });
  }

  // =========================================================================
  // MODULE 3: POST & MANAGE CAREER JOBS LOGIC
  // =========================================================================
  let customJobs = [];
  try {
    const savedJobs = localStorage.getItem('r4realty_custom_jobs');
    if (savedJobs) {
      customJobs = JSON.parse(savedJobs);
    } else {
      customJobs = DEFAULT_CAREER_JOBS;
      localStorage.setItem('r4realty_custom_jobs', JSON.stringify(customJobs));
    }
  } catch (e) {
    customJobs = DEFAULT_CAREER_JOBS;
  }

  function saveCareerJobs() {
    localStorage.setItem('r4realty_custom_jobs', JSON.stringify(customJobs));
  }

  function renderCareerManager() {
    const container = document.getElementById('crmLiveJobsContainer');
    const countEl = document.getElementById('activeJobsCount');
    if (!container) return;

    if (countEl) countEl.textContent = customJobs.filter(j => j.active !== false).length;

    container.innerHTML = '';
    customJobs.forEach((job, index) => {
      const item = document.createElement('div');
      item.className = 'crm-job-item';
      item.innerHTML = `
        <div class="crm-job-item-header">
          <div>
            <h4>${escapeHTML(job.title)}</h4>
            <div class="crm-job-meta">
              <span><i class="fas fa-layer-group"></i> ${escapeHTML(job.department)}</span>
              <span><i class="fas fa-map-marker-alt"></i> ${escapeHTML(job.location)}</span>
              <span><i class="fas fa-wallet"></i> ${escapeHTML(job.package || 'Competitive')}</span>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="crm-action-btn ${job.active !== false ? 'active' : ''}" data-toggle-job="${index}" title="Toggle Active/Inactive">
              <i class="fas ${job.active !== false ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color: ${job.active !== false ? 'var(--success)' : 'var(--muted)'};"></i>
            </button>
            <button class="crm-action-btn del" data-del-job="${index}" title="Delete listing">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--ink-soft); margin: 0; line-height: 1.4;">${escapeHTML(job.description)}</p>
      `;

      // Toggle Job Active Status
      const toggleBtn = item.querySelector('[data-toggle-job]');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          customJobs[index].active = customJobs[index].active === false ? true : false;
          saveCareerJobs();
          renderCareerManager();
          showToast('Updated', `Job status set to ${customJobs[index].active ? 'Active' : 'Paused'}.`, 'info');
        });
      }

      // Delete Job
      const delBtn = item.querySelector('[data-del-job]');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          if (confirm(`Delete job listing "${job.title}"?`)) {
            customJobs.splice(index, 1);
            saveCareerJobs();
            renderCareerManager();
            showToast('Deleted', 'Job listing removed.', 'success');
          }
        });
      }

      container.appendChild(item);
    });
  }

  // Job Submission Form
  const postJobForm = document.getElementById('crmPostJobForm');
  if (postJobForm) {
    postJobForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('newJobTitle').value.trim();
      const department = document.getElementById('newJobDept').value;
      const location = document.getElementById('newJobLoc').value.trim();
      const experience = document.getElementById('newJobExp').value.trim();
      const pkg = document.getElementById('newJobPackage').value.trim();
      const description = document.getElementById('newJobDesc').value.trim();

      if (!title || !location || !description) {
        showToast('Required Fields', 'Please complete all required job details.', 'error');
        return;
      }

      const newJob = {
        id: `job-${Date.now()}`,
        title,
        department,
        location,
        experience,
        package: pkg,
        type: 'Full-Time',
        description,
        active: true
      };

      customJobs.unshift(newJob);
      saveCareerJobs();
      renderCareerManager();
      postJobForm.reset();
      showToast('Published', 'New job posting published live to Careers page.', 'success');
    });
  }

  // =========================================================================
  // MODULE 4: PROJECT CATALOG & PRICING EDITOR LOGIC
  // =========================================================================
  const DEFAULT_PROJECT_DATA = [
    { id: 'ace-terra', name: 'Ace Terra', location: 'Sector 22D, Yamuna Expressway', price: '₹ 1.85 Cr - 3.45 Cr', size: '1770 - 3025 Sq Ft', tag: 'Direct Allotment' },
    { id: 'gygy-mentis', name: 'GYGY Mentis', location: 'Sector 140A, Noida Expressway', price: '₹ 38.00 Lakh - 2.50 Cr', size: '500 - 3200 Sq Ft', tag: 'Up to 11% Yield' },
    { id: 'sikka-mall', name: 'Sikka Mall of Expressway', location: 'Greater Noida Transit Hub', price: '₹ 25.00 Lakh +', size: '150 - 2500 Sq Ft', tag: 'Pre-Leased Retail' },
    { id: 'bhutani-belfair', name: 'Bhutani Belfair', location: 'Sector 140A, Noida Expressway', price: '₹ 4.56 Cr - 6.26 Cr', size: '2280 - 3130 Sq Ft', tag: 'Luxury Low-Rise' },
    { id: 'vedic-city-goa', name: 'Vedic City (Township Plots)', location: 'North Goa, MOPA Corridor', price: '₹ 45.00 Lakh - 1.85 Cr', size: '240 - 1380 Gaj', tag: 'RERA Villa Plots' },
    { id: 'sunrise-city', name: 'Sunrise City', location: 'Galgotias Uni, Greater Noida', price: '₹ 18.25 Lakh - 73.00 Lakh', size: '50 - 200 Sq Yd', tag: 'Freehold Plots' },
    { id: 'farmlands-151', name: 'Sector 151 Farmlands', location: 'Sector 151, Noida Expressway', price: '₹ 85.00 Lakh +', size: '1206 - 4032 Sq Yd', tag: 'Gated Farm Township' }
  ];

  let projectOverrides = {};
  try {
    const savedOverrides = localStorage.getItem('r4realty_project_overrides');
    if (savedOverrides) projectOverrides = JSON.parse(savedOverrides);
  } catch (e) {}

  function renderProjectEditor() {
    const tbody = document.getElementById('crmProjectEditorRows');
    if (!tbody) return;

    tbody.innerHTML = '';
    DEFAULT_PROJECT_DATA.forEach(proj => {
      const current = projectOverrides[proj.id] || proj;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHTML(proj.name)}</strong></td>
        <td style="font-family: var(--font-mono); font-size: 11px; color: var(--muted);">${escapeHTML(proj.location)}</td>
        <td><input type="text" class="crm-inline-input" data-proj-id="${proj.id}" data-field="price" value="${escapeHTML(current.price)}" /></td>
        <td><input type="text" class="crm-inline-input" data-proj-id="${proj.id}" data-field="size" value="${escapeHTML(current.size)}" /></td>
        <td><input type="text" class="crm-inline-input" data-proj-id="${proj.id}" data-field="tag" value="${escapeHTML(current.tag)}" /></td>
      `;
      tbody.appendChild(tr);
    });
  }

  const saveProjectBtn = document.getElementById('save-project-data-btn');
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', () => {
      const inputs = document.querySelectorAll('#crmProjectEditorRows .crm-inline-input');
      inputs.forEach(input => {
        const projId = input.getAttribute('data-proj-id');
        const field = input.getAttribute('data-field');
        if (!projectOverrides[projId]) projectOverrides[projId] = { ...DEFAULT_PROJECT_DATA.find(p => p.id === projId) };
        projectOverrides[projId][field] = input.value.trim();
      });
      localStorage.setItem('r4realty_project_overrides', JSON.stringify(projectOverrides));
      showToast('Saved', 'Project pricing and specs updated live.', 'success');
    });
  }

  // =========================================================================
  // MODULE 5: PORTAL SETTINGS & PIN MANAGEMENT
  // =========================================================================
  const updatePinBtn = document.getElementById('update-pin-btn');
  if (updatePinBtn) {
    updatePinBtn.addEventListener('click', () => {
      const curPin = document.getElementById('settingsCurrentPin').value.trim();
      const newPin = document.getElementById('settingsNewPin').value.trim();

      if (!activeAdminPin || curPin !== activeAdminPin) {
        showToast('Incorrect PIN', 'Current PIN does not match your active session PIN.', 'error');
        return;
      }
      if (newPin.length < 6) {
        showToast('PIN Too Short', 'New PIN must be at least 6 characters.', 'error');
        return;
      }

      activeAdminPin = newPin;
      document.getElementById('settingsCurrentPin').value = '';
      document.getElementById('settingsNewPin').value = '';
      showToast('PIN Updated', 'Session security PIN updated. Remember to update your server ADMIN_PIN environment variable.', 'success');
    });
  }

  const saveContactBtn = document.getElementById('save-contact-info-btn');
  if (saveContactBtn) {
    saveContactBtn.addEventListener('click', () => {
      const phone = document.getElementById('settingsPhone').value.trim();
      const email = document.getElementById('settingsEmail').value.trim();
      localStorage.setItem('r4realty_contact_phone', phone);
      localStorage.setItem('r4realty_contact_email', email);
      showToast('Contact Saved', 'Advisory hotline and email preferences saved.', 'success');
    });
  }
}

// CSV / Excel Formula Injection Sanitizer
function csvSafeCell(val) {
  if (val == null || val === undefined) return '""';
  let s = val.toString();
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.toString().replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
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
  const openBtns = document.querySelectorAll('.open-about-btn, a[href="#about"], a[href="/#about"]');

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
   9b. Legal Disclaimers & Advisory Modal
   ========================================================================== */
function initLegalModal() {
  const modalHTML = `
    <div class="modal-backdrop" id="legal-modal">
      <div class="modal-content" style="max-width: 860px;">
        <div class="modal-header">
          <div>
            <h3 style="margin: 0; font-size: 17px;"><i class="fas fa-balance-scale" style="color: var(--accent);"></i> Legal Disclaimers &amp; Advisory Terms</h3>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent); margin-top: 2px;">UPRERA &amp; Goa RERA Compliance &middot; Ministry of MSME UDYAM-RJ-11-0089088 &middot; Zero Brokerage Mandate</div>
          </div>
          <button class="close-modal-btn" id="close-legal-modal">&times;</button>
        </div>
        <div class="modal-body" style="font-family: var(--font-body); font-size: 13px; line-height: 1.6; color: var(--ink-soft); max-height: 75vh; overflow-y: auto;">
          
          <div style="background: var(--paper); border: var(--border-thin); padding: 14px 18px; margin-bottom: 18px;">
            <strong style="color: var(--ink); font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">
              <i class="fas fa-shield-alt" style="color: var(--accent);"></i> Statutory Notice &amp; Regulatory Fiduciary Statement
            </strong>
            <p style="font-size: 12px; line-height: 1.5; margin-top: 6px; color: var(--ink-soft);">
              R4Realty is an independent real estate consultancy and strategic marketing advisory firm operating strictly under statutory laws, Real Estate (Regulation and Development) Act, 2016 (RERA), and the Ministry of Micro, Small &amp; Medium Enterprises (MSME).
            </p>
          </div>

          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase;"><i class="fas fa-check-circle" style="color: var(--accent);"></i> 1. RERA Statutory Registrations</h4>
          <p style="margin-bottom: 10px; font-size: 12.5px;">All projects listed on this platform are registered with their respective state Real Estate Regulatory Authorities (UPRERA in Uttar Pradesh and Goa RERA in Goa). R4Realty only represents authorized inventory allotments directly from primary developers:</p>
          <table class="compliance-table" style="margin-bottom: 18px;">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Location &amp; Corridor</th>
                <th>Official RERA Number</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Ace Terra</strong></td>
                <td>Sector 22D, Yamuna Expressway</td>
                <td><code style="color: var(--accent); font-weight: 600;">UPRERAPRJ683888</code></td>
              </tr>
              <tr>
                <td><strong>GYGY Mentis</strong></td>
                <td>Sector 140A, Noida Expressway</td>
                <td><code style="color: var(--accent); font-weight: 600;">UPRERAPRJ251909</code></td>
              </tr>
              <tr>
                <td><strong>Sikka Mall of Expressway</strong></td>
                <td>Greater Noida Transit Corridor</td>
                <td><code style="color: var(--accent); font-weight: 600;">UPRERAPRJ4454</code></td>
              </tr>
              <tr>
                <td><strong>Bhutani Belfair</strong></td>
                <td>Sector 140A, Noida Expressway</td>
                <td><code style="color: var(--accent); font-weight: 600;">UPRERAPRJ235721</code></td>
              </tr>
              <tr>
                <td><strong>Vedic City (Township Plots)</strong></td>
                <td>North Goa (MOPA Corridor)</td>
                <td><code style="color: var(--accent); font-weight: 600;">PRGO04242194</code></td>
              </tr>
              <tr>
                <td><strong>Sunrise City</strong></td>
                <td>Greater Noida Corridors</td>
                <td><code style="color: var(--accent); font-weight: 600;">UPRERAPRJ763914</code></td>
              </tr>
            </tbody>
          </table>

          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase;"><i class="fas fa-hand-holding-usd" style="color: var(--accent);"></i> 2. 100% Brokerage-Free Mandate for Buyers</h4>
          <p style="margin-bottom: 14px; font-size: 12.5px;">R4Realty charges <strong>zero (0%) brokerage fee or hidden commission</strong> to prospective buyers, investors, or allottees for primary direct developer allocations. Our institutional advisory, project feasibility walkthroughs, and paperwork facilitation are 100% free of charge to purchasers.</p>

          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase;"><i class="fas fa-certificate" style="color: var(--accent);"></i> 3. Enterprise Government Registration</h4>
          <p style="margin-bottom: 14px; font-size: 12.5px;">R4Realty is officially registered under the <strong>Ministry of Micro, Small and Medium Enterprises (MSME)</strong>, Government of India, holding Enterprise Registration Number <strong>UDYAM-RJ-11-0089088</strong>, operating under standard commercial and consulting business codes.</p>

          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase;"><i class="fas fa-file-contract" style="color: var(--accent);"></i> 4. Investor Due Diligence &amp; Advisory Notice</h4>
          <p style="margin-bottom: 14px; font-size: 12.5px;">Project floor plans, artistic renders, payment milestones, rental yield projections, and possession dates displayed on this website are sourced directly from verified developer master filings. Prospective buyers are advised to review the builder-buyer agreement (BBA), title search reports, and official RERA disclosures before executing payment.</p>

          <h4 style="font-size: 14px; margin-top: 16px; margin-bottom: 8px; color: var(--ink); font-family: var(--font-heading); text-transform: uppercase;"><i class="fas fa-envelope-open-text" style="color: var(--accent);"></i> 5. Regulatory &amp; Grievance Contact</h4>
          <div style="background: var(--paper); border: var(--border-thin); padding: 12px 16px; font-family: var(--font-mono); font-size: 11.5px;">
            <div><strong>Principal Advisor:</strong> Rajveer Singh</div>
            <div><strong>Direct Contact:</strong> +91 78384 16570</div>
            <div><strong>Advisory &amp; Legal Inquiries:</strong> legal@r4realty.in / info@r4realty.in</div>
            <div><strong>Registered Region:</strong> Noida / National Capital Region (NCR), India</div>
          </div>

        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('legal-modal');
  const closeBtn = document.getElementById('close-legal-modal');
  const openBtns = document.querySelectorAll('.open-legal-btn, a[href="#legal"], a[href="/#legal"]');

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

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
    toggleBtn.innerHTML = `
      <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    `;
    
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
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z"/></svg>
        <div class="r4-launcher-pulse"></div>
      </div>
      <span>Ask Advisor</span>
    </div>

    <div class="r4-chat-window" id="r4ChatWindow">
      <div class="r4-chat-header">
        <div class="r4-chat-header-info">
          <div class="r4-chat-avatar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
          <div>
            <div class="r4-chat-title">Rajveer Singh · R4Realty</div>
            <div class="r4-chat-status"><span class="r4-chat-status-dot"></span> Online · Property Advisory</div>
          </div>
        </div>
        <div class="r4-chat-header-actions">
          <button class="r4-chat-action-btn" id="r4ChatClose" title="Close Chat" aria-label="Close Chat">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
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
          <button type="submit" class="r4-chat-send-btn" title="Send message" aria-label="Send message">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
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
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:5px;"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.1 3.2 5 4.4.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.6 1.4 5.1L2 22l5.1-1.3C8.5 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.5-1.2l-.3-.2-3.3.9.9-3.2-.2-.3C3.8 14.4 3.3 13.2 3.3 12 3.3 7.2 7.2 3.3 12 3.3S20.7 7.2 20.7 12 16.8 20 12 20z"/></svg>Chat directly on WhatsApp (+91 78384 16570) &rarr;
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
          <a class="r4-chat-btn" href="/projects/gygy-mentis.html"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>View GYGY Mentis Spec Sheet</a>
          <a class="r4-chat-btn" href="/projects/mall-of-expressway.html"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>View Sikka Mall of Expressway</a>
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
          <a class="r4-chat-btn" href="/projects/vedic-city-goa.html"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>Explore Vedic City Goa Plots</a>
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

    // Careers / Jobs / Hiring
    if (q.includes('career') || q.includes('job') || q.includes('hiring') || q.includes('vacancy') || q.includes('work with') || q.includes('recruitment') || q.includes('interview') || q.includes('salary')) {
      appendBotMessage(`
        <strong>Careers at R4Realty:</strong><br>
        We are actively expanding our real estate advisory team across Noida, Greater Noida, and Goa!<br>
        <ul style="padding-left: 16px; margin: 6px 0;">
          <li><strong>Senior Real Estate Portfolio Advisor:</strong> Noida Expressway &amp; Yamuna Expressway</li>
          <li><strong>Commercial Real Estate &amp; Retail Strategist:</strong> Sector 140A / Greater Noida</li>
          <li><strong>Luxury Vacation Homes Consultant:</strong> North Goa &amp; NCR Farmlands</li>
          <li><strong>Digital Growth &amp; Content Strategist:</strong> Brand storytelling &amp; Lead funnels</li>
        </ul>
        <div class="r4-chat-btn-group">
          <a class="r4-chat-btn" href="/careers"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>View Open Roles &amp; Apply</a>
          <a class="r4-chat-btn" href="https://wa.me/917838416570?text=Hi%20Rajveer,%20I%20am%20interested%20in%20career%20opportunities%20at%20R4Realty." target="_blank"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.6 1.4 5.1L2 22l5.1-1.3C8.5 21.5 10.2 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.5-1.2l-.3-.2-3.3.9.9-3.2-.2-.3C3.8 14.4 3.3 13.2 3.3 12 3.3 7.2 7.2 3.3 12 3.3S20.7 7.2 20.7 12 16.8 20 12 20z"/></svg>WhatsApp CV</a>
        </div>
      `, true);
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

/* ==========================================================================
   17. Dynamic Careers & Project Overrides Synchronizer
   ========================================================================== */
function initDynamicCareers() {
  const rolesContainer = document.getElementById('open-roles');
  if (!rolesContainer) return;

  let jobs = [];
  try {
    const saved = localStorage.getItem('r4realty_custom_jobs');
    if (saved) jobs = JSON.parse(saved);
  } catch (e) {}

  if (!Array.isArray(jobs) || jobs.length === 0) return;

  const customJobs = jobs.filter(j => j.active !== false && !document.getElementById(j.id));
  if (customJobs.length === 0) return;

  customJobs.forEach(job => {
    const jobCard = document.createElement('div');
    jobCard.className = 'job-card';
    jobCard.id = job.id;
    jobCard.innerHTML = `
      <div class="job-card-header">
        <div>
          <h3 class="job-card-title">${escapeHTML(job.title)}</h3>
          <div class="job-card-meta">
            <span class="job-pill highlight"><i class="fas fa-layer-group"></i> ${escapeHTML(job.department)}</span>
            <span class="job-pill"><i class="fas fa-map-marker-alt"></i> ${escapeHTML(job.location)}</span>
            <span class="job-pill"><i class="fas fa-user-graduate"></i> ${escapeHTML(job.experience || '2+ Years')}</span>
            <span class="job-pill"><i class="fas fa-rupee-sign"></i> ${escapeHTML(job.package || 'Competitive Base + Incentives')}</span>
          </div>
        </div>
        <button type="button" class="cta-button apply-role-trigger" data-role="${escapeHTML(job.title)}">
          Apply Now &darr;
        </button>
      </div>
      <p style="font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; margin-bottom: 15px;">
        ${escapeHTML(job.description)}
      </p>
    `;

    const applyBtn = jobCard.querySelector('.apply-role-trigger');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const roleSelect = document.getElementById('applicantRole');
        const formSection = document.getElementById('apply-form-section');
        if (roleSelect) roleSelect.value = job.title;
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
      });
    }

    rolesContainer.appendChild(jobCard);
  });
}

function applyProjectOverrides() {
  let overrides = {};
  try {
    const saved = localStorage.getItem('r4realty_project_overrides');
    if (saved) overrides = JSON.parse(saved);
  } catch (e) {}

  Object.keys(overrides).forEach(projId => {
    const data = overrides[projId];
    if (!data) return;

    const cards = document.querySelectorAll(`[data-project-id="${projId}"], a[href*="${projId}"]`);
    cards.forEach(el => {
      const card = el.closest('.project-card, .mockup-project-card') || el;
      if (card) {
        const priceEl = card.querySelector('.spec-val.price, .p-price');
        const tagEl = card.querySelector('.project-status, .p-tag');
        if (priceEl && data.price) priceEl.textContent = data.price;
        if (tagEl && data.tag) tagEl.textContent = data.tag;
      }
    });
  });
}
