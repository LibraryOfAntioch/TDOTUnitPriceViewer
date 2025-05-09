// analysis.js - Price analysis and prediction functions
import { calculateTrend } from './trends.js';

export function calculatePricePrediction(points, trendType) {
    if (points.length < 2) return null;

    const lastYear = Math.max(...points.map(p => p.x));
    const predictionYears = [lastYear + 1, lastYear + 2, lastYear + 3];
    
    let trendPoints;
    switch (trendType) {
        case 'linear':
            trendPoints = calculateLinearPrediction(points, predictionYears);
            break;
        case 'exponential':
            trendPoints = calculateExponentialPrediction(points, predictionYears);
            break;
        case 'polynomial':
            trendPoints = calculatePolynomialPrediction(points, predictionYears);
            break;
        case 'moving':
            trendPoints = calculateMovingAveragePrediction(points, predictionYears);
            break;
        default:
            return null;
    }

    return trendPoints.map((value, i) => ({
        year: predictionYears[i],
        value: value,
        lower: value * 0.9, // 10% confidence interval
        upper: value * 1.1
    }));
}

export function calculateRegionalDifferentials(itemData, selectedRegions) {
    if (!itemData.statewide || !selectedRegions.includes('statewide')) return null;

    const differentials = {};
    const statewideData = itemData.statewide;

    selectedRegions.forEach(region => {
        if (region === 'statewide' || !itemData[region]) return;

        differentials[region] = {};
        Object.entries(itemData[region]).forEach(([year, data]) => {
            if (statewideData[year]) {
                const statePrice = statewideData[year].price;
                const regionPrice = data.price;
                differentials[region][year] = ((regionPrice - statePrice) / statePrice) * 100;
            }
        });
    });

    return differentials;
}

export function calculateVolatility(points) {
    const returns = [];
    for (let i = 1; i < points.length; i++) {
        const ret = (points[i].y - points[i-1].y) / points[i-1].y;
        returns.push(ret);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
}

export function generateReport(itemData, predictions, differentials) {
    const report = {
        item: itemData.itemNumber,
        description: itemData.description,
        unit: itemData.unit,
        lastUpdated: new Date().toISOString(),
        predictions: predictions,
        regionalDifferentials: differentials,
        summary: {
            currentPrice: itemData.currentPrice,
            priceChange: calculatePriceChange(itemData),
            volatility: calculateVolatility(itemData.points),
            regionalVariation: calculateRegionalVariation(differentials)
        }
    };
    return report;
}

function calculatePriceChange(data) {
    const points = Object.values(data)
        .flatMap(region => Object.entries(region)
            .map(([year, val]) => ({ x: Number(year), y: val.price })))
        .sort((a, b) => a.x - b.x);
    
    if (points.length < 2) return 0;
    return ((points[points.length - 1].y - points[0].y) / points[0].y) * 100;
}

function calculateRegionalVariation(differentials) {
    const variations = Object.values(differentials)
        .flatMap(region => Object.values(region));
    if (variations.length === 0) return 0;
    
    const mean = variations.reduce((a, b) => a + b, 0) / variations.length;
    const variance = variations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / variations.length;
    return Math.sqrt(variance);
}

function calculateLinearPrediction(points, predictionYears) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return predictionYears.map(x => slope * x + intercept);
}

function calculateExponentialPrediction(points, predictionYears) {
    const xs = points.map(p => p.x);
    const lnY = points.map(p => Math.log(p.y));
    
    const linearPred = calculateLinearPrediction(
        xs.map((x, i) => ({ x, y: lnY[i] })),
        predictionYears
    );

    return linearPred.map(y => Math.exp(y));
}

function calculatePolynomialPrediction(points, predictionYears) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    // Quadratic regression
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const sumX3 = xs.reduce((a, x) => a + x * x * x, 0);
    const sumX4 = xs.reduce((a, x) => a + x * x * x * x, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2Y = xs.reduce((acc, x, i) => acc + x * x * ys[i], 0);

    const d = n * sumX2 * sumX4 + 2 * sumX * sumX2 * sumX3 - sumX2 * sumX2 * sumX2 - sumX * sumX * sumX4 - n * sumX3 * sumX3;
    const a = (n * sumX2 * sumX2Y + sumX * sumX3 * sumY + sumX2 * sumX * sumXY - sumX2 * sumX2 * sumY - n * sumX3 * sumXY - sumX * sumX * sumX2Y) / d;
    const b = (n * sumX4 * sumXY + sumX2 * sumX2 * sumY + sumX * sumX3 * sumX2Y - sumX2 * sumX2 * sumXY - n * sumX3 * sumX2Y - sumX * sumX4 * sumY) / d;
    const c = (sumX2 * sumX4 * sumY + sumX * sumX3 * sumXY + sumX2 * sumX2 * sumX2Y - sumX2 * sumX3 * sumXY - sumX * sumX4 * sumX2Y - sumX2 * sumX2 * sumX2Y) / d;

    return predictionYears.map(x => a * x * x + b * x + c);
}

function calculateMovingAveragePrediction(points, predictionYears) {
    const window = 3;
    const lastPoints = points.slice(-window);
    const avgValue = lastPoints.reduce((sum, p) => sum + p.y, 0) / lastPoints.length;
    return predictionYears.map(() => avgValue);
} 