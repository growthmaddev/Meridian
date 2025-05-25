import { Request, Response } from "express";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";

/**
 * Run the GPU assessment script and return results
 */
export const testGpuResources = async (req: Request, res: Response) => {
  try {
    const scriptPath = path.join(process.cwd(), "python_scripts", "test_gpu_resources.py");
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ 
        error: "GPU assessment script not found",
        details: `Script not found at ${scriptPath}`
      });
    }
    
    console.log(`Running GPU assessment script: ${scriptPath}`);
    
    // Run the Python script
    const pythonProcess = spawn("python", [scriptPath]);
    
    let scriptOutput = "";
    let scriptError = "";
    
    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      scriptOutput += output;
      console.log(`[GPU Test] ${output.trim()}`);
    });
    
    pythonProcess.stderr.on("data", (data) => {
      const error = data.toString();
      scriptError += error;
      console.error(`[GPU Test Error] ${error.trim()}`);
    });
    
    // Handle script completion
    pythonProcess.on("close", (code) => {
      console.log(`GPU assessment script exited with code ${code}`);
      
      if (code !== 0) {
        return res.status(500).json({ 
          error: "GPU assessment failed", 
          code, 
          output: scriptOutput,
          errorOutput: scriptError 
        });
      }
      
      // Try to read the JSON results file
      try {
        const resultsPath = path.join(process.cwd(), "gpu_assessment.json");
        if (fs.existsSync(resultsPath)) {
          const results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
          return res.status(200).json(results);
        } else {
          return res.status(404).json({ 
            error: "GPU assessment results not found",
            output: scriptOutput
          });
        }
      } catch (readError) {
        console.error("Error reading GPU assessment results:", readError);
        return res.status(500).json({ 
          error: "Failed to read GPU assessment results", 
          details: readError instanceof Error ? readError.message : String(readError),
          output: scriptOutput
        });
      }
    });
    
    // Handle unexpected errors
    pythonProcess.on("error", (error) => {
      console.error("Error running GPU assessment script:", error);
      return res.status(500).json({ 
        error: "Failed to execute GPU assessment script", 
        details: error.message
      });
    });
    
  } catch (error) {
    console.error("Error in GPU assessment controller:", error);
    return res.status(500).json({ 
      error: "Internal server error during GPU assessment",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get the latest GPU assessment results
 */
export const getGpuStatus = async (req: Request, res: Response) => {
  try {
    const resultsPath = path.join(process.cwd(), "gpu_assessment.json");
    
    if (!fs.existsSync(resultsPath)) {
      return res.status(404).json({ error: "GPU assessment results not found" });
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
    return res.status(200).json(results);
    
  } catch (error) {
    console.error("Error retrieving GPU status:", error);
    return res.status(500).json({ 
      error: "Failed to retrieve GPU status",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};