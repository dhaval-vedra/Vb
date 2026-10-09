// js/mockDataGenerator.js

import { updateDataAndUI } from '../../store/DataHandler.ts';
import { plotAll } from '../charts/charts.ts';
import { populateColumnDragLists } from '../charts/chartcolomdrag.js';
import { showMessage } from '../core/utils.ts';

let mockIntervalId = null;

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Pune", "Hyderabad", "Ahmedabad", "Jaipur", "Lucknow"];
const DEPARTMENTS = ["Marketing", "Sales", "Engineering", "HR", "R&D", "Operations", "Finance", "Customer Support"];
const EMPLOYEES = ["Rahul Sharma", "Priya Patel", "Amit Verma", "Sneha Reddy", "Rohan Gupta", "Ananya Sen", "Rajesh Kumar", "Neha Singh", "Vikram Malhotra", "Pooja Joshi"];
const SENSORS = ["Sensor-Alpha", "Sensor-Beta", "Sensor-Gamma", "Sensor-Delta"];
const COINS = ["BTC (Bitcoin)", "ETH (Ethereum)", "SOL (Solana)", "ADA (Cardano)", "DOT (Polkadot)", "XRP (Ripple)", "DOGE (Dogecoin)"];

export function generateMockData(theme, rowCount) {
    const data = [];
    const count = parseInt(rowCount, 10) || 15;
    
    for (let i = 0; i < count; i++) {
        const item = {};
        
        if (theme === 'sales') {
            item["city"] = CITIES[i % CITIES.length];
            item["sales"] = Math.floor(Math.random() * 120000) + 15000;
            item["orders"] = Math.floor(Math.random() * 1000) + 80;
            item["profit"] = Math.floor(item["sales"] * (Math.random() * 0.15 + 0.05));
            // date within June 2026
            const day = String((i % 28) + 1).padStart(2, '0');
            item["date"] = `2026-06-${day}`;
            
        } else if (theme === 'finance') {
            item["department"] = DEPARTMENTS[i % DEPARTMENTS.length];
            item["budget"] = Math.floor(Math.random() * 400000) + 100000;
            item["expenses"] = Math.floor(item["budget"] * (Math.random() * 0.4 + 0.5));
            item["revenue"] = Math.floor(item["budget"] * (Math.random() * 0.8 + 0.8));
            item["quarter"] = `Q${(i % 4) + 1}`;
            
        } else if (theme === 'hr') {
            item["employee"] = EMPLOYEES[i % EMPLOYEES.length];
            item["rating"] = parseFloat((Math.random() * 2.5 + 2.5).toFixed(1)); // 2.5 to 5.0
            item["department"] = DEPARTMENTS[i % DEPARTMENTS.length];
            item["salary"] = Math.floor(Math.random() * 150000) + 30000;
            item["tenure_months"] = Math.floor(Math.random() * 54) + 6;
            
        } else if (theme === 'iot') {
            item["sensor_id"] = SENSORS[i % SENSORS.length];
            item["temperature"] = parseFloat((Math.random() * 18 + 18).toFixed(1)); // 18C to 36C
            item["humidity"] = Math.floor(Math.random() * 50) + 35; // 35% to 85%
            item["co2_level"] = Math.floor(Math.random() * 500) + 380; // 380ppm to 880ppm
            // time steps
            const mins = String(i * 10 % 60).padStart(2, '0');
            const hrs = String(Math.floor(i * 10 / 60) % 24).padStart(2, '0');
            item["timestamp"] = `${hrs}:${mins}`;
            
        } else if (theme === 'stock') {
            item["coin"] = COINS[i % COINS.length];
            const basePrice = i === 0 ? 65000 : (i === 1 ? 3500 : (i === 2 ? 140 : 1));
            item["price_usd"] = parseFloat((basePrice * (Math.random() * 0.2 + 0.9)).toFixed(2));
            item["volume_24h"] = Math.floor(Math.random() * 9000000) + 500000;
            item["market_cap"] = Math.floor(item["price_usd"] * (Math.random() * 1000000 + 10000000));
            item["daily_change_pct"] = parseFloat((Math.random() * 20 - 10).toFixed(2)); // -10% to +10%
        }
        
        data.push(item);
    }
    
    return data;
}

export function triggerMockDataUpdate(theme, rowCount) {
    const mockData = generateMockData(theme, rowCount);
    
    if (mockData && mockData.length > 0) {
        // Extract headers from first object keys
        const genHeaders = Object.keys(mockData[0]);
        
        // Update DataHandler store and re-render data table / visuals
        updateDataAndUI(mockData);
        populateColumnDragLists(genHeaders);
        plotAll();
    }
}

export function startMockAutoUpdate(theme, rowCount, intervalMs = 10000) {
    stopMockAutoUpdate();
    
    // First trigger immediately
    triggerMockDataUpdate(theme, rowCount);
    showMessage(`ऑटो-मॉक सिमुलेशन शुरू: डेटा हर ${intervalMs / 1000} सेकंड में अपडेट होगा।`, "success");
    
    mockIntervalId = setInterval(() => {
        triggerMockDataUpdate(theme, rowCount);
    }, intervalMs);
}

export function stopMockAutoUpdate() {
    if (mockIntervalId) {
        clearInterval(mockIntervalId);
        mockIntervalId = null;
        showMessage("ऑटो-मॉक सिमुलेशन बंद किया गया।", "info");
    }
}
