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