# Comprehensive Documentation: Building a Google Meridian MMM SaaS on Replit

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   React     │  │  Dashboard   │  │  Visualization      │   │
│  │   Next.js   │  │  Components  │  │  (Plotly.js)        │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/API
┌────────────────────────────┴────────────────────────────────────┐
│                    API Gateway (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Auth Service │  │ Rate Limiter │  │ Request Validation │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    Application Services                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Data Upload │  │ MMM Engine   │  │ Report Generator   │    │
│  │  Service    │  │  (Meridian)  │  │    Service         │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Tenant     │  │  Background  │  │ Optimization       │    │
│  │  Manager    │  │  Job Queue   │  │    Service         │    │
│  └─────────────┘  └──────────────┘  └────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ PostgreSQL   │  │ Object Store │  │ Redis Cache        │   │
│  │ (Multi-tenant│  │ (File Storage│  │ (Session/Results)  │   │
│  │  Database)   │  │  CSV/Reports)│  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Technical Stack Recommendation

```python
# requirements.txt
# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0

# Google Meridian MMM
google-meridian[and-cuda]==1.0.0
tensorflow>=2.11
tensorflow-probability
arviz>=0.14

# Database
sqlalchemy==2.0.23
alembic==1.13.1
psycopg2-binary==2.9.9
redis==5.0.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
auth0-python==4.6.0

# Data Processing
pandas==2.1.3
numpy==1.25.2
openpyxl==3.1.2

# Background Jobs
celery==5.3.4
kombu==5.3.4

# Frontend (package.json)
react==18.2.0
next==14.0.0
@mui/material==5.14.0
plotly.js==2.27.0
axios==1.6.0
```

## Database Schema for Multi-Tenant Setup

### Core Tables Design

```sql
-- Agencies (top-level tenants)
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'starter',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- Clients (sub-tenants under agencies)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- Users with role-based access
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    auth0_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- User access to tenants
CREATE TABLE user_tenant_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    tenant_type VARCHAR(20) NOT NULL CHECK (tenant_type IN ('agency', 'client')),
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'analyst', 'viewer')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id, tenant_type)
);

-- MMM Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'draft'
);

-- Data Uploads
CREATE TABLE data_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    validation_results JSONB,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Model Runs
CREATE TABLE model_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    config JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    results_path VARCHAR(500),
    metrics JSONB,
    error_message TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Budget Scenarios
CREATE TABLE budget_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_run_id UUID NOT NULL REFERENCES model_runs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    scenario_config JSONB NOT NULL,
    results JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_data_uploads_project_id ON data_uploads(project_id);
CREATE INDEX idx_model_runs_project_id ON model_runs(project_id);
CREATE INDEX idx_user_tenant_access_user_id ON user_tenant_access(user_id);
CREATE INDEX idx_user_tenant_access_tenant_id ON user_tenant_access(tenant_id);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY projects_tenant_isolation ON projects
    FOR ALL TO application_user
    USING (
        client_id IN (
            SELECT client_id FROM user_client_access_view 
            WHERE user_id = current_setting('app.current_user')::UUID
        )
    );
```

## API Design for Backend Services

### RESTful API Structure

```python
# main.py - FastAPI Application
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_database()
    yield
    # Shutdown
    await cleanup_connections()

app = FastAPI(
    title="Meridian MMM SaaS API",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://*.replit.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from routers import auth, projects, data, models, reports, optimization

app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(data.router, prefix="/api/v1/data", tags=["data"])
app.include_router(models.router, prefix="/api/v1/models", tags=["models"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(optimization.router, prefix="/api/v1/optimization", tags=["optimization"])
```

### Core API Endpoints

```python
# routers/projects.py
from fastapi import APIRouter, Depends, File, UploadFile
from typing import List
from models import Project, ProjectCreate, ProjectUpdate

router = APIRouter()

@router.post("/", response_model=Project)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new MMM project"""
    return create_project_service(db, project, current_user)

@router.get("/{project_id}", response_model=Project)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get project details"""
    return get_project_service(db, project_id, current_user)

# routers/data.py
@router.post("/{project_id}/upload")
async def upload_data(
    project_id: UUID,
    file: UploadFile = File(...),
    upload_type: str = Form(...),
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload CSV data for MMM analysis"""
    # Validate file
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "Only CSV files are allowed")

    # Save file and queue processing
    upload_id = save_upload_file(file, project_id, upload_type)
    background_tasks.add_task(process_csv_data, upload_id, project_id)

    return {"upload_id": upload_id, "status": "processing"}

# routers/models.py
@router.post("/{project_id}/train")
async def train_model(
    project_id: UUID,
    config: ModelConfig,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Train a new MMM model"""
    model_run_id = create_model_run(project_id, config, current_user)
    background_tasks.add_task(run_meridian_training, model_run_id)

    return {
        "model_run_id": model_run_id,
        "status": "queued",
        "estimated_duration": "10-15 minutes"
    }

@router.get("/{project_id}/runs/{run_id}/status")
async def get_model_status(
    project_id: UUID,
    run_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """Get model training status"""
    return get_model_run_status(run_id, current_user)
```

## Frontend Component Structure

### Component Hierarchy

```typescript
// Frontend Component Structure
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   └── CreateProjectModal.tsx
│   ├── data/
│   │   ├── DataUploadZone.tsx
│   │   ├── ColumnMapper.tsx
│   │   ├── ValidationResults.tsx
│   │   └── DataPreview.tsx
│   ├── models/
│   │   ├── ModelConfiguration.tsx
│   │   ├── PriorSettings.tsx
│   │   ├── TrainingProgress.tsx
│   │   └── ModelResults.tsx
│   ├── visualization/
│   │   ├── ROICurves.tsx
│   │   ├── ChannelContribution.tsx
│   │   ├── BudgetAllocation.tsx
│   │   └── TimeSeriesChart.tsx
│   ├── optimization/
│   │   ├── ScenarioPlanner.tsx
│   │   ├── BudgetOptimizer.tsx
│   │   └── WhatIfAnalysis.tsx
│   └── common/
│       ├── Tooltip.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ProgressBar.tsx
```

### Key Frontend Components

```tsx
// components/data/DataUploadZone.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, LinearProgress } from '@mui/material';

export const DataUploadZone: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.csv')) {
      setUploading(true);
      await onUpload(file);
      setUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed #ccc',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f0f0' : 'white'
      }}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <LinearProgress />
      ) : (
        <Typography>
          {isDragActive
            ? 'Drop the CSV file here...'
            : 'Drag and drop a CSV file here, or click to select'}
        </Typography>
      )}
    </Box>
  );
};

// components/visualization/ROICurves.tsx
import React from 'react';
import Plot from 'react-plotly.js';

export const ROICurves: React.FC<{ data: ChannelData[] }> = ({ data }) => {
  const traces = data.map(channel => ({
    x: channel.spend_levels,
    y: channel.roi_values,
    type: 'scatter',
    mode: 'lines+markers',
    name: channel.name,
    hovertemplate: 'Spend: $%{x}<br>ROI: %{y:.2f}<extra></extra>'
  }));

  return (
    <Plot
      data={traces}
      layout={{
        title: 'ROI Response Curves by Channel',
        xaxis: { title: 'Spend ($)' },
        yaxis: { title: 'ROI' },
        hovermode: 'closest'
      }}
      config={{ responsive: true }}
    />
  );
};
```

## Data Processing Pipeline

### CSV Processing Workflow

```python
# services/data_processing.py
import pandas as pd
from typing import Dict, List, Optional
import asyncio
from datetime import datetime

class DataProcessor:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.validation_errors = []

    async def process_csv_upload(
        self, 
        file_path: str, 
        upload_type: str,
        column_mapping: Dict[str, str]
    ) -> Dict:
        """Main CSV processing pipeline"""
        try:
            # 1. Load and validate CSV
            df = await self._load_csv(file_path)

            # 2. Apply column mapping
            df = self._apply_column_mapping(df, column_mapping)

            # 3. Validate data structure
            validation_result = await self._validate_data(df, upload_type)

            if not validation_result['is_valid']:
                return {
                    'success': False,
                    'errors': validation_result['errors']
                }

            # 4. Transform data for Meridian
            processed_data = await self._transform_for_meridian(df, upload_type)

            # 5. Store processed data
            storage_result = await self._store_processed_data(processed_data)

            return {
                'success': True,
                'rows_processed': len(df),
                'data_id': storage_result['data_id']
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    async def _validate_data(self, df: pd.DataFrame, upload_type: str) -> Dict:
        """Validate data based on upload type"""
        errors = []

        if upload_type == 'media_spend':
            # Check required columns
            required_cols = ['date', 'channel', 'spend']
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                errors.append(f"Missing required columns: {missing_cols}")

            # Validate date format
            try:
                df['date'] = pd.to_datetime(df['date'])
            except:
                errors.append("Invalid date format. Use YYYY-MM-DD")

            # Check for negative spend
            if (df['spend'] < 0).any():
                errors.append("Negative spend values detected")

        elif upload_type == 'kpi_data':
            # Validate KPI data
            if 'revenue' not in df.columns and 'conversions' not in df.columns:
                errors.append("Must include either 'revenue' or 'conversions' column")

        return {
            'is_valid': len(errors) == 0,
            'errors': errors
        }

    async def _transform_for_meridian(
        self, 
        df: pd.DataFrame, 
        upload_type: str
    ) -> pd.DataFrame:
        """Transform data to Meridian format"""
        if upload_type == 'media_spend':
            # Pivot to wide format for Meridian
            df_pivot = df.pivot_table(
                index='date',
                columns='channel',
                values='spend',
                fill_value=0
            )

            # Resample to weekly if daily
            if len(df_pivot) > 200:  # Likely daily data
                df_pivot = df_pivot.resample('W').sum()

            return df_pivot

        return df

# Background task for processing
async def process_csv_data(upload_id: str, project_id: str):
    """Background task to process uploaded CSV"""
    async with get_db() as db:
        # Get upload record
        upload = db.query(DataUpload).filter_by(id=upload_id).first()

        # Initialize processor
        processor = DataProcessor(upload.project.client_id)

        # Process the file
        result = await processor.process_csv_upload(
            upload.file_path,
            upload.upload_type,
            upload.column_mapping
        )

        # Update upload status
        upload.status = 'completed' if result['success'] else 'failed'
        upload.validation_results = result
        upload.processed_at = datetime.utcnow()

        db.commit()

        # Send notification
        await send_processing_notification(upload_id, result)
```

## User Onboarding Flow

### Multi-Step Onboarding Process

```typescript
// pages/onboarding/index.tsx
import React, { useState } from 'react';
import { Stepper, Step, StepLabel, Box } from '@mui/material';

const OnboardingFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Welcome',
      component: <WelcomeStep onNext={() => setActiveStep(1)} />
    },
    {
      label: 'Organization Setup',
      component: <OrganizationSetup onNext={() => setActiveStep(2)} />
    },
    {
      label: 'Create First Project',
      component: <CreateProjectStep onNext={() => setActiveStep(3)} />
    },
    {
      label: 'Upload Sample Data',
      component: <SampleDataUpload onNext={() => setActiveStep(4)} />
    },
    {
      label: 'Run First Model',
      component: <FirstModelRun onComplete={completeOnboarding} />
    }
  ];

  return (
    <Box sx={{ width: '100%', p: 4 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>
        {steps[activeStep].component}
      </Box>
    </Box>
  );
};

// Individual step components with helpful tooltips and guidance
const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  return (
    <Box>
      <Typography variant="h4">Welcome to Meridian MMM</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Marketing Mix Modeling helps you understand the impact of your marketing 
        investments across all channels. Let's get you started!
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">What you'll learn:</Typography>
        <List>
          <ListItem>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText primary="Upload and validate your marketing data" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText primary="Configure and train your first model" />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText primary="Interpret results and optimize budgets" />
          </ListItem>
        </List>
      </Box>

      <Button 
        variant="contained" 
        onClick={onNext}
        sx={{ mt: 4 }}
      >
        Get Started
      </Button>
    </Box>
  );
};
```

### Progressive Feature Introduction

```python
# services/onboarding_service.py
class OnboardingService:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.features_unlocked = set()

    def get_available_features(self) -> List[str]:
        """Return features available based on onboarding progress"""
        base_features = ['project_creation', 'csv_upload', 'basic_model']

        if self.has_completed_first_model():
            base_features.extend(['budget_optimization', 'scenario_planning'])

        if self.has_multiple_successful_models():
            base_features.extend(['advanced_priors', 'custom_transformations'])

        return base_features

    def create_sample_project(self) -> Dict:
        """Create a project with sample data for learning"""
        sample_data = self._generate_sample_marketing_data()

        project = {
            'name': 'Sample Marketing Campaign',
            'description': 'Learn MMM with this sample dataset',
            'data': sample_data,
            'guided_mode': True
        }

        return project
```

## Implementation Roadmap

### Phase 1: MVP Foundation (Weeks 1-4)

**Week 1-2: Infrastructure Setup**
- [ ] Initialize Replit project with Python/React template
- [ ] Set up PostgreSQL database with multi-tenant schema
- [ ] Configure Auth0 for authentication
- [ ] Create basic FastAPI structure with CORS

**Week 3-4: Core Data Pipeline**
- [ ] Implement CSV upload endpoint
- [ ] Build data validation service
- [ ] Create column mapping interface
- [ ] Set up file storage with Replit Object Storage

**Deliverables:**
- Working authentication system
- CSV upload and validation
- Basic project management API

### Phase 2: Meridian Integration (Weeks 5-8)

**Week 5-6: Model Training Pipeline**
- [ ] Integrate Google Meridian library
- [ ] Create model configuration interface
- [ ] Implement background job processing
- [ ] Build training progress tracking

**Week 7-8: Results and Visualization**
- [ ] Develop ROI curve visualizations
- [ ] Create channel contribution charts
- [ ] Build model results API
- [ ] Implement basic reporting

**Deliverables:**
- Functional MMM training pipeline
- Interactive visualization dashboard
- Model results storage and retrieval

### Phase 3: Advanced Features (Weeks 9-12)

**Week 9-10: Budget Optimization**
- [ ] Implement optimization algorithms
- [ ] Create scenario planning interface
- [ ] Build what-if analysis tools
- [ ] Develop budget allocation visualizations

**Week 11-12: Multi-tenant Features**
- [ ] Implement agency/client hierarchy
- [ ] Add role-based access control
- [ ] Create usage tracking and limits
- [ ] Build billing integration foundation

**Deliverables:**
- Complete optimization suite
- Multi-tenant functionality
- Advanced user management

### Phase 4: Production Readiness (Weeks 13-16)

**Week 13-14: Performance & Scale**
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Add monitoring and logging
- [ ] Create automated backup system

**Week 15-16: Polish & Documentation**
- [ ] Complete UI/UX refinements
- [ ] Write comprehensive documentation
- [ ] Create video tutorials
- [ ] Implement feedback systems

**Deliverables:**
- Production-ready SaaS platform
- Complete documentation suite
- Deployment and maintenance guides

## Security and Compliance

### Data Security Measures

```python
# middleware/security.py
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer
import jwt

class SecurityMiddleware:
    def __init__(self):
        self.security = HTTPBearer()

    async def verify_tenant_access(
        self, 
        request: Request, 
        tenant_id: str,
        required_role: str = "viewer"
    ):
        """Verify user has access to tenant resources"""
        token = await self.security(request)

        try:
            payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")

            # Check tenant access
            access = await get_user_tenant_access(user_id, tenant_id)

            if not access or not self._has_required_role(access.role, required_role):
                raise HTTPException(403, "Insufficient permissions")

        except jwt.ExpiredSignatureError:
            raise HTTPException(401, "Token expired")
        except jwt.JWTError:
            raise HTTPException(401, "Invalid token")

    def _has_required_role(self, user_role: str, required_role: str) -> bool:
        role_hierarchy = ["viewer", "analyst", "admin", "owner"]
        return role_hierarchy.index(user_role) >= role_hierarchy.index(required_role)
```

## Deployment Configuration

### Replit Deployment Setup

```yaml
# .replit
run = "python main.py"
language = "python3"

[env]
PYTHONPATH = "${PYTHONPATH}:${REPL_HOME}"

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "python main.py"]
deploymentTarget = "autoscale"
ignorePorts = false

[[ports]]
localPort = 8000
externalPort = 80

[packager]
language = "python3"
  [packager.features]
  packageSearch = true
  guessImports = true
  enabledForHosting = false
```

## Key Insights and Recommendations

### Technical Considerations

1. **Google Meridian Requirements**: Python 3.11+ is mandatory, with GPU support strongly recommended for production use. The framework requires TensorFlow Probability and handles Bayesian hierarchical modeling.

2. **Replit Limitations**: While Replit provides excellent developer experience, be aware of resource constraints. Use Autoscale deployments for the web app and Scheduled deployments for background model training.

3. **Multi-tenancy Strategy**: Use shared database with tenant_id isolation pattern for cost-effectiveness. Implement Row Level Security in PostgreSQL for additional data protection.

### User Experience Priorities

1. **Progressive Disclosure**: Start users with basic features and gradually introduce advanced capabilities. This prevents overwhelming non-technical users while allowing power users to access full functionality.

2. **Visual Feedback**: Implement real-time validation, progress indicators, and clear error messages throughout the data upload and model training process.

3. **Guided Workflows**: Use tooltips, contextual help, and step-by-step wizards to guide users through complex MMM concepts.

### Implementation Strategy

1. **MVP First**: Focus on core functionality (data upload, basic model training, simple visualizations) before adding advanced features.

2. **Modular Architecture**: Build services as independent modules to allow for easier testing, maintenance, and scaling.

3. **Background Processing**: Use FastAPI BackgroundTasks for simple operations and consider Celery for heavy model training tasks.

This comprehensive documentation provides a complete blueprint for building a Google Meridian MMM SaaS application on Replit, covering all technical aspects from architecture to implementation, with specific focus on making it accessible to both technical and non-technical users while maintaining enterprise-grade capabilities.