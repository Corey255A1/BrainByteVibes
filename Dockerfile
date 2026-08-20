# Stage 1: Build PWA Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Python Backend & Bundle Static PWA
FROM python:3.11-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy python backend requirements & install
COPY backend/pyproject.toml backend/README.md ./
COPY backend/app ./app
RUN pip install --no-cache-dir .

# Copy built frontend dist from Stage 1 into /app/static
COPY --from=frontend-builder /app/frontend/dist ./static

ENV STATIC_DIR=/app/static
ENV ARTICLES_DIR=/data/articles
ENV DATABASE_URL=sqlite:////data/antiscroll.db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
