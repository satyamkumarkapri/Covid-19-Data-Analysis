# COVID-19 Data Analysis Dashboard
**Final Project Documentation Report**

## 1. Project Overview
The **COVID-19 Data Analysis Dashboard** is a comprehensive, full-stack data science web application designed to analyze, visualize, and predict the spread of the COVID-19 pandemic. The platform processes raw datasets from the Johns Hopkins University repository and presents them through an interactive, modern user interface. 

The project heavily integrates machine learning and statistical inferences, strictly following the required **M1-M5 Data Science Methodology**.

---

## 2. Technology Stack
- **Backend**: Python 3, Flask, Pandas, NumPy, Scikit-Learn, SciPy
- **Frontend**: HTML5, Vanilla CSS3 (Glassmorphism UI), JavaScript (ES6)
- **Styling & Animation**: Bootstrap 5, AOS.js (Animate On Scroll), Particles.js
- **Data Visualization**: Chart.js, Plotly.js

---

## 3. Methodology Implementation (M1 - M5)

### M1: Data Cleaning & Preprocessing
Raw COVID-19 data natively contains inconsistencies, missing values, and overlapping provincial data. The Python backend resolves this through an automated cleaning pipeline:
1. **Import Dataset**: Read `confirmed.csv`, `deaths.csv`, and `recovered.csv` using Pandas DataFrames.
2. **Handle Missing Values**: Missing geographical markers and sparse daily reporting are handled using Pandas `.fillna(0)`.
3. **Remove Duplicates**: Data is aggregated (`.groupby()`) by `Country/Region`. Provincial and state-level data points are summed to prevent duplicate or overlapping nation-level counts.
4. **Convert Data Types**: The temporal columns are transformed into strict Python `datetime` objects for accurate time-series manipulation.
5. **Outlier Detection**: Erroneous negative daily cases (often due to reporting corrections) are smoothed and bounded to prevent skewing statistical metrics.

### M2: Exploratory Data Analysis (EDA)
An extensive visual analysis is performed to understand underlying patterns:
- **COVID-19 Trend Over Time (Line Chart)**: Tracks the macroscopic growth of cases globally.
- **Most Affected Countries (Bar Chart)**: Highlights the top 10 countries with the highest infection burdens.
- **Cases by Status (Pie Chart)**: Provides a quick compositional overview of active, recovered, and deceased cases.
- **Daily Cases Frequency (Histogram)**: Analyzes the distribution of new daily cases over the recent 30-day window.
- **Correlation Heatmap**: Identifies the strength of relationships between Confirmed, Deaths, Recovered, and Daily New variables.

### M3: Probability Analysis
Probabilistic metrics are calculated based on historical outcomes to estimate risk:
- **Probability of Mortality**: The likelihood of death given a confirmed infection.
- **Probability of Recovery**: The likelihood of surviving the infection.

### M4: Statistical Inference
The backend utilizes the `SciPy` library to perform rigorous statistical tests:
- **Hypothesis Testing (T-Test)**: The timeline is split into two halves to test if the mean daily cases significantly differ between the early pandemic and later waves.
- **Confidence Intervals**: A 95% Confidence Interval is constructed around the global mean daily cases to estimate the true population average with high certainty.
- **ANOVA (Analysis of Variance)**: A One-Way ANOVA test compares the variance in daily case spread among the Top 3 most affected countries, yielding F-statistics and P-values to determine statistical significance.

### M5: Regression Analysis
A Machine Learning model is deployed to predict short-term pandemic trajectories.
- **Model**: Linear Regression (`sklearn.linear_model.LinearRegression`)
- **Features (X)**: Time (Number of days since the outbreak began)
- **Target Variable (y)**: Total Global Confirmed Cases
- **Evaluation**: The model's accuracy is evaluated using the R² (Coefficient of Determination) Score. A 30-day forward-looking forecast is generated and plotted against historical actuals.

---

## 4. API Endpoints Architecture
The Flask backend acts as a RESTful API serving processed JSON data to the frontend:
- `/api/summary`: Returns macroscopic global counters and rates.
- `/api/charts/global`: Provides time-series arrays for rendering line and histogram charts.
- `/api/countries`: Calculates and returns the top 10 most affected countries.
- `/api/country/<name>`: Fetches isolated data and statistics for a single queried country.
- `/api/predict`: Executes the Linear Regression model and returns past actuals alongside future 30-day predictions.
- `/api/table`: Provides raw, tabular data for the DataTables grid.
- `/api/stats`: Calculates and returns the descriptive statistics, correlation matrices, and the complete M4 Inference suite (ANOVA, T-Test, C.I.).

---

## 5. Conclusion
The dashboard successfully transitions raw, unstructured CSV datasets into a rich, interactive analytical platform. By implementing a strict data science methodology, the project successfully derives meaningful insights, calculates future predictions, and verifies the statistical significance of global COVID-19 trends.
