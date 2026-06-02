import os
from flask import Flask, render_template, jsonify, request
import pandas as pd  # pyrefly: ignore [missing-import]
import numpy as np  # pyrefly: ignore [missing-import]
from sklearn.linear_model import LinearRegression  # pyrefly: ignore [missing-import]
import scipy.stats as stats  # pyrefly: ignore [missing-import]

app = Flask(__name__)

# Load Data
DATA_DIR = os.path.join(app.root_path, 'static', 'data')

def clean_data(filepath, value_name):
    df = pd.read_csv(filepath)
    df = df.drop(['Lat', 'Long'], axis=1)
    df = df.groupby('Country/Region').sum().reset_index()
    if 'Province/State' in df.columns:
        df = df.drop(['Province/State'], axis=1)
    df_melted = df.melt(id_vars=['Country/Region'], var_name='Date', value_name=value_name)
    df_melted['Date'] = pd.to_datetime(df_melted['Date'])
    return df_melted

# Initialize data globally to serve requests quickly
confirmed = clean_data(os.path.join(DATA_DIR, 'confirmed.csv'), 'Confirmed')
deaths = clean_data(os.path.join(DATA_DIR, 'deaths.csv'), 'Deaths')
recovered = clean_data(os.path.join(DATA_DIR, 'recovered.csv'), 'Recovered')

covid_data = confirmed.merge(deaths, on=['Country/Region', 'Date']).merge(recovered, on=['Country/Region', 'Date'])
covid_data = covid_data.rename(columns={'Country/Region': 'Country'})
covid_data = covid_data.sort_values(by=['Country', 'Date']).reset_index(drop=True)

# JHU stopped reporting 'Recovered' cases in mid-2021 (data shows 0). 
# We use a standard epidemiological estimate: Recovered ≈ Confirmed (21 days ago) - Deaths
covid_data['Recovered_Est'] = covid_data.groupby('Country')['Confirmed'].shift(21) - covid_data['Deaths']
covid_data['Recovered_Est'] = covid_data['Recovered_Est'].fillna(0).clip(lower=0)
covid_data['Recovered'] = np.where(covid_data['Recovered'] <= 0, covid_data['Recovered_Est'], covid_data['Recovered'])
covid_data = covid_data.drop(columns=['Recovered_Est'])

# Pre-calculate global data
covid_data['Daily_Confirmed'] = covid_data.groupby('Country')['Confirmed'].diff().fillna(0)

global_data = covid_data.groupby('Date')[['Confirmed', 'Deaths', 'Recovered']].sum().reset_index()
global_data['Active'] = global_data['Confirmed'] - global_data['Deaths'] - global_data['Recovered']
global_data['Daily_Confirmed'] = global_data['Confirmed'].diff().fillna(0)
global_data['Daily_Deaths'] = global_data['Deaths'].diff().fillna(0)
global_data['Daily_Recovered'] = global_data['Recovered'].diff().fillna(0)

latest_date = global_data['Date'].max()
latest_country_data = covid_data[covid_data['Date'] == latest_date].copy()
latest_country_data['Active'] = latest_country_data['Confirmed'] - latest_country_data['Deaths'] - latest_country_data['Recovered']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/summary')
def summary():
    latest = global_data.iloc[-1]
    confirmed_val = int(latest['Confirmed'])
    deaths_val = int(latest['Deaths'])
    recovered_val = int(latest['Recovered'])
    active_val = confirmed_val - deaths_val - recovered_val
    
    return jsonify({
        'total_confirmed': confirmed_val,
        'total_deaths': deaths_val,
        'total_recovered': recovered_val,
        'active_cases': active_val,
        'recovery_rate': round((recovered_val / confirmed_val) * 100, 2) if confirmed_val else 0,
        'mortality_rate': round((deaths_val / confirmed_val) * 100, 2) if confirmed_val else 0,
        'last_updated': latest_date.strftime('%Y-%m-%d')
    })

@app.route('/api/insights')
def insights():
    latest = global_data.iloc[-1]
    recovery_rate = round((latest['Recovered'] / latest['Confirmed']) * 100, 1) if latest['Confirmed'] else 0
    
    # Top surging country
    top_surge = latest_country_data.sort_values(by='Daily_Confirmed', ascending=False).iloc[0]
    
    # Most safe country (High recovery, low deaths, min 100000 cases to filter outliers)
    safe_candidates = latest_country_data[latest_country_data['Confirmed'] > 100000].copy()
    safe_candidates['Rec_Rate'] = safe_candidates['Recovered'] / safe_candidates['Confirmed']
    top_safe = safe_candidates.sort_values(by='Rec_Rate', ascending=False).iloc[0]
    
    insights_list = [
        f"Global Recovery Rate currently stands at a robust {recovery_rate}%.",
        f"Highest Daily Surge: {top_surge['Country']} reported {int(top_surge['Daily_Confirmed']):,} new cases in the last 24 hours.",
        f"Top Recovery: {top_safe['Country']} has an impressive recovery rate of {round(top_safe['Rec_Rate'] * 100, 1)}% among heavily affected nations.",
        f"Global active cases currently sit at {int(latest['Active']):,} worldwide."
    ]
    return jsonify({'insights': insights_list})

@app.route('/api/charts/global')
def charts_global():
    return jsonify({
        'dates': global_data['Date'].dt.strftime('%Y-%m-%d').tolist(),
        'confirmed': global_data['Confirmed'].tolist(),
        'deaths': global_data['Deaths'].tolist(),
        'recovered': global_data['Recovered'].tolist(),
        'daily_confirmed': global_data['Daily_Confirmed'].tolist()
    })

@app.route('/api/countries')
def countries():
    top_10 = latest_country_data.nlargest(10, 'Confirmed')
    country_list = latest_country_data.sort_values(by='Confirmed', ascending=False)['Country'].tolist()
    
    return jsonify({
        'all_countries': country_list,
        'top_10_names': top_10['Country'].tolist(),
        'top_10_confirmed': top_10['Confirmed'].tolist(),
        'top_10_deaths': top_10['Deaths'].tolist(),
        'top_10_recovered': top_10['Recovered'].tolist()
    })

@app.route('/api/country/<country_name>')
def country_data(country_name):
    country_df = covid_data[covid_data['Country'] == country_name].copy()
    if country_df.empty:
        return jsonify({'error': 'Country not found'}), 404
        
    country_df['Daily_Confirmed'] = country_df['Confirmed'].diff().fillna(0)
    
    latest = country_df.iloc[-1]
    confirmed_val = int(latest['Confirmed'])
    deaths_val = int(latest['Deaths'])
    recovered_val = int(latest['Recovered'])
    active_val = confirmed_val - deaths_val - recovered_val
    
    return jsonify({
        'dates': country_df['Date'].dt.strftime('%Y-%m-%d').tolist(),
        'confirmed': country_df['Confirmed'].tolist(),
        'deaths': country_df['Deaths'].tolist(),
        'recovered': country_df['Recovered'].tolist(),
        'daily_confirmed': country_df['Daily_Confirmed'].tolist(),
        'stats': {
            'confirmed': confirmed_val,
            'deaths': deaths_val,
            'recovered': recovered_val,
            'active': active_val,
            'recovery_rate': round((recovered_val / confirmed_val) * 100, 2) if confirmed_val else 0,
            'mortality_rate': round((deaths_val / confirmed_val) * 100, 2) if confirmed_val else 0,
        }
    })

@app.route('/api/predict')
def predict():
    # Linear Regression for global confirmed cases
    data = global_data.copy()
    data['Days'] = (data['Date'] - data['Date'].min()).dt.days
    
    X = data[['Days']]
    y = data['Confirmed']
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict past for R2, MAE, RMSE calculation
    y_pred = model.predict(X)
    from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
    r2 = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    
    # Predict next 30 days
    last_day = X['Days'].max()
    future_days = np.array([[last_day + i] for i in range(1, 31)])
    future_preds = model.predict(future_days)
    
    # Generate future dates
    future_dates = [latest_date + pd.Timedelta(days=i) for i in range(1, 31)]
    future_dates_str = [d.strftime('%Y-%m-%d') for d in future_dates]
    
    return jsonify({
        'actual_dates': data['Date'].dt.strftime('%Y-%m-%d').tolist(),
        'actual_cases': y.tolist(),
        'predicted_past': y_pred.tolist(),
        'future_dates': future_dates_str,
        'future_cases': future_preds.tolist(),
        'r2_score': round(r2, 4),
        'mae': round(mae, 2),
        'rmse': round(rmse, 2)
    })

@app.route('/api/table')
def table_data():
    df = latest_country_data.copy()
    df['Recovery_Rate'] = round((df['Recovered'] / df['Confirmed']) * 100, 2).fillna(0)
    df['Mortality_Rate'] = round((df['Deaths'] / df['Confirmed']) * 100, 2).fillna(0)
    return df.to_json(orient='records')

@app.route('/api/stats')
def statistics():
    daily_cases = global_data['Daily_Confirmed']
    
    def get_descriptive_stats(series):
        series_clean = series.dropna()
        if len(series_clean) == 0:
            return {}
        q1 = np.percentile(series_clean, 25)
        q3 = np.percentile(series_clean, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = series_clean[(series_clean < lower_bound) | (series_clean > upper_bound)]
        outliers_values = outliers.tolist()
        if len(outliers_values) > 3:
            outliers_str = ", ".join([str(round(v, 2)) for v in outliers_values[:3]]) + "..."
        else:
            outliers_str = ", ".join([str(round(v, 2)) for v in outliers_values])
            
        return {
            'mean': round(np.mean(series_clean), 2),
            'median': round(np.median(series_clean), 2),
            'mode': round(float(stats.mode(series_clean, keepdims=True).mode[0]), 2),
            'std_dev': round(np.std(series_clean), 2),
            'variance': round(np.var(series_clean), 2),
            'q1': round(q1, 2),
            'q3': round(q3, 2),
            'iqr': round(iqr, 2),
            'outliers_count': len(outliers),
            'outliers_values': outliers_str
        }

    stats_data = {
        'Daily Confirmed': get_descriptive_stats(global_data['Daily_Confirmed']),
        'Daily Deaths': get_descriptive_stats(global_data['Daily_Deaths']),
        'Daily Recovered': get_descriptive_stats(global_data['Daily_Recovered']),
        'Active Cases': get_descriptive_stats(global_data['Active'])
    }
    
    corr_matrix = global_data[['Confirmed', 'Deaths', 'Recovered', 'Daily_Confirmed']].corr().to_dict()
    
    # M4: Hypothesis Testing (T-Test) - Compare first half of timeline vs second half
    half_point = len(daily_cases) // 2
    first_half = daily_cases[:half_point]
    second_half = daily_cases[half_point:]
    t_stat, p_val_t = stats.ttest_ind(first_half, second_half, equal_var=False)
    
    # M4: Confidence Interval for the Mean Daily Cases
    ci_lower, ci_upper = stats.t.interval(0.95, len(daily_cases)-1, loc=np.mean(daily_cases), scale=stats.sem(daily_cases))
    
    # M4: ANOVA (Compare mean daily cases of Top 3 countries)
    top_3_countries = latest_country_data.nlargest(3, 'Confirmed')['Country'].tolist()
    c1_data = covid_data[covid_data['Country'] == top_3_countries[0]]['Confirmed'].diff().fillna(0)
    c2_data = covid_data[covid_data['Country'] == top_3_countries[1]]['Confirmed'].diff().fillna(0)
    c3_data = covid_data[covid_data['Country'] == top_3_countries[2]]['Confirmed'].diff().fillna(0)
    
    f_stat, p_val_anova = stats.f_oneway(c1_data, c2_data, c3_data)
    
    return jsonify({
        'descriptive': stats_data,
        'correlation': corr_matrix,
        'inference': {
            't_test': { 't_stat': round(float(t_stat), 4), 'p_value': round(float(p_val_t), 4) },
            'confidence_interval': { 'lower': round(float(ci_lower), 2), 'upper': round(float(ci_upper), 2) },
            'anova': { 'f_stat': round(float(f_stat), 4), 'p_value': round(float(p_val_anova), 4), 'countries': top_3_countries }
        }
    })

from flask import send_from_directory

@app.route('/report.pdf')
def download_report():
    return send_from_directory(app.root_path, 'report.pdf', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
