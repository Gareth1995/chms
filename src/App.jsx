import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Home from './pages/dashboard/Home';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />}/>
                <Route path="/signup" element={<Signup />}/>

                <Route path="/dashboard" element={<Home />}/>
                <Route path="/" element={<Navigate to="/login" replace/>}/>
            </Routes>
        </Router>
    );
};

export default App