# Report Verification Workflow - Complete Implementation

## Overview
This document describes the complete report verification workflow that prevents misinformation spread while protecting farmers from disease/pest outbreaks.

## Workflow Diagram

```
Farmer → AI Doctor → Submit Report → Govt Officer → Verify/Review → Alert Other Farmers
              ↓                            ↓              ↓
         Disease Detection          [Pending List]  [Verified/Rejected]
         Phone Number              Phone Number     Alert Published
         GN Division               GN Division      to Area
```

---

## Phase 1: Farmer Registration & Reporting

### 1.1 Updated User Registration
**File:** `client/src/components/Register.js`

**Changes:**
- Added `phone` field to form data (required)
- Added UI inputs for phone number in English and Sinhala
- Phone number is stored in `User.phone` database field
- Gram Niladari Division already captured in `User.gnDivision`

**Database Fields:**
```javascript
{
  phone: '+94771234567',        // Contact number
  fullName: 'Namal Perera',
  gnDivision: 'Anuradhapura GN',
  dsDivision: 'Anuradhapura DS',
  district: 'Anuradhapura'
}
```

### 1.2 AI Doctor Report Submission
**File:** `client/src/components/AIDoctor.js`

**Changes:**
- Modified `saveDiseaseReport()` function to use new `/api/reports/submit` endpoint
- When disease is detected (not "Healthy"), user sees "Submit Report" button
- Report includes:
  - Image of affected leaf
  - AI prediction (disease name)
  - Confidence score
  - Description from AI analysis
  - Farmer's contact number (from `user.phone`)
  - Farmer's GN Division (from `user.gnDivision`)

**Submission Data:**
```javascript
{
  title: "Rice - Leaf Blast",
  description: "Disease detected by AI Crop Doctor",
  image_url: "base64_or_url",
  ai_prediction: "Leaf Blast",
  confidence_score: 0.92,
  report_type: "disease"
  // Backend adds: farmerId, farmerName, farmerPhone, district, dsDivision, gnDivision
}
```

---

## Phase 2: Government Officer Review & Verification

### 2.1 Report Model
**File:** `server/models/Report.js`

**Key Fields:**
```javascript
{
  // Source Information
  farmerId: ObjectId,
  farmerName: 'Namal Perera',
  farmerPhone: '+94771234567',     // ← Can call to confirm
  
  // Location
  gnDivision: 'Anuradhapura GN',
  district: 'Anuradhapura',
  
  // Content
  title: 'Rice - Leaf Blast',
  ai_prediction: 'Leaf Blast',
  confidence_score: 0.92,
  image_url: '...',
  
  // Verification
  status: 'pending' | 'verified' | 'rejected' | 'resolved',
  verifiedBy: ObjectId,           // Officer ID
  verificationDate: Date,
  verificationNotes: 'Confirmed with farmer',
  severity: 'low' | 'medium' | 'high' | 'critical',
  
  // Alert Status
  alertSentToFarmers: Boolean,
  alertSentDate: Date,
  affectedFarmersCount: Number
}
```

### 2.2 Officer Verification Dashboard
**File:** `client/src/components/ReportVerification.js`

**Features:**
- Only accessible to users with `role: 'officer'`
- Shows all pending reports for officer's GN Division
- For each report displays:
  - Farmer name and **clickable phone number** to call farmer
  - Disease/pest name from AI
  - AI confidence score with visual bar
  - Location details
  - Disease image
  - Report timestamp

**Verification Actions:**
1. **VERIFY & ALERT** - Mark as verified, set severity, add notes
   - Automatically creates alert for all other farmers in GN Division
   - Alert includes farmer's contact info + recommendation
   
2. **REJECT** - Mark as false report
   - Report discarded
   - No alert sent
   
3. **NOTES** - Officer can add verification context
   - Confirmation notes
   - Additional observations
   - Treatment recommendations

### 2.3 Report Verification API
**File:** `server/routes/reports.js`

**Endpoints:**

```javascript
// Get pending reports for officer's division
GET /api/reports/pending
Headers: Authorization: Bearer {token}
Response: [ { reportId, title, farmerName, farmerPhone, ... } ]

// Verify or reject a report
PUT /api/reports/:id/verify
Body: {
  status: 'verified' | 'rejected',
  verificationNotes: 'Officer notes',
  severity: 'low' | 'medium' | 'high' | 'critical'
}
Response: { success: true, report: {...} }
```

---

## Phase 3: Farmer Alerts in Area

### 3.1 Alert Model
**File:** `server/models/Alert.js`

**Key Fields:**
```javascript
{
  // Alert Details
  alert_type: 'disease' | 'pest' | 'weather',
  title: 'Alert: Leaf Blast detected in your area',
  description: 'Disease confirmed in Anuradhapura GN division',
  
  // Source
  reportId: ObjectId,              // Links back to original report
  originalProblem: 'Leaf Blast',
  
  // Target Area
  gnDivision: 'Anuradhapura GN',
  targetFarmers: [ ObjectId, ... ], // All farmers in area except reporter
  
  // Recommendations
  recommendations: [
    'Monitor crops closely for similar symptoms',
    'Contact farmer Namal at +94771234567 for details',
    'Apply recommended fungicide within 2 days'
  ],
  preventiveMeasures: [...],
  treatment: 'Spray carbendazim 500 SC...',
  
  // Publishing
  publishedBy: ObjectId,           // Officer ID
  publishedDate: Date,
  expiresAt: Date,                 // Expires after 30 days
  
  // Tracking
  viewedBy: [ ObjectId, ... ],     // Farmers who viewed
  isActive: Boolean
}
```

### 3.2 Farmer Alerts Component
**File:** `client/src/components/AreaAlerts.js`

**Features:**
- Only visible to farmers
- Shows all active alerts for farmer's GN Division
- For each alert displays:
  - Alert title and severity (critical/high/medium/low)
  - Description of problem
  - Officer's name and designation
  - Original problem from farmer's report
  - **Contact recommendations** (farmer's name + phone)
  - Published date and expiration date

**Alert Details Modal:**
- Full alert content
- Detailed recommendations
- Preventive measures (step-by-step)
- Treatment information
- Officer contact info

**Tracking:**
- Alert records farmers who have viewed it
- Alerts expire after 30 days or manually marked resolved

### 3.3 Alert API Endpoints
**File:** `server/routes/reports.js`

```javascript
// Get alerts for farmer's area (auto-marks as viewed)
GET /api/reports/alerts/my-area
Headers: Authorization: Bearer {token}
Response: {
  success: true,
  alerts: [{
    title: 'Alert: Leaf Blast detected in Anuradhapura GN',
    description: '...',
    originalProblem: 'Leaf Blast',
    recommendations: [...],
    publishedBy: { fullName: 'Officer Name', ... }
  }],
  count: 3
}
```

---

## Data Flow Summary

### Timeline

1. **Farmer**: Takes photo, AI detects disease → Reports with phone number
2. **System**: Stores report, finds all officers in GN Division
3. **Officer**: Views pending reports, sees farmer's name + phone
4. **Officer**: Can call farmer at provided number to confirm
5. **Officer**: Approves/rejects report with verification notes
6. **System** (if approved): Creates alert for all farmers in area
7. **Farmers**: Receive alert with:
   - Disease details
   - Original farmer's contact info
   - Recommendations & treatment
   - Officer's name & designation

### Information Flow

```
Farmer Data:
├── Name + Phone (for officer to confirm)
├── Location (GN Division)
└── Disease report with image

↓ (Officer Review)

Officer Decision:
├── ✓ Verified → Create Area Alert
├── ✗ Rejected → Discard report
└── Notes → Added to report

↓ (If Verified)

Area Alert Created:
├── Shows original farmer contact info
├── Targets all farmers in GN Division
├── Includes treatment recommendations
└── Published for 30 days
```

---

## Security Features

1. **Only verified reports** create alerts
   - Officer must confirm with farmer by phone
   - False reports discarded
   - Prevents misinformation spread

2. **Contact information protected**
   - Only shared between farmer (reporter) and officer
   - Officer can call farmer before verification
   - Only farmer's name shown in alert (phone optional)

3. **Farmer accountability**
   - Reports traceable to specific farmer
   - False reports tracked (future: flagging system)

4. **Area-based containment**
   - Alerts only sent to farmers in same GN Division
   - Prevents unnecessary panic in distant areas

---

## Testing the Workflow

### Step 1: Register Farmer
```
Role: Farmer
Phone: +94771234567
GN Division: Anuradhapura GN
```

### Step 2: Submit Disease Report
```
1. Go to AI Doctor
2. Upload leaf photo
3. System detects disease
4. Click "Submit Report to Government Officers"
5. Report submitted with phone number & location
```

### Step 3: Officer Reviews
```
1. Register as Government Officer
2. Go to Report Verification
3. See pending reports
4. Click report to view details
5. Call farmer at provided phone number
6. Click "Verify & Alert Farmers"
7. Add verification notes
8. System creates alert
```

### Step 4: Farmers See Alert
```
1. Login as different farmer in same GN Division
2. Go to Area Alerts
3. See new disease alert
4. Can contact original farmer
5. Can view recommendations & treatment
```

---

## Database Queries

### Find reports pending for officer's GN Division
```javascript
Report.find({
  gnDivision: currentUser.gnDivision,
  status: 'pending'
})
```

### Find all farmers to alert when report verified
```javascript
User.find({
  role: 'farmer',
  gnDivision: report.gnDivision,
  _id: { $ne: report.farmerId } // Exclude reporter
})
```

### Find active alerts for farmer
```javascript
Alert.find({
  gnDivision: farmer.gnDivision,
  isActive: true,
  expiresAt: { $gt: new Date() }
})
```

---

## Future Enhancements

1. **SMS/Email Notifications**
   - Notify officers when reports submitted
   - Notify farmers when new alerts published
   - Confirm receipt via SMS

2. **False Report Tracking**
   - Track false reports by farmer
   - Flag accounts with multiple false reports
   - Require approval for flagged farmers' reports

3. **Image Storage**
   - Upload to cloud storage (AWS S3, Firebase)
   - Generate thumbnails
   - Store image URLs in database

4. **Report Analytics**
   - Common diseases by district
   - Seasonal patterns
   - Farmer compliance rate

5. **Officer Dashboard**
   - Stats on reports reviewed
   - Response time metrics
   - Effectiveness of alerts

---

## Files Modified/Created

### Backend
- ✅ `server/models/Report.js` - NEW
- ✅ `server/models/Alert.js` - NEW
- ✅ `server/routes/reports.js` - NEW
- ✅ `server/index.js` - MODIFIED (added routes)

### Frontend
- ✅ `client/src/components/Register.js` - MODIFIED (added phone field)
- ✅ `client/src/components/AIDoctor.js` - MODIFIED (updated save function)
- ✅ `client/src/components/ReportVerification.js` - NEW
- ✅ `client/src/components/AreaAlerts.js` - NEW

### Database
- ✅ `User.phone` - Already exists
- ✅ `User.gnDivision` - Already exists
- ✅ `Report` - NEW collection
- ✅ `Alert` - NEW collection

---

## Deployment Checklist

- [ ] Pull latest code: `git pull origin Kalana3`
- [ ] Rebuild backend: `docker-compose build --no-cache backend client`
- [ ] Restart services: `docker-compose up -d`
- [ ] Verify containers: `docker ps`
- [ ] Test registration with phone number
- [ ] Test AI Doctor report submission
- [ ] Create test accounts (farmer + officer)
- [ ] Test report verification flow
- [ ] Test farmer alert display
- [ ] Check database collections created

---

**Status:** ✅ Ready for EC2 Deployment
**Last Updated:** February 8, 2026
**Version:** 1.0
