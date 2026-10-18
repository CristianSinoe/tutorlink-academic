package com.sinoe.authmfa.integration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.annotation.DirtiesContext;
@TestPropertySource(properties={"spring.datasource.url=jdbc:h2:mem:phase15;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;INIT=CREATE DOMAIN IF NOT EXISTS user_status AS VARCHAR(32)",
        "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop","spring.flyway.enabled=false"})
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class Phase15H2Test extends Phase15Contract {
    @Override protected void prepareSchema(){com.sinoe.authmfa.demo.DemoAcademicSchema.ensure(jdbc);}
}
