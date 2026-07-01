# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM rust:1.88-bookworm AS backend-builder
WORKDIR /build/backend
COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src
COPY backend/migrations ./migrations
RUN cargo build --locked --release

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates libssl3 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --create-home grover

WORKDIR /app
COPY --from=backend-builder /build/backend/target/release/grover-landscaping-api /usr/local/bin/grover-landscaping-api
COPY --from=frontend-builder /build/frontend/dist /app/frontend

ENV APP_ENV=production \
    FRONTEND_DIST_DIR=/app/frontend \
    PORT=10000 \
    RUST_LOG=grover_landscaping_api=info,tower_http=info

USER grover
EXPOSE 10000

CMD ["grover-landscaping-api"]
