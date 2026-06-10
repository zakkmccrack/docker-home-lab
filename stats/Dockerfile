FROM python:3.11-slim

# Installiamo solo i tool di compilazione necessari
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    build-essential \
    ufw \
    iptables \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5450", "--timeout", "120", "app:app"]