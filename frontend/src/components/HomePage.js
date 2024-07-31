import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HomePage = () => {
    const [cycles, setCycles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCycles();
    }, []);

    const fetchCycles = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/cycles');
            console.log('Fetched cycles:', response.data);
            if (Array.isArray(response.data)) {
                setCycles(response.data);
                setError(null);
            } else {
                throw new Error('Received invalid data format from server');
            }
        } catch (error) {
            console.error("There was an error fetching the cycles!", error);
            setError(`Error fetching cycles: ${error.message}`);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRentCycle = async (cycleId) => {
        try {
            await axios.post(`http://localhost:8080/rent_cycle/${cycleId}`, {
                user: 'TestUser',
                rental_date: new Date().toISOString()
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

    const getValidPhotoUrl = (photoUrl) => {
        if (!photoUrl) return null;
        try {
            // Ensure the URL is properly encoded
            const url = new URL(photoUrl);
            url.pathname = encodeURIComponent(url.pathname.split('/').pop());
            return url.toString();
        } catch (error) {
            console.error(`Invalid photo URL: ${photoUrl}`);
            return null;
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Available Cycles</h1>
            {cycles.length === 0 ? (
                <p>No cycles available at the moment.</p>
            ) : (
                cycles.map(cycle => {
                    const validPhotoUrl = getValidPhotoUrl(cycle.photo_url);
                    return (
                        <div key={cycle._id}>
                            <h3>{cycle.name}</h3>
                            <p>Cost: {cycle.cost}</p>
                            {validPhotoUrl && !cycle.imageLoadError ? (
                                <img 
                                    src={validPhotoUrl} 
                                    alt={cycle.name} 
                                    style={{maxWidth: '200px'}} 
                                    onError={() => handleImageError(cycle._id)}
                                />
                            ) : cycle.imageLoadError ? (
                                <p>Image failed to load</p>
                            ) : (
                                <p>No image available</p>
                            )}
                            <p>Photo URL: {validPhotoUrl || 'Not available'}</p>
                            <button 
                                onClick={() => handleRentCycle(cycle._id)} 
                                disabled={!cycle.available}
                            >
                                {cycle.available ? 'Rent Now' : 'Not Available'}
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default HomePage;