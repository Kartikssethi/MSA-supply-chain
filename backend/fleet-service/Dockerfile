# Use official Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /project

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy full app (preserves the app/ package structure)
COPY app/ ./app/

# Expose port (FastAPI default)
EXPOSE 8000

# Run your app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]