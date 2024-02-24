FROM python:3.12.0-alpine3.17
ENV PYTHONUNBUFFERED 1

RUN apk update \
    && apk add jq

WORKDIR /gpxstudio
COPY . .

RUN chmod +x run.sh 

CMD ["./run.sh"]

# Build:
#    docker build -t gpxstudio .
#
# Run:
#    docker run -it --rm -p 8000:8000 -e mapboxApiKey=123 -e openAipKey=xyz -e routing_url=https://routing.gpx.studio gpxstudio
#    open your browser at http://localhost:8000