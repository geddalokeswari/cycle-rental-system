import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import AddCyclePage from './components/AddCyclePage';
import MyOrdersPage from './components/MyOrdersPage';
import ReturnPage from './components/ReturnPage';
import './App.css';

const App = () => {
    return (
        <Router>
            <div className="app">
                <nav>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/add-cycle">Add Cycle</Link></li>
                        <li><Link to="/my-orders">My Orders</Link></li>
                        <li><Link to="/return">Return</Link></li>
                    </ul>
                </nav>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/add-cycle" element={<AddCyclePage />} />
                    <Route path="/my-orders" element={<MyOrdersPage />} />
                    <Route path="/return" element={<ReturnPage />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
