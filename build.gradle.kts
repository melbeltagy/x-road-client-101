import com.github.gradle.node.pnpm.task.PnpmTask
import com.github.gradle.node.npm.task.NpxTask

plugins {
    java
    idea
    eclipse
    checkstyle
    jacoco
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.node.gradle)
    alias(libs.plugins.spotbugs)
    alias(libs.plugins.owasp.dependencycheck)
    alias(libs.plugins.cyclonedx.bom)
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

checkstyle {
    toolVersion = libs.versions.checkstyle.get()
    configDirectory.set(file("${project.rootDir}/config/checkstyle"))
    isIgnoreFailures = false
    isShowViolations = true
}

tasks.named<Checkstyle>("checkstyleMain") {
    source = fileTree("src/main/java")
    configFile = file("${project.rootDir}/config/checkstyle/checkstyle.xml")
    classpath = files()
}

tasks.named<Checkstyle>("checkstyleTest") {
    source = fileTree("src/test/java")
    configFile = file("${project.rootDir}/config/checkstyle/checkstyle.xml")
    classpath = files()
}

jacoco {
    toolVersion = libs.versions.jacoco.get()
}

// Classes to exclude from coverage (DTOs, config, main app, etc.)
val jacocoExcludes = listOf(
    "**/dto/**",
    "**/config/**",
    "**/*App.class",
    "**/*Application.class",
    "**/web/filter/**",
    "**/validation/**"
)

tasks.withType<JacocoReport>().configureEach {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.withType<JacocoCoverageVerification>().configureEach {
    dependsOn(tasks.named("test"))
    dependsOn(tasks.named("jacocoTestReport"))

    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
    }
}

afterEvaluate {
    tasks.withType<JacocoReport>().configureEach {
        classDirectories.setFrom(files(classDirectories.files.map {
            fileTree(it) { exclude(jacocoExcludes) }
        }))
    }
    tasks.withType<JacocoCoverageVerification>().configureEach {
        classDirectories.setFrom(files(classDirectories.files.map {
            fileTree(it) { exclude(jacocoExcludes) }
        }))
    }
}

tasks.named("check") {
    dependsOn(tasks.withType<JacocoCoverageVerification>())
}

// SpotBugs: static analysis. spotbugsMain/spotbugsTest are auto-wired into `check` by the plugin.
// HTML reports are enabled for humans; XML disabled (no tooling consumes it yet).
// Filter file suppresses EI_EXPOSE_REP/EI_EXPOSE_REP2 for DTO classes (immutable view objects).
spotbugs {
    excludeFilter.set(file("${project.rootDir}/config/spotbugs/exclude.xml"))
}

tasks.withType<com.github.spotbugs.snom.SpotBugsTask>().configureEach {
    reports.create("html") {
        required.set(true)
    }
    reports.create("xml") {
        required.set(false)
    }
}

// OWASP Dependency-Check: fail the build when a dependency has a CVSS score >= 7 (HIGH or CRITICAL).
// Standalone task (NOT wired into `check`); run explicitly via `./gradlew dependencyCheckAnalyze`.
//
// NVD API key: the NVD strongly recommends an API key — without one, the unauthenticated rate
// limit (5 requests / 30s rolling window) causes HTTP 429 responses and the update fails.
// CI must set the `NVD_API_KEY` repository secret (request a key at
// https://nvd.nist.gov/developers/request-an-api-key). When the env var is absent the plugin
// falls back to unauthenticated calls with a larger inter-request delay so a local run still
// completes (slower, ~10-15 min on first run).
dependencyCheck {
    failBuildOnCVSS = 7.0f
    val nvdApiKey = System.getenv("NVD_API_KEY")
    nvd {
        if (!nvdApiKey.isNullOrBlank()) {
            apiKey = nvdApiKey
        } else {
            // 8s between requests when no API key (NVD allows ~5/30s unauthenticated → 6s minimum, 8s for safety).
            // With an API key the plugin defaults are fine.
            delay = 8000
        }
    }
    // Backend-only scan. Frontend deps are audited separately via `pnpm audit` in build.yml.
    // The Node Package / Node Audit analyzers require node_modules + a pnpm executable on the
    // runner; rather than installing the FE toolchain in this job, disable them here. (Disabling
    // nodeAudit also disables its pnpm and yarn sub-analyzers.)
    analyzers {
        nodePackage.enabled.set(false)
        nodeAudit.enabled.set(false)
    }
}

// CycloneDX SBOM: use plugin defaults (binds to build/assemble, outputs to build/reports/bom.json).

node {
    nodeProjectDir.set(file("${project.projectDir}/src/main/webapp"))
    version.set("24.16.0")  // LTS version
    pnpmVersion.set("11.2.2")
    download.set(true)
}

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

tasks.register<NpxTask>("webapp_test") {
    workingDir.set(file("${project.projectDir}/src/main/webapp"))
    inputs.property("appVersion", project.version)
    inputs.files(
        "src/main/webapp/package.json",
        "src/main/webapp/pnpm-lock.yaml",
        "src/main/webapp/tsconfig.json",
        "src/main/webapp/vitest.config.ts"
    )
        .withPropertyName("vue-config")
        .withPathSensitivity(PathSensitivity.RELATIVE)
    inputs.dir("src/main/webapp/src/")
        .withPropertyName("vue-source")
        .withPathSensitivity(PathSensitivity.RELATIVE)

    outputs.dir("build/test-results/vitest/")
        .withPropertyName("vitest-result-dir")

    dependsOn(tasks.compileTestJava)
    command.set("pnpm")
    args.set(listOf("test", "--run"))
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
