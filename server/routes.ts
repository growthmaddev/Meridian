import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Import controllers
import { createProject, getProjects, getProject } from './controllers/projects';
import { uploadDataset, getDatasets, getDataset, processDataset } from './controllers/datasets';
import { 
  createModel, getModels, getModel, getModelResults, 
  optimizeBudget, getOptimizationScenarios, getOptimizationScenario
} from './controllers/models';
import { testGpuResources, getGpuStatus } from './controllers/gpu';

export async function registerRoutes(app: Express): Promise<Server> {
  // Project routes
  app.post('/api/projects', createProject);
  app.get('/api/projects', getProjects);
  app.get('/api/projects/:id', getProject);

  // Dataset routes
  app.post('/api/datasets', ...uploadDataset);
  app.get('/api/projects/:projectId/datasets', getDatasets);
  app.get('/api/datasets/:id', getDataset);
  app.post('/api/datasets/:id/process', processDataset);

  // Model routes
  app.post('/api/models', createModel);
  app.get('/api/projects/:projectId/models', getModels);
  app.get('/api/models/:id', getModel);
  app.get('/api/models/:id/results', getModelResults);

  // Optimization routes
  app.post('/api/models/:id/optimize', optimizeBudget);
  app.get('/api/models/:modelId/optimizations', getOptimizationScenarios);
  app.get('/api/optimizations/:id', getOptimizationScenario);
  
  // GPU assessment routes
  app.post('/api/gpu/test', testGpuResources);
  app.get('/api/gpu/status', getGpuStatus);
  
  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
