package com.nortal.xroad.restapi.client;

import static com.tngtech.archunit.base.DescribedPredicate.alwaysTrue;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.belongToAnyOf;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import org.springframework.beans.factory.annotation.Autowired;

import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packagesOf = XRoadExampleRestapiClientApp.class, importOptions = DoNotIncludeTests.class)
class TechnicalStructureTest {

    // prettier-ignore
    @ArchTest
    static final ArchRule respectsTechnicalArchitectureLayers = layeredArchitecture()
        .consideringAllDependencies()
        .optionalLayer("Config").definedBy("..config..")
        .optionalLayer("Web").definedBy("..web..")
        .optionalLayer("Service").definedBy("..service..")

        .whereLayer("Config").mayNotBeAccessedByAnyLayer()
        .whereLayer("Web").mayOnlyBeAccessedByLayers("Config")
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Web", "Config")

        .ignoreDependency(belongToAnyOf(XRoadExampleRestapiClientApp.class), alwaysTrue())
        .ignoreDependency(alwaysTrue(), belongToAnyOf(
            com.nortal.xroad.restapi.client.config.ApplicationProperties.class
        ));

    @ArchTest
    static final ArchRule serviceLayerNamingConventions = classes()
        .that().resideInAPackage("..service..")
        .and().areNotInterfaces()
        .and().areNotRecords()
        .and().areNotEnums()
        .and().areNotAnonymousClasses()
        .and().areNotMemberClasses()
        .should().haveSimpleNameEndingWith("Service")
        .orShould().haveSimpleNameEndingWith("Mapper")
        .orShould().haveSimpleNameEndingWith("Builder")
        .orShould().haveSimpleNameEndingWith("Factory")
        .orShould().haveSimpleNameEndingWith("Validator");

    @ArchTest
    static final ArchRule noFieldInjection = noFields()
        .should().beAnnotatedWith(Autowired.class)
        .because("Use constructor injection instead of field injection");

    @ArchTest
    static final ArchRule dtosShouldBeRecords = classes()
        .that().resideInAPackage("..dto..")
        .and().haveSimpleNameEndingWith("Dto")
        .or().haveSimpleNameEndingWith("DTO")
        .should().beRecords()
        .because("DTOs should be immutable records");
}
