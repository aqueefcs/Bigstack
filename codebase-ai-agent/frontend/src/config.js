/**
 * Application Configuration
 * 
 * This file centralizes API configuration for the frontend.
 * 
 * For local development:
 *   - Uses proxy configured in package.json (http://localhost:3000)
 *   - API_URL can be empty or '/api'
 * 
 * For production:
 *   - Set REACT_APP_API_URL environment variable
 *   - Example: REACT_APP_API_URL=https://your-api-gateway-url.amazonaws.com/prod
 */

const config = {
  // API base URL - defaults to empty string for relative paths (uses proxy in dev)
  // In production, this should be set via REACT_APP_API_URL environment variable
  apiUrl: process.env.REACT_APP_API_URL || '',
  
  // Full API endpoint helper
  getApiUrl: (endpoint) => {
    const baseUrl = config.apiUrl;
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    if (baseUrl) {
      // Production: use full URL
      return `${baseUrl}/${cleanEndpoint}`;
    } else {
      // Development: use relative path (proxy will handle it)
      return `/${cleanEndpoint}`;
    }
  }
};

export default config;

