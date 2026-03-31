(function () {
  'use strict';

  const BACKEND_URL = 'http://127.0.0.1:5000/predict';
  const STORAGE_KEY = 'ai_triage_emails';

  const processedEmails = new Set();
  let isScanning = false;

  console.log('🚀 AI Gmail Scanner Loaded');

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getInboxRows() {
    return document.querySelectorAll('tr.zA');
  }

  function extractEmailData(row) {
    try {
      const subjectEl = row.querySelector('span.bog');
      const previewEl = row.querySelector('span.y2');

      const subject = subjectEl ? subjectEl.innerText.trim() : '';
      const preview = previewEl ? previewEl.innerText.replace(/^-\s*/, '').trim() : '';

      if (!subject && !preview) return null;

      return {
        subject,
        preview,
        combined: `${subject}. ${preview}`.trim()
      };
    } catch (err) {
      console.error('❌ Extraction error:', err);
      return null;
    }
  }

  function generateFallbackReason(email, data) {
    const text = `${email.subject} ${email.preview}`.toLowerCase();
    const reasons = [];

    // Spam-style reasoning
    const spamWords = [
      "free", "winner", "click here", "discount", "offer",
      "prize", "million", "fund", "bank transfer", "lottery"
    ];
    const foundSpam = spamWords.filter(word => text.includes(word));
    if (foundSpam.length > 0) {
      reasons.push(`Contains suspicious spam terms like: ${foundSpam.slice(0, 3).join(', ')}`);
    }

    // Urgency reasoning
    const urgentWords = [
      "urgent", "immediately", "asap", "refund",
      "account locked", "payment failed", "error",
      "unable", "failed", "hacked"
    ];
    const foundUrgent = urgentWords.filter(word => text.includes(word));
    if (foundUrgent.length > 0) {
      reasons.push(`Marked important due to urgency terms: ${foundUrgent.slice(0, 3).join(', ')}`);
    }

    // Category reasoning
    const category = (data.category || "").toLowerCase();

    if (category === "support") {
      reasons.push("Looks like a technical or help-related request");
    } else if (category === "sales") {
      reasons.push("Appears related to pricing, product inquiry, or buying intent");
    } else if (category === "hr") {
      reasons.push("Looks related to hiring, jobs, or internal people operations");
    } else if (category === "complaint") {
      reasons.push("Contains issue-reporting, dissatisfaction, or refund-related language");
    } else if (category === "general inquiry") {
      reasons.push("Appears to be a general non-urgent inquiry");
    } else if (category === "spam") {
      reasons.push("Detected as spam due to suspicious or promotional language");
    }

    if (reasons.length === 0) {
      reasons.push("Classified based on subject wording, preview text, and inferred intent");
    }

    return reasons.join(" | ");
  }

  async function analyzeEmail(email) {
    try {
      console.log('🚀 Sending to backend:', email.combined);

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email_text: email.combined })
      });

      const data = await response.json();

      console.log('✅ AI result:', data);

      return {
        id: email.subject + email.preview,
        subject: email.subject,
        preview: email.preview,
        category: data.category || 'Unknown',
        priority: data.priority || 'Low',
        department: data.department || 'Unknown',
        reason: data.reason || generateFallbackReason(email, data),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Backend error:', error);

      return {
        id: email.subject + email.preview,
        subject: email.subject,
        preview: email.preview,
        category: 'General Inquiry',
        priority: 'Low',
        department: 'Admin',
        reason: generateFallbackReason(email, { category: 'General Inquiry' }),
        timestamp: Date.now()
      };
    }
  }

  function saveEmail(emailObj) {
    return new Promise(resolve => {
      chrome.storage.local.get([STORAGE_KEY], result => {
        const emails = result[STORAGE_KEY] || [];

        const alreadyExists = emails.some(e => e.id === emailObj.id);

        if (!alreadyExists) {
          emails.unshift(emailObj);

          chrome.storage.local.set(
            { [STORAGE_KEY]: emails.slice(0, 50) },
            () => {
              console.log('💾 Saved:', emailObj.subject);
              resolve();
            }
          );
        } else {
          console.log('⚠️ Duplicate skipped:', emailObj.subject);
          resolve();
        }
      });
    });
  }

  async function scanInbox() {
    if (isScanning) return;
    isScanning = true;

    console.log('📥 Scanning Gmail inbox...');

    const rows = getInboxRows();
    console.log(`📧 Found ${rows.length} Gmail rows`);

    for (const row of rows) {
      const email = extractEmailData(row);
      if (!email || !email.combined) continue;

      const emailKey = email.subject + email.preview;

      if (processedEmails.has(emailKey)) continue;
      processedEmails.add(emailKey);

      const result = await analyzeEmail(email);
      await saveEmail(result);

      await sleep(700);
    }

    isScanning = false;
  }

  function waitForInbox() {
    const interval = setInterval(() => {
      const rows = getInboxRows();

      if (rows.length > 0) {
        console.log('✅ Gmail inbox detected');
        clearInterval(interval);
        scanInbox();
      }
    }, 2000);
  }

  const observer = new MutationObserver(() => {
    const rows = getInboxRows();
    if (rows.length > 0) {
      scanInbox();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  waitForInbox();
})();