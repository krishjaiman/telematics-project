import pandas as pd
import numpy as np
import joblib
from flask import Flask, request, jsonify

# --- 1. Initialize Flask App and Load Model ---
app = Flask(__name__)

# Load the trained machine learning model
try:
    model = joblib.load('risk_model.joblib')
    print("Model loaded successfully.")
except FileNotFoundError:
    print("Error: 'risk_model_winner.joblib' not found. Make sure the model file is in the same directory.")
    model = None

# --- 2. Feature Engineering Function ---
# This function MUST replicate the exact same steps as our Colab notebook
def create_features_from_trip(trip_data):
    """
    Processes a list of trip data points and engineers features for the model.
    
    Args:
        trip_data (list of dicts): Raw data points for a single trip.
        
    Returns:
        pandas.DataFrame: A DataFrame with a single row of engineered features.
    """
    if not trip_data:
        return None

    # Convert raw data to a pandas DataFrame
    df = pd.DataFrame(trip_data)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Define thresholds (must be the same as in training)
    HARSH_ACCELERATION_THRESHOLD = 2.5
    HARSH_BRAKING_THRESHOLD = -2.5
    HARSH_TURNING_THRESHOLD = 2.0
    SPEEDING_THRESHOLD = 90

    # Calculate features
    df['lateral_accel_mag'] = df['accelerometer_y'].abs()
    
    trip_duration_seconds = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    if trip_duration_seconds == 0:
        return None # Avoid division by zero for single-point trips

    harsh_accelerations = (df['accelerometer_x'] > HARSH_ACCELERATION_THRESHOLD).sum()
    harsh_brakings = (df['accelerometer_x'] < HARSH_BRAKING_THRESHOLD).sum()
    harsh_turnings = (df['lateral_accel_mag'] > HARSH_TURNING_THRESHOLD).sum()
    
    speeding_duration_seconds = df[df['speed_kmh'] > SPEEDING_THRESHOLD].shape[0]
    percent_time_speeding = (speeding_duration_seconds / trip_duration_seconds) * 100
    
    risky_hours_count = df[df['timestamp'].dt.hour.isin([22, 23, 0, 1, 2, 3, 4])].shape[0]
    percent_time_risky_hours = (risky_hours_count / trip_duration_seconds) * 100

    # Create a DataFrame with the exact feature names the model expects
    features = pd.DataFrame([{
        'harsh_accelerations': harsh_accelerations,
        'harsh_brakings': harsh_brakings,
        'harsh_turnings': harsh_turnings,
        'percent_time_speeding': percent_time_speeding,
        'percent_time_risky_hours': percent_time_risky_hours
    }])
    
    return features


# --- 3. Pricing Engine Function ---
def calculate_premium(risk_score):
    """
    Calculates an insurance premium based on the risk score.
    """
    # A simple formula: base rate increases with risk score.
    # A score of 0 has no increase, a score of 100 doubles the premium.
    BASE_RATE = 50.0 # Base premium in USD for a trip/month
    premium = BASE_RATE * (1 + (risk_score / 100))
    return round(premium, 2)


# --- 4. API Endpoint ---
@app.route('/calculate_premium', methods=['POST'])
def calculate_premium_endpoint():
    if model is None:
        return jsonify({"error": "Model is not loaded."}), 500

    # Get the raw trip data from the request body
    raw_trip_data = request.json.get('trip_data')
    if not raw_trip_data:
        return jsonify({"error": "Request must include 'trip_data'."}), 400

    # Step 1: Engineer features from the raw data
    try:
        features = create_features_from_trip(raw_trip_data)
        if features is None:
             return jsonify({"error": "Invalid trip data. Could not process features."}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to process features: {str(e)}"}), 500

    # Step 2: Use the model to predict the risk score
    try:
        risk_score = model.predict(features)[0]
        # Ensure score is not negative
        risk_score = max(0, risk_score)
    except Exception as e:
        return jsonify({"error": f"Failed to predict score: {str(e)}"}), 500

    # Step 3: Use the pricing engine to calculate the premium
    premium = calculate_premium(risk_score)

    # Return the final result
    response = {
        'risk_score': round(risk_score, 2),
        'calculated_premium_usd': premium
    }
    
    return jsonify(response)


# --- 5. Run the App ---
if __name__ == '__main__':
    # To run this app:
    # 1. Open your terminal in this project directory.
    # 2. Run the command: flask --app app run
    # The server will start, usually on http://127.0.0.1:5000
    app.run(debug=True, port=5000)

