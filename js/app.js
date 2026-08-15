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
});
