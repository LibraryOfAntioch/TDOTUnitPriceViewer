// events.js - Event handling
import { updatePayItemList, getItemData, exportToCSV, searchItems } from './data.js';
import { updateChart } from './chart.js';
import { generatePDFReport } from './report.js';

// Initialize state
let currentItemData = null;
let selectedRegions = ['statewide'];
let trendLineType = 'linear';
let chartType = 'line';
let showPredictions = false;
let showDifferentials = false;
let currentChart;

export function setupEventListeners(trendsData) {
    // Help section toggle
    const helpToggle = document.querySelector('.helpToggle');
    const helpContent = document.querySelector('.helpContent');
    
    if (helpToggle && helpContent) {
        helpToggle.addEventListener('click', () => {
            helpToggle.classList.toggle('active');
            helpContent.classList.toggle('show');
        });
    }

    // Search functionality
    const searchInput = document.querySelector('#search-input');
    const searchResults = document.querySelector('#search-results');
    const searchButton = document.querySelector('#search-button');

    if (searchInput && searchResults && searchButton) {
        let debounceTimeout;

        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }

            try {
                const results = searchItems(query);
                searchResults.innerHTML = '';

                if (results.length === 0) {
                    searchResults.innerHTML = '<div class="p-2">No items found</div>';
                    return;
                }

                results.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'search-result';
                    div.textContent = `${item.id} - ${item.description}`;
                    div.addEventListener('click', () => selectItem(item.id));
                    searchResults.appendChild(div);
                });
            } catch (error) {
                console.error('Search error:', error);
                searchResults.innerHTML = '<div class="p-2">Error performing search</div>';
            }
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(performSearch, 300);
        });

        searchButton.addEventListener('click', performSearch);
    }

    // Region selection
    const regionToggles = document.querySelectorAll('.region-toggle');
    regionToggles.forEach(toggle => {
        if (toggle) {
            toggle.addEventListener('click', () => {
                const region = toggle.dataset.region;
                if (!region) return;

                toggle.classList.toggle('active');
                
                if (toggle.classList.contains('active')) {
                    if (!selectedRegions.includes(region)) {
                        selectedRegions.push(region);
                    }
                } else {
                    selectedRegions = selectedRegions.filter(r => r !== region);
                }

                updateChartWithCurrentOptions();
            });
        }
    });

    // Analysis options
    const trendLineSelect = document.querySelector('#trend-line-type');
    const showPredictionsToggle = document.querySelector('#show-predictions');
    const showDifferentialsToggle = document.querySelector('#show-differentials');

    if (trendLineSelect) {
        trendLineSelect.addEventListener('change', () => {
            trendLineType = trendLineSelect.value;
            updateChartWithCurrentOptions();
        });
    }

    if (showPredictionsToggle) {
        showPredictionsToggle.addEventListener('change', () => {
            showPredictions = showPredictionsToggle.checked;
            updateChartWithCurrentOptions();
        });
    }

    if (showDifferentialsToggle) {
        showDifferentialsToggle.addEventListener('change', () => {
            showDifferentials = showDifferentialsToggle.checked;
            updateChartWithCurrentOptions();
        });
    }

    // Chart type toggle
    const chartTypeToggle = document.querySelector('#chart-type-toggle');
    if (chartTypeToggle) {
        chartTypeToggle.addEventListener('click', () => {
            chartTypeToggle.classList.toggle('active');
            chartType = chartTypeToggle.classList.contains('active') ? 'bar' : 'line';
            updateChartWithCurrentOptions();
        });
    }

    // Export and report buttons
    const exportButton = document.querySelector('.btn-export');
    const reportButton = document.querySelector('.btn-report');

    if (exportButton) {
        exportButton.addEventListener('click', () => {
            if (!currentItemData) {
                alert('Please select a pay item first');
                return;
            }
            
            try {
                const csvContent = generateCSV(currentItemData, selectedRegions);
                downloadCSV(csvContent);
            } catch (error) {
                console.error('Export error:', error);
                alert('Error exporting data');
            }
        });
    }

    if (reportButton) {
        reportButton.addEventListener('click', () => {
            if (!currentItemData) {
                alert('Please select a pay item first');
                return;
            }
            
            try {
                generatePDFReport(currentItemData, {
                    selectedRegions,
                    trendLineType,
                    chartType,
                    showPredictions,
                    showDifferentials
                });
            } catch (error) {
                console.error('Report generation error:', error);
                alert('Error generating report');
            }
        });
    }

    // Remove dark mode toggle
    const darkModeToggle = document.querySelector('#darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.remove();
    }
}

function handlePayItemChange(e) {
    const item = e.target.value;
    if (item) {
        currentItemData = getItemData(item);
        if (!currentItemData) return;
        
        // Update unit display
        const unitDisplay = document.getElementById('unitDisplay');
        const unit = Object.values(currentItemData)[0]?.[Object.keys(Object.values(currentItemData)[0])[0]]?.unit || '';
        unitDisplay.textContent = unit ? `Unit: ${unit}` : '';
        
        updateChartWithCurrentOptions();
    } else {
        // Clear unit display when no item is selected
        const unitDisplay = document.getElementById('unitDisplay');
        unitDisplay.textContent = '';
    }
}

function handleTrendLineChange() {
    const currentItem = document.getElementById('payItem').value;
    if (currentItem) {
        currentItemData = getItemData(currentItem);
        if (!currentItemData) return;
        updateChartWithCurrentOptions();
    }
}

function handleChartTypeChange() {
    const currentItem = document.getElementById('payItem').value;
    if (currentItem) {
        currentItemData = getItemData(currentItem);
        if (!currentItemData) return;
        updateChartWithCurrentOptions();
    }
}

function handleRegionChange() {
    const currentItem = document.getElementById('payItem').value;
    if (currentItem) {
        currentItemData = getItemData(currentItem);
        if (!currentItemData) return;
        updateChartWithCurrentOptions();
    }
}

function handleAnalysisOptionsChange() {
    const currentItem = document.getElementById('payItem').value;
    if (currentItem) {
        currentItemData = getItemData(currentItem);
        if (!currentItemData) return;
        updateChartWithCurrentOptions();
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
    if (!itemData) return;

    const doc = generatePDFReport(itemData);
    doc.save(`${item}_analysis_report.pdf`);
}

function handleDarkModeToggle() {
    document.body.classList.toggle('dark-mode');
    const currentItem = document.getElementById('payItem').value;
    if (currentItem) {
        currentItemData = getItemData(currentItem);
        if (!currentItemData) return;
        updateChartWithCurrentOptions();
    }
}

function updateChartWithCurrentOptions() {
    if (!currentItemData) return;

    try {
        updateChart(currentItemData, {
            selectedRegions,
            trendLineType,
            chartType,
            showPredictions,
            showDifferentials
        });
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

function selectItem(itemId) {
    try {
        currentItemData = getItemData(itemId);
        if (!currentItemData) {
            throw new Error('No data found for item');
        }

        // Update search input with selected item
        if (searchInput) {
            const selectedItem = Object.values(currentItemData)[0]?.[Object.keys(Object.values(currentItemData)[0])[0]];
            if (selectedItem) {
                searchInput.value = `${itemId} - ${selectedItem.description}`;
            }
        }

        // Clear search results
        if (searchResults) {
            searchResults.innerHTML = '';
        }

        updateChartWithCurrentOptions();
    } catch (error) {
        console.error('Error selecting item:', error);
        alert('Error loading item data');
    }
}

function generateCSV(itemData, regions) {
    const rows = [['Year', ...regions.map(r => r === 'statewide' ? 'Statewide' : `Region ${r}`)]];
    const years = new Set();
    
    // Collect all years
    regions.forEach(region => {
        if (itemData[region]) {
            Object.keys(itemData[region]).forEach(year => years.add(year));
        }
    });

    // Sort years
    const sortedYears = Array.from(years).sort();

    // Build data rows
    sortedYears.forEach(year => {
        const row = [year];
        regions.forEach(region => {
            const value = itemData[region]?.[year]?.price ?? '';
            row.push(value);
        });
        rows.push(row);
    });

    return rows.map(row => row.join(',')).join('\n');
}

function downloadCSV(csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'price_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
} 