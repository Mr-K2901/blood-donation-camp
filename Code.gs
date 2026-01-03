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
  
  // Check for duplicates based on mobile (Simple Check)
  var allData = sheet.getDataRange().getValues();
  var inputMobile = String(mobile).trim();

  for (var i = 1; i < allData.length; i++) {
    var sheetMobile = String(allData[i][3]).trim();
    
    // Exact match on trimmed strings
   if (sheetMobile === inputMobile && inputMobile !== "") {
       // Returning existing donor info
       return { 
         status: "success", 
         donor_id: allData[i][1], 
         name: allData[i][2],
         current_status: allData[i][6], // Status
         referrer: allData[i][5], // Referrer
         gift_url: allData[i][9], // Gift URL (Col 10)
         recovered: true, // Flag for frontend redirect
         message: "Welcome back!" 
       };
    }
  }

  // Generate Custom ID: BloodGroup_Name_Last4Mobile
  var cleanName = name.replace(/[^a-zA-Z0-9]/g, ""); 
  var cleanBG = bloodGroup.replace(/[^a-zA-Z0-9\+\-]/g, "") || "Unknown"; // Allow + and -
  var lastFour = String(mobile).slice(-4);
  
  var uniqueId = cleanBG + "_" + cleanName + "_" + lastFour;
  
  // Fallback
  if (cleanName.length === 0) uniqueId = "Donor_" + lastFour + "_" + Math.floor(Math.random()*1000); 
  
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

// Check if user is registered (optional helper)
function checkUser(mobile) {
   // ... existing logic if needed ...
}

// 2. Upload Image
function uploadImage(data) {
  try {
    var mainFolder = getOrCreateFolder(MAIN_FOLDER_NAME); // Use MAIN_FOLDER_NAME for the top-level folder
    
    // Sub-folders based on type
    var subFolder;
    if (data.type === "selfie") subFolder = getOrCreateNestedFolder(mainFolder, FOLDER_NAME);
    else if (data.type === "snack") subFolder = getOrCreateNestedFolder(mainFolder, SNACK_FOLDER_NAME);
    else if (data.type === "gift") subFolder = getOrCreateNestedFolder(mainFolder, GIFT_FOLDER_NAME);
    else subFolder = mainFolder; // Fallback to main folder if type is unknown
    
    // Handle Base64 header if present
    var base64Data = data.image_base64 || data.image; // Use image_base64 or image
    if (base64Data.indexOf("base64,") > -1) {
      base64Data = base64Data.split("base64,")[1];
    }

    var contentType = data.mimeType || "image/jpeg";
    var fileName = (data.filename || "image") + "_" + data.donor_id + ".jpg"; // Ensure donor_id is used in filename
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
    var file = subFolder.createFile(blob);
    
    // Make file publicly viewable so we can display it if needed
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Update Sheet Status
    var sheetUpdated = updateDonorStatus(data.donor_id, data.type, file.getDownloadUrl());
    
    if (!sheetUpdated) {
        return { status: "error", message: "Image uploaded to Drive, but Donor Record not found in Sheet. Check Donor ID." };
    }
    
    return { status: "success", file_url: file.getDownloadUrl() };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

// Helper: Update Status in Sheet
function updateDonorStatus(donorId, type, url) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var targetId = String(donorId).trim(); // Trim input ID
  
  for (var i = 1; i < data.length; i++) {
    // Compare with trimmed sheet ID
    if (String(data[i][1]).trim() === targetId) {
      
      var newStatus = data[i][6]; // Default to current status
      
      if (type === "selfie") {
        sheet.getRange(i+1, 8).setValue(url); // Col 8
        newStatus = "Donated";
      } else if (type === "gift") {
        sheet.getRange(i+1, 10).setValue(url); // Col 10
        newStatus = "Completed";
      }
      
      sheet.getRange(i+1, 7).setValue(newStatus); // Update Status
      
      return true; // Found and updated
    }
  }
  return false; // Not found
}

var MAIN_FOLDER_NAME = "Blood Donation Camp 2026"; // Parent Folder

function getOrCreateFolder(name) {
  // This function is now for the top-level folder
  var folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(name);
  }
}

function getOrCreateNestedFolder(parentFolder, name) {
  // This function creates/gets sub-folders within a parent
  var subFolders = parentFolder.getFoldersByName(name);
  if (subFolders.hasNext()) {
    return subFolders.next();
  } else {
    return parentFolder.createFolder(name);
  }
}

function updateDonorRow(donorId, colIndex, value, newStatus) {
  // This function is now deprecated by updateDonorStatus, but keeping it for completeness if other parts still use it.
  // It's not used by the new uploadImage logic.
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

// 3. Get Stats
function getGlobalStats() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues(); // Get all data
  
  var registeredCount = 0;
  var donatedCount = 0;
  
  // Start from 1 to skip header
  for (var i = 1; i < data.length; i++) {
    registeredCount++;
    var status = String(data[i][6]); // Status is at Index 6 (Col 7)
    // If status is "Completed", it means they finished the entire flow
    if (status === "Completed") {
      donatedCount++;
    }
  }
  
  return { 
    status: "success", 
    registered: registeredCount, 
    donated: donatedCount 
  };
}

// 4. Get Referral Count
function getReferralCount(donorId) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var count = 0;
  
  for (var i = 1; i < data.length; i++) {
    var refId = String(data[i][5]);
    var status = String(data[i][6]);
    
    // Only count if Referrer match AND Status is Completed
    if (refId === String(donorId) && status === "Completed") { 
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
