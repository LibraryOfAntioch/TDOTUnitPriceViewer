// data.js - Data loading and management
import { updateChart } from './chart.js';

let trendsData = null;

export async function loadData() {
    try {
        const response = await fetch('unit_price_trends_with_price.json');
        trendsData = await response.json();
        
        // Normalize region names in the data
        Object.keys(trendsData).forEach(item => {
            const itemData = trendsData[item];
            if (itemData.STATE) {
                itemData.statewide = itemData.STATE;
                delete itemData.STATE;
            }
        });
        
        return trendsData;
    } catch (error) {
        console.error("Failed to load data", error);
        throw error;
    }
}

export function searchItems(query) {
    if (!trendsData) return [];
    
    const searchTerm = query.toLowerCase();
    return Object.entries(trendsData)
        .filter(([id, data]) => {
            const description = Object.values(data)[0]?.[Object.keys(Object.values(data)[0])[0]]?.description || '';
            return id.toLowerCase().includes(searchTerm) || 
                   description.toLowerCase().includes(searchTerm);
        })
        .map(([id, data]) => ({
            id,
            description: Object.values(data)[0]?.[Object.keys(Object.values(data)[0])[0]]?.description || ''
        }));
}

export function updatePayItemList(searchTerm = '') {
    const itemSelect = document.getElementById('payItem');
    const showOldItems = document.getElementById('showOldItems').checked;
    const currentValue = itemSelect.value;
    
    itemSelect.innerHTML = '<option value="">-- Select Item --</option>';
    
    // Convert search term to lowercase for case-insensitive comparison
    const searchTermLower = searchTerm.toLowerCase();
    
    Object.keys(trendsData).sort().forEach(item => {
        const itemData = trendsData[item];
        // Check both regular regions and statewide data
        const desc = itemData && (itemData.statewide || Object.values(itemData)[0]);
        const description = desc ? Object.values(desc)[0]?.description || '' : '';
        
        // Check if the item has data from 2020 or later
        const hasRecentData = Object.entries(itemData).some(([region, regionData]) => 
            Object.keys(regionData).some(year => Number(year) >= 2020)
        );
        
        // Check if the item matches the search term (case insensitive)
        const matchesSearch = searchTermLower === '' || 
            item.toLowerCase().includes(searchTermLower) ||
            description.toLowerCase().includes(searchTermLower);
        
        if ((showOldItems || hasRecentData) && matchesSearch) {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = `${item} — ${description}`;
            itemSelect.appendChild(option);
        }
    });
    
    // Restore the previously selected value if it's still available
    if (currentValue && itemSelect.querySelector(`option[value="${currentValue}"]`)) {
        itemSelect.value = currentValue;
    }
}

export function getItemData(itemNum) {
    return trendsData[itemNum];
}

export function exportToCSV(itemNum) {
    const itemData = trendsData[itemNum];
    let csv = 'Year,Region,Unit Price\n';
    for (const [region, regionData] of Object.entries(itemData)) {
        for (const [year, val] of Object.entries(regionData)) {
            if (val.price) {
                const regionName = region === 'statewide' ? 'Statewide' : `Region ${region}`;
                csv += `${year},${regionName},${val.price}\n`;
            }
        }
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${itemNum}_unit_price.csv`;
    link.click();
} 