# Database Schema Documentation

## Overview
This document details the database schema for the Marketing Mix Modeling application. The application uses PostgreSQL with Drizzle ORM for data management.

## Tables

### Users
Stores user account information for authentication and personalization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the user |
| username | text | NOT NULL, UNIQUE | User's login name |
| password | text | NOT NULL | Hashed password for authentication |
| organization | text | | User's organization name |
| created_at | timestamp | DEFAULT NOW() | When the user account was created |

### Projects
Organizes marketing analysis work into logical containers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the project |
| user_id | integer | NOT NULL, FOREIGN KEY | Reference to the user who owns the project |
| name | text | NOT NULL | Project name |
| description | text | | Optional project description |
| created_at | timestamp | DEFAULT NOW() | When the project was created |

### Datasets
Stores uploaded marketing data files and their configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the dataset |
| project_id | integer | NOT NULL, FOREIGN KEY | Reference to the project the dataset belongs to |
| name | text | NOT NULL | Dataset name |
| file_path | text | NOT NULL | Path to the uploaded file on the server |
| config | json | | Configuration including column mappings and data types |
| uploaded_at | timestamp | DEFAULT NOW() | When the dataset was uploaded |

### Models
Represents trained or in-progress marketing mix models.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the model |
| project_id | integer | NOT NULL, FOREIGN KEY | Reference to the project the model belongs to |
| dataset_id | integer | NOT NULL, FOREIGN KEY | Reference to the dataset used for training |
| name | text | NOT NULL | Model name |
| status | text | NOT NULL | Current status: pending, running, completed, failed |
| config | json | NOT NULL | Model configuration including selected columns and parameters |
| created_at | timestamp | DEFAULT NOW() | When the model was created |

### Model Results
Stores the results of trained marketing mix models.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the model result |
| model_id | integer | NOT NULL, FOREIGN KEY | Reference to the trained model |
| results_json | json | NOT NULL | Complete model results including metrics, coefficients, and predictions |
| artifacts_path | text | | Path to saved model artifacts on the server |
| created_at | timestamp | DEFAULT NOW() | When the results were created |

### Optimization Scenarios
Stores budget optimization scenarios based on trained models.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | serial | PRIMARY KEY | Unique identifier for the optimization scenario |
| model_id | integer | NOT NULL, FOREIGN KEY | Reference to the model used for optimization |
| name | text | NOT NULL | Scenario name |
| config | json | NOT NULL | Optimization parameters such as budget constraints |
| results | json | | Optimization results including optimal allocations |
| created_at | timestamp | DEFAULT NOW() | When the scenario was created |

## Relationships

- **Users → Projects**: One-to-many. A user can have multiple projects.
- **Projects → Datasets**: One-to-many. A project can contain multiple datasets.
- **Projects → Models**: One-to-many. A project can have multiple models.
- **Datasets → Models**: One-to-many. A dataset can be used for multiple models.
- **Models → Model Results**: One-to-one. A model has one set of results when training completes.
- **Models → Optimization Scenarios**: One-to-many. A model can have multiple optimization scenarios.

## Model Config Schema

The `config` JSON column in the Models table follows this structure:

```typescript
{
  date_column: string;           // Column containing date information
  target_column: string;         // Target KPI column (e.g., sales, conversions)
  channel_columns: string[];     // Columns representing marketing channels
  geo_column?: string;           // Optional column for geographic segmentation
  control_columns?: string[];    // Optional columns for control variables
  seasonality?: number;          // Optional seasonality period
  use_geo?: boolean;             // Whether to use geographic hierarchical modeling
}
```

## Data Flow

1. User creates an account (Users table)
2. User creates a project (Projects table)
3. User uploads marketing dataset (Datasets table)
4. User configures and trains a model (Models table)
5. System stores training results (Model Results table)
6. User creates optimization scenarios (Optimization Scenarios table)

## Implementation Notes

- Database access is managed through Drizzle ORM with type safety via TypeScript
- Insert operations use validated schemas through Zod integration
- Foreign key constraints ensure referential integrity
- Timestamp fields automatically track entity creation times