package com.sinoe.authmfa.web.academic;

import com.sinoe.authmfa.dto.academic.AcademicDtos.SubmissionRequest;
import com.sinoe.authmfa.security.InstitutionAccessService;
import com.sinoe.authmfa.service.AcademicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/student") @RequiredArgsConstructor
public class StudentAcademicController {
    private final AcademicService academic;
    private final com.sinoe.authmfa.service.AcademicReadService read;
    @GetMapping("/courses") public Object courses(Authentication a,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return read.groups(a,false,q,page,size); }
    @GetMapping("/progress") public Object progress(Authentication a,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return read.progress(a,page,size); }
    @GetMapping("/attendance") public Object attendance(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.attendance(a,groupId,status,page,size);}
    @PostMapping("/course-questions") public ResponseEntity<Map<String,Long>> question(Authentication a,@jakarta.validation.Valid @RequestBody com.sinoe.authmfa.dto.academic.AcademicDtos.CourseQuestionRequest r){return ResponseEntity.status(201).body(Map.of("id",academic.question(context(a),user(a),r.groupId(),r.targetTeacherId(),r.subject(),r.body())));}
    @GetMapping("/course-questions") public Object questions(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String status,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.questions(a,false,groupId,status,q,page,size);}
    @GetMapping("/course-questions/{id}/messages") public Object messages(Authentication a,@PathVariable long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.messages(a,false,id,page,size);}
    @PutMapping("/tasks/{taskId}/submission") public ResponseEntity<Void> submit(Authentication a,@PathVariable long taskId,@RequestBody SubmissionRequest r) { academic.submit(context(a),user(a),taskId,r.body(),r.finalSubmission()); return ResponseEntity.noContent().build(); }
    @GetMapping("/contents") public Object contents(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.materials(a,false,"CONTENT",groupId,q,page,size);}
    @GetMapping("/tasks") public Object tasks(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.materials(a,false,"TASK",groupId,q,page,size);}
    @GetMapping("/tasks/{id}/submission") public Object submission(Authentication a,@PathVariable long id){return academic.ownSubmission(context(a),user(a),id);}
    @PostMapping("/course-questions/{id}/messages") public ResponseEntity<Void> followup(Authentication a,@PathVariable long id,@jakarta.validation.Valid @RequestBody com.sinoe.authmfa.dto.academic.AcademicDtos.CourseQuestionMessageRequest r){if(r.close()||r.primaryAnswer()) throw new IllegalArgumentException("El estudiante no puede cerrar ni marcar respuestas");read.studentMessage(a,id,r.body());return ResponseEntity.noContent().build();}
    @GetMapping("/course-questions/{id}") public Object questionDetail(Authentication a,@PathVariable long id){return read.question(a,false,id);}
    private long context(Authentication a) { var access=(InstitutionAccessService.Access)a.getDetails(); if(access.institutionId()==null) throw new IllegalStateException("Selecciona una institución"); return access.institutionId(); }
    private long user(Authentication a) { return ((InstitutionAccessService.Access)a.getDetails()).user().getId(); }
}
