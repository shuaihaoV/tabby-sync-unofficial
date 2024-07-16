FROM rust:latest AS rust_builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM node:alpine AS node_builder
WORKDIR /app/frontend
COPY frontend .
RUN npm install && npm run build

FROM debian:latest AS production
WORKDIR /app
COPY --from=rust_builder /app/target/release/tabby-sync-unofficial /app
COPY --from=rust_builder /app/migrations /app/migrations
COPY --from=node_builder /app/frontend/out /app/static-root

EXPOSE 3000

CMD ["./tabby-sync-unofficial"]