package com.sinoe.authmfa.demo;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import java.nio.charset.StandardCharsets;

/** Builds only the temporary academic tables omitted by JPA. Never executes against PostgreSQL. */
public final class DemoAcademicSchema {
    private DemoAcademicSchema() { }
    public static void ensure(JdbcTemplate jdbc) {
        String url=jdbc.execute((org.springframework.jdbc.core.ConnectionCallback<String>) c -> c.getMetaData().getURL());
        if(url!=null&&url.startsWith("jdbc:postgresql:")) return; // Flyway V1–V30 ya creó el esquema real.
        if(url==null||!url.startsWith("jdbc:h2:mem:")) throw new IllegalStateException("El esquema demo exige PostgreSQL migrado o H2 en memoria");
        try {
            String core=new ClassPathResource("db/migration/V27__multi_institution_and_academic_core.sql").getContentAsString(StandardCharsets.UTF_8);
            core=core.substring(core.indexOf("CREATE TABLE IF NOT EXISTS tl_academic_periods"));
            for(String statement:core.replace("TIMESTAMPTZ","TIMESTAMP WITH TIME ZONE").split(";")) if(!statement.isBlank()) jdbc.execute(statement);
            String unlink=new ClassPathResource("db/migration/V29__attachment_soft_unlink.sql").getContentAsString(StandardCharsets.UTF_8);
            unlink=unlink.substring(0,unlink.indexOf("CREATE INDEX"));
            for(String statement:unlink.replace("TIMESTAMPTZ","TIMESTAMP WITH TIME ZONE").split(";")) if(!statement.isBlank()) jdbc.execute(statement);
            String invitations=new ClassPathResource("db/migration/V30__institution_scoped_profiles_and_invitations.sql").getContentAsString(StandardCharsets.UTF_8);
            invitations=invitations.substring(invitations.indexOf("CREATE TABLE tl_institution_invitations"),invitations.indexOf("CREATE INDEX idx_institution_invitations"));
            jdbc.execute(invitations.replace("CREATE TABLE tl_institution_invitations","CREATE TABLE IF NOT EXISTS tl_institution_invitations").replace("TIMESTAMPTZ","TIMESTAMP WITH TIME ZONE"));
            jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_demo_student_code ON tl_students(institution_id,matricula)");
            jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_demo_tutor_code ON tl_tutors(institution_id,tutor_code)");
        } catch(java.io.IOException ex) {throw new IllegalStateException("Esquema académico demo no disponible",ex);}
    }
}
