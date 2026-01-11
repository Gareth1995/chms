import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Home from './pages/dashboard/Home';
import AddMember from "./pages/dashboard/addMember";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Members from "./pages/dashboard/Members";
import UpdateMember from "./pages/dashboard/updateMember";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />}/>
                <Route path="/signup" element={<Signup />}/>

                <Route
                    path="/dashboard"
                    element={
                    <ProtectedRoute>
                    <Home />
                    </ProtectedRoute>
                    }
                />
                
                <Route 
                    path="/members/add" 
                    element={
                        <ProtectedRoute>
                        <AddMember />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/members/update" 
                    element={
                        <ProtectedRoute>
                        <UpdateMember />
                        </ProtectedRoute>
                    } 
                />

                <Route 
                    path="/members" 
                    element={
                        <ProtectedRoute>
                        <Members />
                        </ProtectedRoute>
                    } 
                />

                <Route path="/" element={<Navigate to="/login" replace/>}/>
            </Routes>
        </Router>
    );
};

export default App