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
      return getMemberGenderStats(data);
    }

    if (action === 'getNationalityStats') {
      return getNationalityStats(data);
    }

    if (action === 'getAgeStats') {
      return getAgeStats(data.church_id);
    }

    if (action === 'getChurchNames') {
      return getChurchNames();
    }

    if (action === 'getRoleStats') {
      return getRoleStats(data.church_id);
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

  // 2. Generate ID (hex of first name + last name)
  const fullName = `${data.email}${data.dob}`
    .trim()
    .toLowerCase();

  // Convert hash to hex string
  const member_id = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fullName)
  );

  const idExists = rows.slice(1).some(r => String(r[0]) === String(member_id));
  
  if (idExists) {
    return sendJSON({ 
      status: "error", 
      message: "A member with this exact Email and DOB already exists." 
    });
  }

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
    timestampISO,
    data.church_id
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

function addAttendanceBatch(data) {
  let sheet = ss.getSheetByName("Attendance");
  
  if (!sheet) {
    sheet = ss.insertSheet("Attendance");
    // Updated Header: 5 columns matching the new schema
    sheet.appendRow(["event_name", "congregation_count", "date", "timestamp", "church_id"]); 
  }

  const records = data.records; // Frontend sends { action: "...", records: [...] }
  if (!records || records.length === 0) {
    return sendJSON({ status: "success", message: "No records to save" });
  }

  // 1. READ EXISTING DATA (Now reading 5 columns instead of 6)
  const lastRow = sheet.getLastRow();
  let existingData = [];
  let existingMap = new Map();

  if (lastRow > 1) {
    // Fetch 5 columns
    existingData = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    
    existingData.forEach((row, index) => {
      // Row: [0]Event, [1]Count, [2]Date, [3]Time, [4]ChurchID
      let rowDate = row[2];
      if (rowDate instanceof Date) {
        rowDate = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      
      // CRITICAL CHANGE: The unique key is now just the Event + Date + Church. 
      // This allows you to update the count for the same event later if needed!
      const key = `${row[0]}_${rowDate}_${row[4]}`; 
      existingMap.set(key, index); 
    });
  }

  // 2. PROCESS RECORDS
  const newRows = [];
  let updatesMade = false;

  records.forEach(record => {
    const recordDate = record.date; 
    
    // Generate key to see if we already have a count for this event today
    const key = `${record.event_name}_${recordDate}_${record.church_id}`;

    if (existingMap.has(key)) {
      // --- UPDATE EXISTING ROW ---
      const rowIndex = existingMap.get(key);
      
      existingData[rowIndex][1] = record.congregation_count; // Update Count
      existingData[rowIndex][3] = record.timestamp;          // Update Time
      
      updatesMade = true;
    } else {
      // --- CREATE NEW ROW ---
      newRows.push([
        record.event_name,
        record.congregation_count,
        recordDate,
        record.timestamp, // Using the timestamp passed from the frontend
        record.church_id
      ]);
    }
  });

  // 3. WRITE CHANGES
  // Write back 5 columns for updates
  if (updatesMade && existingData.length > 0) {
    sheet.getRange(2, 1, existingData.length, 5).setValues(existingData);
  }

  // Write 5 columns for new rows
  if (newRows.length > 0) {
    const startRow = lastRow === 0 ? 1 : lastRow + 1; 
    sheet.getRange(startRow, 1, newRows.length, 5).setValues(newRows);
  }

  return sendJSON({ 
    status: "success", 
    message: "Attendance captured", 
    new_rows: newRows.length,
    updated_rows: updatesMade ? "Yes" : "No"
  });
}

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

function getAttendanceByTime(data) {
  const sheet = ss.getSheetByName("Attendance");
  
  if (!sheet) {
    return sendJSON({ status: "success", data: {} });
  }

  const rows = sheet.getDataRange().getValues();
  const timeZone = Session.getScriptTimeZone();

  // 1. Get Headers & Find Column Indices Dynamically
  // This ensures we read the correct columns even if the sheet order changes
  const headers = rows[0]; 
  const headerMap = {};
  
  headers.forEach((header, index) => {
    headerMap[String(header)] = index;
  });

  // Verify 'church_id' column exists
  if (headerMap["church_id"] === undefined) {
    return sendJSON({ status: "error", message: "'church_id' column missing in Attendance sheet" });
  }

  // Get the Target Church ID from the request
  const targetChurchId = String(data.church_id); 

  const masterStats = {};

  // --- ITERATE DATA ---
  // Start at i=1 to skip headers
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // 2. CHECK CHURCH ID FIRST
    const rowChurchId = String(row[headerMap["church_id"]]);
    if (rowChurchId !== targetChurchId) {
      continue; // Skip rows that don't match the requested church
    }
    
    // 3. Get other values using the map (safer than hardcoded indices)
    // Fallback indices provided in case map fails, but map is preferred
    const memberId = String(row[headerMap["member_id"] || 0]); 
    const eventName = row[headerMap["event_name"] || 1];
    const status = Number(row[headerMap["status"] || 2]); 
    const rawDate = row[headerMap["date"] || 3]; 

    // Skip invalid rows
    if (status === 0 || !eventName) continue; 

    // Parse Date
    let dateObj;
    if (rawDate instanceof Date) {
      dateObj = rawDate;
    } else {
      dateObj = new Date(rawDate);
    }
    // Check if date is valid
    if (isNaN(dateObj.getTime())) continue;

    // Initialize this Event's bucket if it doesn't exist yet
    if (!masterStats[eventName]) {
      masterStats[eventName] = {
        dailyMap: {},
        monthsMap: { 
          'Jan': new Set(), 'Feb': new Set(), 'Mar': new Set(), 'Apr': new Set(), 
          'May': new Set(), 'Jun': new Set(), 'Jul': new Set(), 'Aug': new Set(), 
          'Sep': new Set(), 'Oct': new Set(), 'Nov': new Set(), 'Dec': new Set() 
        },
        yearsMap: {} 
      };
    }

    const stats = masterStats[eventName];

    // --- 1. DAILY/WEEKLY (Total Volume) ---
    const sortKey = Utilities.formatDate(dateObj, timeZone, "yyyy-MM-dd");
    // const dayLabel = Utilities.formatDate(dateObj, timeZone, "EEE yy-MM-dd");

    if (!stats.dailyMap[sortKey]) {
      stats.dailyMap[sortKey] = { label: sortKey, count: 0 };
    }
    stats.dailyMap[sortKey].count += status;

    // --- 2. MONTHLY & YEARLY (Distinct Members) ---
    // Note: We typically exclude visitors ('UV') from distinct member counts
    // unless you specifically want to count unique visitor IDs (which usually aren't unique).
    if (memberId !== 'UV') {
        const monthLabel = Utilities.formatDate(dateObj, timeZone, "MMM"); 
        const yearLabel = Utilities.formatDate(dateObj, timeZone, "yyyy"); 

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

    // Format Daily
    const weeklyData = Object.keys(stats.dailyMap).sort().map(key => ({
      label: stats.dailyMap[key].label,
      count: stats.dailyMap[key].count
    }));

    // Format Monthly (Set Size)
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthOrder.map(month => {
        const count = stats.monthsMap[month] ? stats.monthsMap[month].size : 0;
        return { label: month, count: count };
    }).filter(item => item.count > 0);

    // Format Yearly (Set Size)
    const yearlyData = Object.keys(stats.yearsMap).sort().map(year => ({ 
        label: year, 
        count: stats.yearsMap[year].size 
    }));

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


function getMemberGenderStats(data) {
  const sheet = ss.getSheetByName("Members");
  
  // Default empty stats if sheet missing
  if (!sheet) {
    return sendJSON({ 
      status: "success", 
      genderData: [{ name: 'Male', value: 0 }, { name: 'Female', value: 0 }] 
    });
  }

  const rows = sheet.getDataRange().getValues();

  // 1. Get Headers & Find Column Indices Dynamically
  // This ensures we look at the right columns even if you move them later.
  const headers = rows[0]; 
  const headerMap = {};
  
  headers.forEach((header, index) => {
    headerMap[String(header)] = index;
  });

  // Verify 'church_id' column exists
  if (headerMap["church_id"] === undefined) {
    return sendJSON({ status: "error", message: "'church_id' column missing in Members sheet" });
  }

  // Get target church ID
  const targetChurchId = String(data.church_id); 
  
  // Initialize counters
  let maleCount = 0;
  let femaleCount = 0;

  // 2. Iterate rows (Skip header i=1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Check Church ID Filter
    const rowChurchId = String(row[headerMap["church_id"]]);
    if (rowChurchId !== targetChurchId) {
      continue; // Skip if not this church's member
    }

    // Get Gender (Using map is safer than hardcoded index)
    // Fallback to index 4 if map fails, but map should work if header is "gender"
    const genderColIndex = headerMap["gender"] !== undefined ? headerMap["gender"] : 4;
    const gender = String(row[genderColIndex] || "").trim().toLowerCase(); 

    if (gender === 'male' || gender === 'm') {
      maleCount++;
    } else if (gender === 'female' || gender === 'f') {
      femaleCount++;
    }
  }

  // Format for Recharts
  const genderData = [
    { name: 'Male', value: maleCount },
    { name: 'Female', value: femaleCount }
  ];

  return sendJSON({
    status: "success",
    genderData: genderData
  });
}

function getAgeStats(church_id) {
  const sheet = ss.getSheetByName("Members");
  const rows = sheet.getDataRange().getValues();
  
  // Initialize our buckets
  const ageBuckets = {
    '0-18': 0, // (Will actually only contain 5-18 because of the filter)
    '19-30': 0,
    '31-50': 0,
    '51-70': 0,
    '70+': 0
  };

  // Skip header row
  const dataRows = rows.slice(1);

  dataRows.forEach(row => {
    const rowChurchId = row[12];
    let age = row[9];

    // 1. Only count members for the requested church
    if (rowChurchId === church_id) {
      
      // 2. Make sure age is a valid number
      if (age !== "" && !isNaN(age)) {
        age = Number(age);

        // 3. FILTER: Ignore anyone younger than 5
        if (age >= 5) {
          
          // 4. Sort into buckets
          if (age <= 18) {
            ageBuckets['0-18']++;
          } else if (age <= 30) {
            ageBuckets['19-30']++;
          } else if (age <= 50) {
            ageBuckets['31-50']++;
          } else if (age <= 70) {
            ageBuckets['51-70']++;
          } else {
            ageBuckets['70+']++;
          }
        }
      }
    }
  });

  // 5. Format the output exactly how Recharts (your frontend) expects it
  const ageData = [
    { range: '0-18', count: ageBuckets['0-18'] },
    { range: '19-30', count: ageBuckets['19-30'] },
    { range: '31-50', count: ageBuckets['31-50'] },
    { range: '51-70', count: ageBuckets['51-70'] },
    { range: '70+', count: ageBuckets['70+'] }
  ];

  return sendJSON({ status: "success", ageData: ageData });
}

function getRoleStats(church_id) {
  const sheet = ss.getSheetByName("Members");
  const rows = sheet.getDataRange().getValues();
  
  // Object to keep track of counts dynamically (e.g., { "Member": 150, "Visitor": 30 })
  const roleCounts = {};

  // Skip the header row
  const dataRows = rows.slice(1);

  dataRows.forEach(row => {
    const rowChurchId = row[12];
    let role = row[5]; 

    // 1. Only count members for the requested church
    if (rowChurchId === church_id) {
      
      // 2. Clean up the text (just in case there are accidental spaces)
      if (!role || role.toString().trim() === "") {
        role = "Unassigned"; // Fallback if someone has no role
      } else {
        role = role.toString().trim();
      }

      // 3. Increment the bucket or start it at 1 if it doesn't exist yet
      if (roleCounts[role]) {
        roleCounts[role]++;
      } else {
        roleCounts[role] = 1;
      }
    }
  });

  // 4. Format the output EXACTLY how Recharts expects it
  // This converts our object into the array: [{ role: 'Member', count: 150 }, ...]
  const roleData = Object.keys(roleCounts).map(key => {
    return {
      role: key,
      count: roleCounts[key]
    };
  });

  // Optional: Sort the array from highest count to lowest so the chart looks nice
  roleData.sort((a, b) => b.count - a.count);

  return sendJSON({ status: "success", roleData: roleData });
}

function getNationalityStats(data) {
  const sheet = ss.getSheetByName("Members");
  
  if (!sheet) {
    return sendJSON({ status: "success", nationalityData: [] });
  }

  const rows = sheet.getDataRange().getValues();

  // 1. Get Headers & Find Column Indices Dynamically
  const headers = rows[0]; 
  const headerMap = {};
  
  headers.forEach((header, index) => {
    headerMap[String(header)] = index;
  });

  // Verify 'church_id' column exists
  if (headerMap["church_id"] === undefined) {
    return sendJSON({ status: "error", message: "'church_id' column missing in Members sheet" });
  }

  const targetChurchId = String(data.church_id); 
  const counts = {};

  // 2. Iterate rows (Skip header i=1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Check Church ID Filter
    const rowChurchId = String(row[headerMap["church_id"]]);
    if (rowChurchId !== targetChurchId) {
      continue; // Skip if not this church's member
    }

    // Get Nationality (Use Map, fallback to index 3 if needed)
    // Adjust fallback index if your nationality column is different
    const natIndex = headerMap["nationality"] !== undefined ? headerMap["nationality"] : 3;
    let nationality = String(row[natIndex] || "").trim(); 
    
    // Normalize text (Capitalize first letter)
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

  // Sort by count descending so biggest slices are first
  nationalityData.sort((a, b) => b.value - a.value);

  return sendJSON({
    status: "success",
    nationalityData: nationalityData
  });
}

function testGetNationalityStats() {
  console.log("--- 🧪 STARTING TEST: getNationalityStats ---");

  // 1. Configure Test Data
  // Replace this with a valid church_id from your sheet
  const targetChurchId = "test001"; 

  const mockData = {
    action: "getNationalityStats",
    church_id: targetChurchId
  };

  console.log(`Requesting nationality stats for Church ID: [${mockData.church_id}]`);

  // 2. Execute Function
  try {
    const response = getNationalityStats(mockData);
    
    // Parse the JSON response
    const result = JSON.parse(response.getContent());

    // 3. Analyze Results
    console.log("--------------------------------");
    if (result.status === "success") {
      console.log("✅ API Success");
      
      const stats = result.nationalityData;
      console.log(`Found ${stats.length} unique nationalities.`);

      if (stats.length > 0) {
        console.log("\n📊 Breakdown:");
        stats.forEach(item => {
            console.log(`   - ${item.name}: ${item.value}`);
        });
      } else {
        console.log("⚠️ No members found for this church.");
      }

    } else {
      console.error("❌ API Error:", result.message);
    }
    console.log("--------------------------------");

  } catch (error) {
    console.error("❌ CRITICAL FAILURE:", error.toString());
  }
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

// function testGetAttendanceByTime() {
//   // 1. Define test cases
//   const testCases = [
//     { description: "Fetch ALL events", input: {} },
//     { description: "Fetch specific event (Divine Service)", input: { eventName: "Divine Service" }},
//     { description: "Fetch specific event (Prayer Meeting)", input: { eventName: "Prayer Meeting" } }
//   ];

//   // 2. Run tests
//   testCases.forEach(test => {
//     console.log("--- Running Test: " + test.description + " ---");
    
//     // Call the function directly
//     const resultJSON = getAttendanceByTime(test.input);
    
//     // Parse the JSON string back to an object for inspection
//     // Note: In GAS, ContentService returns an object wrapper, so we simulate the output object
//     // If your sendJSON returns ContentService, we can't parse it easily in the logger.
//     // Instead, for testing, let's look at the logic inside.
    
//     // For debugging, it's easier if we temporarily return the raw object instead of sendJSON
//     // OR, we can mock sendJSON to just log the output.
//     console.log("Result Payload:");
//     console.log(resultJSON.getContent()); // getContent() reveals the stringified JSON
//   });
// }
function testGetAttendanceByTime() {
  console.log("--- 🧪 STARTING TEST: getAttendanceByTime ---");

  // 1. Configure Test Data
  // Ensure your 'Attendance' sheet has rows with this specific church_id
  const targetChurchId = "test001"; 

  const mockData = {
    action: "getAttendanceByTime",
    church_id: targetChurchId 
  };

  console.log(`Requesting stats for Church ID: [${mockData.church_id}]`);

  // 2. Execute Function
  try {
    // We pass the mock object directly, just like the router would
    const response = getAttendanceByTime(mockData);
    
    // Parse the returned JSON content
    const result = JSON.parse(response.getContent());

    // 3. Analyze Results
    console.log("--------------------------------");
    if (result.status === "success") {
      console.log("✅ API Success");
      
      const events = Object.keys(result.data);
      console.log(`Found ${events.length} unique event types for this church.`);

      if (events.length > 0) {
        // Log details for the first event found to verify structure
        const sampleEvent = events[0];
        const stats = result.data[sampleEvent];

        console.log(`\n📊 Sample Data for event: "${sampleEvent}"`);
        console.log(`   - Weekly Records: ${stats.weekly.length}`);
        console.log(`   - Monthly Records: ${stats.monthly.length}`);
        console.log(`   - Yearly Records: ${stats.yearly.length}`);
        
        // Print the actual data arrays for inspection
        console.log("\n   Daily/Weekly breakdown:", JSON.stringify(stats.weekly));
        console.log("   Monthly breakdown:", JSON.stringify(stats.monthly));
      } else {
        console.log("⚠️ No attendance records found for this church ID.");
      }

    } else {
      console.error("❌ API Error:", result.message);
    }
    console.log("--------------------------------");

  } catch (error) {
    console.error("❌ CRITICAL FAILURE:", error.toString());
  }
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
  console.log("--- 🧪 STARTING TEST: getMemberGenderStats ---");

  // 1. Configure Test Data
  // Replace this with a church_id that actually has members in your sheet
  const targetChurchId = "test001"; 

  const mockData = {
    action: "getMemberGenderStats",
    church_id: targetChurchId
  };

  console.log(`Requesting gender stats for Church ID: [${mockData.church_id}]`);

  // 2. Execute Function
  try {
    // Pass the mock object directly
    const response = getMemberGenderStats(mockData);
    
    // Parse the JSON response
    const result = JSON.parse(response.getContent());

    // 3. Analyze Results
    console.log("--------------------------------");
    if (result.status === "success") {
      console.log("✅ API Success");
      
      const genderData = result.genderData;
      // Expected format: [{ name: 'Male', value: X }, { name: 'Female', value: Y }]
      
      // Helper to find specific gender count for logging
      const maleStat = genderData.find(item => item.name === 'Male');
      const femaleStat = genderData.find(item => item.name === 'Female');

      console.log(`\n📊 Gender Breakdown for ${targetChurchId}:`);
      console.log(`   - 👨 Male:   ${maleStat ? maleStat.value : 0}`);
      console.log(`   - 👩 Female: ${femaleStat ? femaleStat.value : 0}`);
      
      console.log("\n   Full Response:", JSON.stringify(genderData));

    } else {
      console.error("❌ API Error:", result.message);
    }
    console.log("--------------------------------");

  } catch (error) {
    console.error("❌ CRITICAL FAILURE:", error.toString());
  }
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
