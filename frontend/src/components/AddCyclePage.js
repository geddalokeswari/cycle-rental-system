import React, { useState } from 'react';
import axios from 'axios';
import './AddCyclePage.css';

const AddCyclePage = () => {
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [photo, setPhoto] = useState(null);

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('cost', cost);
        if (photo) formData.append('photo', photo);

        axios.post('http://localhost:8080/add_cycle', formData)
            .then(response => {
                console.log(response.data);
                // Reset form
                setName('');
                setCost('');
                setPhoto(null);
            })
            .catch(error => {
                console.error('There was an error adding the cycle!', error);
            });
    };

    return (
        <div className="add-cycle-page">
            <h1>Add a New Cycle</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Cycle Name:
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                    Cost:
                    <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} required />
                </label>
                <label>
                    Photo:
                    <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
                </label>
                <button type="submit">Add Cycle</button>
            </form>
        </div>
    );
};

export default AddCyclePage;
