// Initialize AOS Animations
AOS.init({ duration: 1000, once: true });

// Initialize Particles.js
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 50 },
        "color": { "value": "#45a29e" },
        "shape": { "type": "circle" },
        "opacity": { "value": 0.3 },
        "size": { "value": 3 },
        "line_linked": { "enable": true, "distance": 150, "color": "#45a29e", "opacity": 0.2, "width": 1 },
        "move": { "enable": true, "speed": 2 }
    },
    "interactivity": {
        "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" } }
    },
    "retina_detect": true
});

// Real-time Clock
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleString();
}
setInterval(updateClock, 1000);
updateClock();

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-sun text-warning"></i>' : '<i class="fa-solid fa-moon"></i>';
});

// Smooth Scrolling for Nav Links (Fix for Safari bug)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const offset = 90; // Height of fixed navbar
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Back to top button
window.addEventListener('scroll', () => {
    const btn = document.querySelector('.back-to-top');
    if (window.scrollY > 300) btn.classList.add('visible');
    else btn.classList.remove('visible');
});

// Number Counter Animation
function animateCounter(id, start, end, duration) {
    let obj = document.getElementById(id),
    current = start,
    range = end - start,
    increment = end > start ? Math.ceil(range / (duration / 20)) : -1,
    step = Math.abs(Math.floor(duration / range));
    if (step === 0) step = 20;
    
    let timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        obj.innerHTML = current.toLocaleString();
    }, step);
}

// Chart Global Config
Chart.defaults.color = '#c5c6c7';
Chart.defaults.font.family = 'Segoe UI';

let globalTrendChart, topCountriesBarChart, distributionPieChart, scatterChart, histogramChart, countryTrendChart;

// Data Fetching and Rendering
async function loadDashboardData() {
    try {
        // Fetch all data concurrently to reduce load time
        const [
            resSummary, resGlobal, resCountries, 
            resTable, resPredict, resStats, resInsights
        ] = await Promise.all([
            fetch('/api/summary'),
            fetch('/api/charts/global'),
            fetch('/api/countries'),
            fetch('/api/table'),
            fetch('/api/predict'),
            fetch('/api/stats'),
            fetch('/api/insights')
        ]);

        const summary = await resSummary.json();
        const globalCharts = await resGlobal.json();
        const countriesData = await resCountries.json();
        const tableData = await resTable.json();
        const predictData = await resPredict.json();
        const statsData = await resStats.json();
        const insightsData = await resInsights.json();
        
        // 1. Load Summary
        document.getElementById('last-updated').innerText = `(Last Updated: ${summary.last_updated})`;
        animateCounter('stat-confirmed', 0, summary.total_confirmed, 1500);
        animateCounter('stat-deaths', 0, summary.total_deaths, 1500);
        animateCounter('stat-recovered', 0, summary.total_recovered, 1500);
        animateCounter('stat-active', 0, summary.active_cases, 1500);
        
        document.getElementById('stat-rec-rate').innerText = summary.recovery_rate;
        document.getElementById('stat-mor-rate').innerText = summary.mortality_rate;

        // 2. Load Global Charts
        renderGlobalCharts(globalCharts);

        // 3. Load Countries for Dropdown and Bar Chart
        renderTopCountriesBar(countriesData);
        populateDropdown(countriesData.all_countries);

        // 4. Load Data Table & Map
        renderDataTable(tableData);
        renderChoroplethMap(tableData);

        // 5. Load ML Predictions
        renderPredictionChart(predictData);

        // 6. Load Statistics
        renderStatistics(statsData, summary);
        
        // 7. Load Smart Insights
        renderInsights(insightsData.insights);

        // Initialize tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

        // Remove Loader
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => document.getElementById('loader').style.display = 'none', 500);
        }, 1000);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = `<h3 class="text-danger mt-3"><i class="fa-solid fa-triangle-exclamation"></i> Error loading data</h3><p class="text-white">${error.message}</p>`;
        }
    }
}

function renderGlobalCharts(data) {
    const ctxTrend = document.getElementById('globalTrendChart').getContext('2d');
    globalTrendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                { label: 'Confirmed', data: data.confirmed, borderColor: '#45a29e', fill: false, tension: 0.1 },
                { label: 'Deaths', data: data.deaths, borderColor: '#f72585', fill: false, tension: 0.1 },
                { label: 'Recovered', data: data.recovered, borderColor: '#4cc9f0', fill: false, tension: 0.1 }
            ]
        },
        options: { responsive: true, interaction: { mode: 'index', intersect: false } }
    });

    const ctxPie = document.getElementById('distributionPieChart').getContext('2d');
    distributionPieChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Recovered', 'Deaths', 'Active'],
            datasets: [{
                data: [data.recovered[data.recovered.length-1], data.deaths[data.deaths.length-1], data.confirmed[data.confirmed.length-1] - data.deaths[data.deaths.length-1] - data.recovered[data.recovered.length-1]],
                backgroundColor: ['#4cc9f0', '#f72585', '#fca311']
            }]
        },
        options: { responsive: true }
    });

    const ctxHist = document.getElementById('histogramChart').getContext('2d');
    histogramChart = new Chart(ctxHist, {
        type: 'bar',
        data: {
            labels: data.dates.slice(-30), // last 30 days
            datasets: [{ label: 'Daily Cases', data: data.daily_confirmed.slice(-30), backgroundColor: '#3f72af' }]
        },
        options: { responsive: true }
    });
}

function renderInsights(insights) {
    const ticker = document.getElementById('insights-ticker');
    if (ticker && insights.length > 0) {
        ticker.innerHTML = insights.map(text => `<span class="me-5 pe-5"><i class="fa-solid fa-circle-dot text-warning me-2" style="font-size:0.5rem"></i> ${text}</span>`).join('');
    }
}

function renderTopCountriesBar(data) {
    const ctx = document.getElementById('topCountriesBarChart').getContext('2d');
    topCountriesBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.top_10_names,
            datasets: [{
                label: 'Confirmed Cases',
                data: data.top_10_confirmed,
                backgroundColor: 'rgba(69, 162, 158, 0.7)',
                borderColor: '#45a29e',
                borderWidth: 1
            }]
        },
        options: { responsive: true, indexAxis: 'y' }
    });

    // Plotly Area Chart
    const trace1 = { x: data.top_10_names, y: data.top_10_confirmed, fill: 'tozeroy', type: 'scatter', name: 'Confirmed' };
    const trace2 = { x: data.top_10_names, y: data.top_10_recovered, fill: 'tonexty', type: 'scatter', name: 'Recovered' };
    Plotly.newPlot('plotlyAreaChart', [trace1, trace2], { 
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)', 
        font: { color: '#c5c6c7' },
        margin: { t: 10, l: 40, r: 10, b: 40 }
    });

    // Scatter Chart (Deaths vs Recovered)
    const ctxScatter = document.getElementById('scatterChart').getContext('2d');
    const scatterData = data.top_10_names.map((name, i) => ({ x: data.top_10_recovered[i], y: data.top_10_deaths[i] }));
    scatterChart = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Top 10 Countries',
                data: scatterData,
                backgroundColor: '#fca311'
            }]
        },
        options: {
            responsive: true,
            scales: { x: { title: { display: true, text: 'Recovered' } }, y: { title: { display: true, text: 'Deaths' } } }
        }
    });
}

// Initialize Google Charts
google.charts.load('current', {'packages':['geochart']});

function renderChoroplethMap(data) {
    google.charts.setOnLoadCallback(() => {
        const mapData = [['Country', 'Confirmed Cases']];
        data.forEach(row => {
            // Map JHU names to Google Charts friendly names if needed
            let countryName = row.Country;
            if (countryName === 'US') countryName = 'United States';
            if (countryName === 'Korea, South') countryName = 'South Korea';
            if (countryName === 'Taiwan*') countryName = 'Taiwan';
            mapData.push([countryName, row.Confirmed]);
        });
        
        const dataTable = google.visualization.arrayToDataTable(mapData);
        
        const options = {
            backgroundColor: 'transparent',
            colorAxis: {colors: ['#88c7c5', '#45a29e', '#fca311', '#f72585']},
            datalessRegionColor: '#1f2833',
            defaultColor: '#f5f5f5',
            legend: {textStyle: {color: '#c5c6c7', fontSize: 12}},
            keepAspectRatio: true
        };

        const chart = new google.visualization.GeoChart(document.getElementById('worldMapChart'));
        chart.draw(dataTable, options);
    });
}

function populateDropdown(countries) {
    const select = document.getElementById('country-select');
    select.innerHTML = '<option value="">-- Select a Country --</option>';
    countries.forEach(c => {
        select.innerHTML += `<option value="${c}">${c}</option>`;
    });

    select.addEventListener('change', async (e) => {
        if (!e.target.value) return;
        const res = await fetch(`/api/country/${e.target.value}`);
        const data = await res.json();
        
        document.getElementById('c-name').innerText = e.target.value;
        document.getElementById('c-conf').innerText = data.stats.confirmed.toLocaleString();
        document.getElementById('c-death').innerText = data.stats.deaths.toLocaleString();
        document.getElementById('c-rec').innerText = data.stats.recovered.toLocaleString();
        document.getElementById('c-act').innerText = data.stats.active.toLocaleString();

        if(countryTrendChart) countryTrendChart.destroy();
        
        const ctx = document.getElementById('countryTrendChart').getContext('2d');
        const activeData = data.confirmed.map((conf, index) => conf - data.deaths[index] - data.recovered[index]);
        
        countryTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,
                datasets: [
                    { label: 'Confirmed', data: data.confirmed, borderColor: '#45a29e', fill: false },
                    { label: 'Active', data: activeData, borderColor: '#fca311', fill: false },
                    { label: 'Recovered', data: data.recovered, borderColor: '#4cc9f0', fill: false },
                    { label: 'Deaths', data: data.deaths, borderColor: '#f72585', fill: false },
                    { label: 'Daily New', data: data.daily_confirmed, borderColor: '#6c757d', type: 'bar' }
                ]
            },
            options: { responsive: true, interaction: { mode: 'index', intersect: false } }
        });
    });
}

function renderPredictionChart(data) {
    document.getElementById('r2-score').innerText = data.r2_score;

    const ctx = document.getElementById('predictionChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...data.actual_dates, ...data.future_dates],
            datasets: [
                { label: 'Actual Cases', data: data.actual_cases, borderColor: '#45a29e', fill: false, pointRadius: 0 },
                { label: 'Predicted Trend (Past)', data: data.predicted_past, borderColor: 'rgba(247, 37, 133, 0.5)', borderDash: [5, 5], fill: false, pointRadius: 0 },
                { label: '30-Day Forecast', data: [...Array(data.actual_cases.length-1).fill(null), data.actual_cases[data.actual_cases.length-1], ...data.future_cases.flat()], borderColor: '#f72585', fill: false, pointRadius: 2 }
            ]
        },
        options: { responsive: true, interaction: { mode: 'index', intersect: false } }
    });
}

function renderDataTable(data) {
    const tbody = document.querySelector('#covidTable tbody');
    data.forEach(row => {
        tbody.innerHTML += `
            <tr>
                <td>${row.Country}</td>
                <td>${row.Confirmed.toLocaleString()}</td>
                <td>${row.Deaths.toLocaleString()}</td>
                <td>${row.Recovered.toLocaleString()}</td>
                <td>${row.Active.toLocaleString()}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${row.Recovery_Rate}%</span>
                        <div class="progress w-100" style="height: 6px; background-color: rgba(255,255,255,0.1);">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${row.Recovery_Rate}%"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${row.Mortality_Rate}%</span>
                        <div class="progress w-100" style="height: 6px; background-color: rgba(255,255,255,0.1);">
                            <div class="progress-bar bg-danger" role="progressbar" style="width: ${row.Mortality_Rate}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    // Initialize DataTables
    $('#covidTable').DataTable({
        pageLength: 10,
        order: [[1, 'desc']],
        responsive: true
    });
}

function renderStatistics(data, summary) {
    document.getElementById('prob-death-m3').innerText = summary.mortality_rate + "%";
    document.getElementById('prob-rec-m3').innerText = summary.recovery_rate + "%";

    // Descriptive Statistics
    const statsContainer = document.getElementById('descriptive-stats-container');
    if (statsContainer && data.descriptive) {
        let cardsHtml = '';
        const categories = Object.keys(data.descriptive);
        categories.forEach(category => {
            const stats = data.descriptive[category];
            cardsHtml += `
                <div class="col-lg-3 col-md-6 mb-4">
                    <div class="p-3 border rounded border-secondary h-100 bg-transparent text-center text-light">
                        <h5 class="text-light fw-bold mb-4">${category}</h5>
                        
                        <div class="row small mb-3 text-start">
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Mean:</span><br/>${stats.mean.toLocaleString()}</div>
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Median:</span><br/>${stats.median.toLocaleString()}</div>
                        </div>
                        
                        <div class="row small mb-3 text-start">
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Mode:</span><br/>${stats.mode.toLocaleString()}</div>
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Std Dev:</span><br/>${stats.std_dev.toLocaleString()}</div>
                        </div>
                        
                        <div class="row small mb-3 text-start">
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Variance:</span><br/>${stats.variance.toLocaleString()}</div>
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">IQR:</span><br/>${stats.iqr.toLocaleString()}</div>
                        </div>
                        
                        <div class="row small mb-3 text-start">
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Q1:</span><br/>${stats.q1.toLocaleString()}</div>
                            <div class="col-6 text-break"><span class="text-secondary fw-bold">Q3:</span><br/>${stats.q3.toLocaleString()}</div>
                        </div>
                        
                        <div class="mt-3 p-2 border rounded ${stats.outliers_count > 0 ? 'border-danger text-danger' : 'border-secondary text-secondary'} text-center text-break">
                            <span class="fw-bold">Outliers:</span> ${stats.outliers_count} found
                            ${stats.outliers_count > 0 ? `<br/><small>Values: ${stats.outliers_values}</small>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        statsContainer.innerHTML = cardsHtml;
    }

    if (data.inference) {
        document.getElementById('inf-tstat').innerText = data.inference.t_test.t_stat;
        document.getElementById('inf-tpval').innerText = data.inference.t_test.p_value;
        
        document.getElementById('inf-ci-low').innerText = data.inference.confidence_interval.lower.toLocaleString();
        document.getElementById('inf-ci-up').innerText = data.inference.confidence_interval.upper.toLocaleString();
        
        document.getElementById('inf-anova-countries').innerText = data.inference.anova.countries.join(", ");
        document.getElementById('inf-fstat').innerText = data.inference.anova.f_stat;
        document.getElementById('inf-apval').innerText = data.inference.anova.p_value;
    }

    // Plotly Heatmap
    const corrKeys = Object.keys(data.correlation);
    const zValues = corrKeys.map(k1 => corrKeys.map(k2 => data.correlation[k1][k2]));
    
    const heatData = [{
        z: zValues,
        x: corrKeys,
        y: corrKeys,
        type: 'heatmap',
        colorscale: 'Viridis'
    }];
    Plotly.newPlot('heatmapChart', heatData, { 
        paper_bgcolor: 'rgba(0,0,0,0)', 
        plot_bgcolor: 'rgba(0,0,0,0)', 
        font: { color: '#c5c6c7' },
        margin: { t: 10, l: 40, r: 10, b: 40 }
    });
}

// Start
loadDashboardData();
