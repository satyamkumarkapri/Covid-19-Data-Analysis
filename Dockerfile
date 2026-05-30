# Use the official lightweight Python image.
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 7860 (Hugging Face Spaces default port)
EXPOSE 7860

# Command to run the application using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]
