import com.github.gradle.node.pnpm.task.PnpmTask

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
        "-Dnet.bytebuddy.experimental=true"
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

tasks.withType<JavaCompile>().configureEach {
    options.compilerArgs.addAll(listOf(
        "-Xlint:all",
        "-Xlint:deprecation",
        "-Xlint:-processing",
        "-Xlint:-serial",
        "-Werror"
    ))
    options.isDeprecation = true
    options.encoding = "UTF-8"
    options.isIncremental = true
}

val webappDir = file("src/main/webapp")

tasks.register<PnpmTask>("webapp") {
    workingDir.set(webappDir)
    inputs.property("appVersion", project.version)
    inputs.files(
        "src/main/webapp/package.json",
        "src/main/webapp/pnpm-lock.yaml",
        "src/main/webapp/tsconfig.json",
        "src/main/webapp/vite.config.ts"
    )
        .withPropertyName("config-files")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("src/main/webapp/src/")
        .withPropertyName("webapp-source")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("src/main/webapp/public/")
        .withPropertyName("public-assets")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    outputs.dir("build/resources/main/static/")
        .withPropertyName("webapp-output")

    dependsOn("pnpmInstall")
    pnpmCommand.set(listOf("run", "build"))
    environment.set(mapOf("VITE_APP_VERSION" to project.version.toString()))
}

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

dependencies {
    implementation(libs.spring.boot.starter.actuator)
    implementation(libs.spring.boot.starter.logging)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.restclient)
    annotationProcessor(libs.spring.boot.configuration.processor)

    implementation(libs.jackson.datatype.jsr310)

    implementation(libs.mapstruct)
    annotationProcessor(libs.mapstruct.processor)

    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)

    implementation(libs.commons.lang3)
    implementation(libs.bouncycastle.pkix)

    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.spring.boot.test)
    testImplementation(libs.spring.boot.test.autoconfigure)
    testImplementation(libs.archunit.junit5.api) {
        exclude(group = "org.slf4j", module = "slf4j-api")
    }
    testRuntimeOnly(libs.archunit.junit5.engine) {
        exclude(group = "org.slf4j", module = "slf4j-api")
    }
}
