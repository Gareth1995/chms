// Open the sheet by ID or just use the active one since the script is bound
const ss = SpreadsheetApp.getActiveSpreadsheet();

// 1. Handle Reading Data (GET Requests)
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getMembers") {
    const sheet = ss.getSheetByName("Members");
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = rows.slice(1); // Remove headers

    // Convert rows to Array of Objects
    const members = data.map(row => {
      return {
        id: row[0],
        name: row[1],
        category: row[2]
      };
    });

    return sendJSON(members);
  }
}

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

    if (action == "getMembers") {
      console.log('Getting members...');
      return getMembers(data);
    }

    if (action === "saveAttendance") {
      const sheet = ss.getSheetByName("Attendance");
      const timestamp = new Date();
      
      // We expect data.records to be an array of { memberId, status }
      // But for simplicity, let's just loop what we get
      const newRows = data.records.map(record => {
        return [
          timestamp,
          data.eventName,
          record.memberId,
          record.status // e.g., "Present", "Absent"
        ];
      });

      // Append all rows at once
      if (newRows.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 4).setValues(newRows);
      }

      return sendJSON({ status: "success", count: newRows.length });
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
    data.role,
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
        role: userRow[4]
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
    timestampISO
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
    timestampISO
  ]);

  return sendJSON({ status: "success", memberId: member_id });
}

function getMembers() {
  const sheet = ss.getSheetByName("Members");
  const data = sheet.getDataRange().getValues(); // This gets a 2D array [[Headers], [Row1], [Row2]]
  
  // 1. Remove the first row (headers) so we don't treat "First Name" as a person
  const headers = data.shift(); 

  // 2. Loop through the remaining rows and format them as objects
  const members = data.map(row => ({
    id: row[0],
    firstName: row[1],
    lastName: row[2],
    nationality: row[3],
    gender: row[4],
    role: row[5],
    email: row[6],
    cell: row[7],
    // Note: row[8] appeared twice in your snippet as gender and DOB. 
    // I assumed index 8 is DOB and 9 is Age based on standard ordering. Check your sheet columns!
    dob: row[8], 
    age: row[9]
  }));

  // 3. Return the LIST of members
  return sendJSON({ status: "success", members: members });
}

// testing functions
// testing registration
function testRegistrationLogic() {
  // 1. Create fake data (mocking what React would send)
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "registerUser",
        firstName: "Test",
        lastName: "User",
        nationality: "South African",
        role: "Admin",
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
        email: "gareth.reeve50@gmail.com",
        password: "password123"
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(mockEvent);
}

// testing adding a member
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
        dob: "2025-10-04"  
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
        action: "getMembers" 
      })
    }
  };

  // 2. Call your main function directly
  // const result = doPost(mockEvent);
  doPost(getMemTest);
}
