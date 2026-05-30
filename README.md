---
title: Covid 19 Data Analysis Dashboard
emoji: 📊
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---
# COVID-19 Data Analysis Dashboard

A complete, production-ready COVID-19 Data Analysis Dashboard project with a Flask backend, interactive charts, machine learning predictions, and a glassmorphism frontend. Developed following a strict M1-M5 Data Science Methodology.

## Project Description
This web-based analytics dashboard automatically ingests raw COVID-19 datasets, cleans the data, performs statistical analysis, and visualizes global trends. Furthermore, it incorporates Machine Learning (Linear Regression) to predict future confirmed cases for the next 30 days.

## Technologies Used
- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript, Bootstrap 5, Chart.js, Plotly.js, AOS Animations
- **Backend**: Python 3, Flask, Gunicorn
- **Data Science / ML**: Pandas, NumPy, Scikit-Learn, SciPy

## Folder Structure
```
covid-dashboard/
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── data/
│       ├── confirmed.csv
│       ├── deaths.csv
│       └── recovered.csv
│
├── templates/
│   └── index.html
│
├── app.py
├── requirements.txt
├── Procfile
├── runtime.txt
├── README.md
├── report.pdf
└── presentation.pptx
```

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd covid-dashboard
   ```

2. **Install Python dependencies**:
   Run the following command to install all required libraries:
   ```bash
   pip install flask pandas numpy matplotlib seaborn scikit-learn scipy plotly gunicorn
   ```

3. **Run the local development server**:
   ```bash
   python app.py
   ```

4. **Access the Dashboard**:
   Open your browser and navigate to: `http://127.0.0.1:5000/`

## Deployment Steps (Render or Heroku)

This project is fully ready for online deployment.

1. Create a GitHub repository and push all files.
2. Link your repository to **Render** (or Heroku).
3. Set the Build Command to: `pip install -r requirements.txt`
4. Set the Start Command to: `gunicorn app:app`
5. Deploy the application. `Procfile` and `runtime.txt` are included to ensure a smooth deployment process.

## Final Documents Included
- **`report.pdf`**: A professional 17-section documentation report ready for submission.
- **`presentation.pptx`**: PowerPoint slides detailing the workflow, charts, and conclusions.

## Methodology
- **M1:** Data Cleaning & Preprocessing
- **M2:** Exploratory Data Analysis (EDA)
- **M3:** Probability Analysis
- **M4:** Statistical Inference
- **M5:** Regression Analysis (Machine Learning Predictions)
