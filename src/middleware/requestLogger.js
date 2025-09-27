export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // List of paths to ignore in logging (common browser requests)
  const ignorePaths = ['/favicon.ico', '/robots.txt', '/manifest.json', '/apple-touch-icon.png'];
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    // Skip logging for ignored paths (like favicon.ico)
    if (ignorePaths.includes(req.originalUrl)) {
      return;
    }
    
    // Log suspicious activity (but not for ignored paths)
    if (res.statusCode >= 400) {
      console.warn('Suspicious request:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};