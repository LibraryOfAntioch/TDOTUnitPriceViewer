// main.js - Main application entry point
import { loadData, updatePayItemList, getItemData, exportToCSV } from './modules/data.js';
import { initializeChart, updateChart, currentChart, getChartOptions } from './modules/chart.js';
import { setupEventListeners } from './modules/events.js';
import { setupHelpSection } from './modules/help.js';
import { calculatePricePrediction, calculateRegionalDifferentials } from './modules/analysis.js';
import { generatePDFReport } from './modules/report.js';

let currentItem = null;
let trendsData = null;

async function initializeApp() {
    try {
        // Load the data
        trendsData = await loadData();
        
        // Initialize the chart
        initializeChart();
        
        // Set up event listeners and help section
        setupEventListeners(trendsData);
        setupHelpSection();
        
        // Update the pay item list
        updatePayItemList();

        // Set up additional event listeners
        setupAdditionalEventListeners();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Failed to load data. Please try refreshing the page.');
    }
}

function setupAdditionalEventListeners() {
    // Pay item selection
    const payItemSelect = document.getElementById('payItem');
    if (payItemSelect) {
        payItemSelect.addEventListener('change', handlePayItemChange);
    }

    // Trend line type
    const trendLineSelect = document.getElementById('trendLine');
    if (trendLineSelect) {
        trendLineSelect.addEventListener('change', handleTrendLineChange);
    }

    // Chart type
    const chartTypeInputs = document.querySelectorAll('input[name="chartType"]');
    chartTypeInputs.forEach(input => {
        input.addEventListener('change', handleChartTypeChange);
    });

    // Region selection
    const regionInputs = document.querySelectorAll('input[name="region"]');
    regionInputs.forEach(input => {
        input.addEventListener('change', handleRegionChange);
    });

    // Export button
    const exportButton = document.querySelector('.btn-export');
    if (exportButton) {
        exportButton.addEventListener('click', handleExport);
    }

    // Report button
    const reportButton = document.querySelector('.btn-report');
    if (reportButton) {
        reportButton.addEventListener('click', handleReportGeneration);
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', handleDarkModeToggle);
    }

    // Analysis options
    const showPredictions = document.getElementById('showPredictions');
    const showDifferentials = document.getElementById('showDifferentials');
    if (showPredictions) {
        showPredictions.addEventListener('change', () => {
            if (currentItem) updateChartForItem(currentItem);
        });
    }
    if (showDifferentials) {
        showDifferentials.addEventListener('change', () => {
            if (currentItem) updateChartForItem(currentItem);
        });
    }
}

function handlePayItemChange(e) {
    const item = e.target.value;
    console.log('Pay item changed:', item);
    if (item) {
        currentItem = item;
        updateChartForItem(item);
    }
}

function handleTrendLineChange() {
    if (currentItem) {
        updateChartForItem(currentItem);
    }
}

function handleChartTypeChange() {
    if (currentItem) {
        updateChartForItem(currentItem);
    }
}

function handleRegionChange() {
    if (currentItem) {
        updateChartForItem(currentItem);
    }
}

function handleExport() {
    const item = document.getElementById('payItem').value;
    if (item) {
        exportToCSV(item);
    }
}

function handleReportGeneration() {
    const item = document.getElementById('payItem').value;
    if (!item) return;

    const itemData = getItemData(item);
    const trendLineType = document.getElementById('trendLine').value;
    const showPredictions = document.getElementById('showPredictions').checked;
    const showDifferentials = document.getElementById('showDifferentials').checked;

    let predictions = null;
    if (showPredictions && trendLineType !== 'none') {
        const points = Object.values(itemData)
            .flatMap(region => Object.entries(region)
                .map(([year, val]) => ({ x: Number(year), y: val.price })))
            .sort((a, b) => a.x - b.x);
        predictions = calculatePricePrediction(points, trendLineType);
    }

    const differentials = showDifferentials ? calculateRegionalDifferentials(itemData) : null;
    
    // Generate PDF report
    const doc = generatePDFReport({
        itemNumber: item,
        description: Object.values(itemData)[0]?.[Object.keys(Object.values(itemData)[0])[0]]?.description || '',
        unit: Object.values(itemData)[0]?.[Object.keys(Object.values(itemData)[0])[0]]?.unit || '',
        currentPrice: Object.values(itemData)
            .flatMap(region => Object.values(region))
            .sort((a, b) => b.year - a.year)[0]?.price || 0,
        priceChange: calculatePriceChange(itemData),
        volatility: calculateVolatility(itemData),
        regionalVariation: calculateRegionalVariation(differentials)
    }, predictions, differentials);

    // Save the PDF
    doc.save(`${item}_analysis_report.pdf`);

    // Update summary display
    updateSummaryDisplay(itemData, predictions, differentials);
}

function updateSummaryDisplay(itemData, predictions, differentials) {
    const currentPrice = Object.values(itemData)
        .flatMap(region => Object.values(region))
        .sort((a, b) => b.year - a.year)[0]?.price || 0;
    const priceChange = calculatePriceChange(itemData);
    const volatility = calculateVolatility(itemData);
    const regionalVariation = calculateRegionalVariation(differentials);

    document.getElementById('currentPrice').textContent = 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
            .format(currentPrice);
    document.getElementById('priceChange').textContent = 
        `${priceChange.toFixed(2)}%`;
    document.getElementById('volatility').textContent = 
        `${(volatility * 100).toFixed(2)}%`;
    document.getElementById('regionalVariation').textContent = 
        `${regionalVariation.toFixed(2)}%`;
}

function calculatePriceChange(data) {
    const points = Object.values(data)
        .flatMap(region => Object.entries(region)
            .map(([year, val]) => ({ x: Number(year), y: val.price })))
        .sort((a, b) => a.x - b.x);
    
    if (points.length < 2) return 0;
    return ((points[points.length - 1].y - points[0].y) / points[0].y) * 100;
}

function calculateVolatility(data) {
    const points = Object.values(data)
        .flatMap(region => Object.entries(region)
            .map(([year, val]) => ({ x: Number(year), y: val.price })))
        .sort((a, b) => a.x - b.x);
    
    if (points.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < points.length; i++) {
        const ret = (points[i].y - points[i-1].y) / points[i-1].y;
        returns.push(ret);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

function calculateRegionalVariation(differentials) {
    if (!differentials) return 0;
    
    const variations = Object.values(differentials)
        .flatMap(region => Object.values(region));
    if (variations.length === 0) return 0;
    
    const mean = variations.reduce((a, b) => a + b, 0) / variations.length;
    const variance = variations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / variations.length;
    return Math.sqrt(variance);
}

function handleDarkModeToggle() {
    document.body.classList.toggle('dark-mode');
    if (currentChart) {
        // Update chart options for dark mode
        const options = getChartOptions();
        currentChart.options = options;
        currentChart.update();
    }
    if (currentItem) {
        updateChartForItem(currentItem);
    }
}

function updateChartForItem(itemNum) {
    console.log('Updating chart for item:', itemNum);
    const itemData = getItemData(itemNum);
    if (!itemData) {
        console.error('No data found for item:', itemNum);
        return;
    }

    console.log('Item data:', itemData);

    const selectedRegions = Array.from(document.querySelectorAll('input[name="region"]:checked'))
                               .map(cb => cb.value);
    console.log('Selected regions:', selectedRegions);
    
    const trendLineType = document.getElementById('trendLine').value;
    const chartType = document.querySelector('input[name="chartType"]:checked').value;
    const showPredictions = document.getElementById('showPredictions').checked;
    const showDifferentials = document.getElementById('showDifferentials').checked;

    const allYears = Object.entries(itemData)
        .filter(([region]) => selectedRegions.includes(region))
        .flatMap(([region, data]) => Object.keys(data).map(Number))
        .filter(year => !isNaN(year));
    
    console.log('Years range:', Math.min(...allYears), 'to', Math.max(...allYears));
    
    let minYear = Math.min(...allYears);
    let maxYear = Math.max(...allYears);
    if (minYear === maxYear) {
        minYear -= 1;
        maxYear += 1;
    }

    updateChart(itemData, {
        selectedRegions,
        trendLineType,
        chartType,
        minYear,
        maxYear,
        showPredictions,
        showDifferentials
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp); 