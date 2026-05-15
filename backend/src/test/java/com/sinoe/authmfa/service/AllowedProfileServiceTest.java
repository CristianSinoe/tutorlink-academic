package com.sinoe.authmfa.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AllowedProfileServiceTest {

    @Test
    void shouldAllowDemoProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("demo");

        AllowedProfileService service = new AllowedProfileService(environment);

        assertTrue(service.isLocalDevOrDemo());
    }

    @Test
    void shouldBlockUnknownProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("qa");

        AllowedProfileService service = new AllowedProfileService(environment);

        assertFalse(service.isLocalDevOrDemo());
    }

    @Test
    void shouldBlockProdProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        AllowedProfileService service = new AllowedProfileService(environment);

        assertFalse(service.isLocalDevOrDemo());
    }

    @Test
    void shouldBlockMixedProdAndDemoProfiles() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod", "demo");

        AllowedProfileService service = new AllowedProfileService(environment);

        assertFalse(service.isLocalDevOrDemo());
    }
}
