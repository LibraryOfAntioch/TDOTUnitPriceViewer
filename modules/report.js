// report.js - PDF report generation

export function generatePDFReport(itemData, predictions, differentials) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TDOT Unit Price Analysis Report', pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Add item details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Item Number: ${itemData.itemNumber}`, margin, y);
    y += 10;
    doc.text(`Description: ${itemData.description}`, margin, y);
    y += 10;
    doc.text(`Unit: ${itemData.unit}`, margin, y);
    y += 10;
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 20;

    // Add price summary
    doc.setFont('helvetica', 'bold');
    doc.text('Price Summary', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
        ['Current Price', formatCurrency(itemData.currentPrice)],
        ['Price Change', `${itemData.priceChange.toFixed(2)}%`],
        ['Volatility', `${(itemData.volatility * 100).toFixed(2)}%`],
        ['Regional Variation', `${itemData.regionalVariation.toFixed(2)}%`]
    ];

    doc.autoTable({
        startY: y,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 }
    });
    y = doc.lastAutoTable.finalY + 10;

    // Add predictions if available
    if (predictions) {
        // Add new page for predictions and methodology
        doc.addPage();
        y = margin;

        doc.setFont('helvetica', 'bold');
        doc.text('Price Predictions and Methodology', margin, y);
        y += 15;

        // Add methodology explanation
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Forecasting Methodology:', margin, y);
        y += 10;
        doc.setFont('helvetica', 'normal');

        const methodologyText = [
            "The price predictions are calculated using multiple forecasting methods to provide comprehensive insights:",
            "",
            "1. Linear Regression:",
            "   • Formula: y = mx + b",
            "   • Where: y is predicted price, x is year, m is slope, b is intercept",
            "   • Slope (m) = (n∑xy - ∑x∑y) / (n∑x² - (∑x)²)",
            "   • Intercept (b) = (∑y - m∑x) / n",
            "",
            "2. Exponential Growth:",
            "   • Formula: y = ae^(bx)",
            "   • Linearized as: ln(y) = ln(a) + bx",
            "   • Fitted using linear regression on log-transformed data",
            "",
            "3. Polynomial (Quadratic):",
            "   • Formula: y = ax² + bx + c",
            "   • Uses matrix solution for coefficients a, b, c",
            "   • Accounts for non-linear trends and inflection points",
            "",
            "4. Moving Average:",
            "   • Formula: y_t = (y_(t-1) + y_t + y_(t+1)) / 3",
            "   • Uses 3-year window for smoothing",
            "",
            "Confidence Intervals:",
            "• Upper and lower bounds represent ±10% confidence interval",
            "• Based on historical price volatility patterns",
            "",
            "Volatility Calculation:",
            "• Standard deviation of year-over-year price returns",
            "• Formula: σ = √(∑(r - μ)² / n)",
            "• Where r = year-over-year returns, μ = mean return"
        ];

        methodologyText.forEach(line => {
            if (y + 5 > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 5;
        });

        y += 10;

        // Add prediction results table
        doc.setFont('helvetica', 'bold');
        doc.text('Prediction Results:', margin, y);
        y += 10;

        const predictionData = predictions.map(p => [
            p.year.toString(),
            formatCurrency(p.value),
            formatCurrency(p.lower),
            formatCurrency(p.upper)
        ]);

        doc.autoTable({
            startY: y,
            head: [['Year', 'Predicted Price', 'Lower Bound', 'Upper Bound']],
            body: predictionData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 10 }
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    // Add regional differentials if available
    if (differentials) {
        // Add new page if needed
        if (y + 100 > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Regional Price Differentials', margin, y);
        y += 10;

        // Add methodology for differentials
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Regional Differential Calculation:', margin, y);
        y += 10;

        const diffMethodology = [
            "• Calculated as percentage difference from statewide average",
            "• Formula: ((Regional Price - Statewide Price) / Statewide Price) × 100",
            "• Positive values indicate prices above statewide average",
            "• Negative values indicate prices below statewide average",
            "",
            "Regional Variation Index:",
            "• Standard deviation of regional differentials",
            "• Measures overall price dispersion across regions"
        ];

        diffMethodology.forEach(line => {
            doc.text(line, margin, y);
            y += 5;
        });

        y += 10;

        const years = Object.keys(differentials[Object.keys(differentials)[0]]);
        const diffData = Object.entries(differentials).map(([region, data]) => {
            const row = [region];
            years.forEach(year => {
                row.push(data[year] ? `${data[year].toFixed(2)}%` : '-');
            });
            return row;
        });

        doc.autoTable({
            startY: y,
            head: [['Region', ...years]],
            body: diffData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 10 }
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    // Add chart image if available
    const chartCanvas = document.getElementById('chart');
    if (chartCanvas) {
        const chartImage = chartCanvas.toDataURL('image/png');
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (chartCanvas.height * imgWidth) / chartCanvas.width;
        
        // Add new page if needed
        if (y + imgHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }

        doc.addImage(chartImage, 'PNG', margin, y, imgWidth, imgHeight);
    }

    // Add footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    return doc;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
} 