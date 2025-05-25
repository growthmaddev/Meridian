import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { log } from '../vite';

interface PythonRunnerOptions {
  script: string;
  args: string[];
  onData?: (data: any) => void;
  onError?: (error: string) => void;
  onComplete?: (code: number | null) => void;
}

export async function runPythonScript({
  script,
  args,
  onData,
  onError,
  onComplete
}: PythonRunnerOptions): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), script);
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      const error = `Python script not found: ${scriptPath}`;
      if (onError) onError(error);
      resolve({ success: false, output: error });
      return;
    }
    
    log(`Running Python script: ${scriptPath} with args: ${args.join(' ')}`, 'python-runner');
    
    // First install Meridian if needed
    const installProcess = spawn('pip', ['install', 'git+https://github.com/google/meridian.git']);
    
    let installOutput = '';
    
    installProcess.stdout.on('data', (data) => {
      installOutput += data.toString();
    });
    
    installProcess.stderr.on('data', (data) => {
      installOutput += data.toString();
    });
    
    installProcess.on('close', (code) => {
      if (code !== 0) {
        const error = `Failed to install Meridian: ${installOutput}`;
        if (onError) onError(error);
        resolve({ success: false, output: error });
        return;
      }
      
      // Now run the actual script
      const pythonProcess = spawn('python3', [scriptPath, ...args]);
      
      let output = '';
      let jsonOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        const strData = data.toString();
        output += strData;
        
        // Try to parse JSON output from the script
        try {
          const lines = strData.split('\n');
          for (const line of lines) {
            if (line.trim()) {
              const jsonData = JSON.parse(line);
              jsonOutput += line + '\n';
              if (onData) onData(jsonData);
            }
          }
        } catch (e) {
          // Not JSON data, that's fine
        }
      });
      
      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        output += error;
        if (onError) onError(error);
      });
      
      pythonProcess.on('close', (code) => {
        if (onComplete) onComplete(code);
        
        if (code === 0) {
          resolve({ success: true, output: jsonOutput || output });
        } else {
          resolve({ success: false, output });
        }
      });
    });
  });
}
