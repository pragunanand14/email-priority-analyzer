from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline
import re
import os

app = Flask(__name__)
CORS(app)

# Categories for zero-shot classification
# Spam is handled separately before AI classification
CATEGORIES = [
    "Support",
    "Sales",
    "HR",
    "Complaint",
    "General Inquiry"
]

# Load pretrained model once at startup
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Urgency keywords with weights
URGENCY_KEYWORDS = {
    "urgent": 4,
    "immediately": 3,
    "asap": 3,
    "hacked": 4,
    "failed": 2,
    "refund": 2,
    "account locked": 4,
    "not working": 2,
    "error": 2,
    "complaint": 2,
    "payment failed": 3,
    "unable": 2
}

# Category urgency adjustments
CATEGORY_URGENCY = {
    "Support": 2,
    "Complaint": 2
}

# Department mapping
DEPARTMENT_MAP = {
    "Support": "IT Support",
    "Sales": "Sales Team",
    "HR": "HR Department",
    "Complaint": "Customer Support",
    "General Inquiry": "Admin",
    "Spam": "Ignore / Spam"
}

def clean_text(text):
    """
    Clean weird HTML-like junk and normalize spaces
    """
    if not text:
        return ""

    text = str(text)
    text = text.replace("&#160;", " ")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def is_spam(text):
    """
    Rule-based spam detector:
    Handles both promo spam + financial scam emails
    """
    text = clean_text(text).lower()

    spam_keywords = [
        # Promotional spam
        "congratulations", "winner", "free", "click here",
        "limited offer", "claim now", "prize", "lottery",
        "earn money", "exclusive offer", "buy now",
        "discount", "offer ends soon", "act now",
        "click below", "subscribe now",

        # Financial / scam spam
        "fund", "usd", "million", "bank transfer",
        "atm card", "consignment", "payment method",
        "compensation fund", "transaction", "award fund",
        "wire transfer", "send your details", "your name",
        "your address", "phone number", "over due compensation",
        "approved and deposited", "cash delivery", "swift visa card"
    ]

    spam_score = 0

    for word in spam_keywords:
        if word in text:
            spam_score += 1

    # Extra scam pattern boosts
    if "usd" in text and "million" in text:
        spam_score += 2

    if "bank" in text and "transfer" in text:
        spam_score += 2

    if "your name" in text and "your address" in text:
        spam_score += 2

    if "payment methods" in text or "payment method" in text:
        spam_score += 2

    return spam_score >= 2

def calculate_priority(email_text, category):
    """
    Calculate priority score using urgency keywords + category adjustment
    """
    score = 0
    text_lower = clean_text(email_text).lower()

    for keyword, weight in URGENCY_KEYWORDS.items():
        if keyword in text_lower:
            score += weight

    if category in CATEGORY_URGENCY:
        score += CATEGORY_URGENCY[category]

    if score >= 5:
        return "High"
    elif score >= 2:
        return "Medium"
    else:
        return "Low"

def generate_reason(email_text, category, priority):
    """
    Generate human-readable explanation for why the email
    was assigned this category/priority
    """
    text = clean_text(email_text).lower()
    reasons = []

    # Spam reasoning
    if category == "Spam":
        spam_signals = []
        for word in [
            "free", "winner", "click here", "discount",
            "usd", "million", "bank transfer", "fund",
            "atm card", "claim now", "prize"
        ]:
            if word in text:
                spam_signals.append(word)

        if spam_signals:
            reasons.append(f"Detected suspicious spam keywords: {', '.join(spam_signals[:3])}")
        else:
            reasons.append("Detected as spam due to suspicious promotional or scam-like content")

    # Urgency reasoning
    urgency_found = []
    for word in [
        "urgent", "immediately", "asap", "hacked",
        "refund", "account locked", "failed",
        "error", "unable", "payment failed"
    ]:
        if word in text:
            urgency_found.append(word)

    if urgency_found:
        reasons.append(f"Priority influenced by urgent terms: {', '.join(urgency_found[:3])}")

    # Category reasoning
    if category == "Support":
        reasons.append("Looks like a technical/help-related request")
    elif category == "Sales":
        reasons.append("Appears related to pricing, product inquiry, or purchase intent")
    elif category == "HR":
        reasons.append("Looks related to jobs, hiring, or internal people operations")
    elif category == "Complaint":
        reasons.append("Contains dissatisfaction, issue reporting, or refund-related language")
    elif category == "General Inquiry":
        reasons.append("Appears to be a general non-urgent inquiry")

    return " | ".join(reasons)

@app.route('/predict', methods=['POST'])
def predict_email():
    """
    Main API endpoint
    Input: {"email_text": "..."}
    Output: {"category": "...", "priority": "...", "department": "...", "reason": "..."}
    """
    try:
        data = request.get_json()

        # Validation
        if not data or 'email_text' not in data:
            return jsonify({"error": "Missing 'email_text' field"}), 400

        email_text = clean_text(data['email_text'])

        if not email_text:
            return jsonify({"error": "Email text cannot be empty"}), 400

        # STEP 1: SPAM DETECTION FIRST
        if is_spam(email_text):
            return jsonify({
                "category": "Spam",
                "priority": "Low",
                "department": "Ignore / Spam",
                "reason": generate_reason(email_text, "Spam", "Low")
            })

        # STEP 2: ZERO-SHOT AI CLASSIFICATION
        result = classifier(email_text, CATEGORIES)
        category = result['labels'][0]

        # STEP 3: PRIORITY
        priority = calculate_priority(email_text, category)

        # STEP 4: DEPARTMENT
        department = DEPARTMENT_MAP.get(category, "Admin")

        return jsonify({
            "category": category,
            "priority": priority,
            "department": department,
            "reason": generate_reason(email_text, category, priority)
        })

    except Exception as e:
        print("❌ ERROR:", str(e))
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route('/', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "AI Email Triage Backend is running!",
        "endpoint": "/predict"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🚀 Starting AI Email Triage Backend on http://localhost:5000")
    print("📧 POST /predict with {'email_text': 'your email'}")
    app.run(host='0.0.0.0', port=port, debug=True)