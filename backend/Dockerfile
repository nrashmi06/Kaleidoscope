# Use OpenJDK 17 as base image
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the JAR file from the target directory
COPY target/*.jar app.jar

# Create directory for application logs and set permissions
RUN mkdir -p /app/logs && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Run the application without specifying a profile
# This will use the default profile
ENTRYPOINT ["java", "-jar", "app.jar"]