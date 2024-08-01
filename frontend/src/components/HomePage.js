import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './HomePage.css'; // Import the CSS file

const HomePage = () => {
    const [cycles, setCycles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCycles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/cycles');
            if (Array.isArray(response.data)) {
                setCycles(response.data);
                setError(null);
            } else {
                throw new Error('Invalid data format from server');
            }
        } catch (error) {
            console.error("Error fetching cycles:", error);
            setError(`Error fetching cycles: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCycles();
    }, [fetchCycles]);

    const handleRentCycle = async (cycleId) => {
        try {
            const formData = new FormData();
            formData.append('user', 'TestUser');
            formData.append('rental_date', new Date().toISOString());

            await axios.post(`http://localhost:8080/rent_cycle/${cycleId}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            fetchCycles();
        } catch (error) {
            console.error("Error renting cycle:", error);
            setError("Failed to rent cycle. Please try again.");
        }
    };

    const handleImageError = (cycleId) => {
        console.error(`Failed to load image for cycle ${cycleId}`);
        setCycles(prevCycles => prevCycles.map(cycle => 
            cycle._id === cycleId ? { ...cycle, imageLoadError: true } : cycle
        ));
    };

    return (
        <div className="home-container">
            <h1 className="title">Available Cycles</h1>
            {loading ? (
                <p className="loading">Loading...</p>
            ) : error ? (
                <p className="error">Error: {error}</p>
            ) : (
                cycles.length === 0 ? (
                    <p className="no-cycles">No cycles available at the moment.</p>
                ) : (
                    <div className="cycles-list">
                        {cycles.map(cycle => {
                            const validPhotoUrl = cycle.photo_url ? cycle.photo_url.replace(/['"]/g, '') : '';
                            return (
                                <div key={cycle._id} className="cycle-card">
                                    <h3 className="cycle-name">{cycle.name}</h3>
                                    <p className="cycle-cost">Cost: ${cycle.cost}</p>
                                    {validPhotoUrl ? (
                                        <img 
                                            src={validPhotoUrl} 
                                            alt={cycle.name} 
                                            className="cycle-image"
                                            onError={() => handleImageError(cycle._id)}
                                        />
                                    ) : (
                                        <p className="no-image">No image available</p>
                                    )}
                                    <button 
                                        onClick={() => handleRentCycle(cycle._id)} 
                                        disabled={!cycle.available}
                                        className={`rent-button ${cycle.available ? 'available' : 'unavailable'}`}
                                    >
                                        {cycle.available ? 'Rent Now' : 'Not Available'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

export default HomePage;
