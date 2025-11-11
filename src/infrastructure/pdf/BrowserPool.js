/**
 * Browser Pool Manager
 *
 * Manages a pool of Puppeteer browser instances for efficient PDF generation.
 * Reuses browser instances across requests to avoid initialization overhead.
 *
 * Features:
 * - Configurable pool size
 * - Automatic cleanup of idle browsers
 * - Health checks for browser instances
 * - Graceful shutdown handling
 */

import logger from '../logging/Logger.js';

// Dynamic imports for production/development Chrome handling
let puppeteer;
let chromium;

// Detect environment and load appropriate Chrome binary
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;
const isVercel = process.env.VERCEL !== undefined;
const isServerless = isRailway || isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;

// Initialize Puppeteer with appropriate configuration
async function initializePuppeteer() {
  try {
    if (isServerless || process.env.USE_SERVERLESS_CHROME === 'true') {
      // Use serverless Chrome for Railway/Vercel/AWS
      logger.info('Loading serverless Chrome configuration...');
      const chromiumModule = await import('@sparticuz/chromium');
      chromium = chromiumModule.default;
      const puppeteerCore = await import('puppeteer-core');
      puppeteer = puppeteerCore.default;
      logger.info('Serverless Chrome loaded successfully');
    } else {
      // Use regular Puppeteer for development/VPS
      const puppeteerModule = await import('puppeteer');
      puppeteer = puppeteerModule.default;
      logger.info('Regular Puppeteer loaded successfully');
    }
  } catch (error) {
    logger.error('Failed to initialize Puppeteer', {
      error: error.message,
      isProduction,
      isServerless
    });
    // Fallback to regular puppeteer
    const puppeteerModule = await import('puppeteer');
    puppeteer = puppeteerModule.default;
  }
}

// Initialize on module load
await initializePuppeteer();

class BrowserPool {
  constructor() {
    this.pool = [];
    this.inUse = new Set();
    this.maxSize = parseInt(process.env.PDF_BROWSER_POOL_SIZE || '3', 10);
    this.idleTimeout = parseInt(process.env.PDF_BROWSER_IDLE_TIMEOUT || '300000', 10); // 5 minutes

    // Base browser arguments
    this.browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      // Additional performance optimizations
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ];

    this.cleanupInterval = null;
    this.isShuttingDown = false;

    // Start cleanup interval
    this.startCleanupInterval();

    // Handle process shutdown
    this.setupShutdownHandlers();
  }

  /**
   * Initialize a new browser instance
   */
  async createBrowser() {
    try {
      let launchOptions;

      if (chromium && (isServerless || process.env.USE_SERVERLESS_CHROME === 'true')) {
        // Use serverless Chrome configuration
        launchOptions = {
          args: [...chromium.args, ...this.browserArgs],
          defaultViewport: chromium.defaultViewport || {
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
          },
          executablePath: await chromium.executablePath(),
          headless: chromium.headless || 'new'
        };
        logger.info('Launching browser with serverless Chrome', {
          executablePath: launchOptions.executablePath
        });
      } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        // Use custom Chrome path (e.g., from Nixpacks)
        launchOptions = {
          headless: 'new',
          args: this.browserArgs,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
          defaultViewport: {
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
          }
        };
        logger.info('Launching browser with custom executable path', {
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        });
      } else {
        // Use default Puppeteer configuration
        launchOptions = {
          headless: 'new',
          args: this.browserArgs,
          defaultViewport: {
            width: 1200,
            height: 1600,
            deviceScaleFactor: 2
          }
        };
        logger.info('Launching browser with default Puppeteer configuration');
      }

      const browser = await puppeteer.launch(launchOptions);

      // Add metadata
      browser._createdAt = Date.now();
      browser._lastUsed = Date.now();
      browser._useCount = 0;

      logger.info('Browser created for pool', {
        poolSize: this.pool.length + 1,
        maxSize: this.maxSize
      });

      return browser;
    } catch (error) {
      logger.error('Failed to create browser', {
        error: error.message,
        stack: error.stack,
        isProduction,
        isServerless,
        isRailway,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        nodeEnv: process.env.NODE_ENV,
        useServerlessChrome: process.env.USE_SERVERLESS_CHROME
      });

      // Provide helpful error message for common issues
      if (error.message.includes('Failed to launch') || error.message.includes('spawn')) {
        const helpMessage = isServerless
          ? 'Chrome binary not found. Ensure @sparticuz/chromium is installed and Railway/Vercel has Chromium buildpack configured.'
          : 'Chrome binary not found. Install Chromium or set PUPPETEER_EXECUTABLE_PATH environment variable.';

        logger.error(helpMessage);
        throw new Error(`${error.message}\n${helpMessage}`);
      }

      throw error;
    }
  }

  /**
   * Get a browser from the pool
   */
  async acquire() {
    if (this.isShuttingDown) {
      throw new Error('Browser pool is shutting down');
    }

    // Try to get an available browser from the pool
    let browser = this.pool.find(b => !this.inUse.has(b));

    if (browser) {
      // Check if browser is still healthy
      if (await this.isBrowserHealthy(browser)) {
        this.inUse.add(browser);
        browser._lastUsed = Date.now();
        browser._useCount++;
        logger.debug('Browser acquired from pool', {
          useCount: browser._useCount,
          poolSize: this.pool.length
        });
        return browser;
      } else {
        // Remove unhealthy browser
        await this.removeBrowser(browser);
        browser = null;
      }
    }

    // Create new browser if pool not at max size
    if (this.pool.length < this.maxSize) {
      browser = await this.createBrowser();
      this.pool.push(browser);
      this.inUse.add(browser);
      browser._useCount = 1;
      return browser;
    }

    // Wait for a browser to become available
    logger.warn('Browser pool at max capacity, waiting...', {
      maxSize: this.maxSize,
      inUse: this.inUse.size
    });

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        if (this.isShuttingDown) {
          clearInterval(checkInterval);
          reject(new Error('Browser pool is shutting down'));
          return;
        }

        browser = this.pool.find(b => !this.inUse.has(b));
        if (browser) {
          clearInterval(checkInterval);
          if (await this.isBrowserHealthy(browser)) {
            this.inUse.add(browser);
            browser._lastUsed = Date.now();
            browser._useCount++;
            resolve(browser);
          } else {
            await this.removeBrowser(browser);
            // Try to create a new one
            try {
              browser = await this.createBrowser();
              this.pool.push(browser);
              this.inUse.add(browser);
              browser._useCount = 1;
              resolve(browser);
            } catch (error) {
              reject(error);
            }
          }
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for available browser'));
      }, 30000);
    });
  }

  /**
   * Release a browser back to the pool
   */
  async release(browser) {
    if (!browser) return;

    this.inUse.delete(browser);
    browser._lastUsed = Date.now();

    // Clear pages to free memory
    try {
      const pages = await browser.pages();
      for (const page of pages.slice(1)) { // Keep about:blank
        await page.close().catch(() => {});
      }
    } catch (error) {
      logger.warn('Error clearing browser pages', { error: error.message });
    }

    // Check if browser should be recycled (after 100 uses)
    if (browser._useCount > 100) {
      logger.info('Recycling browser after heavy use', { useCount: browser._useCount });
      await this.removeBrowser(browser);
      // Create replacement if not shutting down
      if (!this.isShuttingDown && this.pool.length < this.maxSize) {
        try {
          const newBrowser = await this.createBrowser();
          this.pool.push(newBrowser);
        } catch (error) {
          logger.error('Failed to create replacement browser', { error: error.message });
        }
      }
    }

    logger.debug('Browser released to pool', {
      useCount: browser._useCount,
      poolSize: this.pool.length
    });
  }

  /**
   * Check if a browser instance is healthy
   */
  async isBrowserHealthy(browser) {
    if (!browser || !browser.isConnected()) {
      return false;
    }

    try {
      // Try to create a new page as health check
      const page = await browser.newPage();
      await page.close();
      return true;
    } catch (error) {
      logger.warn('Browser health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Remove a browser from the pool
   */
  async removeBrowser(browser) {
    const index = this.pool.indexOf(browser);
    if (index > -1) {
      this.pool.splice(index, 1);
    }
    this.inUse.delete(browser);

    try {
      await browser.close();
    } catch (error) {
      logger.warn('Error closing browser', { error: error.message });
    }

    logger.info('Browser removed from pool', { poolSize: this.pool.length });
  }

  /**
   * Clean up idle browsers
   */
  async cleanupIdleBrowsers() {
    if (this.isShuttingDown) return;

    const now = Date.now();
    const browsersToRemove = [];

    for (const browser of this.pool) {
      if (!this.inUse.has(browser)) {
        const idleTime = now - browser._lastUsed;
        if (idleTime > this.idleTimeout) {
          browsersToRemove.push(browser);
        }
      }
    }

    for (const browser of browsersToRemove) {
      logger.info('Removing idle browser', {
        idleMinutes: Math.round(this.idleTimeout / 60000)
      });
      await this.removeBrowser(browser);
    }

    // Ensure minimum pool size (at least 1 browser ready)
    if (!this.isShuttingDown && this.pool.length === 0) {
      try {
        const browser = await this.createBrowser();
        this.pool.push(browser);
        logger.info('Maintained minimum pool size');
      } catch (error) {
        logger.error('Failed to maintain minimum pool size', { error: error.message });
      }
    }
  }

  /**
   * Start the cleanup interval
   */
  startCleanupInterval() {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleBrowsers().catch(error => {
        logger.error('Cleanup interval error', { error: error.message });
      });
    }, 60000);
  }

  /**
   * Setup shutdown handlers
   */
  setupShutdownHandlers() {
    const shutdown = async () => {
      if (this.isShuttingDown) return;

      this.isShuttingDown = true;
      logger.info('Browser pool shutting down...');

      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }

      // Close all browsers
      const closePromises = this.pool.map(browser =>
        browser.close().catch(error =>
          logger.warn('Error closing browser during shutdown', { error: error.message })
        )
      );

      await Promise.all(closePromises);
      logger.info('Browser pool shutdown complete');
    };

    process.on('exit', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in browser pool', { error: error.message });
      shutdown();
    });
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      available: this.pool.length - this.inUse.size,
      maxSize: this.maxSize,
      totalUseCount: this.pool.reduce((sum, b) => sum + (b._useCount || 0), 0)
    };
  }

  /**
   * Pre-warm the pool with browsers
   */
  async warmUp() {
    logger.info('Warming up browser pool...');

    const targetSize = Math.min(2, this.maxSize); // Pre-create 2 browsers
    const promises = [];

    for (let i = 0; i < targetSize; i++) {
      promises.push(
        this.createBrowser()
          .then(browser => {
            this.pool.push(browser);
            return browser;
          })
          .catch(error => {
            logger.error('Failed to pre-warm browser', { error: error.message });
          })
      );
    }

    await Promise.all(promises);
    logger.info('Browser pool warmed up', { poolSize: this.pool.length });
  }

  /**
   * Force shutdown all browsers
   */
  async shutdown() {
    this.isShuttingDown = true;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    for (const browser of this.pool) {
      await this.removeBrowser(browser);
    }

    logger.info('Browser pool force shutdown complete');
  }
}

// Export singleton instance
const browserPool = new BrowserPool();

// Pre-warm the pool on startup (non-blocking)
browserPool.warmUp().catch(error => {
  logger.error('Failed to warm up browser pool', { error: error.message });
});

export default browserPool;