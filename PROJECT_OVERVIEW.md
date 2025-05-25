# Marketing Mix Modeling Application

## Project Overview
A modern Marketing Mix Modeling application using Google's Meridian for advanced media attribution and budget optimization.

## Key Features
- CSV data upload for marketing spend and sales data
- Bayesian MMM with adstock and saturation curves
- Channel ROI analysis with confidence intervals
- Budget optimization accounting for diminishing returns
- Interactive visualization of media response curves

## Project Structure
```
├── client
│   ├── src
│   │   ├── components
│   │   │   ├── dashboard
│   │   │   │   ├── model-config.tsx
│   │   │   │   ├── model-summary.tsx
│   │   │   │   ├── new-model-form.tsx
│   │   │   │   ├── optimization-section.tsx
│   │   │   │   ├── response-curves.tsx
│   │   │   │   └── training-progress.tsx
│   │   │   ├── layout
│   │   │   │   ├── main-layout.tsx
│   │   │   │   └── sidebar.tsx
│   │   │   ├── ui (shadcn components)
│   │   │   ├── create-project-dialog.tsx
│   │   │   └── file-upload.tsx
│   │   ├── hooks
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-theme-toggle.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib
│   │   │   ├── queryClient.ts
│   │   │   ├── theme-provider.tsx
│   │   │   └── utils.ts
│   │   ├── pages
│   │   │   ├── dashboard.tsx
│   │   │   ├── datasets.tsx
│   │   │   ├── model-details.tsx
│   │   │   ├── models.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── optimizations.tsx
│   │   │   ├── projects.tsx
│   │   │   └── upload-dataset.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── index.html
├── python_scripts
│   ├── optimize_budget.py
│   └── train_meridian.py
├── server
│   ├── controllers
│   │   ├── datasets.ts
│   │   ├── models.ts
│   │   └── projects.ts
│   ├── utils
│   │   └── python-runner.ts
│   ├── db.ts
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared
│   └── schema.ts
├── components.json
├── drizzle.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Core Files
1. **shared/schema.ts** - Contains our complete data model with tables for users, projects, datasets, models, model results, and optimization scenarios.

2. **server/storage.ts** - Implements our database access layer with methods for all CRUD operations.

3. **python_scripts/train_meridian.py** - Core script that integrates with Google's Meridian library to train marketing mix models.

4. **python_scripts/optimize_budget.py** - Handles budget optimization calculations based on trained models.

5. **server/controllers/models.ts** - Contains the logic for model creation, training, and retrieving results.

6. **server/controllers/datasets.ts** - Manages dataset uploads and processing.

7. **client/src/pages/upload-dataset.tsx** - Frontend interface for uploading marketing datasets.

8. **client/src/components/dashboard/model-summary.tsx** - Visualizes model results including channel contributions and ROI.

9. **client/src/components/dashboard/response-curves.tsx** - Displays saturation and adstock curves for marketing channels.

10. **client/src/components/dashboard/optimization-section.tsx** - Shows budget optimization recommendations.

## Technology Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Data Science**: Google's Meridian (Python)

## Installation Requirements
- Node.js and npm
- Python 3.8+
- PostgreSQL database
- Google's Meridian: `pip install git+https://github.com/google/meridian.git`

## Getting Started
1. Start the application: `npm run dev`
2. Access the application at: http://localhost:5000