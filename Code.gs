/**
 * BLOOD DONATION CAMP SPA BACKEND
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Run the 'setupSheet' function once to initialize the Sheet.
 * 5. Deploy > New Deployment > Web App.
 *    - Description: "Blood Donation v1"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 6. Copy the Deployment URL (required for frontend).
 */

// --- CONFIGURATION ---
// Leave SHEET_ID empty if the script is bound to the sheet (created from Extensions menu).
// If using a standalone script, paste the Sheet ID here.
var SHEET_ID = ""; 
var FOLDER_NAME = "BloodDonation_Selfies";
var SNACK_FOLDER_NAME = "BloodDonation_Snacks";
var GIFT_FOLDER_NAME = "BloodDonation_Gifts";

// --- MAIN ENTRY POINT (API) ---
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for other processes to finish.
  lock.tryLock(30000); 
  
  try {
    var params = {};
    
    // Handling different post data structures
    if (e.parameter) {
      Object.assign(params, e.parameter);
    }
    
    // If JSON body is sent as text/plain (to avoid CORS preflight)
    if (e.postData && e.postData.contents) {
      try {
        var jsonData = JSON.parse(e.postData.contents);
        Object.assign(params, jsonData);
      } catch (err) {
        // Content might not be JSON, ignore
      }
    }

    var action = params.action;
    var result = {};

    if (action === "register") {
      result = registerDonor(params);
    } else if (action === "upload_selfie") {
      result = uploadImage(params, "Selfie");
    } else if (action === "upload_snack") {
      result = uploadImage(params, "Snack");
    } else if (action === "upload_gift") {
      result = uploadImage(params, "Gift");
    } else if (action === "get_stats") {
      result = getGlobalStats();
    } else if (action === "check_status") {
       // Optional: feature to check status by mobile if localstorage lost
       result = { status: "success", message: "Status pending implementation" };
    } else {
      result = { status: "error", message: "Invalid action: " + action };
    }

    return createResponse(result);
    
  } catch (error) {
    return createResponse({ status: "error", message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Handle GET requests (checking if API is live)
function doGet(e) {
  if (e.parameter && e.parameter.action === "get_donor_stats") {
     return createResponse(getReferralCount(e.parameter.donor_id));
  }
  return createResponse({ status: "success", message: "Blood Donation API is Online" });
}

// --- HELPER FUNCTIONS ---

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss;
  if (SHEET_ID) {
    ss = SpreadsheetApp.openById(SHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  var sheet = ss.getSheetByName("Donors");
  if (!sheet) {
    sheet = ss.insertSheet("Donors");
    // Initialize headers: Timestamp, DonorID, Name, Mobile, BloodGroup, ReferrerID, Status, SelfieURL, SnackURL, GiftURL
    sheet.appendRow(["Timestamp", "DonorID", "Name", "Mobile", "BloodGroup", "ReferrerID", "Status", "SelfieURL", "SnackURL", "GiftURL"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// --- CORE LOGIC ---

function registerDonor(data) {
  var sheet = getSheet();
  var timestamp = new Date();
  
  // Sanitize inputs
  var name = data.name || "Anonymous";
  var mobile = data.mobile || "";
  var bloodGroup = data.blood_group || "";
  var referrer = data.referrer || "";
  
  // Check for duplicates based on mobile (Simple check)
  var allData = sheet.getDataRange().getValues();
  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][3]) === String(mobile) && mobile !== "") {
       return { 
         status: "success", 
         donor_id: allData[i][1], 
         name: allData[i][2],
         recovered: true,
         message: "Welcome back!" 
       };
    }
  }

  var uniqueId = "HERO-" + Math.floor(1000 + Math.random() * 9000) + "-" + Date.now().toString().slice(-4); 
  
  sheet.appendRow([
    timestamp,
    uniqueId,
    name,
    "'" + mobile, // Force string 
    bloodGroup,
    referrer,
    "Registered",
    "",
    "",
    ""
  ]);
  
  return { 
    status: "success", 
    donor_id: uniqueId, 
    name: name,
    message: "Welcome to the cause!" 
  };
}

function uploadImage(data, type) {
  // data.image_base64 (no header), data.donor_id, data.filename
  var donorId = data.donor_id;
  if (!donorId) return { status: "error", message: "Missing Donor ID" };
  
  // Handle Base64 header if present
  var base64Data = data.image_base64;
  if (base64Data.indexOf("base64,") > -1) {
    base64Data = base64Data.split("base64,")[1];
  }
  
  var folderName = FOLDER_NAME;
  if (type === "Snack") folderName = SNACK_FOLDER_NAME;
  if (type === "Gift") folderName = GIFT_FOLDER_NAME;
  
  var folder = getOrCreateFolder(folderName);
  
  var fileName = (data.filename || "image") + "_" + donorId + ".jpg";
  var imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), "image/jpeg", fileName);
  
  var file = folder.createFile(imageBlob);
  // Make file publicly viewable so we can display it if needed
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  var fileUrl = file.getDownloadUrl(); 
  
  // Update Sheet
  // Selfie -> Col 8 (Index 7), Snack -> Col 9 (Index 8), Gift -> Col 10 (Index 9)
  // Status -> Col 7 (Index 6)
  var colIndex = 7;
  var status = "Donated";
  
  if (type === "Snack") { colIndex = 8; status = "Snacked"; }
  if (type === "Gift") { colIndex = 9; status = "Completed"; }

  updateDonorRow(donorId, colIndex, fileUrl, status);
  
  return { status: "success", file_url: fileUrl, message: type + " uploaded successfully!" };
}

function getOrCreateFolder(name) {
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(name);
  }
}

function updateDonorRow(donorId, colIndex, value, newStatus) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  
  // Iterate to find donor
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(donorId)) { 
      // Row is i + 1
      sheet.getRange(i + 1, colIndex + 1).setValue(value);
      if (newStatus) {
         sheet.getRange(i + 1, 7).setValue(newStatus); 
      }
      return;
    }
  }
}

function getGlobalStats() {
  var sheet = getSheet();
  var lastRow = sheet.getLastRow();
  var count = lastRow > 1 ? lastRow - 1 : 0;
  return { status: "success", count: count };
}

function getReferralCount(donorId) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var count = 0;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][5]) === String(donorId)) { // ReferrerID at index 5
      count++;
    }
  }
  return { status: "success", referral_count: count };
}

function setupSheet() {
  var sheet = getSheet();
  // FORCE DRIVE PERMISSIONS: This line ensures the script asks for Drive access during setup.
  var root = DriveApp.getRootFolder(); 
  Logger.log("Sheet initialized: " + sheet.getName());
}
