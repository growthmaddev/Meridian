import { pgTable, text, serial, integer, timestamp, json, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  organization: text("organization"),
  created_at: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  file_path: text("file_path").notNull(),
  config: json("config"),
  uploaded_at: timestamp("uploaded_at").defaultNow(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").notNull().references(() => projects.id),
  dataset_id: integer("dataset_id").notNull().references(() => datasets.id),
  name: text("name").notNull(),
  status: text("status").notNull(), // pending, running, completed, failed
  config: json("config").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const model_results = pgTable("model_results", {
  id: serial("id").primaryKey(),
  model_id: integer("model_id").notNull().references(() => models.id),
  results_json: json("results_json").notNull(),
  artifacts_path: text("artifacts_path"),
  created_at: timestamp("created_at").defaultNow(),
});

export const optimization_scenarios = pgTable("optimization_scenarios", {
  id: serial("id").primaryKey(),
  model_id: integer("model_id").notNull().references(() => models.id),
  name: text("name").notNull(),
  config: json("config").notNull(),
  results: json("results"),
  created_at: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({
  id: true,
  uploaded_at: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  created_at: true,
});

export const insertModelResultSchema = createInsertSchema(model_results).omit({
  id: true,
  created_at: true,
});

export const insertOptimizationScenarioSchema = createInsertSchema(optimization_scenarios).omit({
  id: true,
  created_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type Dataset = typeof datasets.$inferSelect;

export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;

export type InsertModelResult = z.infer<typeof insertModelResultSchema>;
export type ModelResult = typeof model_results.$inferSelect;

export type InsertOptimizationScenario = z.infer<typeof insertOptimizationScenarioSchema>;
export type OptimizationScenario = typeof optimization_scenarios.$inferSelect;

// Model config types for frontend use
export const modelConfigSchema = z.object({
  date_column: z.string(),
  target_column: z.string(),
  channel_columns: z.array(z.string()),
  geo_column: z.string().optional(),
  control_columns: z.array(z.string()).optional(),
  seasonality: z.number().optional(),
  use_geo: z.boolean().optional(),
  population_scaling_column: z.string().optional(),
});

export type ModelConfig = z.infer<typeof modelConfigSchema>;
