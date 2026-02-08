const express = require('express');
const router = express.Router();

// Mock data for yield predictions
const yieldData = {
  'Anuradhapura': {
    'Maha': { baseYield: 4.5, variance: 0.8 },
    'Yala': { baseYield: 3.2, variance: 0.6 }
  },
  'Kurunegala': {
    'Maha': { baseYield: 4.2, variance: 0.7 },
    'Yala': { baseYield: 3.0, variance: 0.5 }
  },
  'Polonnaruwa': {
    'Maha': { baseYield: 4.8, variance: 0.9 },
    'Yala': { baseYield: 3.5, variance: 0.7 }
  }
};

/**
 * GET /api/yield/predict
 * Predict yield based on district, season, area, etc.
 */
router.get('/predict', (req, res) => {
  try {
    const { district = 'Anuradhapura', season = 'Maha', year = 2026, area_ha = 1 } = req.query;
    
    const districtData = yieldData[district] || yieldData['Anuradhapura'];
    const seasonData = districtData[season] || districtData['Maha'];
    
    const baseYield = seasonData.baseYield;
    const variance = seasonData.variance;
    
    // Simple yield calculation
    const predictedYield = (baseYield + (Math.random() * variance - variance / 2)) * area_ha;
    
    res.json({
      success: true,
      district,
      season,
      year: parseInt(year),
      area_ha: parseFloat(area_ha),
      predicted_yield: parseFloat(predictedYield.toFixed(2)),
      unit: 'metric tons',
      confidence: 0.85,
      factors: {
        rainfall: 'Good',
        soil: 'Fertile',
        temperature: 'Optimal'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/yield/profit
 * Calculate profit based on yield and market prices
 */
router.get('/profit', (req, res) => {
  try {
    const { district = 'Anuradhapura', season = 'Maha', year = 2026, area_ha = 1, cost_per_ha = 50000, price_per_kg = 35 } = req.query;
    
    const districtData = yieldData[district] || yieldData['Anuradhapura'];
    const seasonData = districtData[season] || districtData['Maha'];
    
    const baseYield = seasonData.baseYield;
    const variance = seasonData.variance;
    
    const predictedYield = (baseYield + (Math.random() * variance - variance / 2)) * area_ha;
    const totalCost = parseFloat(cost_per_ha) * parseFloat(area_ha);
    const totalRevenue = predictedYield * 1000 * parseFloat(price_per_kg); // convert tons to kg
    const profit = totalRevenue - totalCost;
    const profitMargin = ((profit / totalRevenue) * 100) || 0;
    
    res.json({
      success: true,
      district,
      season,
      year: parseInt(year),
      area_ha: parseFloat(area_ha),
      predicted_yield_tons: parseFloat(predictedYield.toFixed(2)),
      cost_per_ha: parseFloat(cost_per_ha),
      total_cost: parseFloat(totalCost.toFixed(2)),
      price_per_kg: parseFloat(price_per_kg),
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      net_profit: parseFloat(profit.toFixed(2)),
      profit_margin_percent: parseFloat(profitMargin.toFixed(2))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/yield/warning
 * Get early warning for weather/pest risks
 */
router.get('/warning', (req, res) => {
  try {
    const { district = 'Anuradhapura', season = 'Maha', year = 2026 } = req.query;
    
    const warnings = [
      {
        type: 'Pest',
        severity: 'Medium',
        description: 'Rice Hispa detected in nearby areas',
        recommendation: 'Monitor crops closely and consider preventive spraying'
      },
      {
        type: 'Weather',
        severity: 'Low',
        description: 'Monsoon onset may be delayed by 2-3 days',
        recommendation: 'Plan irrigation accordingly'
      }
    ];
    
    res.json({
      success: true,
      district,
      season,
      year: parseInt(year),
      warnings: warnings,
      overall_risk: 'Medium'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
