# Use OpenJDK 21 instead of 17
FROM eclipse-temurin:21-jre-alpine

# Rest of your Dockerfile remains the same
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY target/*.jar app.jar
RUN mkdir -p /app/logs && \
    chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]