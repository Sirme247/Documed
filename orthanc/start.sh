#!/bin/bash
echo "Starting Orthanc DICOM Server..."
docker-compose up -d
echo "Orthanc is running at http://localhost:8042"
echo "Username: admin"
echo "Password: Check .env file"