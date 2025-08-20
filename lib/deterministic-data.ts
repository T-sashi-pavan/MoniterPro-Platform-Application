// Utility functions for generating deterministic data that won't cause hydration mismatches

// Simple seeded random number generator (LCG)
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Create deterministic sample data based on current time (rounded to prevent hydration issues)
export function generateDeterministicSampleData(count: number = 10) {
  // Use current hour as seed to ensure same data during SSR and client render
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const rng = new SeededRandom(currentHour);
  
  const data = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = new Date(now - (count - i) * 30 * 1000);
    data.push({
      time: time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      cpu: rng.range(30, 70),
      memory: rng.range(40, 90),
      responseTime: rng.range(100, 300),
    });
  }
  
  return data;
}

// Generate deterministic system stats
export function generateDeterministicSystemStats() {
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const rng = new SeededRandom(currentHour + 1000); // Different seed for different data
  
  return {
    avgResponseTime: rng.range(150, 350),
    onlineServices: 8,
    totalServices: 10,
    uptime: 99.5,
    memoryUsage: rng.range(45, 75),
    cpuUsage: rng.range(35, 75),
  };
}

// Generate deterministic log data
export function generateDeterministicLogData(count: number = 100) {
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const rng = new SeededRandom(currentHour + 2000); // Different seed for logs
  
  const logLevels = ["info", "warning", "error", "debug"];
  const services = ["API Gateway", "User Service", "Database", "Auth Service", "Payment Gateway"];
  const messages = [
    "Request processed successfully",
    "Database connection established", 
    "User authentication failed",
    "High memory usage detected",
    "Service response time exceeded threshold",
    "Cache miss for user data",
    "Payment transaction completed",
    "SSL certificate expires soon",
    "Rate limit exceeded for IP",
    "Backup process completed",
  ];

  const baseTime = Date.now();
  const logs = [];

  for (let i = 0; i < count; i++) {
    // Use deterministic time offsets
    const timeOffset = i * 36000 + rng.range(0, 3600000); // Spread over hours with some randomness
    logs.push({
      id: i + 1,
      timestamp: new Date(baseTime - timeOffset).toISOString(),
      level: logLevels[rng.range(0, logLevels.length - 1)],
      service: services[rng.range(0, services.length - 1)],
      message: messages[rng.range(0, messages.length - 1)],
    });
  }

  // Sort by timestamp (newest first)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Generate a single deterministic metric data point
export function generateDeterministicMetricPoint() {
  const currentMinute = Math.floor(Date.now() / (1000 * 60));
  const rng = new SeededRandom(currentMinute + 3000); // Different seed for real-time updates
  
  return {
    time: new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }),
    cpu: rng.range(30, 70),
    memory: rng.range(40, 90),
    responseTime: rng.range(100, 300),
  };
}

// Generate a single deterministic log entry
export function generateDeterministicLogEntry() {
  const currentMinute = Math.floor(Date.now() / (1000 * 60));
  const rng = new SeededRandom(currentMinute + 4000); // Different seed for log updates
  
  const logLevels = ["info", "warning", "error", "debug"];
  const services = ["API Gateway", "User Service", "Database", "Auth Service", "Payment Gateway"];
  const messages = [
    "Request processed successfully",
    "Database connection established", 
    "User authentication failed",
    "High memory usage detected",
    "Service response time exceeded threshold",
    "Cache miss for user data",
    "Payment transaction completed",
    "SSL certificate expires soon",
    "Rate limit exceeded for IP",
    "Backup process completed",
  ];

  return {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    level: logLevels[rng.range(0, logLevels.length - 1)],
    service: services[rng.range(0, services.length - 1)],
    message: messages[rng.range(0, messages.length - 1)],
  };
}
