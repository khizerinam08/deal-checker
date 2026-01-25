# Use an official Python runtime with Chrome pre-installed
# We use a base image that already has Python + Chrome setup to save headache
FROM python:3.9-slim

# Install system dependencies (wget, gnupg, etc.)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable

# Set working directory
WORKDIR /app

# Copy the server directory (where your scraper lives)
COPY server/ ./server/

# Install Python dependencies
# Adjust the path below if you put requirements.txt somewhere else
RUN pip install --no-cache-dir -r server/scrapers/Dominos/requirements.txt

# Set the command to run your scraper
# This is what the Cron Job will execute
CMD ["python", "server/scrapers/Dominos/scraper-for-dominos.py"]