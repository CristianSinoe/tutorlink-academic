package com.sinoe.authmfa.config;

import com.sinoe.authmfa.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    @Value("${tutorlink.security.cors.allowed-origin-patterns:http://localhost:*,http://127.0.0.1:*,http://192.168.*.*:*,http://10.*.*.*:*}")
    private List<String> allowedOriginPatterns;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> {
                    var points=new java.util.LinkedHashMap<org.springframework.security.web.util.matcher.RequestMatcher,org.springframework.security.web.AuthenticationEntryPoint>();
                    points.put(new org.springframework.security.web.util.matcher.AntPathRequestMatcher("/api/attachments/**"),(request,response,exception) -> {
                        response.setStatus(401);response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"message\":\"Autenticación requerida\"}");
                    });
                    var entry=new org.springframework.security.web.authentication.DelegatingAuthenticationEntryPoint(points);
                    entry.setDefaultEntryPoint(new org.springframework.security.web.authentication.Http403ForbiddenEntryPoint());
                    errors.authenticationEntryPoint(entry);
                })
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register").denyAll()
                        .requestMatchers(
                                "/api/health",
                                "/api/public/institutions/**",
                                "/api/institution-invitations/accept",
                                "/api/auth/login",
                                "/api/auth/activate",
                                "/api/auth/first-login/complete",
                                "/api/recaptcha/verify",
                                "/api/auth/login",
                                "/api/auth/login/verify-otp",
                                "/api/auth/login/resend-otp",
                                "/api/auth/first-login",
                                "/api/auth/first-login/verify-otp",
                                "/api/internal/bootstrap/admin",
                                "/error",
                                "/api/auth/dev/hash"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET, "/dev/email-preview/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/docs/**").permitAll()
                        .requestMatchers("/api/platform/**").hasRole("PLATFORM_SUPER_ADMIN")
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/questions/**").hasAnyRole("ESTUDIANTE", "TUTOR", "ADMIN")
                        .requestMatchers("/api/tutor/**").hasAnyRole("TUTOR", "SUPER_ADMIN")
                        .requestMatchers("/api/teacher/**").hasAnyRole("DOCENTE", "SUPER_ADMIN")
                        .requestMatchers("/api/student/**").hasRole("ESTUDIANTE")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
