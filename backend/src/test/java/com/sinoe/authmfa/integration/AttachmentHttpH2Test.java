package com.sinoe.authmfa.integration;

import org.springframework.core.io.ClassPathResource;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;
import java.nio.charset.StandardCharsets;

@TestPropertySource(properties={"spring.datasource.url=jdbc:h2:mem:attachmentHttp;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;INIT=CREATE DOMAIN IF NOT EXISTS user_status AS VARCHAR(32)",
    "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop","spring.flyway.enabled=false"})
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class AttachmentHttpH2Test extends AttachmentHttpContract {
    @org.springframework.beans.factory.annotation.Autowired javax.sql.DataSource source;
    @org.springframework.boot.test.mock.mockito.SpyBean com.sinoe.authmfa.service.AttachmentRepository attachmentRepository;

    @org.junit.jupiter.api.Test void userVersionChangedWhileWaitingIsRevalidatedFromDatabase() throws Exception {
        var external=new org.springframework.jdbc.core.JdbcTemplate(source);
        var tx=new org.springframework.transaction.support.TransactionTemplate(
                new org.springframework.jdbc.datasource.DataSourceTransactionManager(source));
        var acquired=new java.util.concurrent.CountDownLatch(1);
        var reached=new java.util.concurrent.CountDownLatch(1);
        var release=new java.util.concurrent.CountDownLatch(1);
        var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        org.mockito.Mockito.doAnswer(invocation -> {
            reached.countDown(); return invocation.callRealMethod();
        }).when(attachmentRepository).lockAuthorizationFacts(org.mockito.ArgumentMatchers.any());
        try {
            var writer=pool.submit(() -> tx.executeWithoutResult(status -> {
                external.queryForList("select id from tl_users where id=? for update",teacher.getId());
                acquired.countDown();
                try { org.junit.jupiter.api.Assertions.assertTrue(release.await(15,java.util.concurrent.TimeUnit.SECONDS)); }
                catch(InterruptedException ex) { Thread.currentThread().interrupt(); throw new IllegalStateException(ex); }
                external.update("update tl_users set authorization_version=authorization_version+1 where id=?",teacher.getId());
            }));
            org.junit.jupiter.api.Assertions.assertTrue(acquired.await(10,java.util.concurrent.TimeUnit.SECONDS));
            var creation=pool.submit(() -> {
                try { mvc.perform(as(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/attachments"),teacher,"DOCENTE")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON).content(body("CONTENT",30)))
                        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isForbidden()); }
                catch(Exception ex) { throw new IllegalStateException(ex); }
            });
            org.junit.jupiter.api.Assertions.assertTrue(reached.await(10,java.util.concurrent.TimeUnit.SECONDS));
            release.countDown(); writer.get(10,java.util.concurrent.TimeUnit.SECONDS); creation.get(10,java.util.concurrent.TimeUnit.SECONDS);
            org.junit.jupiter.api.Assertions.assertEquals(0,jdbc.queryForObject("select count(*) from tl_academic_attachments",Integer.class));
        } finally {
            release.countDown(); pool.shutdownNow(); org.mockito.Mockito.reset(attachmentRepository);
        }
    }

    @Override protected void initializeAcademicSchema() {
        try {
            String sql=new ClassPathResource("db/migration/V27__multi_institution_and_academic_core.sql")
                    .getContentAsString(StandardCharsets.UTF_8);
            sql=sql.substring(sql.indexOf("CREATE TABLE IF NOT EXISTS tl_academic_periods"),sql.indexOf("CREATE TABLE IF NOT EXISTS tl_course_questions"))
                    .replace("TIMESTAMPTZ","TIMESTAMP WITH TIME ZONE");
            for(String statement : sql.split(";")) if(!statement.isBlank()) jdbc.execute(statement);
            String unlink=new ClassPathResource("db/migration/V29__attachment_soft_unlink.sql").getContentAsString(StandardCharsets.UTF_8);
            unlink=unlink.substring(0,unlink.indexOf("CREATE INDEX")).replace("TIMESTAMPTZ","TIMESTAMP WITH TIME ZONE");
            for(String statement : unlink.split(";")) if(!statement.isBlank()) jdbc.execute(statement);
        } catch(java.io.IOException ex) { throw new IllegalStateException(ex); }
    }
}
