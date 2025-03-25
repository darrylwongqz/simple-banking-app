#!/bin/bash

# Simple Banking App Docker Runner
# This script provides an easy way to run the banking application with Docker

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    echo "Please install Docker from https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Warning: Docker Compose is not installed or not in PATH."
    echo "Will try to use Docker directly."
    USE_DOCKER_DIRECTLY=true
else
    USE_DOCKER_DIRECTLY=false
fi

echo "========================================"
echo "  Simple Banking App Docker Runner"
echo "========================================"
echo ""

# Function to handle shutdown
function cleanup {
    echo ""
    echo "Shutting down containers..."
    if [ "$USE_DOCKER_DIRECTLY" = true ]; then
        docker stop simple-banking-app 2>/dev/null
    else
        docker-compose down
    fi
    echo "Application stopped."
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

if [ "$USE_DOCKER_DIRECTLY" = true ]; then
    echo "Starting application with Docker..."
    echo ""
    
    # Build the image if it doesn't exist
    if ! docker image inspect simple-banking-app &>/dev/null; then
        echo "Building Docker image..."
        docker build -t simple-banking-app .
    fi
    
    # Run the container
    echo "Starting container..."
    docker run --name simple-banking-app -p 3000:3000 --rm simple-banking-app &
    
    # Wait for container to start
    echo "Waiting for application to start..."
    sleep 5
else
    echo "Starting application with Docker Compose..."
    echo ""
    docker-compose up -d
    
    # Wait for container to start
    echo "Waiting for application to start..."
    sleep 5
fi

echo ""
echo "Application is running!"
echo "Access the Swagger UI at: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop the application"

# Keep the script running to allow for Ctrl+C to work
while true; do
    sleep 1
done 