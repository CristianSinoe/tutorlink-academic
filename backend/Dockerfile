# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# No private Maven settings or credentials enter the build context.
COPY pom.xml .

# Ahora el resto del código
COPY src ./src

# Empaquetamos
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests package

# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Seguridad: usuario no-root
RUN addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /app/logs && chown spring:spring /app /app/logs

# Copiamos el JAR del stage anterior
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar
USER spring:spring

# Ajustes JVM razonables para contenedor
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Render/Local: la app escucha en este puerto (Render te asigna uno y lo inyecta como PORT)
EXPOSE 8080

# Arranque
ENTRYPOINT ["java","-jar","/app/app.jar"]
