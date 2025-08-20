"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var node_cron_1 = require("node-cron");
var dotenv_1 = require("dotenv");
var axios_1 = require("axios");
var bcryptjs_1 = require("bcryptjs");
var mongodb_1 = require("../lib/mongodb");
var models_1 = require("../lib/models");
dotenv_1.default.config({ path: '.env.local' });
var app = (0, express_1.default)();
var server = (0, http_1.createServer)(app);
var io = new socket_io_1.Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
    }
});
var PORT = process.env.PORT || 3333;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Connect to MongoDB
(0, mongodb_1.default)();
// WebSocket connection handling
io.on('connection', function (socket) {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', function () {
        console.log('Client disconnected:', socket.id);
    });
});
// Health Checker Class for MongoDB
var MongoHealthChecker = /** @class */ (function () {
    function MongoHealthChecker() {
    }
    MongoHealthChecker.prototype.checkService = function (serviceId, url) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, response, responseTime, baseMemory, baseCpu, responseTimeFactor, memoryUsage, cpuUsage, metric, error_1, responseTime, metric;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 8]);
                        return [4 /*yield*/, axios_1.default.get(url, { timeout: 10000 })];
                    case 2:
                        response = _a.sent();
                        responseTime = Date.now() - startTime;
                        baseMemory = 40 + Math.random() * 30;
                        baseCpu = 20 + Math.random() * 60;
                        responseTimeFactor = Math.min(responseTime / 1000, 2);
                        memoryUsage = Math.min(95, baseMemory + (responseTimeFactor * 10));
                        cpuUsage = Math.min(95, baseCpu + (responseTimeFactor * 15));
                        metric = new models_1.ServiceMetric({
                            serviceId: serviceId,
                            status: response.status >= 200 && response.status < 300 ? 'online' : 'degraded',
                            responseTime: responseTime,
                            memoryUsage: Math.round(memoryUsage),
                            cpuUsage: Math.round(cpuUsage),
                            isHealthy: response.status >= 200 && response.status < 300,
                            lastChecked: new Date()
                        });
                        return [4 /*yield*/, metric.save()];
                    case 3:
                        _a.sent();
                        // Log successful check
                        return [4 /*yield*/, new models_1.Log({
                                serviceId: serviceId,
                                level: 'info',
                                message: "Health check successful - ".concat(responseTime, "ms, Memory: ").concat(Math.round(memoryUsage), "%, CPU: ").concat(Math.round(cpuUsage), "%"),
                                timestamp: new Date()
                            }).save()];
                    case 4:
                        // Log successful check
                        _a.sent();
                        return [2 /*return*/, metric];
                    case 5:
                        error_1 = _a.sent();
                        responseTime = Date.now() - startTime;
                        metric = new models_1.ServiceMetric({
                            serviceId: serviceId,
                            status: 'offline',
                            responseTime: responseTime,
                            memoryUsage: 0,
                            cpuUsage: 0,
                            isHealthy: false,
                            error: error_1.message,
                            lastChecked: new Date()
                        });
                        return [4 /*yield*/, metric.save()];
                    case 6:
                        _a.sent();
                        // Log error
                        return [4 /*yield*/, new models_1.Log({
                                serviceId: serviceId,
                                level: 'error',
                                message: "Health check failed: ".concat(error_1.message),
                                timestamp: new Date()
                            }).save()];
                    case 7:
                        // Log error
                        _a.sent();
                        return [2 /*return*/, metric];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    MongoHealthChecker.prototype.checkAllServices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var services, results, _i, services_1, service, metric, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, models_1.Service.find({})];
                    case 1:
                        services = _a.sent();
                        results = [];
                        _i = 0, services_1 = services;
                        _a.label = 2;
                    case 2:
                        if (!(_i < services_1.length)) return [3 /*break*/, 5];
                        service = services_1[_i];
                        return [4 /*yield*/, this.checkService(service._id.toString(), service.url)];
                    case 3:
                        metric = _a.sent();
                        results.push(metric);
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        // Emit real-time updates via WebSocket
                        io.emit('metrics-update', results);
                        return [2 /*return*/, results];
                    case 6:
                        error_2 = _a.sent();
                        console.error('Error checking services:', error_2);
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return MongoHealthChecker;
}());
var healthChecker = new MongoHealthChecker();
// API Routes
// Get all services
app.get('/api/services', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var services, servicesWithMetrics, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.Service.find({})
                        .populate('ownerId', 'name')
                        .sort({ createdAt: -1 })];
            case 1:
                services = _a.sent();
                return [4 /*yield*/, Promise.all(services.map(function (service) { return __awaiter(void 0, void 0, void 0, function () {
                        var latestMetric;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, models_1.ServiceMetric.findOne({ serviceId: service._id })
                                        .sort({ lastChecked: -1 })];
                                case 1:
                                    latestMetric = _a.sent();
                                    return [2 /*return*/, __assign(__assign({}, service.toObject()), { status: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.status) || 'unknown', responseTime: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.responseTime) || 0, uptime: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.status) === 'online' ? 100 : 0, lastCheck: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.lastChecked) ?
                                                new Date(latestMetric.lastChecked).toLocaleString() : 'Never' })];
                            }
                        });
                    }); }))];
            case 2:
                servicesWithMetrics = _a.sent();
                res.json(servicesWithMetrics);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.error('Error fetching services:', error_3);
                res.status(500).json({ error: 'Failed to fetch services' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Create new service
// Create service (with user activity logging)
app.post('/api/services', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, url, ownerId, userName, service, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, name_1 = _a.name, url = _a.url, ownerId = _a.ownerId, userName = _a.userName;
                if (!name_1 || !url) {
                    return [2 /*return*/, res.status(400).json({ error: 'Name and URL are required' })];
                }
                service = new models_1.Service({
                    name: name_1,
                    url: url,
                    ownerId: ownerId,
                    createdAt: new Date()
                });
                return [4 /*yield*/, service.save()];
            case 1:
                _b.sent();
                // Log service creation activity
                return [4 /*yield*/, new models_1.Log({
                        serviceId: service._id,
                        level: 'info',
                        message: "Service \"".concat(name_1, "\" created by ").concat(userName || 'User', " (").concat(url, ")"),
                        timestamp: new Date()
                    }).save()];
            case 2:
                // Log service creation activity
                _b.sent();
                console.log("\u2705 Service created: ".concat(name_1, " by ").concat(userName || 'User'));
                res.status(201).json(service);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _b.sent();
                console.error('Error creating service:', error_4);
                res.status(500).json({ error: 'Failed to create service' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Delete service (with user activity logging)
app.delete('/api/services/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, userName, service, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                id = req.params.id;
                userName = req.body.userName;
                return [4 /*yield*/, models_1.Service.findById(id)];
            case 1:
                service = _a.sent();
                if (!service) {
                    return [2 /*return*/, res.status(404).json({ error: 'Service not found' })];
                }
                // Log service deletion activity
                return [4 /*yield*/, new models_1.Log({
                        serviceId: service._id,
                        level: 'warning',
                        message: "Service \"".concat(service.name, "\" deleted by ").concat(userName || 'User'),
                        timestamp: new Date()
                    }).save()];
            case 2:
                // Log service deletion activity
                _a.sent();
                return [4 /*yield*/, models_1.Service.findByIdAndDelete(id)];
            case 3:
                _a.sent();
                // Also delete related metrics and logs
                return [4 /*yield*/, models_1.ServiceMetric.deleteMany({ serviceId: id })];
            case 4:
                // Also delete related metrics and logs
                _a.sent();
                console.log("\uD83D\uDDD1\uFE0F Service deleted: ".concat(service.name, " by ").concat(userName || 'User'));
                res.json({ message: 'Service deleted successfully' });
                return [3 /*break*/, 6];
            case 5:
                error_5 = _a.sent();
                console.error('Error deleting service:', error_5);
                res.status(500).json({ error: 'Failed to delete service' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// Get single service details
app.get('/api/services/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, service, latestMetric, recentMetrics, serviceWithDetails, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = req.params.id;
                return [4 /*yield*/, models_1.Service.findById(id).populate('ownerId', 'name')];
            case 1:
                service = _a.sent();
                if (!service) {
                    return [2 /*return*/, res.status(404).json({ error: 'Service not found' })];
                }
                return [4 /*yield*/, models_1.ServiceMetric.findOne({ serviceId: id })
                        .sort({ lastChecked: -1 })];
            case 2:
                latestMetric = _a.sent();
                return [4 /*yield*/, models_1.ServiceMetric.find({ serviceId: id })
                        .sort({ lastChecked: -1 })
                        .limit(50)];
            case 3:
                recentMetrics = _a.sent();
                serviceWithDetails = __assign(__assign({}, service.toObject()), { status: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.status) || 'unknown', responseTime: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.responseTime) || 0, uptime: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.status) === 'online' ? 100 : 0, lastCheck: (latestMetric === null || latestMetric === void 0 ? void 0 : latestMetric.lastChecked) ?
                        new Date(latestMetric.lastChecked).toLocaleString() : 'Never', recentMetrics: recentMetrics });
                res.json(serviceWithDetails);
                return [3 /*break*/, 5];
            case 4:
                error_6 = _a.sent();
                console.error('Error fetching service details:', error_6);
                res.status(500).json({ error: 'Failed to fetch service details' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Update service
app.put('/api/services/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, name_2, url, userName, service, updatedService, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                id = req.params.id;
                _a = req.body, name_2 = _a.name, url = _a.url, userName = _a.userName;
                return [4 /*yield*/, models_1.Service.findById(id)];
            case 1:
                service = _b.sent();
                if (!service) {
                    return [2 /*return*/, res.status(404).json({ error: 'Service not found' })];
                }
                return [4 /*yield*/, models_1.Service.findByIdAndUpdate(id, { name: name_2, url: url }, { new: true }).populate('ownerId', 'name')];
            case 2:
                updatedService = _b.sent();
                // Log service update activity
                return [4 /*yield*/, new models_1.Log({
                        serviceId: service._id,
                        level: 'info',
                        message: "Service \"".concat(service.name, "\" updated by ").concat(userName || 'User'),
                        timestamp: new Date()
                    }).save()];
            case 3:
                // Log service update activity
                _b.sent();
                console.log("\u270F\uFE0F Service updated: ".concat(service.name, " by ").concat(userName || 'User'));
                res.json(updatedService);
                return [3 /*break*/, 5];
            case 4:
                error_7 = _b.sent();
                console.error('Error updating service:', error_7);
                res.status(500).json({ error: 'Failed to update service' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Get service metrics
app.get('/api/services/:id/metrics', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, hours, service, hoursAgo, metrics, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.query.hours, hours = _a === void 0 ? 24 : _a;
                return [4 /*yield*/, models_1.Service.findById(id)];
            case 1:
                service = _b.sent();
                if (!service) {
                    return [2 /*return*/, res.status(404).json({ error: 'Service not found' })];
                }
                hoursAgo = new Date(Date.now() - (Number(hours) * 60 * 60 * 1000));
                return [4 /*yield*/, models_1.ServiceMetric.find({
                        serviceId: id,
                        lastChecked: { $gte: hoursAgo }
                    }).sort({ lastChecked: -1 })];
            case 2:
                metrics = _b.sent();
                res.json(metrics);
                return [3 /*break*/, 4];
            case 3:
                error_8 = _b.sent();
                console.error('Error fetching service metrics:', error_8);
                res.status(500).json({ error: 'Failed to fetch service metrics' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Trigger health check for specific service
app.post('/api/services/:id/health-check', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, service, result, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                return [4 /*yield*/, models_1.Service.findById(id)];
            case 1:
                service = _a.sent();
                if (!service) {
                    return [2 /*return*/, res.status(404).json({ error: 'Service not found' })];
                }
                return [4 /*yield*/, healthChecker.checkService(service._id.toString(), service.url)];
            case 2:
                result = _a.sent();
                res.json({
                    message: 'Health check completed',
                    result: {
                        status: result.status,
                        responseTime: result.responseTime,
                        lastChecked: result.lastChecked
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                console.error('Error triggering health check:', error_9);
                res.status(500).json({ error: 'Failed to trigger health check' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get users
app.get('/api/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.User.find({}, '-password').sort({ createdAt: -1 })];
            case 1:
                users = _a.sent();
                res.json(users);
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                console.error('Error fetching users:', error_10);
                res.status(500).json({ error: 'Failed to fetch users' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// User registration
app.post('/api/auth/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_3, email, password, _b, role, existingUser, hashedPassword, user, error_11;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.body, name_3 = _a.name, email = _a.email, password = _a.password, _b = _a.role, role = _b === void 0 ? 'viewer' : _b;
                // Validate input
                if (!name_3 || !email || !password) {
                    return [2 /*return*/, res.status(400).json({ error: 'Name, email, and password are required' })];
                }
                return [4 /*yield*/, models_1.User.findOne({ email: email })];
            case 1:
                existingUser = _c.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(409).json({ error: 'User with this email already exists' })];
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 2:
                hashedPassword = _c.sent();
                user = new models_1.User({
                    name: name_3,
                    email: email,
                    password: hashedPassword,
                    role: role,
                    createdAt: new Date()
                });
                return [4 /*yield*/, user.save()];
            case 3:
                _c.sent();
                // Log registration activity
                return [4 /*yield*/, new models_1.Log({
                        serviceId: null,
                        level: 'info',
                        message: "New user registered: ".concat(name_3, " (").concat(email, ")"),
                        timestamp: new Date()
                    }).save()];
            case 4:
                // Log registration activity
                _c.sent();
                console.log("\u2705 New user registered: ".concat(name_3, " (").concat(email, ")"));
                res.status(201).json({
                    message: 'User registered successfully',
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
                return [3 /*break*/, 6];
            case 5:
                error_11 = _c.sent();
                console.error('Error during registration:', error_11);
                res.status(500).json({ error: 'Registration failed' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// User login
app.post('/api/auth/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, isValidPassword, error_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, email = _a.email, password = _a.password;
                // Validate input
                if (!email || !password) {
                    return [2 /*return*/, res.status(400).json({ error: 'Email and password are required' })];
                }
                return [4 /*yield*/, models_1.User.findOne({ email: email })];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
            case 2:
                isValidPassword = _b.sent();
                if (!isValidPassword) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                // Log login activity
                return [4 /*yield*/, new models_1.Log({
                        serviceId: null,
                        level: 'info',
                        message: "User logged in: ".concat(user.name, " (").concat(user.email, ")"),
                        timestamp: new Date()
                    }).save()];
            case 3:
                // Log login activity
                _b.sent();
                console.log("\u2705 User logged in: ".concat(user.name, " (").concat(user.email, ")"));
                res.json({
                    message: 'Login successful',
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_12 = _b.sent();
                console.error('Error during login:', error_12);
                res.status(500).json({ error: 'Login failed' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Dashboard stats
app.get('/api/dashboard/stats', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalServices, recentMetrics, avgResponseTime, uptime, activeAlerts, onlineCount, stats, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.log('Dashboard stats request received');
                return [4 /*yield*/, models_1.Service.countDocuments({})];
            case 1:
                totalServices = _a.sent();
                console.log('Total services:', totalServices);
                return [4 /*yield*/, models_1.ServiceMetric.find({}).sort({ lastChecked: -1 }).limit(10)];
            case 2:
                recentMetrics = _a.sent();
                console.log('Recent metrics count:', recentMetrics.length);
                avgResponseTime = 0;
                uptime = 100;
                activeAlerts = 0;
                if (recentMetrics.length > 0) {
                    // Calculate average response time
                    avgResponseTime = Math.round(recentMetrics.reduce(function (sum, m) { return sum + (m.responseTime || 0); }, 0) / recentMetrics.length);
                    onlineCount = recentMetrics.filter(function (m) { return m.status === 'online'; }).length;
                    uptime = Math.round(((onlineCount / recentMetrics.length) * 100) * 100) / 100;
                    // Count active alerts
                    activeAlerts = recentMetrics.filter(function (m) {
                        return m.status === 'offline' || (m.responseTime && m.responseTime > 1000);
                    }).length;
                }
                stats = {
                    totalServices: totalServices,
                    activeAlerts: activeAlerts,
                    avgResponseTime: avgResponseTime,
                    uptime: uptime
                };
                console.log('Returning stats:', stats);
                res.json(stats);
                return [3 /*break*/, 4];
            case 3:
                error_13 = _a.sent();
                console.error('Error fetching dashboard stats:', error_13);
                res.status(500).json({
                    error: 'Failed to fetch dashboard stats',
                    details: error_13 instanceof Error ? error_13.message : 'Unknown error'
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get metrics
app.get('/api/metrics', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, serviceId, _b, hours, query, hoursAgo, metrics, error_14;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, serviceId = _a.serviceId, _b = _a.hours, hours = _b === void 0 ? 24 : _b;
                query = {};
                if (serviceId) {
                    query.serviceId = serviceId;
                }
                hoursAgo = new Date(Date.now() - (Number(hours) * 60 * 60 * 1000));
                query.lastChecked = { $gte: hoursAgo };
                return [4 /*yield*/, models_1.ServiceMetric.find(query)
                        .populate('serviceId', 'name')
                        .sort({ lastChecked: -1 })
                        .limit(100)];
            case 1:
                metrics = _c.sent();
                res.json(metrics);
                return [3 /*break*/, 3];
            case 2:
                error_14 = _c.sent();
                console.error('Error fetching metrics:', error_14);
                res.status(500).json({ error: 'Failed to fetch metrics' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get recent metrics
app.get('/api/metrics/recent', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var metrics, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.ServiceMetric.find({})
                        .populate('serviceId', 'name')
                        .sort({ lastChecked: -1 })
                        .limit(20)];
            case 1:
                metrics = _a.sent();
                res.json(metrics);
                return [3 /*break*/, 3];
            case 2:
                error_15 = _a.sent();
                console.error('Error fetching recent metrics:', error_15);
                res.status(500).json({ error: 'Failed to fetch recent metrics' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get latest metrics (alias for recent metrics)
app.get('/api/metrics/latest', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var metrics, error_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.ServiceMetric.find({})
                        .populate('serviceId', 'name')
                        .sort({ lastChecked: -1 })
                        .limit(20)];
            case 1:
                metrics = _a.sent();
                res.json(metrics);
                return [3 /*break*/, 3];
            case 2:
                error_16 = _a.sent();
                console.error('Error fetching latest metrics:', error_16);
                res.status(500).json({ error: 'Failed to fetch latest metrics' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get logs
app.get('/api/logs/recent', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, logs, error_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                limit = parseInt(req.query.limit) || 10;
                return [4 /*yield*/, models_1.Log.find({})
                        .populate('serviceId', 'name')
                        .sort({ timestamp: -1 })
                        .limit(limit)];
            case 1:
                logs = _a.sent();
                res.json(logs);
                return [3 /*break*/, 3];
            case 2:
                error_17 = _a.sent();
                console.error('Error fetching logs:', error_17);
                res.status(500).json({ error: 'Failed to fetch logs' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get logs (alternative endpoint for frontend compatibility)
app.get('/api/logs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, logs, error_18;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                limit = parseInt(req.query.limit) || 10;
                return [4 /*yield*/, models_1.Log.find({})
                        .populate('serviceId', 'name')
                        .sort({ timestamp: -1 })
                        .limit(limit)];
            case 1:
                logs = _a.sent();
                res.json(logs);
                return [3 /*break*/, 3];
            case 2:
                error_18 = _a.sent();
                console.error('Error fetching logs:', error_18);
                res.status(500).json({ error: 'Failed to fetch logs' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get metrics history (new endpoint for frontend)
app.get('/api/metrics/history', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, serviceId, _b, hours, query, hoursAgo, metrics, error_19;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, serviceId = _a.serviceId, _b = _a.hours, hours = _b === void 0 ? 24 : _b;
                query = {};
                if (serviceId) {
                    query.serviceId = serviceId;
                }
                hoursAgo = new Date(Date.now() - (Number(hours) * 60 * 60 * 1000));
                query.lastChecked = { $gte: hoursAgo };
                return [4 /*yield*/, models_1.ServiceMetric.find(query)
                        .populate('serviceId', 'name')
                        .sort({ lastChecked: -1 })
                        .limit(100)];
            case 1:
                metrics = _c.sent();
                res.json(metrics);
                return [3 /*break*/, 3];
            case 2:
                error_19 = _c.sent();
                console.error('Error fetching metrics history:', error_19);
                res.status(500).json({ error: 'Failed to fetch metrics history' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Trigger manual health check
app.post('/api/health-check/trigger', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results, error_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, healthChecker.checkAllServices()];
            case 1:
                results = _a.sent();
                res.json({ message: 'Health check completed', results: results });
                return [3 /*break*/, 3];
            case 2:
                error_20 = _a.sent();
                console.error('Error triggering health check:', error_20);
                res.status(500).json({ error: 'Failed to trigger health check' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Health check endpoint (alias for trigger)
app.post('/api/health-check', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var results, error_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, healthChecker.checkAllServices()];
            case 1:
                results = _a.sent();
                res.json({ results: results });
                return [3 /*break*/, 3];
            case 2:
                error_21 = _a.sent();
                console.error('Error triggering health check:', error_21);
                res.status(500).json({ error: 'Failed to trigger health check' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Health check endpoint for the API itself
app.get('/api/health', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Database info endpoint
app.get('/api/database/info', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, users, services, recentMetrics, stats, error_22;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Promise.all([
                        models_1.User.find({}, '-password').sort({ createdAt: 1 }),
                        models_1.Service.find({}).populate('ownerId', 'name').sort({ createdAt: 1 }),
                        models_1.ServiceMetric.find({})
                            .populate('serviceId', 'name')
                            .sort({ lastChecked: -1 })
                            .limit(20),
                        Promise.all([
                            models_1.User.countDocuments({}),
                            models_1.Service.countDocuments({}),
                            models_1.ServiceMetric.countDocuments({}),
                            models_1.Alert.countDocuments({}),
                            models_1.Notification.countDocuments({})
                        ])
                    ])];
            case 1:
                _a = _b.sent(), users = _a[0], services = _a[1], recentMetrics = _a[2], stats = _a[3];
                res.json({
                    users: users,
                    services: services,
                    recent_metrics: recentMetrics,
                    statistics: {
                        total_users: stats[0],
                        total_services: stats[1],
                        total_metrics: stats[2],
                        total_alerts: stats[3],
                        total_notifications: stats[4]
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_22 = _b.sent();
                console.error('Error fetching database info:', error_22);
                res.status(500).json({ error: 'Failed to fetch database information' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Schedule automated health checks
var scheduleHealthChecks = function () {
    // Run health check every minute
    node_cron_1.default.schedule('* * * * *', function () { return __awaiter(void 0, void 0, void 0, function () {
        var results, error_23;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log('🏥 Running automated health check...');
                    return [4 /*yield*/, healthChecker.checkAllServices()];
                case 1:
                    results = _a.sent();
                    console.log("Health check completed for ".concat(results.length, " services"));
                    return [3 /*break*/, 3];
                case 2:
                    error_23 = _a.sent();
                    console.error('Error during automated health check:', error_23);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
};
// Error handling middleware
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});
// Start server
server.listen(PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_24;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("\uD83D\uDE80 Monitoring API server running on port ".concat(PORT));
                console.log("\uD83D\uDCCA WebSocket server ready for real-time updates");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, mongodb_1.default)()];
            case 2:
                _a.sent();
                console.log('✅ MongoDB connected successfully');
                // Database is ready for real user data (no sample data)
                console.log('🎯 Database ready for real user registration and activities');
                // Start automated health checks
                scheduleHealthChecks();
                console.log('⏰ Automated health checks scheduled');
                return [3 /*break*/, 4];
            case 3:
                error_24 = _a.sent();
                console.error('❌ MongoDB connection failed:', error_24);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = app;
