@echo off
set PGPASSWORD=Sessi111111@@@@@@

echo ==========================================
echo   MONITORING DATABASE QUICK VIEW
echo ==========================================

echo.
echo [USERS TABLE]
psql -h localhost -p 5432 -U postgres -d monitoringdb -c "SELECT id, name, email, role FROM users;"

echo.
echo [SERVICES TABLE] 
psql -h localhost -p 5432 -U postgres -d monitoringdb -c "SELECT id, name, url FROM services;"

echo.
echo [RECENT METRICS - Last 5]
psql -h localhost -p 5432 -U postgres -d monitoringdb -c "SELECT s.name, sm.status, sm.response_time, sm.last_checked FROM service_metrics sm JOIN services s ON sm.service_id = s.id ORDER BY sm.last_checked DESC LIMIT 5;"

echo.
echo [DATABASE STATS]
psql -h localhost -p 5432 -U postgres -d monitoringdb -c "SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM services) as services, (SELECT COUNT(*) FROM service_metrics) as metrics;"

pause
