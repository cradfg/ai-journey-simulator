# ai-journey-simulator
## Current Implementation: Checkout Optimization Module

This is the first phase of a complete customer journey simulator, focusing on the checkout conversion moment. The system uses machine learning to predict optimal interventions at checkout to reduce cart abandonment.

Current scope: Checkout intervention selection
Planned phases: Product discovery, cart optimization, post-purchase engagement, recommendation engine and search engine optimization.

Machine learning system that selects the best checkout intervention to maximize profit per user.
What It Does
Predicts which offer (discount, free shipping, urgency message, or none) will generate the highest expected value for each user at checkout.
NOTE : Until now it is not a complete journey simulator , it is largely hard-coded in future commits i will be adding in a lot more features which will make it a complete journey simulator.

Performance:
ROC-AUC: 0.75
Accuracy: 71.7%
Prediction time: Under 100ms

Quick Start
Firstly clone the repo locally and then,
pip install -r requirements.txt (to install all the required dependecies)
python main.py (for setting up and running the server)
Then open index.html in your browser. (to view the frontend ui)

How It Works
The system evaluates 5 interventions (none, 5% off, 10% off, free shipping, urgency) and selects the one with highest expected value using:
Expected Value = (Revenue - Cost) × Conversion Probability
The ML model (Gradient Boosting with 150 trees) predicts conversion probability based on cart value, device type, user behavior, and intervention type.

Files
main.py - Training and API server
index.html - Frontend interface
style.css - Styling
script.js - Frontend logic
requirements.txt - Dependencies
models/ - Generated on first run

API
POST /predict-intervention
Accepts user data (cart value, device, behavior), returns best intervention with predicted conversion rate and expected value.
Docs: http://localhost:8000/docs

Limitations :
Implements checkout phase only (full journey simulation in development)
Trained on synthetic data
Single model (no ensemble)

Working on reducing the limitations.

Tech Stack :
Python, FastAPI, scikit-learn, HTML/CSS/JavaScript
