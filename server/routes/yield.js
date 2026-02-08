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

/**
 * GET /api/yield/rankings
 * Get district rankings by yield
 */
router.get('/rankings', (req, res) => {
  try {
    const { season = 'Maha', year = 2026 } = req.query;
    
    const rankings = [
      {
        rank: 1,
        district: 'Polonnaruwa',
        average_yield: 4.8,
        area_cultured_ha: 45000,
        production_tons: 216000,
        growth_percent: 12.5
      },
      {
        rank: 2,
        district: 'Anuradhapura',
        average_yield: 4.5,
        area_cultured_ha: 38000,
        production_tons: 171000,
        growth_percent: 8.3
      },
      {
        rank: 3,
        district: 'Kurunegala',
        average_yield: 4.2,
        area_cultured_ha: 35000,
        production_tons: 147000,
        growth_percent: 5.2
      },
      {
        rank: 4,
        district: 'Ratnapura',
        average_yield: 3.8,
        area_cultured_ha: 28000,
        production_tons: 106400,
        growth_percent: 3.1
      },
      {
        rank: 5,
        district: 'Matara',
        average_yield: 3.5,
        area_cultured_ha: 22000,
        production_tons: 77000,
        growth_percent: 1.5
      }
    ];
    
    res.json({
      success: true,
      season,
      year: parseInt(year),
      rankings,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/yield/trends
 * Get yield trends over years
 */
router.get('/trends', (req, res) => {
  try {
    const { district = 'Anuradhapura', season = 'Maha' } = req.query;
    
    const trends = [
      { year: 2022, yield_tons_per_ha: 3.8, area_ha: 35000, production_tons: 133000 },
      { year: 2023, yield_tons_per_ha: 4.0, area_ha: 36000, production_tons: 144000 },
      { year: 2024, yield_tons_per_ha: 4.3, area_ha: 37000, production_tons: 159100 },
      { year: 2025, yield_tons_per_ha: 4.5, area_ha: 38000, production_tons: 171000 },
      { year: 2026, yield_tons_per_ha: 4.6, area_ha: 39000, production_tons: 179400 }
    ];
    
    res.json({
      success: true,
      district,
      season,
      trends,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
