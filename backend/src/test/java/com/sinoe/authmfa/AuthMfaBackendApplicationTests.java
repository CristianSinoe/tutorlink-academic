package com.sinoe.authmfa;

import com.sinoe.authmfa.integration.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Previously disabled smoke check now uses the same real PostgreSQL fixture as integration tests. */
class AuthMfaBackendApplicationTests extends AbstractIntegrationTest {
    @Test void contextLoads() throws Exception {
        mockMvc.perform(get("/api/health")).andExpect(status().isOk());
    }
}
