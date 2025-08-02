// --- 1. DOM Element References ---
const tripSelect = document.getElementById('trip-select');
const calculateBtn = document.getElementById('calculate-btn');
const riskScoreEl = document.getElementById('risk-score');
const premiumEl = document.getElementById('premium');
const gamificationBadge = document.getElementById('gamification-badge');
const resultsEl = document.getElementById('results');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error-message');

// --- 2. Sample Trip Data ---
// This is the data we will send to our backend. We have two pre-defined trips.
// This data structure matches what our simulation script created.
const sampleTrips = {
    safe_trip: [
        { timestamp: "2023-10-27T10:00:00", latitude: 40.7128, longitude: -74.0060, speed_kmh: 45, accelerometer_x: 0.1, accelerometer_y: -0.2, accelerometer_z: 9.8 },
        { timestamp: "2023-10-27T10:00:01", latitude: 40.7129, longitude: -74.0061, speed_kmh: 46, accelerometer_x: 0.2, accelerometer_y: 0.1, accelerometer_z: 9.8 },
        { timestamp: "2023-10-27T10:00:02", latitude: 40.7130, longitude: -74.0062, speed_kmh: 44, accelerometer_x: -0.1, accelerometer_y: -0.1, accelerometer_z: 9.8 }
    ],
    risky_trip: [
        { timestamp: "2023-10-27T11:00:00", latitude: 34.0522, longitude: -118.2437, speed_kmh: 85, accelerometer_x: 1.5, accelerometer_y: 0.5, accelerometer_z: 9.8 },
        // Harsh Braking Event
        { timestamp: "2023-10-27T11:00:01", latitude: 34.0523, longitude: -118.2438, speed_kmh: 50, accelerometer_x: -3.0, accelerometer_y: 0.2, accelerometer_z: 9.8 },
        // Harsh Turning Event
        { timestamp: "2023-10-27T11:00:02", latitude: 34.0524, longitude: -118.2439, speed_kmh: 55, accelerometer_x: 0.5, accelerometer_y: 2.5, accelerometer_z: 9.8 },
        // Speeding
        { timestamp: "2023-10-27T11:00:03", latitude: 34.0525, longitude: -118.2440, speed_kmh: 95, accelerometer_x: 1.0, accelerometer_y: 0.1, accelerometer_z: 9.8 }
    ]
};

// --- 3. Event Listener ---
calculateBtn.addEventListener('click', () => {
    const selectedTripKey = tripSelect.value;
    const tripData = sampleTrips[selectedTripKey];
    
    // Call the function to communicate with the backend
    getPremiumCalculation(tripData);
});


// --- 4. Backend Communication Function ---
async function getPremiumCalculation(tripData) {
    // Show loader and hide previous results/errors
    showLoader(true);
    showResults(false);
    showError(false);

    try {
        // This is the core of the frontend-backend communication.
        // We use `fetch` to send a POST request to our Flask server's endpoint.
        const response = await fetch('http://127.0.0.1:5000/calculate_premium', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // The `body` of the request contains our trip data, converted to a JSON string.
            body: JSON.stringify({ trip_data: tripData }),
        });

        if (!response.ok) {
            // If the server responds with an error (e.g., 400 or 500), throw an error.
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Update the UI with the data we received from the backend
        updateUI(data);

    } catch (error) {
        console.error('Error fetching calculation:', error);
        showError(`Failed to get calculation. Is the backend server running? \nError: ${error.message}`);
    } finally {
        // Hide loader and show results (even if there was an error)
        showLoader(false);
        showResults(true);
    }
}

// --- 5. UI Update Functions ---
function updateUI(data) {
    if (data) {
        // Update score and premium text
        riskScoreEl.textContent = data.risk_score;
        premiumEl.textContent = `$${data.calculated_premium_usd}`;

        // Update risk score color based on value
        riskScoreEl.classList.remove('safe', 'risky');
        if (data.risk_score < 40) {
            riskScoreEl.classList.add('safe');
            // Show gamification badge for safe drivers
            gamificationBadge.classList.add('visible');
        } else {
            riskScoreEl.classList.add('risky');
            gamificationBadge.classList.remove('visible');
        }
    } else {
        // Reset to default if there's an error
        riskScoreEl.textContent = '--';
        premiumEl.textContent = '$--';
        riskScoreEl.classList.remove('safe', 'risky');
        gamificationBadge.classList.remove('visible');
    }
}

function showLoader(isLoading) {
    loaderEl.classList.toggle('hidden', !isLoading);
}

function showResults(isVisible) {
    resultsEl.classList.toggle('hidden', !isVisible);
    resultsEl.classList.toggle('visible', isVisible);
}

function showError(message) {
    if (message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        // Hide the main results display when an error occurs
        resultsEl.classList.add('hidden');
        resultsEl.classList.remove('visible');
    } else {
        errorEl.classList.add('hidden');
    }
}
