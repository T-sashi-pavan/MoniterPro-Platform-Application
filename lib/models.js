"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.Notification = exports.Alert = exports.ServiceMetric = exports.Service = exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'developer', 'viewer'],
        default: 'viewer'
    },
    createdAt: { type: Date, default: Date.now }
});
const ServiceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});
const ServiceMetricSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true },
    status: {
        type: String,
        enum: ['online', 'offline', 'degraded'],
        required: true
    },
    responseTime: { type: Number },
    cpuUsage: { type: Number },
    memoryUsage: { type: Number },
    isHealthy: { type: Boolean, default: true },
    error: { type: String },
    lastChecked: { type: Date, default: Date.now }
});
const AlertSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: true },
    ruleType: {
        type: String,
        enum: ['cpu', 'memory', 'response_time', 'status'],
        required: true
    },
    threshold: { type: Number, required: true },
    comparisonOperator: {
        type: String,
        enum: ['>', '<', '>=', '<='],
        required: true
    },
    notificationMethod: {
        type: String,
        enum: ['email', 'push'],
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});
const NotificationSchema = new mongoose_1.Schema({
    alertId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Alert', required: true },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['sent', 'pending', 'failed'],
        default: 'pending'
    }
});
const LogSchema = new mongoose_1.Schema({
    serviceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Service', required: false },
    level: {
        type: String,
        enum: ['info', 'warning', 'error'],
        required: true
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
// Export models
exports.User = mongoose_1.models.User || (0, mongoose_1.model)('User', UserSchema);
exports.Service = mongoose_1.models.Service || (0, mongoose_1.model)('Service', ServiceSchema);
exports.ServiceMetric = mongoose_1.models.ServiceMetric || (0, mongoose_1.model)('ServiceMetric', ServiceMetricSchema);
exports.Alert = mongoose_1.models.Alert || (0, mongoose_1.model)('Alert', AlertSchema);
exports.Notification = mongoose_1.models.Notification || (0, mongoose_1.model)('Notification', NotificationSchema);
exports.Log = mongoose_1.models.Log || (0, mongoose_1.model)('Log', LogSchema);
//# sourceMappingURL=models.js.map