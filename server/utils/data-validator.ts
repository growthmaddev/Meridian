import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface ValidationResult {
  passed: boolean;
  category: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  details?: any;
}

export class DataValidator {
  async validateDataset(
    filePath: string, 
    columns: string[], 
    sampleData: any[]
  ): Promise<{
    isValid: boolean;
    score: number; // 0-100
    results: ValidationResult[];
    recommendations: string[];
    detectedColumns?: {
      dateColumn: string | null;
      spendColumns: string[];
      gqvColumns: string[];
      populationColumn: string | null;
    };
  }> {
    const results: ValidationResult[] = [];
    const recommendations: string[] = [];
    
    // Read the full dataset
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rawData = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    // 1. Date continuity check
    const dateColumn = this.detectDateColumn(columns, sampleData);
    if (dateColumn) {
      const dateResult = this.checkDateContinuity(rawData, dateColumn);
      results.push(dateResult);
      
      if (!dateResult.passed && dateResult.severity === 'warning') {
        recommendations.push(`Check for missing dates in ${dateColumn} column`);
      }
    } else {
      results.push({
        passed: false,
        category: 'Date Column',
        message: 'No date column detected',
        severity: 'error'
      });
      recommendations.push('Dataset must include a date column');
    }
    
    // 2. Numeric validation for spend/KPI columns
    const numericColumns = this.detectNumericColumns(columns, sampleData);
    const numericResults = this.validateNumericColumns(rawData, numericColumns);
    results.push(...numericResults);
    
    // Add recommendations for non-numeric columns
    numericResults
      .filter(r => !r.passed && r.severity === 'error')
      .forEach(r => {
        recommendations.push(`Column ${r.details.column} contains non-numeric values`);
      });
    
    // 3. Outlier detection
    const outlierResults = this.detectOutliers(rawData, numericColumns);
    results.push(...outlierResults);
    
    // Add recommendations for outliers
    outlierResults
      .filter(r => !r.passed && r.severity === 'warning')
      .forEach(r => {
        recommendations.push(`Review outliers in ${r.details.column} column`);
      });
    
    // 4. Missing values check
    const missingResults = this.checkMissingValues(rawData, columns);
    results.push(...missingResults);
    
    // Add recommendations for missing values
    missingResults
      .filter(r => !r.passed)
      .forEach(r => {
        recommendations.push(`Consider handling missing values in ${r.details.column} column`);
      });
    
    // 5. Negative values check (for spend columns)
    const spendColumns = this.detectSpendColumns(columns);
    const negativeResults = this.checkNegativeValues(rawData, spendColumns);
    results.push(...negativeResults);
    
    // Add recommendations for negative values
    negativeResults
      .filter(r => !r.passed && r.severity === 'error')
      .forEach(r => {
        recommendations.push(`Fix negative values in ${r.details.column} column`);
      });

    // 5.5. Media pairs validation (spend and impressions)
    const mediaValidation = this.validateMediaPairs(columns);
    results.push(...mediaValidation);
    
    // Add recommendations for missing impression columns
    mediaValidation
      .filter(r => !r.passed && r.severity === 'error')
      .forEach(r => {
        recommendations.push(`Add impression data for ${r.details.spendColumn}`);
      });
    
    // 6. GQV column detection and validation
    const gqvColumns = this.detectGQVColumns(columns);
    if (gqvColumns.length > 0) {
      // Check for negative values in GQV columns
      const gqvNegativeResults = this.checkNegativeValues(rawData, gqvColumns);
      results.push(...gqvNegativeResults.map(result => ({
        ...result,
        category: 'GQV Validation',
      })));
      
      // Add recommendations for negative values in GQV columns
      gqvNegativeResults
        .filter(r => !r.passed && r.severity === 'error')
        .forEach(r => {
          recommendations.push(`Fix negative values in GQV column ${r.details.column}`);
        });
      
      // Add a validation result to indicate GQV columns were found
      results.push({
        passed: true,
        category: 'GQV Detection',
        message: `Found ${gqvColumns.length} Google query volume columns`,
        severity: 'info',
        details: { columns: gqvColumns }
      });
    } else {
      // Add a validation result to indicate no GQV columns were found
      results.push({
        passed: true,
        category: 'GQV Detection',
        message: 'No Google query volume columns detected',
        severity: 'info'
      });
    }
    
    // 7. Population column detection
    const populationColumn = this.detectPopulationColumn(columns);
    if (populationColumn) {
      results.push({
        passed: true,
        category: 'Population Detection',
        message: `Found population column: ${populationColumn}`,
        severity: 'info',
        details: { column: populationColumn }
      });
    }
    
    // 8. Minimum data points check
    const dataPointsResult = this.checkMinimumDataPoints(rawData);
    results.push(dataPointsResult);
    
    if (!dataPointsResult.passed) {
      recommendations.push('For reliable MMM results, provide at least 52 weeks of data');
    }
    
    // Calculate overall score based on validation results
    const score = this.calculateValidationScore(results);
    
    // Determine if the dataset is valid (no error-level failures)
    const isValid = !results.some(r => !r.passed && r.severity === 'error');
    
    // Add general recommendation based on score
    if (score >= 90) {
      recommendations.push('Data quality is excellent for MMM analysis');
    } else if (score >= 70) {
      recommendations.push('Data quality is good for MMM analysis');
    } else if (score >= 50) {
      recommendations.push('Data quality is acceptable but could be improved');
    } else {
      recommendations.push('Data quality needs significant improvement for reliable MMM results');
    }
    
    // Include detected columns in the result
    const detectedColumns = {
      dateColumn,
      spendColumns,
      gqvColumns,
      populationColumn
    };
    
    return { 
      isValid, 
      score, 
      results, 
      recommendations,
      detectedColumns
    };
  }
  
  private detectDateColumn(columns: string[], sampleData: any[]): string | null {
    // Check for common date column names
    const dateColumnHints = ['date', 'week', 'day', 'month', 'year', 'time'];
    
    // First try to find columns with standard date column names
    const dateColumn = columns.find(col => 
      dateColumnHints.some(hint => col.toLowerCase().includes(hint))
    );
    
    if (dateColumn) return dateColumn;
    
    // If no standard name found, try to detect date format in columns
    for (const col of columns) {
      const values = sampleData.map(row => row[col]);
      const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;
      
      if (values.some(v => datePattern.test(String(v)))) {
        return col;
      }
    }
    
    return null;
  }
  
  private detectNumericColumns(columns: string[], sampleData: any[]): string[] {
    return columns.filter(col => {
      const values = sampleData.map(row => row[col]);
      return values.some(v => !isNaN(parseFloat(v)));
    });
  }
  
  private detectSpendColumns(columns: string[]): string[] {
    const spendHints = ['spend', 'cost', 'budget', 'investment', 'media'];
    return columns.filter(col => 
      spendHints.some(hint => col.toLowerCase().includes(hint))
    );
  }
  
  private detectGQVColumns(columns: string[]): string[] {
    const gqvHints = ['query', 'search', 'gqv', 'google_query'];
    return columns.filter(col => 
      gqvHints.some(hint => col.toLowerCase().includes(hint))
    );
  }
  
  private detectPopulationColumn(columns: string[]): string | null {
    const populationHints = ['population', 'pop', 'geo_population'];
    
    const populationColumn = columns.find(col => 
      populationHints.some(hint => col.toLowerCase().includes(hint))
    );
    
    return populationColumn || null;
  }

  private validateMediaPairs(columns: string[]): ValidationResult[] {
    const results: ValidationResult[] = [];
    const spendColumns = columns.filter(col => col.endsWith('_spend'));
    
    for (const spendCol of spendColumns) {
      const impressionCol = spendCol.replace('_spend', '_impressions');
      const hasImpressions = columns.includes(impressionCol);
      
      results.push({
        passed: hasImpressions,
        category: 'Media Data',
        message: hasImpressions 
          ? `${spendCol} has matching impressions data`
          : `${spendCol} missing impressions data (${impressionCol})`,
        severity: hasImpressions ? 'info' : 'error',
        details: { spendColumn: spendCol, impressionColumn: impressionCol }
      });
    }
    
    return results;
  }
  
  private checkDateContinuity(data: any[], dateColumn: string): ValidationResult {
    try {
      // Parse dates and sort
      const dates = data
        .map(row => new Date(row[dateColumn]))
        .sort((a, b) => a.getTime() - b.getTime());
      
      // Check for gaps
      const gaps = [];
      for (let i = 1; i < dates.length; i++) {
        const current = dates[i];
        const previous = dates[i-1];
        const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
        
        // Detect weekly data
        if (i === 1) {
          const isWeekly = diffDays >= 6 && diffDays <= 8;
          if (isWeekly) {
            // For weekly data, check for missing weeks
            if (diffDays > 8) {
              gaps.push({ index: i, date: current, previous, diffDays });
            }
          } else {
            // For daily data, check for missing days
            if (diffDays > 1) {
              gaps.push({ index: i, date: current, previous, diffDays });
            }
          }
        } else {
          // Use the same threshold established in the first interval
          if (diffDays > (gaps.length > 0 ? 8 : 1)) {
            gaps.push({ index: i, date: current, previous, diffDays });
          }
        }
      }
      
      if (gaps.length === 0) {
        return {
          passed: true,
          category: 'Date Continuity',
          message: 'No gaps found in time series',
          severity: 'info'
        };
      } else {
        return {
          passed: false,
          category: 'Date Continuity',
          message: `Found ${gaps.length} gaps in time series`,
          severity: gaps.length > 3 ? 'error' : 'warning',
          details: { gaps }
        };
      }
    } catch (error) {
      return {
        passed: false,
        category: 'Date Continuity',
        message: 'Could not parse dates properly',
        severity: 'error',
        details: { error: (error as Error).message }
      };
    }
  }
  
  private validateNumericColumns(data: any[], numericColumns: string[]): ValidationResult[] {
    return numericColumns.map(column => {
      const nonNumericRows = data
        .map((row, index) => ({ index, value: row[column] }))
        .filter(item => isNaN(parseFloat(String(item.value))));
      
      if (nonNumericRows.length === 0) {
        return {
          passed: true,
          category: 'Numeric Validation',
          message: `Column '${column}' contains valid numeric data`,
          severity: 'info',
          details: { column }
        };
      } else {
        return {
          passed: false,
          category: 'Numeric Validation',
          message: `Column '${column}' contains ${nonNumericRows.length} non-numeric values`,
          severity: 'error',
          details: { column, rows: nonNumericRows }
        };
      }
    });
  }
  
  private detectOutliers(data: any[], numericColumns: string[]): ValidationResult[] {
    return numericColumns.map(column => {
      // Convert values to numbers and filter out non-numeric
      const values = data
        .map(row => parseFloat(String(row[column])))
        .filter(val => !isNaN(val));
      
      if (values.length === 0) return {
        passed: true,
        category: 'Outlier Detection',
        message: `No numeric data in column '${column}'`,
        severity: 'info',
        details: { column }
      };
      
      // Calculate mean and standard deviation
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Identify outliers (>3 standard deviations)
      const threshold = 3 * stdDev;
      const outliers = data
        .map((row, index) => ({ index, value: parseFloat(String(row[column])) }))
        .filter(item => !isNaN(item.value) && Math.abs(item.value - mean) > threshold);
      
      if (outliers.length === 0) {
        return {
          passed: true,
          category: 'Outlier Detection',
          message: `No outliers found in column '${column}'`,
          severity: 'info',
          details: { column, mean, stdDev }
        };
      } else {
        return {
          passed: false,
          category: 'Outlier Detection',
          message: `Found ${outliers.length} outliers in column '${column}'`,
          severity: 'warning',
          details: { column, outliers, mean, stdDev }
        };
      }
    });
  }
  
  private checkMissingValues(data: any[], columns: string[]): ValidationResult[] {
    return columns.map(column => {
      const missingRows = data
        .map((row, index) => ({ index, value: row[column] }))
        .filter(item => item.value === null || item.value === undefined || item.value === '');
      
      const missingPercentage = (missingRows.length / data.length) * 100;
      
      if (missingRows.length === 0) {
        return {
          passed: true,
          category: 'Missing Values',
          message: `No missing values in column '${column}'`,
          severity: 'info',
          details: { column }
        };
      } else {
        return {
          passed: false,
          category: 'Missing Values',
          message: `${missingRows.length} missing values (${missingPercentage.toFixed(1)}%) in column '${column}'`,
          severity: missingPercentage > 10 ? 'error' : 'warning',
          details: { column, rows: missingRows, percentage: missingPercentage }
        };
      }
    });
  }
  
  private checkNegativeValues(data: any[], spendColumns: string[]): ValidationResult[] {
    return spendColumns.map(column => {
      const negativeRows = data
        .map((row, index) => ({ index, value: parseFloat(String(row[column])) }))
        .filter(item => !isNaN(item.value) && item.value < 0);
      
      if (negativeRows.length === 0) {
        return {
          passed: true,
          category: 'Negative Values',
          message: `No negative values in column '${column}'`,
          severity: 'info',
          details: { column }
        };
      } else {
        return {
          passed: false,
          category: 'Negative Values',
          message: `Found ${negativeRows.length} negative values in column '${column}'`,
          severity: 'error',
          details: { column, rows: negativeRows }
        };
      }
    });
  }
  
  private checkMinimumDataPoints(data: any[]): ValidationResult {
    const minRequired = 52; // 52 weeks (1 year) minimum
    
    if (data.length >= minRequired) {
      return {
        passed: true,
        category: 'Minimum Data Points',
        message: `${data.length} data points (recommended: ${minRequired}+)`,
        severity: 'info',
        details: { count: data.length, minimum: minRequired }
      };
    } else {
      return {
        passed: false,
        category: 'Minimum Data Points',
        message: `Only ${data.length} data points (recommended: ${minRequired}+)`,
        severity: data.length < 26 ? 'error' : 'warning',
        details: { count: data.length, minimum: minRequired }
      };
    }
  }
  
  private calculateValidationScore(results: ValidationResult[]): number {
    // Define weights for different severity levels
    const weights = {
      error: 1.0,
      warning: 0.5,
      info: 0.0
    };
    
    // Calculate penalty points
    let penaltyPoints = 0;
    let totalChecks = 0;
    
    results.forEach(result => {
      if (!result.passed) {
        penaltyPoints += weights[result.severity];
      }
      totalChecks++;
    });
    
    // Calculate score (0-100)
    const maxPenalty = totalChecks;
    const score = 100 * (1 - (penaltyPoints / maxPenalty));
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}