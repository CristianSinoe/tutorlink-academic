package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AttachmentDtos.*;
import com.sinoe.authmfa.service.AttachmentService;
import static com.sinoe.authmfa.service.AttachmentAuthorizationService.*;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    private final AttachmentService service;

    @PostMapping
    public ResponseEntity<Metadata> create(Authentication authentication, @RequestParam ActingRole actingRole,
            @Valid @RequestBody Create request) {
        var metadata=service.create(authentication,actingRole,request);
        return ResponseEntity.created(URI.create("/api/attachments/"+metadata.id()+"?actingRole="+actingRole)).body(metadata);
    }
    @GetMapping("/{id}")
    public Metadata metadata(Authentication authentication, @PathVariable long id, @RequestParam ActingRole actingRole) {
        return service.metadata(authentication,id,actingRole);
    }
    @GetMapping
    public List<Metadata> list(Authentication authentication, @RequestParam ResourceType resourceType,
            @RequestParam long resourceId, @RequestParam ActingRole actingRole,
            @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return service.list(authentication,resourceType,resourceId,actingRole,page,size);
    }
    @GetMapping("/{id}/content-reference")
    public ContentReference content(Authentication authentication, @PathVariable long id, @RequestParam ActingRole actingRole) {
        return service.contentReference(authentication,id,actingRole);
    }
    @PostMapping("/{id}/unlink")
    public ResponseEntity<Void> unlink(Authentication authentication, @PathVariable long id, @RequestParam ActingRole actingRole,
            @Valid @RequestBody Unlink request) {
        service.unlink(authentication,id,actingRole,request);
        return ResponseEntity.noContent().build();
    }
}
