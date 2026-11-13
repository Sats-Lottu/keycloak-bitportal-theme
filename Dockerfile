# syntax=docker/dockerfile:1
FROM maven:3.9.6-eclipse-temurin-21 AS package
WORKDIR /build
COPY pom.xml LICENSE ./
COPY src src
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp verify

FROM quay.io/keycloak/keycloak:26.8.2
COPY --from=package --chown=keycloak:keycloak /build/target/keycloak-bitportal-theme-*.jar /opt/keycloak/providers/
COPY --chown=keycloak:keycloak tests/bitportal-realm.json /opt/keycloak/data/import/
