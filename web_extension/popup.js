// AI Email Triage Chrome Extension - popup.js
// Calls Flask backend at http://127.0.0.1:5000/predict

const BACKEND_URL = 'http://127.0.0.1:5000/predict';

document.addEventListener('DOMContentLoaded', function() {
  const emailText = document.getElementById('emailText');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const categorySpan = document.getElementById('category');
  const prioritySpan = document.getElementById('priority');
  const departmentSpan = document.getElementById('department');

  analyzeBtn.addEventListener('click', async function() {
    const text = emailText.value.trim();
    
    // Input validation
    if (!text) {
      showError('Please paste email text to analyze');
      return;
    }

    // Show loading, hide others
    showLoading();
    hideResult();
    hideError();
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';

    try {
      // Exact backend request format
      const requestData = {
        "email_text": text
      };

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response format
      if (!data.category || !data.priority || !data.department) {
        throw new Error('Invalid response from AI backend');
      }

      // Show results
      categorySpan.textContent = data.category;
      prioritySpan.textContent = data.priority;
      prioritySpan.className = `value priority ${data.priority}`;
      departmentSpan.textContent = data.department;
      
      showResult();

    } catch (error) {
      console.error('Analysis failed:', error);
      let errorMsg = error.message;
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        errorMsg = 'Backend not running? Start Flask server at http://127.0.0.1:5000';
      }
      
      showError(errorMsg);

    } finally {
      // Reset button
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = '🚀 Analyze Email';
      hideLoading();
    }
  });

  // Utility functions
  function showResult() {
    resultDiv.classList.remove('hidden');
  }

  function hideResult() {
    resultDiv.classList.add('hidden');
  }

  function showLoading() {
    loadingDiv.classList.remove('hidden');
  }

  function hideLoading() {
    loadingDiv.classList.add('hidden');
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function hideError() {
    errorDiv.classList.add('hidden');
  }

  // Dashboard button
  const dashboardBtn = document.getElementById('dashboardBtn');
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });
  


  // Auto-focus textarea
  emailText.focus();
});

