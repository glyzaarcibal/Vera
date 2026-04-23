import axios from 'axios';

async function testRegistration() {
    const payload = {
        email: "test_" + Math.random().toString(36).substring(7) + "@gmail.com",
        password: "Password123!",
        username: "Test User",
        contactNumber: "09123456789",
        birthDate: "2000-01-01"
    };

    console.log("Testing registration with payload:", payload);

    try {
        const response = await axios.post('http://127.0.0.1:5000/api/auth/register', payload);
        console.log("Response:", response.status, response.data);
    } catch (error) {
        if (error.response) {
            console.error("Error Response:", error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testRegistration();
