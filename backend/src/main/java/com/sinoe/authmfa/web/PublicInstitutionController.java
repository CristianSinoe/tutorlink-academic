package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.institution.InstitutionStatus;
import com.sinoe.authmfa.domain.institution.InstitutionRepository;
import com.sinoe.authmfa.dto.PublicInstitutionDtos.InstitutionView;
import com.sinoe.authmfa.service.AuthorizationContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/institutions")
@RequiredArgsConstructor
public class PublicInstitutionController {
    private final InstitutionRepository institutions;

    @GetMapping("/{code}")
    public ResponseEntity<InstitutionView> find(@PathVariable String code) {
        String normalized = AuthorizationContextService.normalizeCode(code);
        return institutions.findByCode(normalized)
                .filter(i -> i.getStatus() == InstitutionStatus.ACTIVE)
                .map(i -> ResponseEntity.ok(new InstitutionView(i.getCode(), i.getName())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
