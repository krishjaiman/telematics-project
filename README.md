**Telematics-Based Auto Insurance Solution**
This project is a proof-of-concept implementation of a modern, usage-based insurance (UBI) system as outlined. It moves away from traditional, static insurance models and towards a dynamic pricing engine that leverages real-time driving data to calculate fairer and more personalized premiums.

The application simulates driving data, processes it to identify key behaviors, uses a machine learning model to generate a risk score, and presents the final score and estimated premium on a user-friendly web dashboard.

**🚀 Project Phases & Methodology**
The project was developed in a sequential, multi-phase process:

**1. Data Simulation**
Objective: To create a realistic dataset for model training without requiring real-world telematics hardware.

Methodology: A Python script generates time-series data for multiple drivers and trips. Two distinct "behavior profiles" were created:

Safe Driver: Characterized by consistent speed, gentle acceleration/turning, and a low probability of harsh events.

Risky Driver: Characterized by high-speed driving, volatile acceleration, and a significantly higher probability of harsh events (braking, turning, accelerating).

We have used a sampling rate of 1 sample per second that is, we record the parameters for a trip once every second.

Output: A driving_data_large.csv file containing raw, second-by-second sensor readings. This file can be found here: https://drive.google.com/file/d/1qyTKSHAc44r_Y3o1reOSIvv3VumYXT9O/view?usp=sharing

**2. Feature Engineering**
Objective: To transform low-level sensor data into high-level, interpretable features that describe a trip's behavior.

Methodology: The raw data is grouped by trip_id, and for each trip, the following key features are calculated:

Harsh Event Counts: The number of times acceleration, braking, or turning exceeded a predefined G-force threshold.

Speeding: The percentage of trip duration spent above a high-speed threshold (90 km/h).

Mileage: The total distance covered.

Contextual Risk: The percentage of the trip driven during high-risk hours (late at night).

Output: A trip_summary_features.csv file, where each row is a summarized trip.

**3. Model Training & Validation**
Objective: To build a robust machine learning model that can predict a driver's risk score based on the engineered features.

Methodology:

A Risk Score was defined using a weighted formula of the engineered features, serving as our target variable.

Two models were trained and compared: a simple Linear Regression and a more complex RandomForestRegressor.

To ensure robustness, the models were evaluated on a "noisy" version of the test data. The Random Forest model proved to be superior, maintaining near-perfect accuracy even with imperfect data.

Output: A risk_model_winner.joblib file containing the trained and validated Random Forest model.

**4. Backend Development (API)**
Objective: To create a web server that can process new trip data and serve predictions from our trained model.

Methodology: A Flask application was developed with a single API endpoint (/calculate_premium). This endpoint:

Receives raw trip data in a POST request.

Runs the same feature engineering logic as the training phase.

Loads the risk_model_winner.joblib file.

Predicts a risk score using the model.

Calculates a dynamic premium based on the score.

Returns the final score and premium as a JSON response.

Technology: Python, Flask, Flask-CORS.

**5. Frontend Development (Dashboard)**
Objective: To create a simple, interactive web interface for users to simulate a trip and view the results.

Methodology: A static web page was built using HTML, CSS, and vanilla JavaScript.

The dashboard allows a user to select a pre-defined "Safe" or "Risky" trip.

On button click, JavaScript's fetch API sends the sample trip data to the running Flask backend.

The frontend then dynamically displays the risk score and premium returned by the backend.

Technology: HTML, CSS, JavaScript.

**🛠️ Tech Stack**
Data Science & ML: Python, Pandas, NumPy, Scikit-learn

Backend: Flask, Flask-CORS, Gunicorn (for deployment)

Frontend: HTML5, CSS3, Vanilla JavaScript

Model Persistence: Joblib

**⚙️ How to Run the Project Locally**
Follow these steps to set up and run the application on your local machine.

Prerequisites
Python 3.8+

pip (Python package installer)

git (for cloning the repository)

1. Clone the Repository
git clone <your-github-repository-url>
cd <repository-folder-name>

2. Set Up a Virtual Environment
It is highly recommended to use a virtual environment.

# Create the virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

3. Install Dependencies
Install all the required Python libraries from the requirements.txt file.

pip install -r requirements.txt

4. Run the Backend Server
Start the Flask application. This will serve the API that the frontend communicates with.

flask --app app run

The server will start, typically on http://127.0.0.1:5000. Keep this terminal window running.

5. Run the Frontend
Navigate to the frontend subfolder and open the index.html file in your web browser.

telematics-project/
└── frontend/
    └── index.html  <-- Double-click this file

You can now interact with the dashboard, select a trip type, and click "Calculate Premium" to see the full system in action.

**🔮 Future Improvements**
This project provides a solid foundation. Future enhancements could include:

Real-time Data Ingestion: Integrate with a message queue like Kafka or RabbitMQ to process data from real telematics devices.

Database Integration: Store trip data, features, and scores in a scalable database like PostgreSQL or MongoDB.

Advanced Contextual Risk: Integrate with weather and traffic APIs to adjust risk scores based on real-time environmental conditions.

Full User Authentication: Develop a complete user login and profile system.

Deployment to the Cloud: Containerize the application with Docker and deploy it to a cloud service like Render or AWS for public access.
