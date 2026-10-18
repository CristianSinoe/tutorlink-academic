package com.sinoe.authmfa.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration(proxyBeanMethods = false)
@Profile("demo")
public class DemoMailConfiguration {
    @Bean DemoMailbox demoMailbox() { return new DemoMailbox(); }
    @Bean JavaMailSender demoMailSender(DemoMailbox mailbox, Environment environment) {
        return environment.acceptsProfiles(Profiles.of("e2e"))
                ? new InMemoryDemoMailSender(mailbox)
                : new DemoMailSender();
    }
}
