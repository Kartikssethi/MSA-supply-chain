# Use official Python image
FROM python:3.12-slim

# Set working directory inside container
WORKDIR /project

# Copy requirements first (for caching)
# This layer won't rebuild unless requirements.txt changes
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy full app (preserves the app/ package structure)
COPY app/ ./app/

# Expose port (Auth Service runs on 8001)
EXPOSE 8001

# Run the app
# --host 0.0.0.0 is required to allow external access (from outside the container)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
