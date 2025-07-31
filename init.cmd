@echo off

if [%1]==[--force] (
   echo Deleting node_modules
   rd /S /Q node_modules
)

echo Installing node_modules
call npm i

echo Compiling CryptoBot
call node_modules\.bin\tsc