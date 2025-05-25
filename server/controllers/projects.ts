import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertProjectSchema } from '@shared/schema';
import { z } from 'zod';

export const createProject = async (req: Request, res: Response) => {
  try {
    const projectData = insertProjectSchema.parse(req.body);
    
    // For simplicity, we're using a default user_id until auth is implemented
    const userId = req.body.user_id || 1;
    
    const project = await storage.createProject({
      ...projectData,
      user_id: userId
    });

    return res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Failed to create project' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    // For simplicity, we're using a default user_id until auth is implemented
    const userId = parseInt(req.query.user_id as string) || 1;
    
    const projects = await storage.getProjects(userId);
    return res.json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    return res.status(500).json({ message: 'Failed to retrieve projects' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    return res.status(500).json({ message: 'Failed to retrieve project' });
  }
};
