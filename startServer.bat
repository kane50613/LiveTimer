@echo off

call npm run build
start http://127.0.0.1:8080
start http://127.0.0.1:8080/admin.html
call npm run start