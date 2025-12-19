import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login/>}/>
                    {/* Redirect home to login for now */}
                <Route path="/" element={<Navigate to="/login" replace/>}/>
            </Routes>
        </Router>
    );
};

export default App