import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertDatasetSchema } from '@shared/schema';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { ZodError } from 'zod-validation-error';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = `${uuidv4()}-${file.originalname}`;
      cb(null, uniqueFilename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

export const uploadDataset = [
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const schema = z.object({
        project_id: z.coerce.number(),
        name: z.string().min(1),
      });

      const validatedData = schema.parse(req.body);
      const project = await storage.getProject(validatedData.project_id);
      
      if (!project) {
        // Delete the uploaded file if project doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Project not found' });
      }

      const dataset = await storage.createDataset({
        project_id: validatedData.project_id,
        name: validatedData.name,
        file_path: req.file.path,
        config: null, // Will be populated when the dataset is processed
      });

      return res.status(201).json(dataset);
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      // Clean up file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      console.error('Error uploading dataset:', error);
      return res.status(500).json({ message: 'Failed to upload dataset' });
    }
  }
];

export const getDatasets = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const datasets = await storage.getDatasets(projectId);
    return res.json(datasets);
  } catch (error) {
    console.error('Error getting datasets:', error);
    return res.status(500).json({ message: 'Failed to retrieve datasets' });
  }
};

export const getDataset = async (req: Request, res: Response) => {
  try {
    const datasetId = parseInt(req.params.id);
    if (isNaN(datasetId)) {
      return res.status(400).json({ message: 'Invalid dataset ID' });
    }

    const dataset = await storage.getDataset(datasetId);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    return res.json(dataset);
  } catch (error) {
    console.error('Error getting dataset:', error);
    return res.status(500).json({ message: 'Failed to retrieve dataset' });
  }
};

import { parse } from 'csv-parse/sync';
import { DataValidator } from '../utils/data-validator';

export const processDataset = async (req: Request, res: Response) => {
  try {
    const datasetId = parseInt(req.params.id);
    if (isNaN(datasetId)) {
      return res.status(400).json({ message: 'Invalid dataset ID' });
    }

    const dataset = await storage.getDataset(datasetId);
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Process the CSV file to extract column names and sample data
    const filePath = dataset.file_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Dataset file not found' });
    }

    // Read the CSV properly with csv-parse for more robust parsing
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Empty CSV file' });
    }

    // Extract columns and sample data
    const columns = Object.keys(rows[0]);
    const sampleData = rows.slice(0, 5);

    // Basic config with columns and sample data
    const config = {
      columns,
      sampleData,
    };

    // Run data validation
    const validator = new DataValidator();
    console.log(`Running validation on dataset ${datasetId}`);
    const validation = await validator.validateDataset(
      filePath,
      columns,
      sampleData
    );

    console.log(`Validation results: score=${validation.score}, isValid=${validation.isValid}`);
    
    // Add validation results to the config
    const updatedConfig = {
      ...config,
      validation: {
        score: validation.score,
        results: validation.results,
        recommendations: validation.recommendations,
        validatedAt: new Date().toISOString()
      }
    };

    console.log(`Processing dataset ${datasetId} with config:`, JSON.stringify(updatedConfig, null, 2));
    
    // Update the dataset with the extracted config
    await storage.updateDataset(dataset.id, {
      config: updatedConfig,
    });

    return res.json({
      id: dataset.id,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error processing dataset:', error);
    return res.status(500).json({ message: 'Failed to process dataset' });
  }
};
