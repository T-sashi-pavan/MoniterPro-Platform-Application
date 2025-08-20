"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthChecker = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = __importDefault(require("../lib/database"));
class HealthChecker {
    constructor() {
        this.checkTimeout = 10000; // 10 seconds timeout
    }
    async checkService(service) {
        const startTime = Date.now();
        try {
            const response = await axios_1.default.get(service.url, {
                timeout: this.checkTimeout,
                validateStatus: (status) => status < 500, // Consider 4xx as "online" but will log
            });
            const responseTime = Date.now() - startTime;
            const status = response.status < 400 ? 'online' : 'offline';
            return {
                service_id: service.id,
                status,
                response_time: responseTime,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                service_id: service.id,
                status: 'offline',
                response_time: responseTime > this.checkTimeout ? null : responseTime,
                error: error.message,
            };
        }
    }
    async checkAllServices() {
        try {
            const { rows: services } = await database_1.default.query('SELECT * FROM services');
            const checkPromises = services.map(service => this.checkService(service));
            const results = await Promise.allSettled(checkPromises);
            return results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                }
                else {
                    return {
                        service_id: services[index].id,
                        status: 'offline',
                        response_time: null,
                        error: 'Check failed',
                    };
                }
            });
        }
        catch (error) {
            console.error('Error checking services:', error);
            return [];
        }
    }
    async saveMetrics(results) {
        const client = await database_1.default.connect();
        try {
            await client.query('BEGIN');
            for (const result of results) {
                await client.query(`INSERT INTO service_metrics (service_id, status, response_time, cpu_usage, memory_usage, last_checked) 
           VALUES ($1, $2, $3, $4, $5, $6)`, [result.service_id, result.status, result.response_time, null, null, new Date()]);
                // Log errors if service is offline
                if (result.status === 'offline' && result.error) {
                    await client.query(`INSERT INTO logs (service_id, level, message, timestamp) 
             VALUES ($1, $2, $3, $4)`, [result.service_id, 'error', `Service check failed: ${result.error}`, new Date()]);
                }
            }
            await client.query('COMMIT');
        }
        catch (error) {
            await client.query('ROLLBACK');
            console.error('Error saving metrics:', error);
        }
        finally {
            client.release();
        }
    }
    async getLatestMetrics() {
        try {
            const { rows } = await database_1.default.query(`
        SELECT DISTINCT ON (service_id) 
          sm.*, s.name as service_name, s.url as service_url
        FROM service_metrics sm
        JOIN services s ON sm.service_id = s.id
        ORDER BY service_id, last_checked DESC
      `);
            return rows;
        }
        catch (error) {
            console.error('Error getting latest metrics:', error);
            return [];
        }
    }
    async getMetricsHistory(serviceId, hours = 24) {
        try {
            const query = serviceId
                ? `SELECT sm.*, s.name as service_name, s.url as service_url
           FROM service_metrics sm
           JOIN services s ON sm.service_id = s.id
           WHERE sm.service_id = $1 AND sm.last_checked > NOW() - INTERVAL '${hours} hours'
           ORDER BY sm.last_checked DESC`
                : `SELECT sm.*, s.name as service_name, s.url as service_url
           FROM service_metrics sm
           JOIN services s ON sm.service_id = s.id
           WHERE sm.last_checked > NOW() - INTERVAL '${hours} hours'
           ORDER BY sm.last_checked DESC`;
            const { rows } = await database_1.default.query(query, serviceId ? [serviceId] : []);
            return rows;
        }
        catch (error) {
            console.error('Error getting metrics history:', error);
            return [];
        }
    }
}
exports.HealthChecker = HealthChecker;
//# sourceMappingURL=health-checker.js.map