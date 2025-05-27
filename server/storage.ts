import { 
  User, InsertUser, Project, InsertProject, 
  Dataset, InsertDataset, Model, InsertModel,
  ModelResult, InsertModelResult, OptimizationScenario, InsertOptimizationScenario
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, projects, datasets, models, model_results, optimization_scenarios } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Dataset operations
  getDatasets(projectId: number): Promise<Dataset[]>;
  getDataset(id: number): Promise<Dataset | undefined>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  updateDataset(id: number, updates: Partial<Dataset>): Promise<Dataset>;
  
  // Model operations
  getModels(projectId: number): Promise<Model[]>;
  getModel(id: number): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModelStatus(id: number, status: string): Promise<Model>;
  
  // Model result operations
  getModelResult(modelId: number): Promise<ModelResult | undefined>;
  createModelResult(result: InsertModelResult): Promise<ModelResult>;
  
  // Optimization scenario operations
  getOptimizationScenarios(modelId: number): Promise<OptimizationScenario[]>;
  getOptimizationScenario(id: number): Promise<OptimizationScenario | undefined>;
  createOptimizationScenario(scenario: InsertOptimizationScenario): Promise<OptimizationScenario>;
  updateOptimizationScenarioResults(id: number, results: any): Promise<OptimizationScenario>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Project operations
  async getProjects(userId: number): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.user_id, userId));
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }
  
  // Dataset operations
  async getDatasets(projectId: number): Promise<Dataset[]> {
    return db.select().from(datasets).where(eq(datasets.project_id, projectId));
  }
  
  async getDataset(id: number): Promise<Dataset | undefined> {
    const [dataset] = await db.select().from(datasets).where(eq(datasets.id, id));
    return dataset;
  }
  
  async createDataset(insertDataset: InsertDataset): Promise<Dataset> {
    const [dataset] = await db
      .insert(datasets)
      .values(insertDataset)
      .returning();
    return dataset;
  }
  
  async updateDataset(id: number, updates: Partial<Dataset>): Promise<Dataset> {
    const [dataset] = await db
      .update(datasets)
      .set(updates)
      .where(eq(datasets.id, id))
      .returning();
    return dataset;
  }
  
  // Model operations
  async getModels(projectId: number): Promise<Model[]> {
    return db.select().from(models).where(eq(models.project_id, projectId));
  }
  
  async getModel(id: number): Promise<Model | undefined> {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  }
  
  async createModel(insertModel: InsertModel): Promise<Model> {
    const [model] = await db
      .insert(models)
      .values(insertModel)
      .returning();
    return model;
  }
  
  async updateModelStatus(id: number, status: string): Promise<Model> {
    const [model] = await db
      .update(models)
      .set({ status })
      .where(eq(models.id, id))
      .returning();
    return model;
  }
  
  // Model result operations
  async getModelResult(modelId: number): Promise<ModelResult | undefined> {
    const [result] = await db.select().from(model_results).where(eq(model_results.model_id, modelId));
    return result;
  }
  
  async createModelResult(insertResult: InsertModelResult): Promise<ModelResult> {
    const [result] = await db
      .insert(model_results)
      .values(insertResult)
      .returning();
    return result;
  }
  
  // Optimization scenario operations
  async getOptimizationScenarios(modelId: number): Promise<OptimizationScenario[]> {
    return db.select().from(optimization_scenarios).where(eq(optimization_scenarios.model_id, modelId));
  }
  
  async getOptimizationScenario(id: number): Promise<OptimizationScenario | undefined> {
    const [scenario] = await db.select().from(optimization_scenarios).where(eq(optimization_scenarios.id, id));
    return scenario;
  }
  
  async createOptimizationScenario(insertScenario: InsertOptimizationScenario): Promise<OptimizationScenario> {
    const [scenario] = await db
      .insert(optimization_scenarios)
      .values(insertScenario)
      .returning();
    return scenario;
  }
  
  async updateOptimizationScenarioResults(id: number, results: any): Promise<OptimizationScenario> {
    const [scenario] = await db
      .update(optimization_scenarios)
      .set({ results })
      .where(eq(optimization_scenarios.id, id))
      .returning();
    return scenario;
  }
}

export const storage = new DatabaseStorage();
