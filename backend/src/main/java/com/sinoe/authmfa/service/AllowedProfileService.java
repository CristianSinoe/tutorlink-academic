package com.sinoe.authmfa.service;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class AllowedProfileService {

    private static final Set<String> ALLOWED_LOCAL_PROFILES = Set.of("dev", "local", "demo");
    private static final String PRODUCTION_PROFILE = "prod";

    private final Environment environment;

    public AllowedProfileService(Environment environment) {
        this.environment = environment;
    }

    public boolean isLocalDevOrDemo() {
        boolean hasAllowedProfile = false;

        for (String profile : environment.getActiveProfiles()) {
            if (PRODUCTION_PROFILE.equals(profile)) {
                return false;
            }
            if (ALLOWED_LOCAL_PROFILES.contains(profile)) {
                hasAllowedProfile = true;
            }
        }

        return hasAllowedProfile;
    }
}
