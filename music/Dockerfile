FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 5451

CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5451", "--timeout", "120", "app:app"]