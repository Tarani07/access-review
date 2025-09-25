# SparrowVision IGA User Sync - Production Docker Image
FROM python:3.11-slim

# Set labels for container metadata
LABEL maintainer="SparrowVision Team <it-admin@surveysparrow.com>"
LABEL version="2.0"
LABEL description="IGA User Synchronization Service for SparrowVision"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app directory and non-root user
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY iga_user_sync.py .
COPY example_usage.py .
COPY test_connection.py .
COPY config.env.example .

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data /app/exports && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; import os; exit(0 if os.getenv('IGA_API_KEY') else 1)"

# Default command - run connection test first, then sync
CMD ["sh", "-c", "python test_connection.py && python iga_user_sync.py"]
