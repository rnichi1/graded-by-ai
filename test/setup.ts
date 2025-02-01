import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as Redis from 'redis';

// Load test environment variables
dotenv.config({ path: '.env.test' });

async function setupTestEnvironment() {
  try {
    console.log('Setting up test environment...');
    console.log(`Redis config - Host: ${process.env.REDIS_HOST}, Port: ${process.env.REDIS_PORT}`);

    // Check Redis using actual connection
    const client = Redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    try {
      await client.connect();
      console.log('✓ Redis is running and connected');
      await client.quit();
    } catch (error) {
      console.error('✗ Redis connection failed:', error);
      console.log('Starting Redis container...');
      
      try {
        // Stop any existing container first
        try {
          execSync('docker-compose -f docker-compose.test.yml down');
        } catch (e) {
          // Ignore errors from down command
        }

        // Start new container
        execSync('docker-compose -f docker-compose.test.yml up -d redis');
        console.log('Redis container started successfully');
        
        // Wait for Redis to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try connecting again
        await client.connect();
        console.log('✓ Redis is now running and connected');
        await client.quit();
      } catch (dockerError) {
        console.error('Failed to start Redis container:', dockerError);
        process.exit(1);
      }
    }

    console.log('Test environment is ready');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    process.exit(1);
  }
}

export default setupTestEnvironment;
