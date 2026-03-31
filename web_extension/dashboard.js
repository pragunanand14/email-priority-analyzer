// dashboard.js - SHOW ALL 50+ EMAILS - No Filtering

const STORAGE_KEY = 'ai_triage_emails';

document.addEventListener('DOMContentLoaded', function() {
  loadEmails();
  setInterval(loadEmails, 3000); // Fast refresh
  document.getElementById('refreshBtn').addEventListener('click', loadEmails);
});

async function loadEmails() {
  showLoading();
  hideError();
  hideEmpty();
  
  try {
    const emails = await getStoredEmails();
    console.log(`📊 Dashboard loaded ${emails.length} TOTAL emails`);
    
    const totalEl = document.getElementById('totalEmails');
    totalEl.textContent = emails.length;
    
    if (emails.length === 0) {
      showEmpty();
      return;
    }
    
    // Group ALL emails
    const groups = {
      urgent: [],
      moderate: [],
      low: [],
      spam: []
    };
    
    emails.forEach(email => {
      let group = 'low';
      
      const pri = (email.priority || '').toLowerCase().trim();
      const cat = (email.category || '').toLowerCase().trim();
      
      if (cat === 'spam') {
        group = 'spam';
      } else if (pri === 'high' || pri.includes('urgent')) {
        group = 'urgent';
      } else if (pri === 'medium') {
        group = 'moderate';
      } else if (pri === 'low') {
        group = 'low';
      }
      
      groups[group].push(email);
      console.log(`Grouped ${email.subject.slice(0, 30)} → ${group}`);
    });
    
    // Sort newest first
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    });
    
    // Render ALL
    renderSection('urgent', groups.urgent);
    renderSection('moderate', groups.moderate);
    renderSection('low', groups.low);
    renderSection('spam', groups.spam);
    
    console.log(`Dashboard rendered: Urgent=${groups.urgent.length}, Moderate=${groups.moderate.length}, Low=${groups.low.length}, Spam=${groups.spam.length}`);
    hideLoading();
    
  } catch (error) {
    console.error('Dashboard error:', error);
    showError('Storage error - refresh page');
    hideLoading();
  }
}

function renderSection(sectionId, emails) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  
  const cardsContainer = section.querySelector('.cards');
  const countEl = section.querySelector('.count');
  
  countEl.textContent = emails.length;
  
  if (emails.length === 0) {
    cardsContainer.innerHTML = '<div class="empty-cards">No emails</div>';
    return;
  }
  
  cardsContainer.innerHTML = emails.map(email => createCard(email)).join('');
  console.log(`Rendered ${emails.length} cards in ${sectionId}`);
}

function createCard(email) {
  const priorityColor = getPriorityColor(email.priority);
  return `
    <div class="card" title="${escapeHtml(email.reason || 'No explanation available')}">
      <div class="card-header">
        <h3>${escapeHtml(email.subject || 'No Subject')}</h3>
        <span class="priority ${priorityColor}">${email.priority || 'Unknown'}</span>
      </div>
      <p class="preview">${escapeHtml(email.preview?.substring(0, 100) || '')}${email.preview && email.preview.length > 100 ? '...' : ''}</p>
      <div class="details">
        <span class="detail">📂 ${escapeHtml(email.category || 'N/A')}</span>
        <span class="detail">🏢 ${escapeHtml(email.department || 'N/A')}</span>
      </div>
      <div class="hover-hint">ℹ Hover to see why</div>
    </div>
  `;
}

function getPriorityColor(priority) {
  switch ((priority || '').toLowerCase()) {
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    case 'spam': return 'spam';
    default: return 'low';
  }
}

function getStoredEmails() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// UI helpers
function showLoading() { document.getElementById('loading').classList.remove('hidden'); document.getElementById('sections').classList.add('hidden'); }
function hideLoading() { document.getElementById('loading').classList.add('hidden'); document.getElementById('sections').classList.remove('hidden'); }
function showEmpty() { document.getElementById('emptyState').classList.remove('hidden'); document.getElementById('sections').classList.add('hidden'); }
function hideEmpty() { document.getElementById('emptyState').classList.add('hidden'); document.getElementById('sections').classList.remove('hidden'); }
function showError(msg) { 
  const el = document.getElementById('error');
  el.textContent = msg;
  el.classList.remove('hidden'); 
  document.getElementById('sections').classList.add('hidden');
}
function hideError() { document.getElementById('error').classList.add('hidden'); }

