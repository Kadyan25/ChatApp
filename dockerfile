# Stage 1: build the jar
FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

# Copy Maven config and sources
COPY pom.xml .
COPY src ./src

# Build the project (skips tests to be faster)
RUN mvn -q -DskipTests=true clean package

# Stage 2: run the jar
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copy built jar from the first stage
COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080

# Use the render profile
ENV SPRING_PROFILES_ACTIVE=render

ENTRYPOINT ["java","-jar","/app/app.jar"]
