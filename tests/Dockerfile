FROM mcr.microsoft.com/playwright:v1.56.1-noble
WORKDIR /tests
COPY tests/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY tests/*.mjs ./
CMD ["npm", "test"]
