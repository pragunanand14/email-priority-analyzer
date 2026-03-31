# 🧠 AI Email Triage Chrome Extension - Complete Setup

## 📁 Full Project Structure
```
ai-email-triage-browser-extension/
├── app.py                 # Python Flask backend  
├── requirements.txt       # Backend deps
├── chrome-extension/      # Chrome extension frontend
│   ├── manifest.json     # Manifest V3
│   ├── popup.html        # Popup UI
│   ├── popup.js          # Backend API calls
│   └── style.css         # Modern styling
```

## 🚀 Step-by-Step: Backend + Extension

### 1. Start Backend
```
cd "c:/Users/Pragun/Desktop/Hackathon/ai-email-triage-browser-extension"
python -m venv venv
venv\Scripts\activate  
pip install -r requirements.txt
python app.py
```
**Backend: http://127.0.0.1:5000/predict**

### 2. Load Chrome Extension
1. Open `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select `ai-email-triage-browser-extension/chrome-extension/`
5. ✅ Extension icon appears in toolbar

### 3. Test Extension
1. **Start backend** (step 1)
2. Click extension icon 🧠
3. Paste: `My account is locked! Payment failed. URGENT help needed.`
4. Click **Analyze Email**
5. **Results:**
   - Category: Support  
   - Priority: **High** (red badge)
   - Department: IT Support

## 🔧 Host Permissions (manifest.json)
```
"host_permissions": [
  "http://127.0.0.1:5000/*", 
  "http://localhost:5000/*"
]
```
✅ Extension can call Flask backend directly

## 🧪 Error Handling
- ❌ Empty input → "Please paste email text"
- ❌ Backend down → "Backend not running? Start Flask server"
- ❌ Network error → Clear error message
- ✅ Success → Styled results with priority colors

## 🎨 UI Features
- Modern gradient design
- Priority badges: High=red, Medium=orange, Low=green
- Loading spinner + smooth transitions
- Responsive popup (350px wide)
- Auto-focus textarea

## 📱 Ready for Gmail/Outlook
Extension popup MVP complete. Next: content scripts to auto-extract Gmail emails.

**Hackathon complete: Backend + Frontend = Full MVP!**
