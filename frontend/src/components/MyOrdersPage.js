import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8080/orders')
            .then(response => {
                setOrders(response.data);
            })
            .catch(error => {
                console.error('There was an error fetching the orders!', error);
            });
    }, []);

    const handleReturn = (cycleId) => {
        axios.post(`http://localhost:8080/return_cycle/${cycleId}`)
            .then(response => {
                setOrders(orders.filter(order => order.cycle_id !== cycleId));
            })
            .catch(error => {
                console.error('There was an error returning the cycle!', error);
            });
    };

    return (
        <div className="my-orders-page">
            <h1>My Orders</h1>
            <div className="orders-container">
                {orders.map(order => (
                    <div className="order-card" key={order._id}>
                        <h2>Cycle ID: {order.cycle_id}</h2>
                        <p>Rented on: {order.rental_date}</p>
                        <button onClick={() => handleReturn(order.cycle_id)}>Return</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyOrdersPage;
