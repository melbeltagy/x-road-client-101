# Build stage
FROM eclipse-temurin:25-jdk AS build

# Frontend configuration (build-time)
ARG VITE_MAX_HISTORY_ENTRIES=25
ENV VITE_MAX_HISTORY_ENTRIES=$VITE_MAX_HISTORY_ENTRIES

WORKDIR /app
COPY . .
RUN ./gradlew -Pprod clean bootJar -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:25-jre
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "--enable-native-access=ALL-UNNAMED", "-jar", "/app.jar"]
