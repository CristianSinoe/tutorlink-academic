# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiamos sólo pom primero para cache de dependencias
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline

# Ahora el resto del código
COPY src ./src

# Empaquetamos
RUN mvn -q -DskipTests package

# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Seguridad: usuario no-root
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiamos el JAR del stage anterior
COPY --from=build /app/target/*.jar app.jar

# Ajustes JVM razonables para contenedor
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Render/Local: la app escucha en este puerto (Render te asigna uno y lo inyecta como PORT)
EXPOSE 8080

# Arranque
ENTRYPOINT ["java","-jar","/app/app.jar"]
