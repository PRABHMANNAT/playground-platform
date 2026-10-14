FROM python:3.14-slim
WORKDIR /workspace
COPY services/api/requirements.txt /workspace/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/api /workspace/services/api
ENV PYTHONPATH=/workspace/services/api
RUN useradd --system --uid 10001 playground
USER playground
CMD ["uvicorn", "playground.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
