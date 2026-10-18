package com.sinoe.authmfa.integration;

import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@TestPropertySource(properties={"spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@Testcontainers(disabledWithoutDocker=true)
@DirtiesContext(classMode=DirtiesContext.ClassMode.AFTER_CLASS)
class AttachmentHttpPostgresTest extends AttachmentHttpContract {
    @Container static final PostgreSQLContainer<?> POSTGRES=new PostgreSQLContainer<>("postgres:16-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username",POSTGRES::getUsername);
        registry.add("spring.datasource.password",POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name",() -> "org.postgresql.Driver");
    }

    @Test void finalizingSubmissionWhileAttachmentWaitsForLockDeniesMutation() throws Exception {
        long id=create(student,"ESTUDIANTE","SUBMISSION",32);
        var source=new DriverManagerDataSource(POSTGRES.getJdbcUrl(),POSTGRES.getUsername(),POSTGRES.getPassword());
        var external=new JdbcTemplate(source);
        var tx=new TransactionTemplate(new DataSourceTransactionManager(source));
        var acquired=new CountDownLatch(1); var release=new CountDownLatch(1);
        var pool=Executors.newFixedThreadPool(2);
        try {
            Future<?> writer=pool.submit(() -> tx.executeWithoutResult(status -> {
                external.queryForList("select id from tl_task_submissions where id=32 for update");
                acquired.countDown();
                try { assertTrue(release.await(15,TimeUnit.SECONDS)); }
                catch(InterruptedException ex) { Thread.currentThread().interrupt(); throw new IllegalStateException(ex); }
                external.update("update tl_task_submissions set status='ON_TIME',submitted_at=current_timestamp where id=32");
            }));
            assertTrue(acquired.await(10,TimeUnit.SECONDS));
            Future<?> unlink=pool.submit(() -> {
                try { mvc.perform(as(post("/api/attachments/{id}/unlink",id),student,"ESTUDIANTE")
                        .contentType(APPLICATION_JSON).content("{}")).andExpect(status().isForbidden()); }
                catch(Exception ex) { throw new IllegalStateException(ex); }
            });
            // Synchronize on PostgreSQL's actual lock wait rather than timing assumptions.
            long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(10);
            boolean waiting=false;
            while(System.nanoTime()<deadline) {
                waiting=external.queryForObject("select exists(select 1 from pg_stat_activity where datname=current_database() "
                        +"and wait_event_type='Lock' and query like '%tl_task_submissions%')",Boolean.class);
                if(waiting) break;
                Thread.sleep(25);
            }
            assertTrue(waiting,"Attachment operation must reach the locked submission");
            release.countDown(); writer.get(10,TimeUnit.SECONDS); unlink.get(10,TimeUnit.SECONDS);
            assertNull(jdbc.queryForMap("select unlinked_at from tl_academic_attachments where id=?",id).get("unlinked_at"));
        } finally { release.countDown(); pool.shutdownNow(); }
    }
}
