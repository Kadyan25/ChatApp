FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/ChatApp-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 8080

# Set default profile to 'render' for Docker
ENV SPRING_PROFILES_ACTIVE=render

ENTRYPOINT ["java","-jar","/app/app.jar"]
