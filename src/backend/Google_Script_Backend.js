// Open the sheet by ID or just use the active one since the script is bound
const ss = SpreadsheetApp.getActiveSpreadsheet();

// 2. Handle Writing Data (POST Requests)
function doPost(e) {

  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action == "loginUser") {
      console.log('User Logging In...');
      return loginUser(data);
    }

    if (action == "registerUser") {
      console.log('Registering User...');
      return registerUser(data);
    }

    if (action == "addMember") {
      console.log('Adding member...');
      return addMember(data);
    }

    if (action == "addMemberUpdate") {
      console.log('Updating members...');
      return addMemberUpdates(data);
    }

    if (action == "getMembers") {
      console.log('Getting members...');
      return getMembers(data);
    }

    if (data.action === "getEvents") {
      return getEvents();
    }

    if (data.action === "addEvent") {
      return addEvent(data);
    }

    if (data.action === "deleteEvent") {
      return deleteEvent(data);
    }

    if (data.action === "addAttendance") {
      return addAttendanceBatch(data);
    }

    if (data.action === "getAttendance") {
      return getAttendance(data);
    }

    if (action === "getAttendanceByTime") {
      return getAttendanceByTime(data);
    }

    if (action === 'getMemberGenderStats') {
      return getMemberGenderStats();
    }

    if (action === 'getNationalityStats') {
      return getNationalityStats();
    }

    if (action === 'getChurchNames') {
      return getChurchNames();
    }
  } catch (error) {
    return sendJSON({ status: "error", message: error.toString() });
  }
}

// Helper function to return JSON correctly
function sendJSON(content) {
  Logger.log(JSON.stringify(content));
  return ContentService.createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}

// function that handles the saving of user registration data
function registerUser(data){
  const sheet = ss.getSheetByName("Users")
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; // getting the rows of headers
  const rows = sheet.getDataRange().getValues(); // get all rows


  // Check if email already exists
  const emailIndex = headers.indexOf("email_address");
  const emailExists = rows.some(r => r[emailIndex] === data.email);
  if (emailExists) {
    return sendJSON({ status: "error", message: "Email already exists" });
  }

  // 2. Generate new ID (Find max ID and add 1)
  // Assuming ID is in column 0 (A)
  let maxId = 0;
  if (rows.length > 1) {
    maxId = Math.max(...rows.slice(1).map(r => Number(r[0]) || 0));
  }
  const newId = maxId + 1;

  // 3. Hash the password (Simple SHA-256)
  // We never want to read a plain password in the sheet!
  const hashedPassword = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data.password)
  );

  // 4. Append the row
  // Order: member_id, first_name, last_name, nationality, role, email_address, cell_number, password
  sheet.appendRow([
    newId,
    data.firstName,
    data.lastName,
    data.nationality,
    data.church_id,
    data.email,
    data.cell,
    hashedPassword
  ]);

  return sendJSON({ status: "success", memberId: newId });
}

function loginUser(data) {
  const sheet = ss.getSheetByName("Users");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  const emailIndex = headers.indexOf("email"); 
  const passIndex = headers.indexOf("password"); 
  
  // 1. Find the user by email
  // We skip row 0 (headers)
  // const userRow = rows.slice(1).find(r => r[emailIndex] === data.email);
  const userRow = rows.slice(1).find(r => 
    String(r[emailIndex]).toLowerCase() === String(data.email).toLowerCase()
  );

  if (!userRow) {
    return sendJSON({ status: "error", message: "User not found" });
  }

  // 2. Hash the input password to see if it matches the stored hash
  const inputHash = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data.password)
  );
  
  const storedHash = userRow[passIndex];

  if (inputHash === storedHash) {
    // 3. Success! Return user info (BUT NOT THE PASSWORD)
    return sendJSON({
      status: "success",
      user: {
        id: userRow[0],
        firstName: userRow[1],
        lastName: userRow[2],
        church_id: userRow[4]
      }
    });
  } else {
    return sendJSON({ status: "error", message: "Incorrect password" });
  }
}

function addMember(data) {
  const sheet = ss.getSheetByName("Members");
  const updates_sheet = ss.getSheetByName("Updates");
  const rows = sheet.getDataRange().getValues();
  
  // 1. Check for duplicate email
  const emailIndex = rows[0].indexOf("email_address");
  const emailExists = rows.slice(1).some(r => String(r[emailIndex]).toLowerCase() === String(data.email).toLowerCase());
  if (emailExists) return sendJSON({ status: "error", message: "Duplicate email. Cannot add member" });

  // 2. Generate ID (hex of first name + last name)
  const fullName = `${data.email}${data.dob}`
    .trim()
    .toLowerCase();

  // Convert hash to hex string
  const member_id = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fullName)
  );

  // 3. Calculate age
  let age = ""; // Default to empty if no DOB provided
  if (data.dob) {
    const birthDate = new Date(data.dob);
    const today = new Date();
    
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    // If the current month is before the birth month, 
    // or it is the birth month but the day hasn't happened yet, subtract 1 year
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  };

  // 4. Calculate timestamp
  const timestampISO = new Date().toISOString();


  // 5. Append Row (Matches your new columns)
  // Order: id, first, last, nationality, role, email, cell, password, gender, dob
  sheet.appendRow([
    member_id,
    data.firstName,
    data.lastName,
    data.nationality,
    data.gender,
    data.role,
    data.email,
    data.cell,
    data.dob,
    age,
    "",
    timestampISO,
    data.church_id
  ]);

  // 6. Append row to the Updates table also
  updates_sheet.appendRow([
    member_id,
    data.firstName,
    data.lastName,
    data.nationality,
    data.gender,
    data.role,
    data.email,
    data.cell,
    data.dob,
    age,
    "",
    timestampISO,
    data.church_id
  ]);

  return sendJSON({ status: "success", memberId: member_id });
}

function getMembers(requestData) {
  const sheet = ss.getSheetByName("Members");
  const data = sheet.getDataRange().getValues(); 

  // 1. Remove the first row (headers)
  const headers = data.shift(); 

  // 2. Find the 'church_id' column index dynamically
  // This is safer than hardcoding row[X] because the column might move
  const churchIdIndex = headers.indexOf("church_id");

  // Safety Check: If we can't find the column, return an error
  if (churchIdIndex === -1) {
    return sendJSON({ status: "error", message: "Column 'church_id' not found in Members sheet" });
  }

  // 3. Filter the rows to match the requested church_id
  const targetId = String(requestData.church_id); // Ensure we compare strings
  
  const filteredRows = data.filter(row => String(row[churchIdIndex]) === targetId);

  // 4. Loop through the FILTERED rows and format them
  const members = filteredRows.map(row => ({
    id: row[0],
    firstName: row[1],
    lastName: row[2],
    nationality: row[3],
    gender: row[4],
    role: row[5],
    email: row[6],
    cell: row[7],
    dob: row[8], 
    age: row[9]
  }));

  // 5. Return the filtered list
  return sendJSON({ status: "success", members: members });
}

function addMemberUpdates(data) {
  const updates_sheet = ss.getSheetByName("Updates");

  // Adding update row to the Updates table for audit tracking
  // 1. Calculate timestamp
  const timestampISO = new Date().toISOString();
  

  // 2. Append row to the Updates table also
  updates_sheet.appendRow([
    data.member_id,
    data.firstName,
    data.lastName,
    data.nationality,
    data.gender,
    data.role,
    data.email,
    data.cell,
    data.dob,
    data.age,
    data.updateReason,
    timestampISO
  ]);

  // Updating the Member table accordingly
  updateMember(data);

  return sendJSON({ status: "success", memberId: data.member_id });
}

function updateMember(data) {
  const sheet = ss.getSheetByName("Members");

  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];

  const idIndex = headers.indexOf("member_id");

  // 1. Find row index of the member
  const rowIndex = values.findIndex((row, i) => i > 0 && row[idIndex] === data.member_id);

  if (rowIndex === -1) {
    return sendJSON({ status: "error", message: "Member not found" });
  }

  // 3. Build updated row (match column order exactly)
  const updatedRow = [
    data.member_id,
    data.firstName,
    data.lastName,
    data.nationality,
    data.gender,
    data.role,
    data.email,
    data.cell,
    data.dob,
    data.age,
    data.updateReason || "Profile update",
    new Date().toISOString()
  ];

  // 4. Update Members sheet
  sheet.getRange(rowIndex + 1, 1, 1, updatedRow.length).setValues([updatedRow]);

  return sendJSON({
    status: "success",
    message: "Member updated successfully",
    memberId: data.id
  });
}

// 1. Helper function to fetch unique events
function getEvents() {
  const sheet = ss.getSheetByName("Events");
  
  // If sheet doesn't exist yet, return empty list
  if (!sheet) {
    return sendJSON({ status: "success", events: [] });
  }

  const data = sheet.getDataRange().getValues();
  
  // Assuming Row 1 is headers.
  // Assuming "Event Name" is in Column B (index 1).
  // Check if there is data beyond headers
  if (data.length <= 1) {
    return sendJSON({ status: "success", events: [] });
  }

  // Extract names from Column B (index 1), skipping header row
  const eventNames = data.slice(1).map(row => row[1]);

  // Filter out blanks and get unique values
  const uniqueEvents = [...new Set(eventNames)].filter(name => name && String(name).trim() !== "");

  // Sort alphabetically for better UX
  uniqueEvents.sort();

  return sendJSON({ status: "success", events: uniqueEvents });
}

function addEvent(data) {
  let sheet = ss.getSheetByName("Events");
  
  // 1. If sheet doesn't exist, create it and add headers
  if (!sheet) {
    sheet = ss.insertSheet("Events");
    sheet.appendRow(["id", "event_name", "timestamp"]); // Header Row
  }

  // 2. CHECK FOR DUPLICATES
  const rows = sheet.getDataRange().getValues();
  // We assume "event_name" is in Column B (Index 1).
  // We trim and convert to lowercase to ensure "Sabbath School" and "sabbath school" are treated as duplicates.
  const newNameNormalized = String(data.eventName).trim().toLowerCase();

  // Loop through existing rows (skipping header at index 0)
  for (let i = 1; i < rows.length; i++) {
    const existingName = String(rows[i][1]).trim().toLowerCase();
    
    if (existingName === newNameNormalized) {
      return sendJSON({ 
        status: "error", 
        message: "This event has already been created" 
      });
    }
  }

  // 3. GENERATE CUSTOM ID: e{date}{5 digit random salt}
  const now = new Date();
  
  // Format Date: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate 5 Digit Salt (Random number between 10000 and 99999)
  const salt = Math.floor(Math.random() * 90000) + 10000;
  
  const id = `e${dateString}${salt}`; // e.g., e2026011109874
  const timestamp = now.toISOString();
  
  // 4. APPEND ROW
  sheet.appendRow([
    id, 
    data.eventName, 
    timestamp
  ]);

  return sendJSON({ status: "success", message: "Event added", eventName: data.eventName });
}

function deleteEvent(data) {
  const sheet = ss.getSheetByName("Events");
  if (!sheet) {
    return sendJSON({ status: "error", message: "Sheet not found" });
  }

  const rows = sheet.getDataRange().getValues();
  const nameToDelete = String(data.eventName).trim().toLowerCase();
  
  // Loop through rows to find the match
  // We start loop at 1 to skip header
  for (let i = 1; i < rows.length; i++) {
    // Assuming Event Name is in Column B (index 1)
    const currentName = String(rows[i][1]).trim().toLowerCase();

    if (currentName === nameToDelete) {
      // deleteRow takes a 1-based index. 
      // The array index 'i' is 0-based, so row number is i + 1
      sheet.deleteRow(i + 1);
      
      return sendJSON({ status: "success", message: "Event deleted" });
    }
  }

  return sendJSON({ status: "error", message: "Event not found" });
}

// function addAttendanceBatch(data) {
//   let sheet = ss.getSheetByName("Attendance");
  
//   if (!sheet) {
//     sheet = ss.insertSheet("Attendance");
//     // Header order: Member ID | Event | Status | Date | Timestamp
//     sheet.appendRow(["member_id", "event_name", "status", "date", "timestamp"]); 
//   }

//   const records = data.records; 
//   if (!records || records.length === 0) {
//     return sendJSON({ status: "success", message: "No records to save" });
//   }

//   // 1. Generate Timestamp only (Date comes from frontend now)
//   const now = new Date();
//   const timestamp = now.toISOString();

//   // 2. READ EXISTING DATA
//   const lastRow = sheet.getLastRow();
//   let existingData = [];
//   let existingMap = new Map();

//   if (lastRow > 1) {
//     existingData = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
//     existingData.forEach((row, index) => {
//       // Row: [0]ID, [1]Event, [2]Status, [3]Date, [4]Time
//       let rowDate = row[3];
//       if (rowDate instanceof Date) {
//         rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
//       }
      
//       // Key includes Date so we can differentiate events on different days
//       const key = `${row[0]}_${row[1]}_${rowDate}`; 
//       existingMap.set(key, index); 
//     });
//   }

//   // 3. PROCESS RECORDS
//   const newRows = [];
//   let updatesMade = false;

//   records.forEach(record => {
//     // USE DATE FROM FRONTEND
//     const recordDate = record.date; 

//     const key = `${record.member_id}_${record.event_name}_${recordDate}`;

//     if (existingMap.has(key)) {
//       // --- UPDATE EXISTING ROW ---
//       const rowIndex = existingMap.get(key);
      
//       existingData[rowIndex][2] = record.status; // Update Status
//       existingData[rowIndex][4] = timestamp;     // Update 'Last Modified' Time
      
//       updatesMade = true;
//     } else {
//       // --- CREATE NEW ROW ---
//       newRows.push([
//         record.member_id,
//         record.event_name,
//         record.status,
//         recordDate,      // <--- Use Date from UI
//         timestamp
//       ]);
      
//       existingMap.set(key, existingData.length + newRows.length); 
//     }
//   });

//   // 4. WRITE CHANGES
//   if (updatesMade && existingData.length > 0) {
//     sheet.getRange(2, 1, existingData.length, 5).setValues(existingData);
//   }

//   if (newRows.length > 0) {
//     sheet.getRange(lastRow + 1, 1, newRows.length, 5).setValues(newRows);
//   }

//   return sendJSON({ 
//     status: "success", 
//     message: "Attendance captured", 
//     new_rows: newRows.length,
//     updated_rows: updatesMade ? "Yes" : "No"
//   });
// }

function addAttendanceBatch(data) {
  let sheet = ss.getSheetByName("Attendance");
  
  if (!sheet) {
    sheet = ss.insertSheet("Attendance");
    // Updated Header: Added 'church_id' at the end
    sheet.appendRow(["member_id", "event_name", "status", "date", "timestamp", "church_id"]); 
  }

  const records = data.records; // Frontend sends { action: "...", records: [...] }
  if (!records || records.length === 0) {
    return sendJSON({ status: "success", message: "No records to save" });
  }

  const now = new Date();
  const timestamp = now.toISOString();

  // 1. READ EXISTING DATA (Now reading 6 columns instead of 5)
  const lastRow = sheet.getLastRow();
  let existingData = [];
  let existingMap = new Map();

  if (lastRow > 1) {
    // Change: Fetch 6 columns to include church_id
    existingData = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
    
    existingData.forEach((row, index) => {
      // Row: [0]ID, [1]Event, [2]Status, [3]Date, [4]Time, [5]ChurchID
      let rowDate = row[3];
      if (rowDate instanceof Date) {
        rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      
      // CRITICAL CHANGE: Include Church ID in the unique key
      // This ensures we match the correct church's record
      const key = `${row[0]}_${row[1]}_${rowDate}_${row[5]}`; 
      existingMap.set(key, index); 
    });
  }

  // 2. PROCESS RECORDS
  const newRows = [];
  let updatesMade = false;

  records.forEach(record => {
    const recordDate = record.date; 
    
    // Generate key with church_id
    const key = `${record.member_id}_${record.event_name}_${recordDate}_${record.church_id}`;

    if (existingMap.has(key)) {
      // --- UPDATE EXISTING ROW ---
      const rowIndex = existingMap.get(key);
      
      existingData[rowIndex][2] = record.status; // Update Status
      existingData[rowIndex][4] = timestamp;     // Update Time
      // No need to update church_id, it's part of the key
      
      updatesMade = true;
    } else {
      // --- CREATE NEW ROW ---
      newRows.push([
        record.member_id,
        record.event_name,
        record.status,
        recordDate,
        timestamp,
        record.church_id // <--- Add Church ID to new row
      ]);
    }
  });

  // 3. WRITE CHANGES
  // Change: Write back 6 columns for updates
  if (updatesMade && existingData.length > 0) {
    sheet.getRange(2, 1, existingData.length, 6).setValues(existingData);
  }

  // Change: Write 6 columns for new rows
  if (newRows.length > 0) {
    // Note: If the sheet was empty, we start at lastRow + 1
    // If we just created the sheet, lastRow is 1 (header).
    const startRow = lastRow === 0 ? 1 : lastRow + 1; 
    sheet.getRange(startRow, 1, newRows.length, 6).setValues(newRows);
  }

  return sendJSON({ 
    status: "success", 
    message: "Attendance captured", 
    new_rows: newRows.length,
    updated_rows: updatesMade ? "Yes" : "No"
  });
}

// function getAttendance(data) {
//   const sheet = ss.getSheetByName("Attendance");
//   if (!sheet) return sendJSON({ status: "success", records: [] });

//   const rows = sheet.getDataRange().getValues();
  
//   // 1. Get Headers and find the 'church_id' column index dynamically
//   // This prevents breaking if you change column order
//   const headers = rows[0]; 
//   const churchIdIndex = headers.indexOf("church_id");

//   // Safety: If column missing, return empty or error (optional)
//   if (churchIdIndex === -1) {
//      return sendJSON({ status: "error", message: "'church_id' column missing in Attendance sheet" });
//   }

//   // const rows = sheet.getDataRange().getValues();
//   const targetEvent = data.eventName;
//   const targetDate = data.date; // Expecting "YYYY-MM-DD"
//   const targetChurchId = String(data.church_id);
  
//   const foundRecords = [];

//   // Skip header (i=1)
//   for (let i = 1; i < rows.length; i++) {
//     const row = rows[i];
//     // Col 1: Event Name, Col 2: Status, Col 3: Date (Indices based on your last structure)
//     // Your structure: [member_id, event_name, status, date, timestamp]
    
//     const eventName = row[1];
//     const status = row[2];
//     let dateVal = row[3];

//     const rowChurchId = String(row[churchIdIndex]);

//     // Format date from sheet to string for comparison
//     if (dateVal instanceof Date) {
//       dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
//     }

//     if (eventName === targetEvent && dateVal === targetDate && status == 1 && rowChurchId === targetChurchId)
//       foundRecords.push(row[0]); // Push member_id
//     }
//   }

//   return sendJSON({ status: "success", presentMemberIds: foundRecords });
// }

function getAttendance(data) {
  const sheet = ss.getSheetByName("Attendance");
  if (!sheet) return sendJSON({ status: "success", records: [] });

  const rows = sheet.getDataRange().getValues();
  
  // 1. Get Headers and find the 'church_id' column index dynamically
  // This prevents breaking if you change column order
  const headers = rows[0]; 
  const churchIdIndex = headers.indexOf("church_id");

  // Safety: If column missing, return empty or error (optional)
  if (churchIdIndex === -1) {
     return sendJSON({ status: "error", message: "'church_id' column missing in Attendance sheet" });
  }

  const targetEvent = data.eventName;
  const targetDate = data.date; // Expecting "YYYY-MM-DD"
  const targetChurchId = String(data.church_id); // Ensure string comparison

  const foundRecords = [];

  // Skip header (i=1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Get values based on assumed indices for Event/Status/Date
    // (Ideally, find these dynamically too, but stick to your current indices if fixed)
    const eventName = row[1];
    const status = row[2];
    let dateVal = row[3];
    
    // Get the stored Church ID from the found column
    const rowChurchId = String(row[churchIdIndex]);

    // Format date from sheet to string for comparison
    if (dateVal instanceof Date) {
      dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
    }

    // 2. Add the Church ID check to the if-statement
    if (
        eventName === targetEvent && 
        dateVal === targetDate && 
        status == 1 &&
        rowChurchId === targetChurchId // <--- NEW CHECK
    ) {
      foundRecords.push(row[0]); // Push member_id
    }
  }

  return sendJSON({ status: "success", presentMemberIds: foundRecords });
}

function getAttendanceByTime() {
  const sheet = ss.getSheetByName("Attendance");
  
  if (!sheet) {
    return sendJSON({ status: "success", data: {} });
  }

  const rows = sheet.getDataRange().getValues();
  const timeZone = Session.getScriptTimeZone();

  // STRUCTURE: 
  // { 
  //   "Divine Service": { daily: {}, monthly: {Jan: Set(), ...}, yearly: {2026: Set()} },
  //   ...
  // }
  const masterStats = {};

  // --- ITERATE DATA ---
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Column Mapping based on your table:
    // 0: member_id, 1: event_name, 2: status, 3: date
    const memberId = String(row[0]); // Ensure ID is a string
    const eventName = row[1];
    const status = Number(row[2]); 
    const rawDate = row[3]; 

    // Skip invalid rows
    if (status === 0 || !eventName) continue; 

    // Parse Date
    let dateObj;
    if (rawDate instanceof Date) {
      dateObj = rawDate;
    } else {
      dateObj = new Date(rawDate);
    }
    if (isNaN(dateObj.getTime())) continue;

    // Initialize this Event's bucket if it doesn't exist yet
    if (!masterStats[eventName]) {
      masterStats[eventName] = {
        dailyMap: {},
        // Initialize months with empty Sets to track unique IDs
        monthsMap: { 
          'Jan': new Set(), 'Feb': new Set(), 'Mar': new Set(), 'Apr': new Set(), 
          'May': new Set(), 'Jun': new Set(), 'Jul': new Set(), 'Aug': new Set(), 
          'Sep': new Set(), 'Oct': new Set(), 'Nov': new Set(), 'Dec': new Set() 
        },
        yearsMap: {} // Will contain Sets: { '2026': new Set() }
      };
    }

    const stats = masterStats[eventName];

    // --- 1. DAILY/WEEKLY (Keep as Total Attendance Volume) ---
    // We usually keep daily as raw volume (including visitors) for trend analysis
    const sortKey = Utilities.formatDate(dateObj, timeZone, "yyyy-MM-dd");
    const dayLabel = Utilities.formatDate(dateObj, timeZone, "EEE yy-MM-dd");

    if (!stats.dailyMap[sortKey]) {
      stats.dailyMap[sortKey] = { label: dayLabel, count: 0 };
    }
    stats.dailyMap[sortKey].count += status;

    // --- 2. MONTHLY & YEARLY (Distinct Members, Exclude UV) ---
    if (memberId !== 'UV') {
        const monthLabel = Utilities.formatDate(dateObj, timeZone, "MMM"); 
        const yearLabel = Utilities.formatDate(dateObj, timeZone, "yyyy"); 

        // Add Member ID to the Set (Set automatically handles uniqueness)
        if (stats.monthsMap[monthLabel]) {
            stats.monthsMap[monthLabel].add(memberId);
        }

        if (!stats.yearsMap[yearLabel]) {
            stats.yearsMap[yearLabel] = new Set();
        }
        stats.yearsMap[yearLabel].add(memberId);
    }
  }

  // --- FORMAT OUTPUT ---
  const finalOutput = {};

  for (const event in masterStats) {
    const stats = masterStats[event];

    // Format Daily (Standard Count)
    const weeklyData = Object.keys(stats.dailyMap).sort().map(key => ({
      label: stats.dailyMap[key].label,
      count: stats.dailyMap[key].count
    }));

    // Format Monthly (Distinct Count = Set Size)
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthOrder
      .map(month => ({ 
          label: month, 
          count: stats.monthsMap[month].size // Get size of Set
      }))
      .filter(item => item.count > 0);

    // Format Yearly (Distinct Count = Set Size)
    const yearlyData = Object.keys(stats.yearsMap).sort()
      .map(year => ({ 
          label: year, 
          count: stats.yearsMap[year].size // Get size of Set
      }))
      .filter(item => item.count > 0);

    finalOutput[event] = {
      weekly: weeklyData,
      monthly: monthlyData,
      yearly: yearlyData
    };
  }

  return sendJSON({
    status: "success",
    data: finalOutput
  });
}

function getMemberGenderStats() {
  const sheet = ss.getSheetByName("Members");
  
  if (!sheet) {
    // Return zeros if sheet is missing to prevent crash
    return sendJSON({ 
      status: "success", 
      genderData: [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }] 
    });
  }

  const rows = sheet.getDataRange().getValues();
  
  // Initialize counters
  let maleCount = 0;
  let femaleCount = 0;

  // Iterate rows (Skip header i=1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // ADJUST THIS INDEX based on your Members sheet column
    // Example: If Gender is Column C (index 2)
    const gender = String(row[4]).trim().toLowerCase(); 

    if (gender === 'male' || gender === 'm') {
      maleCount++;
    } else if (gender === 'female' || gender === 'f') {
      femaleCount++;
    }
  }

  // Format exactly as Recharts expects
  const genderData = [
    { name: 'Male', value: maleCount },
    { name: 'Female', value: femaleCount }
  ];

  return sendJSON({
    status: "success",
    genderData: genderData
  });
}

function getNationalityStats() {
  const sheet = ss.getSheetByName("Members");
  
  if (!sheet) {
    return sendJSON({ status: "success", nationalityData: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const counts = {};

  // Iterate rows (Skip header i=1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // --- ADJUST INDEX HERE ---
    // Assuming Nationality is Column 4 (Index 3)
    // If it's Column E, use row[4], etc.
    let nationality = String(row[3]).trim(); 
    
    // Normalize text (optional: Capitalize first letter)
    if (!nationality) nationality = "Unknown";
    nationality = nationality.charAt(0).toUpperCase() + nationality.slice(1).toLowerCase();

    if (!counts[nationality]) {
      counts[nationality] = 0;
    }
    counts[nationality]++;
  }

  // Convert map to array format: [{ name: 'American', value: 30 }, ...]
  const nationalityData = Object.keys(counts).map(key => ({
    name: key,
    value: counts[key]
  }));

  // Optional: Sort by count descending so biggest slices are first
  nationalityData.sort((a, b) => b.value - a.value);

  return sendJSON({
    status: "success",
    nationalityData: nationalityData
  });
}

function testGetNationalityStats() {
  // 1. Create the mock request object
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "getNationalityStats" 
      })
    }
  };

  // 2. Call doPost directly to test routing and logic
  console.log("--- Running testGetNationalityStats ---");
  const result = doPost(mockEvent);

  // 3. Log the output
  console.log("Result Payload:");
  console.log(result.getContent());
}

function getChurchNames() {
  // exact name of your sheet tab
  const sheet = ss.getSheetByName("Church Detail"); 
  
  if (!sheet) {
    return sendJSON({ status: "error", message: "Sheet 'Church Detail' not found", churches: [] });
  }

  const rows = sheet.getDataRange().getValues();
  const churches = [];

  // Skip header (i = 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Column Mapping based on your list:
    // 0: church_id, 1: church_name, 2: church_address, 3: church_email_address
    const id = row[0];
    const name = row[1];

    if (name) {
      churches.push({
        id: id,
        name: name
      });
    }
  }

  return sendJSON({
    status: "success",
    churches: churches
  });
}

function testGetAttendanceByTime() {
  // 1. Define test cases
  const testCases = [
    { description: "Fetch ALL events", input: {} },
    { description: "Fetch specific event (Divine Service)", input: { eventName: "Divine Service" }},
    { description: "Fetch specific event (Prayer Meeting)", input: { eventName: "Prayer Meeting" } }
  ];

  // 2. Run tests
  testCases.forEach(test => {
    console.log("--- Running Test: " + test.description + " ---");
    
    // Call the function directly
    const resultJSON = getAttendanceByTime(test.input);
    
    // Parse the JSON string back to an object for inspection
    // Note: In GAS, ContentService returns an object wrapper, so we simulate the output object
    // If your sendJSON returns ContentService, we can't parse it easily in the logger.
    // Instead, for testing, let's look at the logic inside.
    
    // For debugging, it's easier if we temporarily return the raw object instead of sendJSON
    // OR, we can mock sendJSON to just log the output.
    console.log("Result Payload:");
    console.log(resultJSON.getContent()); // getContent() reveals the stringified JSON
  });
}

// testing functions
// function testAddAttendanceBatch() {
//   console.log("--- 🧪 STARTING TEST: addAttendanceBatch ---");

//   // --- STEP 1: CONFIGURE TEST DATA ---
//   // Change this value from 1 to 0 and run the script again to test the UPDATE logic.
//   const TEST_STATUS_1 = 0; 
//   const TEST_STATUS_2 = 1; 

//   const mockData = {
//     action: "addAttendance",
//     records: [
//       { 
//         // This record will switch status based on the variable above
//         member_id: "TEST_USER_001", 
//         event_name: "Test Event Alpha", 
//         status: TEST_STATUS_1,
//         date: "2026-03-16",
//         church_id: "lans001" 
//       },
//       { 
//         // This record stays the same
//         member_id: "TEST_USER_002", 
//         event_name: "Test Event Alpha", 
//         status: TEST_STATUS_2,
//         date: "2026-03-16",
//         church_id: "test001"  
//       }
//     ]
//   };

//   console.log("Incoming Payload:", JSON.stringify(mockData));

//   // --- STEP 2: EXECUTE FUNCTION ---
//   try {
//     const response = addAttendanceBatch(mockData);
    
//     // Parse the JSON response to read it in the logs
//     const result = JSON.parse(response.getContent());

//     // --- STEP 3: ANALYZE RESULTS ---
//     console.log("--------------------------------");
//     console.log("✅ API Response Received");
//     console.log("Status:", result.status);
//     console.log("Message:", result.message);
//     console.log("New Rows Created:", result.new_rows);
//     console.log("Existing Rows Updated:", result.updated_rows);
//     console.log("--------------------------------");

//   } catch (error) {
//     console.error("❌ ERROR FAILED:", error.toString());
//   }
// }

function testAddAttendanceBatch() {
  console.log("--- 🧪 STARTING TEST: addAttendanceBatch ---");

  // --- STEP 1: CONFIGURE TEST DATA ---
  const TEST_STATUS_1 = 0; 
  const TEST_STATUS_2 = 0; 

  const mockData = {
    action: "addAttendance",
    records: [
      { 
        member_id: "TEST_USER_001", 
        event_name: "Test Event Alpha", 
        status: TEST_STATUS_1,
        date: "2026-03-16",
        church_id: "lans001" 
      },
      { 
        member_id: "TEST_USER_002", 
        event_name: "Test Event Alpha", 
        status: TEST_STATUS_2,
        date: "2026-03-16",
        church_id: "test001" 
      },
      {
        member_id: "UV", 
        event_name: "Test Event Alpha",
        status: 5, 
        date: "2026-03-16",
        church_id: "lans001"
      }
    ]
  };

  console.log("Incoming Payload (Full Object):", JSON.stringify(mockData));

  // --- STEP 2: EXECUTE FUNCTION ---
  try {
    // ✅ CRITICAL FIX: Pass 'mockData' (The whole object).
    // Your main function now runs 'const records = data.records', 
    // so it needs the object wrapper to work.
    const response = addAttendanceBatch(mockData);
    
    // Parse the JSON response
    const result = JSON.parse(response.getContent());

    // --- STEP 3: ANALYZE RESULTS ---
    console.log("--------------------------------");
    console.log("✅ API Response Received");
    console.log("Status:", result.status);
    
    if (result.status === 'success') {
       console.log("Rows Saved:", result.count);
    } else {
       console.log("Message:", result.message);
    }
    console.log("--------------------------------");

  } catch (error) {
    console.error("❌ ERROR FAILED:", error.toString());
  }
}

function testGetAttendance() {
  console.log("--- 🔎 STARTING TEST: getAttendance ---");

  // --- CONFIGURATION ---
  // Ensure this matches the data you previously added to the sheet
  const TEST_EVENT = "Divine Service"; 
  
  // Format must match strictly: YYYY-MM-DD
  // Use the date from your 'Attendance' column D
  const TEST_DATE = "2026-01-31"; 

  const mockPayload = {
    action: "getAttendance",
    eventName: TEST_EVENT,
    date: TEST_DATE,
    church_id: "test001"
  };

  console.log(`Requesting: ${TEST_EVENT} on ${TEST_DATE}`);

  // --- EXECUTION ---
  try {
    const response = getAttendance(mockPayload);
    const result = JSON.parse(response.getContent());

    // --- ANALYSIS ---
    console.log("--------------------------------");
    console.log("✅ API Response Received");
    
    if (result.status === "success") {
      const ids = result.presentMemberIds;
      console.log(`Count Found: ${ids.length}`);
      console.log("Member IDs Present:", ids);
      
      if (ids.length > 0) {
        console.log("✅ SUCCESS: Data was retrieved.");
      } else {
        console.log("⚠️ WARNING: No members found. Check if Event/Date match the sheet exactly.");
      }
    } else {
      console.log("❌ FAILED: " + result.message);
    }
    console.log("--------------------------------");

  } catch (error) {
    console.error("❌ ERROR FAILED:", error.toString());
  }
}

function testDeleteEvents() {
  // 1. Create fake data (mocking what React would send)
  const mockdelete = {
    postData: {
      contents: JSON.stringify({
        action: "deleteEvent",
        eventName: "Janitors Class"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockdelete);
}

function testAddEvents() {
  // 1. Create fake data (mocking what React would send)
  const mockmember = {
    postData: {
      contents: JSON.stringify({
        action: "addEvent",
        eventName: "Sabbath School"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockmember);
}

function testGetEvents(){

  const getEveTest = {
    postData: {
      contents: JSON.stringify({
        action: "getEvents" 
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(getEveTest);
}

function testGetChurchNames(){

  const getChurchNameTest = {
    postData: {
      contents: JSON.stringify({
        action: "getChurchNames" 
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(getChurchNameTest);
}

function testGetMemberGenderStats() {
  // 1. Create the mock request object
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "getMemberGenderStats" 
      })
    }
  };

  // 2. Call doPost directly
  console.log("--- Running testGetMemberStats ---");
  const result = doPost(mockEvent);

  // 3. Log the output to verify the JSON structure
  // We use .getContent() because doPost returns a special ContentService object
  console.log("Result Payload:");
  console.log(result.getContent());
}

function testRegistrationLogic() {
  // 1. Create fake data (mocking what React would send)
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "registerUser",
        firstName: "Test",
        lastName: "User",
        nationality: "South African",
        church_id: "test01",
        email: "test" + new Date().getTime() + "@example.com", // Random email so it doesn't fail on duplicates
        cell: "1234567890",
        password: "secretpassword123"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockEvent);
}

// testing registration
function testLoginLogic() {
  // 1. Create fake data (mocking what React would send)
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "loginUser",
        email: "trev@gta5.com",
        password: "123"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockEvent);
}

// testing adding a member
function testAddMemberUpdates() {
  // 1. Create fake data (mocking what React would send)
  const mockmember = {
    postData: {
      contents: JSON.stringify({
        action: "addMemberUpdate",
        member_id: "poqiwmnenyeyq76=",
        firstName: "Positive",
        lastName: "Luke",
        nationality: "Greek",
        gender: "Male",
        role: "Deacon",
        email: "LukeP@gmail.com",
        cell: "0797711121",
        dob: "2025-06-06",
        age: "20",
        updateReason: "Change to password"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockmember);
}

// testing adding a member updates
function testAddMember() {
  // 1. Create fake data (mocking what React would send)
  const mockmember = {
    postData: {
      contents: JSON.stringify({
        action: "addMember",
        firstName: "Membero",
        lastName: "NumberOne",
        nationality: "South African",
        gender: "Female",
        role: "Member",
        email: "member07@gmail.com",
        cell: "079123456",
        dob: "2025-10-04",
        church_id: "testID001"  
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockmember);
}

// testing getting members
function testGetMembers() {
  // 1. Create fake data (mocking what React would send)
  const getMemTest = {
    postData: {
      contents: JSON.stringify({
        action: "getMembers",
        church_id: "lans001"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(getMemTest);
}

function testUpdateMember(){
  // 1. Create fake data (mocking what React would send)
  const mockmember = {
    postData: {
      contents: JSON.stringify({
        action: "addMemberUpdate",
        member_id: "4yPnGfHsY1jH/F8cqlBiYQdqhHZmWnuKDDmxtr2947c=",
        firstName: "Membero",
        lastName: "NumberOne",
        nationality: "South African",
        gender: "Female",
        role: "Member",
        email: "member07@gmail.com",
        cell: "333333333333",
        dob: "2025-10-04",
        age: 0,
        updateReason: "Updated phone number"  
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockmember);
}
