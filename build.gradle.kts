import com.github.gradle.node.npm.task.NpmTask

plugins {
    java
    idea
    eclipse
    alias(libs.plugins.spring.boot)
    id("xroad.java-conventions")
    id("node-conventions")
}

group = "com.nortal.xroad.restapi.client"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_25
    targetCompatibility = JavaVersion.VERSION_25
}

require(System.getProperty("java.specification.version") == "25") {
    "Java 25 is required to build this project"
}

repositories {
    mavenCentral()
}

apply(plugin = "io.spring.dependency-management")

// -Pprod for production build (webpack optimization)
val isProd = project.hasProperty("prod")

idea {
    module {
        excludeDirs = excludeDirs + files("node_modules")
    }
}

eclipse {
    sourceSets {
        main {
            java {
                srcDirs("build/generated/sources/annotationProcessor/java/main")
            }
        }
    }
}

defaultTasks("bootRun")

springBoot {
    mainClass.set("com.nortal.xroad.restapi.client.XRoadExampleRestapiClientApp")
}

tasks.bootRun {
    jvmArgs("--enable-native-access=ALL-UNNAMED")  // Required for Netty with Java 21+
}

// =============================================================================
// Testing
// =============================================================================

tasks.test {
    useJUnitPlatform()
    exclude("**/*IT*", "**/*IntTest*")
    testLogging {
        events("FAILED", "SKIPPED")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
    jvmArgs(
        "-Djava.security.egd=file:/dev/./urandom",
        "-Xmx512m",
        "-Dnet.bytebuddy.experimental=true"  // Required for Mockito to work with Java 25
    )
    reports.html.required.set(false)
}

tasks.register<Test>("integrationTest") {
    description = "Execute integration tests."
    group = "verification"
    maxHeapSize = "1G"
    useJUnitPlatform()
    include("**/*IT*", "**/*IntTest*")
    testClassesDirs = sourceSets.test.get().output.classesDirs
    classpath = sourceSets.test.get().runtimeClasspath
    testLogging {
        events("FAILED", "SKIPPED")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
    }
    systemProperty("spring.profiles.active", "test")
    systemProperty("java.security.egd", "file:/dev/./urandom")
    systemProperty("net.bytebuddy.experimental", "true")
    reports.html.required.set(false)
    dependsOn(tasks.test)
}

tasks.check {
    dependsOn("integrationTest")
}

tasks.register<TestReport>("testReport") {
    destinationDirectory.set(layout.buildDirectory.dir("reports/tests"))
    testResults.from(tasks.test)
}

tasks.register<TestReport>("integrationTestReport") {
    destinationDirectory.set(layout.buildDirectory.dir("reports/tests"))
    testResults.from(tasks.named("integrationTest"))
}

// =============================================================================
// Java Compiler
// =============================================================================

tasks.withType<JavaCompile>().configureEach {
    options.compilerArgs.addAll(listOf(
        "-Xlint:all",
        "-Xlint:deprecation",
        "-Xlint:-processing",  // MapStruct generates these
        "-Xlint:-serial",
        "-Werror"
    ))
    options.isDeprecation = true
    options.encoding = "UTF-8"
    options.isIncremental = true
}

// =============================================================================
// Frontend (Webpack)
// =============================================================================

val webpackCommand = if (isProd) "webapp:prod" else "webapp:build"

tasks.register<NpmTask>("webapp") {
    inputs.property("appVersion", project.version)
    inputs.files("package-lock.json", "package.json", "tsconfig.json", ".postcssrc")
        .withPropertyName("config-files")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("src/main/webapp/")
        .withPropertyName("webapp-source")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("webpack/")
        .withPropertyName("webpack-config")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.dir("build/resources/main/static/")
        .withPropertyName("webapp-output")

    dependsOn("npmInstall")
    args.set(listOf("run", webpackCommand))
    environment.set(mapOf("APP_VERSION" to project.version.toString()))
}

// =============================================================================
// Resource Processing
// =============================================================================

tasks.processResources {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    inputs.property("version", version)
    filesMatching("**/application.yml") {
        filter { it.replace("@project.version@", version.toString()) }
    }
}

tasks.named("webapp") {
    mustRunAfter(tasks.processResources)
}

tasks.classes {
    dependsOn("webapp")
}

tasks.compileJava {
    dependsOn(tasks.processResources)
}

tasks.named("bootJar") {
    dependsOn(tasks.processResources)
}

tasks.register<Delete>("cleanResources") {
    delete("build/resources")
}

// =============================================================================
// Dependencies
// =============================================================================

configurations {
    create("providedRuntime")
}

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-logging")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")

    // Jackson
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

    // MapStruct
    implementation(libs.mapstruct)
    annotationProcessor(libs.mapstruct.processor)

    // Utilities
    implementation("org.apache.commons:commons-lang3")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-test")
    testImplementation(libs.archunit.junit5.api) {
        exclude(group = "org.slf4j", module = "slf4j-api")
    }
    testRuntimeOnly(libs.archunit.junit5.engine) {
        exclude(group = "org.slf4j", module = "slf4j-api")
    }
}
