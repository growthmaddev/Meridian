import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertModelSchema, modelConfigSchema } from '@shared/schema';
import { runPythonScript } from '../utils/python-runner';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

export const createModel = async (req: Request, res: Response) => {
  try {
    // Add status to the request body before validation
    const requestData = {
      ...req.body,
      status: 'pending'
    };
    
    const modelData = insertModelSchema.parse(requestData);
    
    // Verify dataset exists
    const dataset = await storage.getDataset(modelData.dataset_id);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Verify project exists
    const project = await storage.getProject(modelData.project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Validate the model config
    try {
      modelConfigSchema.parse(modelData.config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid model configuration', 
          errors: error.errors 
        });
      }
      throw error;
    }

    // Create model (status is already set to 'pending')
    const model = await storage.createModel(modelData);

    res.status(201).json(model);

    // Create a temp directory for model outputs
    const modelDir = path.resolve(process.cwd(), 'model_outputs', `model_${model.id}`);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    // Create config file for the model
    const configPath = path.join(modelDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(modelData.config, null, 2));

    // Create output path for model results
    const outputPath = path.join(modelDir, 'results.json');

    // Update model status to running
    await storage.updateModelStatus(model.id, 'running');

    console.log(`Starting model training for model ${model.id} using dataset ${dataset.id}`);
    console.log(`Dataset path: ${dataset.file_path}`);
    console.log(`Config path: ${configPath}`);
    console.log(`Output path: ${outputPath}`);
    
    // Run the Meridian Python script to train the model
    const { success, output } = await runPythonScript({
      script: 'python_scripts/train_meridian_simple.py',
      args: [dataset.file_path, configPath, outputPath],
      onData: async (data) => {
        console.log('Python script output:', data);
        
        // If the script is sending progress updates, we can use them
        if (data.status && data.progress) {
          // We could update the model status with progress information
          // but we'll keep it simple for now
        }
      },
      onError: (error) => {
        console.error('Python script error:', error);
      },
      onComplete: async (code) => {
        // Update model status based on completion code
        if (code === 0 && fs.existsSync(outputPath)) {
          try {
            const resultsData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            
            // Save model results
            await storage.createModelResult({
              model_id: model.id,
              results_json: resultsData,
              artifacts_path: modelDir
            });
            
            // Update model status to completed
            await storage.updateModelStatus(model.id, 'completed');
          } catch (error) {
            console.error('Error saving model results:', error);
            await storage.updateModelStatus(model.id, 'failed');
          }
        } else {
          await storage.updateModelStatus(model.id, 'failed');
        }
      }
    });

    if (!success) {
      console.error('Failed to run Python script:', output);
      await storage.updateModelStatus(model.id, 'failed');
    }

  } catch (error) {
    console.error('Error creating model:', error);
    return res.status(500).json({ message: 'Failed to create model' });
  }
};

export const getModels = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const models = await storage.getModels(projectId);
    return res.json(models);
  } catch (error) {
    console.error('Error getting models:', error);
    return res.status(500).json({ message: 'Failed to retrieve models' });
  }
};

export const getModel = async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID' });
    }

    const model = await storage.getModel(modelId);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    return res.json(model);
  } catch (error) {
    console.error('Error getting model:', error);
    return res.status(500).json({ message: 'Failed to retrieve model' });
  }
};

export const getModelResults = async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID' });
    }

    const model = await storage.getModel(modelId);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const results = await storage.getModelResult(modelId);
    if (!results) {
      return res.status(404).json({ message: 'Model results not found' });
    }

    return res.json(results);
  } catch (error) {
    console.error('Error getting model results:', error);
    return res.status(500).json({ message: 'Failed to retrieve model results' });
  }
};

export const optimizeBudget = async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID' });
    }

    const model = await storage.getModel(modelId);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    const results = await storage.getModelResult(modelId);
    if (!results) {
      return res.status(404).json({ message: 'Model results not found' });
    }

    // Create optimization scenario
    const scenario = await storage.createOptimizationScenario({
      model_id: modelId,
      name: req.body.name || 'Budget Optimization',
      config: req.body.config || {},
      results: null
    });

    // Create a directory for optimization outputs
    const optimizationDir = path.resolve(process.cwd(), 'optimization_outputs', `optimization_${scenario.id}`);
    if (!fs.existsSync(optimizationDir)) {
      fs.mkdirSync(optimizationDir, { recursive: true });
    }

    // Create input file with model results for optimization
    const inputPath = path.join(optimizationDir, 'model_results.json');
    fs.writeFileSync(inputPath, JSON.stringify(results.results_json, null, 2));

    // Create config file for the optimization
    const configPath = path.join(optimizationDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body.config || {}, null, 2));

    // Create output path for optimization results
    const outputPath = path.join(optimizationDir, 'results.json');

    // Run the Python script to optimize the budget
    const { success, output } = await runPythonScript({
      script: 'python_scripts/optimize_budget.py',
      args: [inputPath, configPath, outputPath],
      onComplete: async (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          try {
            const optimizationResults = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            await storage.updateOptimizationScenarioResults(scenario.id, optimizationResults);
          } catch (error) {
            console.error('Error saving optimization results:', error);
          }
        }
      }
    });

    if (!success) {
      console.error('Failed to run optimization script:', output);
      return res.status(500).json({ message: 'Failed to run budget optimization' });
    }

    return res.status(202).json(scenario);
  } catch (error) {
    console.error('Error optimizing budget:', error);
    return res.status(500).json({ message: 'Failed to optimize budget' });
  }
};

export const getOptimizationScenarios = async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.modelId);
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID' });
    }

    const scenarios = await storage.getOptimizationScenarios(modelId);
    return res.json(scenarios);
  } catch (error) {
    console.error('Error getting optimization scenarios:', error);
    return res.status(500).json({ message: 'Failed to retrieve optimization scenarios' });
  }
};

export const getOptimizationScenario = async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    if (isNaN(scenarioId)) {
      return res.status(400).json({ message: 'Invalid scenario ID' });
    }

    const scenario = await storage.getOptimizationScenario(scenarioId);
    if (!scenario) {
      return res.status(404).json({ message: 'Optimization scenario not found' });
    }

    return res.json(scenario);
  } catch (error) {
    console.error('Error getting optimization scenario:', error);
    return res.status(500).json({ message: 'Failed to retrieve optimization scenario' });
  }
};

export const calculateScenario = async (req: Request, res: Response) => {
  try {
    const modelId = parseInt(req.params.id);
    if (isNaN(modelId)) {
      return res.status(400).json({ message: 'Invalid model ID' });
    }

    // Get the model and check if it exists
    const model = await storage.getModel(modelId);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }

    // Get the model results
    const results = await storage.getModelResult(modelId);
    if (!results) {
      return res.status(404).json({ message: 'Model results not found' });
    }

    // Get the budget adjustments from the request body
    const { budgetAdjustments } = req.body;
    
    if (!budgetAdjustments || !Array.isArray(budgetAdjustments)) {
      return res.status(400).json({ 
        message: 'Invalid budget adjustments',
        details: 'budgetAdjustments must be an array of channel budget changes'
      });
    }

    // Get the original channel results from the model
    const originalChannels = results.results_json?.channel_results || [];
    
    // Create a map of channel names to their data
    const channelMap = new Map();
    originalChannels.forEach((channel: any) => {
      channelMap.set(channel.name, {...channel});
    });
    
    // Apply budget adjustments
    budgetAdjustments.forEach((adjustment: any) => {
      const { channelName, newBudget } = adjustment;
      if (channelMap.has(channelName)) {
        const channel = channelMap.get(channelName);
        channel.spend = newBudget;
        
        // For a basic mock scenario, we'll apply a simple formula to adjust ROI
        // In a real implementation, this would involve more complex calculations
        const budgetRatio = newBudget / channel.originalSpend;
        const diminishingReturns = Math.sqrt(budgetRatio); // Simple diminishing returns function
        channel.roi = channel.originalRoi * diminishingReturns;
        
        // Recalculate contribution based on new spend and ROI
        channel.contribution = (channel.spend * channel.roi) / 
          channelMap.reduce((total: number, ch: any) => total + (ch.spend * ch.roi), 0) * 100;
      }
    });

    // Generate scenario results with the adjusted channels
    const scenarioResults = {
      scenario_id: Date.now(),
      name: req.body.name || 'Custom Budget Scenario',
      created_at: new Date().toISOString(),
      channels: Array.from(channelMap.values()),
      metrics: {
        total_spend: Array.from(channelMap.values()).reduce((sum: number, channel: any) => sum + channel.spend, 0),
        total_revenue: Array.from(channelMap.values()).reduce((sum: number, channel: any) => sum + (channel.spend * channel.roi), 0),
        average_roi: Array.from(channelMap.values()).reduce((sum: number, channel: any) => sum + channel.roi, 0) / channelMap.size
      }
    };

    return res.json(scenarioResults);
  } catch (error) {
    console.error('Error calculating scenario:', error);
    return res.status(500).json({ message: 'Failed to calculate scenario' });
  }
};
