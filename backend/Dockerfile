FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for pgvector, asyncpg, etc.)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy start script and make executable
COPY start.sh .
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Run startup script
CMD ["./start.sh"]
