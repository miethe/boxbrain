FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
# libpq-dev is needed for psycopg2 (if used) or asyncpg compilation sometimes, 
# but usually binary wheels work. keeping it simple for now.
# gcc is usually not needed for modern python wheels
# RUN apt-get update && apt-get install -y \
#     gcc \
#     && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Create assets directory
RUN mkdir -p assets

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
