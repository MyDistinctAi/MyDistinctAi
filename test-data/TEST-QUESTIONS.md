# 🧪 RAG Testing Questions for Company Handbook

## 📋 **How to Test:**

1. **Upload the Document:**
   - Go to Models → Create New Model
   - Name: "HR Assistant"
   - Base Model: "Gemini Flash 1.5 8B (FREE - Cloud)"
   - Upload: `company-handbook.txt`
   - Click Create

2. **Go to Chat:**
   - Select "HR Assistant" model
   - Verify header shows "🤖 Gemini Flash"

3. **Ask These Questions:**
   - The AI should answer using the document context
   - Verify answers are accurate and specific

---

## ✅ **Easy Questions (Should Answer Perfectly)**

### Question 1: Vacation Days
**Ask:** "How many vacation days do I get in my first year?"

**Expected Answer:** 
- 15 days paid vacation in year 1-2
- Should mention it increases to 20 days in year 3-5
- Should mention 25 days after year 6

---

### Question 2: Company CEO
**Ask:** "Who is the CEO of ACME Corporation?"

**Expected Answer:**
- Sarah Johnson
- Should be confident and direct

---

### Question 3: Remote Work Equipment
**Ask:** "What equipment does the company provide for remote work?"

**Expected Answer:**
- Laptop (MacBook Pro or Dell XPS)
- Monitor (27-inch 4K)
- Keyboard and mouse
- $500 home office stipend

---

### Question 4: Health Insurance Premium
**Ask:** "How much is the Gold health insurance plan per month?"

**Expected Answer:**
- $150/month (employee portion)
- $500 deductible
- 90% coverage after deductible
- $2,000 out-of-pocket max

---

### Question 5: 401(k) Match
**Ask:** "What is the company 401k match?"

**Expected Answer:**
- 100% match up to 6% of salary
- 20% vesting per year
- Fully vested after 5 years

---

## 🎯 **Medium Questions (Test Understanding)**

### Question 6: Remote Work Eligibility
**Ask:** "Can I work remotely? What are the requirements?"

**Expected Answer:**
- Must be employed for at least 6 months
- Performance rating of "Meets Expectations" or higher
- Role must be suitable for remote work
- Options: Hybrid (2-3 days) or Full Remote

---

### Question 7: Parental Leave Comparison
**Ask:** "What's the difference between birth parent and non-birth parent leave?"

**Expected Answer:**
- Birth parent: 16 weeks paid
- Non-birth parent: 8 weeks paid
- Both at full salary
- Can be taken within 12 months

---

### Question 8: Professional Development Budget
**Ask:** "How much can I spend on training and courses?"

**Expected Answer:**
- $2,000 per employee annually
- Covers courses, conferences, certifications, books
- Need manager approval
- VP approval for over $1,000

---

### Question 9: Referral Bonus
**Ask:** "How much do I get for referring an engineer?"

**Expected Answer:**
- $5,000 for engineering roles
- 50% after 90 days
- 50% after 6 months
- Candidate must stay 6 months

---

### Question 10: Office Locations
**Ask:** "Where are the company offices located?"

**Expected Answer:**
- San Francisco HQ
- New York
- Austin
- London
- Should include addresses

---

## 🔥 **Hard Questions (Test RAG Context Retrieval)**

### Question 11: Specific Calculation
**Ask:** "If I'm 52 years old, what's the maximum I can contribute to my 401k in 2024?"

**Expected Answer:**
- Regular limit: $23,000
- Catch-up (age 50+): $7,500
- Total: $30,500

---

### Question 12: Multi-Step Process
**Ask:** "What's the complete process to request vacation?"

**Expected Answer:**
1. Submit request at least 2 weeks in advance
2. Get manager approval via email
3. Update team calendar
4. Set out-of-office auto-reply

---

### Question 13: Comparison Question
**Ask:** "Compare the three health insurance plans"

**Expected Answer:**
Should compare Gold, Silver, Bronze with:
- Premiums ($150, $75, $25)
- Deductibles ($500, $1,500, $3,000)
- Coverage (90%, 80%, 70%)
- Out-of-pocket max

---

### Question 14: Conditional Logic
**Ask:** "I've been here 4 years and got 'Meets Expectations' rating. What raise can I expect?"

**Expected Answer:**
- Meets Expectations = 3-5% raise + bonus
- Should reference the performance review section

---

### Question 15: Multiple Data Points
**Ask:** "Tell me about the New York office - address, phone, hours, and how to get there"

**Expected Answer:**
- Address: 456 Tech Plaza, New York, NY 10001
- Phone: (212) 555-0200
- Hours: 9am-7pm EST
- Subway: 2 blocks from Penn Station

---

## 🚫 **Negative Tests (Should Say "Not in Document")**

### Question 16: Not in Document
**Ask:** "What's the dress code?"

**Expected Answer:**
- Should say this information is not in the handbook
- Should NOT make up an answer

---

### Question 17: Not in Document
**Ask:** "What's the company's stock price?"

**Expected Answer:**
- Should say this information is not available
- Should NOT make up financial data

---

## 📊 **Success Criteria**

### ✅ **RAG is Working If:**
1. Answers are **specific** (mentions exact numbers, dates, names)
2. Answers **cite the document** (e.g., "According to the handbook...")
3. Answers are **accurate** (matches the document exactly)
4. Answers **don't hallucinate** (doesn't make up info not in doc)
5. Answers **say "not in document"** when info isn't available

### ❌ **RAG is NOT Working If:**
1. Answers are **vague** (e.g., "The company offers competitive benefits")
2. Answers are **generic** (could apply to any company)
3. Answers are **wrong** (contradicts the document)
4. Answers **make up information** not in the document
5. Answers **don't reference the context**

---

## 🎯 **Quick Test Sequence**

**5-Minute Test:**
1. Ask: "Who is the CEO?" (Should say Sarah Johnson)
2. Ask: "How many vacation days in year 1?" (Should say 15 days)
3. Ask: "What's the 401k match?" (Should say 100% up to 6%)
4. Ask: "What's the dress code?" (Should say not in document)

If all 4 are correct → **RAG is working! ✅**

---

## 📝 **Testing Checklist**

- [ ] Upload document to model
- [ ] Verify AI model badge shows "🤖 Gemini Flash"
- [ ] Test 3 easy questions
- [ ] Test 2 medium questions
- [ ] Test 1 hard question
- [ ] Test 1 negative question
- [ ] Verify no mock responses
- [ ] Verify answers are specific and accurate
- [ ] Check server logs for RAG context retrieval

---

**File Location:** `test-data/company-handbook.txt`

**Ready to test! Upload the handbook and start asking questions! 🚀**
