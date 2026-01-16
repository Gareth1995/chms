const GOOGLE_SCRIPT_URL = import.meta.env.VITE_API_URL || "https://script.google.com/macros/s/AKfycby_CZ3xU61oLxs9BBHEqs_8lf1UXJ5ZpWQjdXqr4YPDgUY5-Ug47vq_AUpQBLuabZeY1A/exec"; 
// Note: If you haven't set up the .env file yet, paste your string directly above.

export const registerUser = async (userData) => {
    console.log(userData);
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "registerUser",
            firstName: userData.firstName,
            lastName: userData.lastName,
            nationality: userData.nationality,
            role: userData.role,
            email: userData.email,
            cell: String(userData.cell),
            password: userData.password
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Registration failed:", error);
        return { status: "error", message: "Network error" };
    }
};

export const loginUser = async (email, password) => {
    console.log(email, password);

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "loginUser",
            email: email,
            password: password
            })
        });
        return await response.json();
    } catch (error) {
        console.error("Login failed:", error);
        return { status: "error", message: "Network error" };
    }
};

export const addMember = async (memberData) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addMember",
        ...memberData // This spreads all the fields (firstName, gender, etc.)
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Add member failed:", error);
    return { status: "error", message: "Network error" };
  }
};

export const addMemberUpdates = async (memberData) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addMemberUpdate",
        ...memberData // This spreads all the fields (firstName, gender, etc.)
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Add member failed:", error);
    return { status: "error", message: "Network error" };
  }
};

export const getMembers = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getMembers"
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Get members failed:", error);
    return { status: "error", message: "Network error" };
  }
};

/**
 * Fetches the list of unique event names from the 'Events' sheet.
 */
export const getEvents = async () => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "getEvents"
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    return { status: "error", message: "Network error", events: [] };
  }
};

/**
 * Adds a new event to the 'Events' sheet.
 * @param {string} eventName - The name of the event to add.
 */
export const addEvent = async (eventName) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "addEvent",
        eventName: eventName
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding event:", error);
    return { status: "error", message: "Network error" };
  }
};

/**
 * Deletes an event from the 'Events' sheet.
 * @param {string} eventName - The name of the event to delete.
 */
export const deleteEvent = async (eventName) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteEvent",
        eventName: eventName
      })
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting event:", error);
    return { status: "error", message: "Network error" };
  }
};