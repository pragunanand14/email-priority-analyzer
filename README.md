# 🚀 AI Email Triage Browser Extension - Backend

**Complete Flask backend using facebook/bart-large-mnli for zero-shot email classification**

## 📦 Files
1. `app.py` - Main Flask app
2. `requirements.txt` - Dependencies
3. `README.md` - This file

## 🛠️ Step-by-Step Setup (Windows)

1. **Navigate to project:**
```
cd "c:/Users/Pragun/Desktop/Hackathon/ai-email-triage-browser-extension"
```

2. **Create virtual environment:**
```
python -m venv venv
```

3. **Activate venv:**
```
venv\Scripts\activate
```

4. **Install dependencies:**
```
pip install -r requirements.txt
```

5. **Run backend:**
```
python app.py
```

**✅ Server starts at http://localhost:5000**

**First model load takes ~30 seconds (downloads bart-large-mnli)**

## 🧪 Test API

### 1. Health check
```
curl http://localhost:5000/
```

### 2. Email prediction
```
curl -X POST http://localhost:5000/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"email_text\": \"My account is locked and payment failed. Please help urgently.\"}"
```

**Expected:**
```json
{
  "category": "Support",
  "priority": "High", 
  "department": "IT Support"
}
```

### 3. Python test
```python
import requests
response = requests.post("http://localhost:5000/predict", 
                        json={"email_text": "URGENT: payment failed!"})
print(response.json())
```

## 🎯 Test Cases

| Email | Category | Priority | Department |
|-------|----------|----------|------------|
| "My account is locked! ASAP help" | Support | High | IT Support |
| "Interested in pricing" | Sales | Low | Sales Team |
| "Terrible service, refund NOW" | Complaint | High | Customer Support |
| "WIN $1000!!!" | Spam | Low | Ignore / Spam |

## 🔌 Chrome Extension Ready
- ✅ Full CORS support (`Flask-CORS`)
- ✅ localhost:5000 accessible from browser extension
- ✅ Exact JSON format: `{"email_text": "..."}` → `{"category": "...", "priority": "...", "department": "..."}`

## 🏆 Features Implemented
- ✅ Zero-shot classification (bart-large-mnli)
- ✅ Keyword urgency scoring
- ✅ Category weighting
- ✅ Department auto-routing
- ✅ Input validation + error handling
- ✅ Hackathon-optimized (minimal deps, fast setup)

**Ready for Chrome extension frontend connection!**
