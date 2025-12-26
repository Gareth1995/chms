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

    if (action == "registerUser") {
      console.log('Registering User...')
      return registerUser(data);
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

