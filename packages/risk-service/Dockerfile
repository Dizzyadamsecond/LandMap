# Build stage
FROM rust:1.75 as builder

WORKDIR /app
COPY . .

RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/risk-service /usr/local/bin/

EXPOSE 3002

CMD ["risk-service"]
