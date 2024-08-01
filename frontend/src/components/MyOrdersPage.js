import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [cycles, setCycles] = useState({});

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get('http://localhost:8080/orders');
                setOrders(response.data);
                
                const cycleIds = response.data.map(order => order.cycle_id);
                const cycleDetailsPromises = cycleIds.map(id => axios.get(`http://localhost:8080/cycles/${id}`));
                const cycleDetailsResponses = await Promise.all(cycleDetailsPromises);

                const cyclesMap = {};
                cycleDetailsResponses.forEach(res => {
                    cyclesMap[res.data._id] = res.data;
                });
                setCycles(cyclesMap);
            } catch (error) {
                console.error('There was an error fetching the orders and cycles!', error);
            }
        };
        fetchOrders();
    }, []);

    const handleReturn = async (cycleId) => {
        try {
            await axios.post(`http://localhost:8080/return_cycle/${cycleId}`);
            setOrders(orders.filter(order => order.cycle_id !== cycleId));
        } catch (error) {
            console.error('There was an error returning the cycle!', error);
        }
    };

    return (
        <div className="my-orders-page">
            <h1>My Orders</h1>
            <div className="orders-container">
                {orders.map(order => {
                    const cycle = cycles[order.cycle_id];
                    return (
                        <div className="order-card" key={order._id}>
                            {cycle && (
                                <>
                                    <h2>{cycle.name}</h2>
                                    <p>Cost: ${cycle.cost}</p>
                                    <img src={cycle.photo_url} alt={cycle.name} className="cycle-image"/>
                                    <p>Rented on: {new Date(order.rental_date).toLocaleString()}</p>
                                    <button onClick={() => handleReturn(order.cycle_id)}>Return</button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyOrdersPage;
