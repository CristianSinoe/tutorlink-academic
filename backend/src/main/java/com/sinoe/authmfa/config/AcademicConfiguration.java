package com.sinoe.authmfa.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods=false)
public class AcademicConfiguration {
    @Bean public Clock academicClock() { return Clock.systemUTC(); }
}
