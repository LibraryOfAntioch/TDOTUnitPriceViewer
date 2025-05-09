// trends.js - Trend calculation functions
export function calculateTrend(points, type) {
    if (points.length < 2) return [];

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    switch (type) {
        case 'linear':
            return calculateLinearTrend(xs, ys);
        case 'exponential':
            return calculateExponentialTrend(xs, ys);
        case 'polynomial':
            return calculatePolynomialTrend(xs, ys);
        case 'moving':
            return calculateMovingAverage(points);
        default:
            return [];
    }
}

function calculateLinearTrend(xs, ys) {
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return xs.map(x => ({
        x,
        y: slope * x + intercept
    }));
}

function calculateExponentialTrend(xs, ys) {
    const lnY = ys.map(y => Math.log(y));
    const linear = calculateLinearTrend(xs, lnY);
    return linear.map(point => ({
        x: point.x,
        y: Math.exp(point.y)
    }));
}

function calculatePolynomialTrend(xs, ys) {
    // Simple quadratic fit
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

    return xs.map(x => ({
        x,
        y: a * x * x + b * x + c
    }));
}

function calculateMovingAverage(points, window = 3) {
    const result = [];
    for (let i = 0; i < points.length; i++) {
        const start = Math.max(0, i - Math.floor(window / 2));
        const end = Math.min(points.length, i + Math.floor(window / 2) + 1);
        const values = points.slice(start, end).map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        result.push({
            x: points[i].x,
            y: avg
        });
    }
    return result;
} 