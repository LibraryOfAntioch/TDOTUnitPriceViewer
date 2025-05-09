// chart.js - Chart configuration and rendering
import { calculateTrend } from './trends.js';
import { calculatePricePrediction, calculateRegionalDifferentials } from './analysis.js';

const colorScheme = {
    '1': 'rgba(59, 130, 246, 0.8)',
    '2': 'rgba(16, 185, 129, 0.8)',
    '3': 'rgba(245, 158, 11, 0.8)',
    '4': 'rgba(239, 68, 68, 0.8)',
    'statewide': 'rgba(139, 92, 246, 0.8)'
};

export let currentChart = null;

export function initializeChart() {
    const canvas = document.getElementById('chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: getChartOptions()
    });
}

export function updateChart(itemData, options) {
    if (!itemData) return;

    const {
        selectedRegions,
        trendLineType,
        chartType,
        showPredictions,
        showDifferentials
    } = options;

    const canvas = document.getElementById('chart');
    if (!canvas) return;

    // Clear existing chart
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prepare data
    const datasets = [];
    const colors = {
        '1': '#2563eb',
        '2': '#16a34a',
        '3': '#dc2626',
        '4': '#9333ea',
        'statewide': '#000000'
    };

    try {
        // Get all years for x-axis
        const allYears = Object.entries(itemData)
            .filter(([region]) => selectedRegions.includes(region))
            .flatMap(([region, data]) => Object.keys(data).map(Number))
            .filter(year => !isNaN(year));
        
        if (allYears.length === 0) return;

        const minYear = Math.min(...allYears);
        const maxYear = Math.max(...allYears);

        // Create datasets for each selected region
        selectedRegions.forEach(region => {
            if (!itemData[region]) return;

            const regionData = itemData[region];
            const points = Object.entries(regionData)
                .map(([year, data]) => ({
                    x: Number(year),
                    y: data.price
                }))
                .sort((a, b) => a.x - b.x);

            if (points.length === 0) return;

            // Add main dataset
            datasets.push({
                label: region === 'statewide' ? 'Statewide' : `Region ${region}`,
                data: points,
                borderColor: colors[region],
                backgroundColor: colors[region] + '20',
                fill: chartType === 'bar',
                type: chartType
            });

            // Add trend line if selected
            if (trendLineType !== 'none' && points.length > 1) {
                const trendPoints = calculateTrendLine(points, trendLineType);
                if (trendPoints && trendPoints.length > 0) {
                    datasets.push({
                        label: `${region === 'statewide' ? 'Statewide' : `Region ${region}`} Trend`,
                        data: trendPoints,
                        borderColor: colors[region],
                        borderDash: [5, 5],
                        fill: false,
                        type: 'line'
                    });

                    // Add predictions if enabled
                    if (showPredictions) {
                        const predictions = calculatePricePrediction(points, trendLineType);
                        if (predictions && predictions.length > 0) {
                            datasets.push({
                                label: `${region === 'statewide' ? 'Statewide' : `Region ${region}`} Prediction`,
                                data: predictions.map(p => ({ x: p.year, y: p.value })),
                                borderColor: colors[region],
                                backgroundColor: colors[region] + '20',
                                fill: true,
                                type: 'line'
                            });
                        }
                    }
                }
            }
        });

        // Add regional differentials if enabled
        if (showDifferentials) {
            const differentials = calculateRegionalDifferentials(itemData, selectedRegions);
            if (differentials) {
                Object.entries(differentials).forEach(([region, data]) => {
                    const points = Object.entries(data)
                        .map(([year, diff]) => ({
                            x: Number(year),
                            y: diff
                        }))
                        .sort((a, b) => a.x - b.x);

                    if (points.length > 0) {
                        datasets.push({
                            label: `Region ${region} Differential`,
                            data: points,
                            borderColor: colors[region],
                            borderDash: [2, 2],
                            fill: false,
                            type: 'line',
                            yAxisID: 'differential'
                        });
                    }
                });
            }
        }

        // Create chart
        currentChart = new Chart(ctx, {
            type: chartType,
            data: {
                datasets
            },
            options: {
                responsive: true,
                interaction: {
                    intersect: true,
                    mode: 'point'
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: minYear - 0,
                        max: 2028,
                        title: {
                            display: true,
                            text: 'Year'
                        },
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            borderColor: 'rgba(0, 0, 0, 0.2)'
                        },
                        ticks: {
                            color: 'rgba(0, 0, 0, 0.7)'
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'Price ($)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)',
                            borderColor: 'rgba(0, 0, 0, 0.2)'
                        },
                        ticks: {
                            color: 'rgba(0, 0, 0, 0.7)'
                        }
                    },
                    ...(showDifferentials ? {
                        differential: {
                            type: 'linear',
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Price Differential (%)'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)',
                                borderColor: 'rgba(0, 0, 0, 0.2)'
                            },
                            ticks: {
                                color: 'rgba(0, 0, 0, 0.7)'
                            }
                        }
                    } : {})
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Price Trends for Item ${Object.values(itemData)[0]?.[Object.keys(Object.values(itemData)[0])[0]]?.description || ''}`,
                        color: 'rgba(0, 0, 0, 0.9)'
                    },
                    legend: {
                        labels: {
                            color: 'rgba(0, 0, 0, 0.9)'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: 'rgba(0, 0, 0, 0.9)',
                        bodyColor: 'rgba(0, 0, 0, 0.9)',
                        borderColor: 'rgba(0, 0, 0, 0.2)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                return `Year: ${context[0].parsed.x}`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                return `${label}: $${value.toFixed(2)}`;
                            }
                        },
                        filter: function(tooltipItem) {
                            // Only show the tooltip for the specific point being hovered
                            return tooltipItem.datasetIndex === tooltipItem.dataIndex;
                        }
                    }
                }
            }
        });

        // Update unit notice
        updateUnitNotice(itemData);

    } catch (error) {
        console.error('Error updating chart:', error);
        // Create an empty chart to avoid null reference
        currentChart = new Chart(ctx, {
            type: 'line',
            data: { datasets: [] },
            options: getChartOptions()
        });
    }
}

// Export getChartOptions for dark mode toggle
export function getChartOptions() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: textColor,
                    font: {
                        weight: isDarkMode ? '500' : '400'
                    }
                }
            },
            title: {
                display: true,
                color: textColor,
                font: {
                    weight: isDarkMode ? '600' : '500'
                }
            },
            tooltip: {
                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                titleColor: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.9)',
                bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.9)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                type: 'linear',
                min: 2000,
                max: 2028,
                grid: {
                    color: gridColor,
                    borderColor: textColor
                },
                ticks: {
                    color: textColor,
                    font: {
                        weight: isDarkMode ? '500' : '400'
                    },
                    stepSize: 1
                },
                title: {
                    display: true,
                    text: 'Year',
                    color: textColor,
                    font: {
                        weight: isDarkMode ? '600' : '500'
                    }
                }
            },
            y: {
                grid: {
                    color: gridColor,
                    borderColor: textColor
                },
                ticks: {
                    color: textColor,
                    font: {
                        weight: isDarkMode ? '500' : '400'
                    }
                },
                title: {
                    display: true,
                    text: 'Price ($)',
                    color: textColor,
                    font: {
                        weight: isDarkMode ? '600' : '500'
                    }
                }
            }
        }
    };
}

function calculateTrendLine(points, type) {
    if (points.length < 2) return [];
    return calculateTrend(points, type);
}

function updateUnitNotice(itemData) {
    const unitNotice = document.querySelector('.unit-notice');
    if (!unitNotice) return;

    const unit = Object.values(itemData)[0]?.[Object.keys(Object.values(itemData)[0])[0]]?.unit || '';
    unitNotice.textContent = `Unit: ${unit}`;
} 