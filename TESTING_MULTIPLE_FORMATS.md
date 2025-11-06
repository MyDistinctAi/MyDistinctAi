# Testing Multiple File Formats

## 📁 Sample Files Created

I've created 3 comprehensive sample files for testing:

1. **`sample-company-policy.txt`** (1.7 KB)
   - Work hours & schedule
   - Remote work policy
   - Vacation & time off
   - Benefits package
   - Performance & compensation

2. **`sample-employee-handbook.txt`** (3.2 KB)
   - Code of conduct
   - Dress code
   - Workplace behavior
   - Training & development
   - Health & safety

3. **`sample-safety-guidelines.txt`** (5.1 KB)
   - Emergency procedures
   - Workplace safety rules
   - Health & wellness programs
   - Incident reporting
   - Security procedures

---

## 🧪 How to Test in Browser

### Step 1: Login
1. Open browser: `http://localhost:4000`
2. Use xray route: `http://localhost:4000/xray/johndoe`
3. You're now logged in as test user

### Step 2: Create Model
1. Go to **Models** page
2. Click **"Create Model"** button
3. Fill in details:
   - **Name**: "Multi-Format Test Model"
   - **Description**: "Testing TXT files with different content"
   - **Base Model**: Select "DeepSeek Chat V3.1"
   - **Training Mode**: Standard
4. **Upload Files**:
   - Click "Upload Training Files"
   - Select all 3 sample files:
     - `sample-company-policy.txt`
     - `sample-employee-handbook.txt`
     - `sample-safety-guidelines.txt`
5. Click **"Create Model"**

### Step 3: Wait for Processing
- Files will upload automatically
- Embeddings will be generated (takes ~30 seconds)
- Check **Training Data** page to see processed files
- Status should show "Processed" for each file

### Step 4: Test Chat with RAG
Go to **Chat** page and ask questions about each file:

#### Questions for Company Policy (File 1):
```
❓ "What are the work hours at ACME Corporation?"
Expected: Monday-Friday, 9 AM - 5 PM, 1 hour lunch

❓ "How many vacation days do employees get?"
Expected: 15 days (Year 1-2), 20 days (Year 3-5), 25 days (Year 6+)

❓ "What is the remote work policy?"
Expected: 2 days remote, 3 days in-office, must be in on Tuesdays and Thursdays

❓ "What benefits does ACME offer?"
Expected: Health insurance, 401(k) with 5% match, $2,000 professional development
```

#### Questions for Employee Handbook (File 2):
```
❓ "What is the dress code policy?"
Expected: Business casual Mon-Thu, Casual Friday, Business formal for client meetings

❓ "What training programs are available?"
Expected: 2-week onboarding, quarterly workshops, leadership training, certifications

❓ "What are the communication channels?"
Expected: Email, Slack, Zoom, in-person, monthly town halls

❓ "What is the code of conduct?"
Expected: Respect, professionalism, zero tolerance for harassment
```

#### Questions for Safety Guidelines (File 3):
```
❓ "What should I do in case of a fire alarm?"
Expected: Sound alarm, evacuate via stairwell, go to north parking lot, don't use elevators

❓ "What health and wellness programs are available?"
Expected: Free health screenings, EAP counseling, gym reimbursement $50/month

❓ "What are the ergonomic guidelines?"
Expected: Adjust chair, monitor at eye level, take breaks every 30 minutes

❓ "How do I report a safety incident?"
Expected: Notify supervisor immediately, complete incident report within 24 hours
```

---

## 🎯 Expected Results

### ✅ What Should Happen:

1. **File Upload**: All 3 files upload successfully
2. **Processing**: Files are processed and embeddings generated
3. **RAG Retrieval**: Questions retrieve relevant context from correct file
4. **AI Response**: DeepSeek provides accurate answers based on file content
5. **Accuracy**: Responses should match the information in the files

### 📊 Success Criteria:

- ✅ All files show "Processed" status
- ✅ Each question retrieves context from the correct file
- ✅ AI responses are accurate and relevant
- ✅ RAG similarity scores are high (>70%)
- ✅ No errors in console or server logs

---

## 🔍 Verification Checklist

After testing, verify:

- [ ] All 3 files uploaded successfully
- [ ] All 3 files show "Processed" status in Training Data page
- [ ] Embeddings were generated (check database or logs)
- [ ] Chat responses are accurate for File 1 (Company Policy)
- [ ] Chat responses are accurate for File 2 (Employee Handbook)
- [ ] Chat responses are accurate for File 3 (Safety Guidelines)
- [ ] RAG retrieves context from the correct file for each question
- [ ] No errors in browser console
- [ ] No errors in server logs

---

## 📝 Testing Different File Formats

### Current Support:
The system currently supports **text-based files**:
- ✅ `.txt` - Plain text
- ✅ `.md` - Markdown
- ✅ `.csv` - Comma-separated values

### Future Support (requires additional libraries):
- ⏳ `.pdf` - Requires PDF parsing library (pdf-parse)
- ⏳ `.docx` - Requires Word parsing library (mammoth)
- ⏳ `.xlsx` - Requires Excel parsing library (xlsx)

### To Test PDF and DOCX:
1. **Install required libraries**:
   ```bash
   npm install pdf-parse mammoth
   ```

2. **Update file processing logic** in:
   - `src/lib/file-processor.ts`
   - Add PDF and DOCX parsing functions

3. **Test with actual PDF/DOCX files**:
   - Convert sample TXT files to PDF/DOCX
   - Upload through the UI
   - Verify processing works

---

## 🐛 Troubleshooting

### Files Not Uploading:
- Check file size (max 10MB)
- Verify file type is supported
- Check browser console for errors
- Verify you're logged in

### Files Not Processing:
- Check server logs for errors
- Verify OpenRouter API key is valid
- Check database connection
- Verify embeddings are being generated

### RAG Not Retrieving Context:
- Check embeddings were stored
- Verify vector search is working
- Check similarity threshold (default: 0.7)
- Look at server logs for RAG queries

### AI Not Responding:
- Check OpenRouter API key
- Verify rate limits not exceeded
- Check model is available
- Look at server logs for errors

---

## 📊 Performance Metrics

Expected processing times:
- **File Upload**: < 1 second per file
- **Embedding Generation**: 2-5 seconds per file
- **RAG Retrieval**: < 500ms
- **AI Response**: 5-10 seconds (streaming)

Expected accuracy:
- **RAG Similarity**: > 70% for relevant queries
- **Response Accuracy**: > 90% based on file content
- **Context Retrieval**: Correct file 95%+ of the time

---

## ✅ Success!

If all tests pass, you've successfully verified:
1. ✅ Multi-file upload works
2. ✅ Embedding generation works for multiple files
3. ✅ RAG retrieves context from correct files
4. ✅ AI provides accurate responses based on training data
5. ✅ System handles multiple documents simultaneously

**Your platform is ready for production use with multiple training files!** 🎉
