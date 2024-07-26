import axios from 'axios';
import { useEffect, useState } from 'react';

const HomePage = () => {
    const [cycles, setCycles] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8080/cycles')
            .then(response => {
                setCycles(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the cycles!", error);
                setError("There was an error fetching the cycles.");
            });
    }, []);

    return (
        <div>
            {error && <p>{error}</p>}
            {cycles.map(cycle => (
                <div key={cycle._id}>
                    <h3>{cycle.name}</h3>
                    <p>Cost: {cycle.cost}</p>
                    <img src={cycle.photo_url} alt={cycle.name} />
                    <button disabled={!cycle.available}>Rent Now</button>
                </div>
            ))}
        </div>
    );
};

export default HomePage;
