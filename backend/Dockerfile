FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy pre-built JAR from local target/
COPY target/*.jar app.jar

RUN mkdir -p /app/logs && \
    chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]