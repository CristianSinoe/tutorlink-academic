package com.sinoe.authmfa.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(ApprovedAttachmentCatalog.class)
public class AttachmentConfiguration { }
