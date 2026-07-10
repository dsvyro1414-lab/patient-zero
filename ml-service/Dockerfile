# Explicit image so the build does not depend on the platform's Python installer
# (Railway's Railpack/mise failed to fetch a pinned CPython). python:3.12-slim
# has the wheels for the whole scientific stack and keeps the image small.
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The service reads models/ and data/ relative to src/app.py (__file__-based),
# so --app-dir src is all that is needed. $PORT is injected by the host.
ENV PORT=8000
CMD uvicorn app:app --app-dir src --host 0.0.0.0 --port ${PORT}
