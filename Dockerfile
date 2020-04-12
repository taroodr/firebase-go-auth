FROM golang:1.14.2-alpine3.11 AS build

WORKDIR /go/app
COPY . .
RUN apk update \
  && apk add --no-cache git 
RUN cd api && go build -o bin/app main.go
RUN go get github.com/oxequa/realize

FROM alpine:3.8
COPY --from=build /go/api/bin/app /usr/local/bin/
CMD ["app"]