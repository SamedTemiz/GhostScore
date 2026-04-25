FROM python:3.12-slim

# Güvenlik: root olmayan kullanıcı
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Bağımlılıkları önce kopyala (Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Uygulama dosyalarını kopyala
COPY app/ ./app/

# Güvenlik: root olmayan kullanıcıya geç
USER appuser

# Ortam değişkenleri (gerçek değerler runtime'da inject edilir)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

EXPOSE 8000

# Production: uvicorn workers = 2 * CPU + 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--no-access-log"]
