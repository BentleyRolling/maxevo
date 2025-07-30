const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('~/utils/logger');

/**
 * MaxEvo Terminal Takeover System
 * Claude Code clone - allows AI agents to execute terminal commands and manage files
 */
class MaxEvoTerminal {
  constructor(maxevoCore) {
    this.maxevoCore = maxevoCore;
    this.activeProcesses = new Map();
    this.workingDirectory = process.cwd();
    this.sessionId = null;
    this.commandHistory = [];
    this.isSecureMode = true; // Enhanced security by default
  }

  /**
   * Initialize terminal session
   */
  async initialize(sessionId, options = {}) {
    try {
      this.sessionId = sessionId;
      this.workingDirectory = options.workingDirectory || process.cwd();
      this.isSecureMode = options.secureMode !== false;

      logger.info(`[MaxEvo Terminal] Session initialized: ${sessionId}`);
      
      // Log session start
      await this.logTerminalEvent('session_start', {
        sessionId,
        workingDirectory: this.workingDirectory,
        secureMode: this.isSecureMode
      });

      return {
        success: true,
        sessionId: this.sessionId,
        workingDirectory: this.workingDirectory,
        secureMode: this.isSecureMode
      };

    } catch (error) {
      logger.error('[MaxEvo Terminal] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Execute a terminal command with security checks
   */
  async executeCommand(command, options = {}) {
    try {
      // Security validation
      if (this.isSecureMode && !this.isCommandSafe(command)) {
        throw new Error(`Command blocked by security policy: ${command}`);
      }

      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info(`[MaxEvo Terminal] Executing command: ${command} (ID: ${commandId})`);

      // Add to command history
      this.commandHistory.push({
        id: commandId,
        command,
        timestamp: new Date().toISOString(),
        workingDirectory: this.workingDirectory,
        status: 'running'
      });

      // Execute command
      const result = await this.runCommand(command, options);
      
      // Update command history
      const historyIndex = this.commandHistory.findIndex(h => h.id === commandId);
      if (historyIndex !== -1) {
        this.commandHistory[historyIndex] = {
          ...this.commandHistory[historyIndex],
          status: result.success ? 'completed' : 'failed',
          exitCode: result.exitCode,
          executionTime: result.executionTime,
          output: result.output.substring(0, 10000) // Limit output size
        };
      }

      // Log terminal event
      await this.logTerminalEvent('command_executed', {
        commandId,
        command,
        success: result.success,
        exitCode: result.exitCode,
        executionTime: result.executionTime
      });

      return {
        commandId,
        success: result.success,
        exitCode: result.exitCode,
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        workingDirectory: this.workingDirectory
      };

    } catch (error) {
      logger.error(`[MaxEvo Terminal] Command execution failed: ${command}`, error);
      
      await this.logTerminalEvent('command_failed', {
        command,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Run command with timeout and output capture
   */
  async runCommand(command, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const timeout = options.timeout || 30000; // 30 second default timeout
      
      const child = exec(command, {
        cwd: this.workingDirectory,
        env: { ...process.env, ...options.env },
        timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;
        
        if (error) {
          resolve({
            success: false,
            exitCode: error.code || 1,
            output: stdout || '',
            error: stderr || error.message,
            executionTime
          });
        } else {
          resolve({
            success: true,
            exitCode: 0,
            output: stdout || '',
            error: stderr || '',
            executionTime
          });
        }
      });

      // Store active process
      const processId = `proc_${Date.now()}`;
      this.activeProcesses.set(processId, child);

      // Clean up on completion
      child.on('exit', () => {
        this.activeProcesses.delete(processId);
      });
    });
  }

  /**
   * Security validation for commands
   */
  isCommandSafe(command) {
    const blockedCommands = [
      'rm -rf /',
      'rm -rf *',
      'format',
      'del /q',
      'deltree',
      ':(){ :|:& };:', // Fork bomb
      'sudo rm',
      'chmod 777',
      'dd if=',
      'mkfs',
    ];

    const blockedPatterns = [
      /rm\s+-rf\s+\/[^\/]/,
      /rm\s+-rf\s+\*/,
      /sudo\s+rm/,
      /chmod\s+777/,
      />\s*\/dev\/sd[a-z]/,
      /passwd\s+root/,
    ];

    // Check exact matches
    if (blockedCommands.some(blocked => command.toLowerCase().includes(blocked.toLowerCase()))) {
      return false;
    }

    // Check regex patterns
    if (blockedPatterns.some(pattern => pattern.test(command))) {
      return false;
    }

    return true;
  }

  /**
   * Read file content
   */
  async readFile(filePath, options = {}) {
    try {
      const fullPath = path.resolve(this.workingDirectory, filePath);
      
      // Security check - prevent reading outside working directory
      if (this.isSecureMode && !fullPath.startsWith(this.workingDirectory)) {
        throw new Error('Access denied: Cannot read files outside working directory');
      }

      const stats = await fs.stat(fullPath);
      
      // Check file size (limit to 50MB)
      if (stats.size > 50 * 1024 * 1024) {
        throw new Error('File too large to read (>50MB)');
      }

      const encoding = options.encoding || 'utf8';
      const content = await fs.readFile(fullPath, encoding);

      await this.logTerminalEvent('file_read', {
        filePath: fullPath,
        size: stats.size
      });

      return {
        success: true,
        content,
        size: stats.size,
        lastModified: stats.mtime.toISOString()
      };

    } catch (error) {
      logger.error(`[MaxEvo Terminal] File read failed: ${filePath}`, error);
      
      await this.logTerminalEvent('file_read_failed', {
        filePath,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath, content, options = {}) {
    try {
      const fullPath = path.resolve(this.workingDirectory, filePath);
      
      // Security check
      if (this.isSecureMode && !fullPath.startsWith(this.workingDirectory)) {
        throw new Error('Access denied: Cannot write files outside working directory');
      }

      // Create directory if it doesn't exist
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      const encoding = options.encoding || 'utf8';
      await fs.writeFile(fullPath, content, encoding);

      const stats = await fs.stat(fullPath);

      await this.logTerminalEvent('file_written', {
        filePath: fullPath,
        size: stats.size
      });

      return {
        success: true,
        filePath: fullPath,
        size: stats.size,
        lastModified: stats.mtime.toISOString()
      };

    } catch (error) {
      logger.error(`[MaxEvo Terminal] File write failed: ${filePath}`, error);
      
      await this.logTerminalEvent('file_write_failed', {
        filePath,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath = '.', options = {}) {
    try {
      const fullPath = path.resolve(this.workingDirectory, dirPath);
      
      // Security check
      if (this.isSecureMode && !fullPath.startsWith(this.workingDirectory)) {
        throw new Error('Access denied: Cannot access directories outside working directory');
      }

      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      const items = await Promise.all(
        entries.map(async (entry) => {
          const itemPath = path.join(fullPath, entry.name);
          const stats = await fs.stat(itemPath);
          
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
            permissions: stats.mode.toString(8)
          };
        })
      );

      await this.logTerminalEvent('directory_listed', {
        dirPath: fullPath,
        itemCount: items.length
      });

      return {
        success: true,
        path: fullPath,
        items
      };

    } catch (error) {
      logger.error(`[MaxEvo Terminal] Directory listing failed: ${dirPath}`, error);
      throw error;
    }
  }

  /**
   * Change working directory
   */
  async changeDirectory(newPath) {
    try {
      const fullPath = path.resolve(this.workingDirectory, newPath);
      
      // Verify directory exists
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      this.workingDirectory = fullPath;

      await this.logTerminalEvent('directory_changed', {
        newPath: fullPath
      });

      return {
        success: true,
        workingDirectory: this.workingDirectory
      };

    } catch (error) {
      logger.error(`[MaxEvo Terminal] Directory change failed: ${newPath}`, error);
      throw error;
    }
  }

  /**
   * Kill active process
   */
  async killProcess(processId) {
    try {
      const process = this.activeProcesses.get(processId);
      if (!process) {
        throw new Error(`Process not found: ${processId}`);
      }

      process.kill('SIGTERM');
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);

      this.activeProcesses.delete(processId);

      await this.logTerminalEvent('process_killed', {
        processId
      });

      return { success: true, processId };

    } catch (error) {
      logger.error(`[MaxEvo Terminal] Process kill failed: ${processId}`, error);
      throw error;
    }
  }

  /**
   * Get terminal session status
   */
  getStatus() {
    return {
      sessionId: this.sessionId,
      workingDirectory: this.workingDirectory,
      activeProcesses: Array.from(this.activeProcesses.keys()),
      commandHistoryLength: this.commandHistory.length,
      secureMode: this.isSecureMode,
      lastActivity: this.commandHistory.length > 0 
        ? this.commandHistory[this.commandHistory.length - 1].timestamp 
        : null
    };
  }

  /**
   * Get command history
   */
  getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit);
  }

  /**
   * Log terminal events
   */
  async logTerminalEvent(eventType, data) {
    try {
      if (this.maxevoCore) {
        // This would typically call the MCP log endpoint
        logger.info(`[MaxEvo Terminal] Event: ${eventType}`, {
          sessionId: this.sessionId,
          ...data
        });
      }
    } catch (error) {
      logger.error('[MaxEvo Terminal] Failed to log event:', error);
    }
  }

  /**
   * Clean up terminal session
   */
  async cleanup() {
    try {
      // Kill all active processes
      for (const [processId, process] of this.activeProcesses) {
        try {
          process.kill('SIGTERM');
        } catch (error) {
          logger.warn(`[MaxEvo Terminal] Failed to kill process ${processId}:`, error);
        }
      }

      this.activeProcesses.clear();
      
      await this.logTerminalEvent('session_cleanup', {
        sessionId: this.sessionId
      });

      logger.info(`[MaxEvo Terminal] Session cleaned up: ${this.sessionId}`);

    } catch (error) {
      logger.error('[MaxEvo Terminal] Cleanup failed:', error);
    }
  }
}

module.exports = MaxEvoTerminal;