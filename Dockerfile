FROM python:3.12-slim

WORKDIR /app
COPY ./app .
COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000
CMD ["flask", "run", "-h", "0.0.0.0", "-p", "5000"]
