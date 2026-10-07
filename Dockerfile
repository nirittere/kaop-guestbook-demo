FROM golang:1.27-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /guestbook ./main.go

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=builder /guestbook /app/guestbook
COPY public /app/public
EXPOSE 3000
USER nonroot:nonroot
ENTRYPOINT ["/app/guestbook"]

