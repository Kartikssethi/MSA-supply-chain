# Use official Python image
FROM python:3.12-slim

# Set working directory inside container
WORKDIR /project

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy full app (preserves the app/ package structure)
COPY app/ ./app/

# Expose port (Frontend expects 8004)
EXPOSE 8004

# Run your app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8004"]