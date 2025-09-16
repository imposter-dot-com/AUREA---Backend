export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
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
    
    // Log suspicious activity
    if (res.statusCode >= 400) {
      console.warn('Suspicious request:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};