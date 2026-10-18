package com.sinoe.authmfa.security;

import com.sinoe.authmfa.service.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final InstitutionAccessService accessService;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        String auth = req.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(auth) && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                Jws<io.jsonwebtoken.Claims> jws = jwtService.parse(token);
                Claims c = jws.getBody();
                String email = c.getSubject();
                Number uid = c.get("uid", Number.class);
                Number version = c.get("authVersion", Number.class);
                Number institutionId = c.get("institutionId", Number.class);
                if (email != null && uid != null && version != null) {
                    var access = accessService.resolve(uid.longValue(), institutionId == null ? null : institutionId.longValue(), version.longValue());
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    for (String role : access.roles()) authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                    var authToken = new UsernamePasswordAuthenticationToken(
                            access.user().getEmail(),
                            null,
                            authorities);
                    authToken.setDetails(access);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            } catch (Exception ex) {
                // seguimos sin autenticación; el handler global devolverá 401 si hace falta
            }
        }
        chain.doFilter(req, res);
    }
}
