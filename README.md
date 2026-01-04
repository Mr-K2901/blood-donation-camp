# Blood Donation Camp Web App
This project is a simple web application built to manage and promote a blood donation camp.
It focuses on smooth user experience, avoiding duplicate entries, and encouraging participation through referrals.

---

## What the App Does

The app guides a user through a **4-step process**, starting from registration and ending with sharing the campaign with others.

---

## User Flow

### 1. Registration

* Users register using **Name, Mobile Number, and Blood Group**
* If the same mobile number is entered again, the app:

  * Detects the existing user
  * Logs them back in automatically
  * Prevents duplicate records in the sheet
* The home screen shows **live counts** of:

  * Users who joined
  * Users who donated

---

### 2. Donation

* A personalized message is shown to the donor
* Users can upload a donation selfie using:

  * Camera
  * Gallery
* Once the photo is uploaded, the donor’s status is updated to **“Donated”**

---

### 3. Gift & Certificate

* After donation, users upload their **certificate or gift photo**
* This step completes the donor journey
* Uploading here marks the status as **“Completed”**

---

### 4. Ambassador (Final Step)

* A success screen confirms completion
* Users can share the campaign directly to **WhatsApp Status**
* The shared content automatically includes the gift/certificate image
* Each donor gets a **unique QR code**

  * When someone joins using this QR code, the original donor gets credit
  * This is tracked as an **Impact Score**

---

## Safety and Reliability

* Before confirming any upload, the app checks if the user’s row exists in Google Sheets
  This avoids false “Upload Successful” messages
* If a user leaves midway and returns later:

  * The app detects their last completed step
  * Automatically redirects them to the correct screen

---

## How the System Is Built

### Frontend

* **File:** `index.html`
* Hosted using **GitHub Pages**
* Handles:

  * UI
  * Step navigation
  * API calls to the backend

---

### Backend

* **File:** `Code.gs`
* Hosted on **Google Apps Script**
* Handles:

  * Reading/writing data to Google Sheets
  * Uploading images to Google Drive
  * Login detection, referrals, and validations

---

### Storage

* **Google Sheets** – acts as the database
* **Google Drive** – stores all uploaded images

---

## Setup & Deployment

### 1. Google Apps Script

* Paste backend code into `Code.gs`
* Deploy as:

  ```
  Deploy → New Deployment → Web App
  ```
* Access level set to **Anyone**
* Copy the generated Web App URL

---

### 2. Connecting Frontend and Backend

* Add the Web App URL at the top of `index.html`:

```javascript
let API_URL = "https://script.google.com/macros/s/XXXXXXX/exec";
```

---

### 3. Hosting the Frontend

* Push `index.html` to GitHub
* Enable GitHub Pages
* The app becomes live on the GitHub Pages URL

---
