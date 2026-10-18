package com.sinoe.authmfa.web;
import com.sinoe.authmfa.dto.InstitutionAdminDtos.*;
import com.sinoe.authmfa.service.InstitutionInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/institution-invitations")
@RequiredArgsConstructor
public class InstitutionInvitationController {
    private final InstitutionInvitationService service;
    private final com.sinoe.authmfa.service.AuditService audit;
    @PostMapping("/accept") public UserResponse accept(Authentication authentication,@Valid @RequestBody InvitationAccept request) {
        try {return service.accept(authentication,request);}
        catch(RuntimeException ex) {
            Long actor=authentication!=null && authentication.getDetails() instanceof com.sinoe.authmfa.security.InstitutionAccessService.Access a ? a.user().getId() : null;
            audit.logSystem(actor,"INSTITUTION_INVITATION_REJECTED",false,"ACCEPTANCE_REJECTED","No se registra el token ni datos personales");
            throw ex;
        }
    }
}
