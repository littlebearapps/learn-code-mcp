#!/usr/bin/env node

/**
 * Debug Learn Code MCP Server
 * Systematic testing and debugging
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ServerDebugger {
  constructor() {
    this.serverPath = join(__dirname, 'dist', 'server.js');
  }

  async debugServerStartup() {
    console.log('🔍 Debug 1: Testing server startup...\n');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      
      serverProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('📤 STDOUT:', data.toString());
      });

      serverProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log('❌ STDERR:', data.toString());
      });

      serverProcess.on('close', (code) => {
        console.log(`🔚 Server exited with code: ${code}`);
        console.log(`📊 Total stdout: ${stdout.length} chars`);
        console.log(`📊 Total stderr: ${stderr.length} chars\n`);
        resolve({ code, stdout, stderr });
      });

      // Let it run for 3 seconds then kill
      setTimeout(() => {
        console.log('⏰ Killing server after 3s...');
        serverProcess.kill();
      }, 3000);
    });
  }

  async debugJSONRPCCommunication() {
    console.log('🔍 Debug 2: Testing JSON-RPC communication...\n');
    
    return new Promise((resolve) => {
      const serverProcess = spawn('node', [this.serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let response = '';
      let errorOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        response += data.toString();
        console.log('📤 Received:', data.toString());
      });

      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.log('❌ Error:', data.toString());
      });

      serverProcess.on('close', (code) => {
        console.log(`🔚 Communication test ended with code: ${code}`);
        console.log(`📊 Response length: ${response.length} chars`);
        console.log(`📊 Error length: ${errorOutput.length} chars\n`);
        resolve({ code, response, errorOutput });
      });

      // Send a simple JSON-RPC request after 1 second
      setTimeout(() => {
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'prompts/list'
        };
        
        console.log('📤 Sending request:', JSON.stringify(request, null, 2));
        serverProcess.stdin.write(JSON.stringify(request) + '\n');
        
        // Wait for response then close
        setTimeout(() => {
          serverProcess.kill();
        }, 2000);
      }, 1000);
    });
  }

  async debugServerDirectly() {
    console.log('🔍 Debug 3: Testing server class directly...\n');
    
    try {
      // Import the server class directly
      const { LearnCodeMCPServer } = await import('./dist/server.js');
      
      console.log('✅ Server class imported successfully');
      
      // Try to create an instance
      const server = new LearnCodeMCPServer();
      console.log('✅ Server instance created successfully');
      
      // Check if server has expected properties
      console.log('📊 Server properties:');
      console.log('- Has server:', !!server.server);
      console.log('- Has secretRedactor:', !!server.secretRedactor);
      console.log('- Has constructClassifier:', !!server.constructClassifier);
      console.log('- Has preferencesManager:', !!server.preferencesManager);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Direct server test failed:', error.message);
      console.error('Stack:', error.stack);
      return { success: false, error };
    }
  }

  async debugLibraryImports() {
    console.log('🔍 Debug 4: Testing library imports...\n');
    
    const libraries = [
      './dist/lib/secret-redactor.js',
      './dist/lib/construct-classifier.js', 
      './dist/lib/preferences-manager.js',
      './dist/lib/response-streamer.js'
    ];
    
    for (const lib of libraries) {
      try {
        const module = await import(lib);
        console.log(`✅ ${lib} imported successfully`);
        console.log(`   Exports:`, Object.keys(module));
      } catch (error) {
        console.error(`❌ ${lib} import failed:`, error.message);
      }
    }
  }

  async runAllDebugTests() {
    console.log('🚨 Learn Code MCP Server Debug Suite\n');
    console.log('📁 Server path:', this.serverPath);
    console.log('🕐 Starting comprehensive debugging...\n');

    const results = {};
    
    try {
      results.startup = await this.debugServerStartup();
      results.communication = await this.debugJSONRPCCommunication();
      results.direct = await this.debugServerDirectly();
      await this.debugLibraryImports();
      
      console.log('📋 Debug Summary:');
      console.log('- Startup test:', results.startup.code === null ? 'KILLED' : `EXIT ${results.startup.code}`);
      console.log('- Communication test:', results.communication.response ? 'GOT RESPONSE' : 'NO RESPONSE');
      console.log('- Direct instantiation:', results.direct.success ? 'SUCCESS' : 'FAILED');
      
      if (results.direct.success) {
        console.log('\n✅ Core server functionality appears to work');
        console.log('🔍 Issue likely in JSON-RPC transport or stdio handling');
      } else {
        console.log('\n❌ Core server has fundamental issues');
      }
      
    } catch (error) {
      console.error('❌ Debug suite failed:', error.message);
      process.exit(1);
    }
  }
}

// Run debug tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ServerDebugger();
  tester.runAllDebugTests();
}