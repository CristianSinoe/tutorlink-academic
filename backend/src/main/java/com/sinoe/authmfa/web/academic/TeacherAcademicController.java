package com.sinoe.authmfa.web.academic;

import com.sinoe.authmfa.dto.academic.AcademicDtos.*;
import com.sinoe.authmfa.security.InstitutionAccessService;
import com.sinoe.authmfa.service.AcademicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/teacher") @RequiredArgsConstructor
public class TeacherAcademicController {
    private final AcademicService academic;
    private final com.sinoe.authmfa.service.TeacherActivityService activities;
    private final com.sinoe.authmfa.service.AcademicReadService read;
    @GetMapping("/courses") public Object courses(Authentication a,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return read.groups(a,true,q,page,size); }
    @PostMapping("/contents") public ResponseEntity<Map<String,Long>> content(Authentication a,@Valid @RequestBody ContentRequest r) { return ResponseEntity.status(201).body(Map.of("id",activities.createContent(a,r))); }
    @PostMapping("/tasks") public ResponseEntity<Map<String,Long>> task(Authentication a,@Valid @RequestBody TaskRequest r) { return ResponseEntity.status(201).body(Map.of("id",activities.createTask(a,r))); }
    @PutMapping("/contents/{id}") public ResponseEntity<Void> updateContent(Authentication a,@PathVariable long id,@Valid @RequestBody ContentUpdate r) { activities.updateContent(a,id,r);return ResponseEntity.noContent().build(); }
    @PutMapping("/tasks/{id}") public ResponseEntity<Void> updateTask(Authentication a,@PathVariable long id,@Valid @RequestBody TaskUpdate r) { activities.updateTask(a,id,r);return ResponseEntity.noContent().build(); }
    @DeleteMapping("/contents/{id}") public ResponseEntity<Void> deleteContent(Authentication a,@PathVariable long id) { activities.delete(a,false,id);return ResponseEntity.noContent().build(); }
    @DeleteMapping("/tasks/{id}") public ResponseEntity<Void> deleteTask(Authentication a,@PathVariable long id) { activities.delete(a,true,id);return ResponseEntity.noContent().build(); }
    @GetMapping("/tasks/{id}/students") public Object taskStudents(Authentication a,@PathVariable long id,@RequestParam(defaultValue="ALL") String status,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return read.taskStudents(a,id,status,q,page,size); }
    @PostMapping("/sessions") public ResponseEntity<Map<String,Long>> session(Authentication a,@Valid @RequestBody SessionRequest r){return ResponseEntity.status(201).body(Map.of("id",academic.session(context(a),user(a),r.groupId(),r.startsAt(),r.endsAt(),r.topic())));}
    @PutMapping("/sessions/{id}/attendance") public ResponseEntity<Void> attendance(Authentication a,@PathVariable long id,@Valid @RequestBody AttendanceRequest r){academic.attendance(context(a),user(a),id,r.studentId(),r.status());return ResponseEntity.noContent().build();}
    @PostMapping("/questions/{id}/messages") public ResponseEntity<Void> reply(Authentication a,@PathVariable long id,@Valid @RequestBody CourseQuestionMessageRequest r){academic.replyQuestion(context(a),user(a),id,r.body(),r.primaryAnswer(),r.close());return ResponseEntity.noContent().build();}
    @GetMapping("/contents") public Object contents(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.materials(a,true,"CONTENT",groupId,q,page,size);}
    @GetMapping("/tasks") public Object tasks(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.materials(a,true,"TASK",groupId,q,page,size);}
    @GetMapping("/questions") public Object questions(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(required=false) String status,@RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.questions(a,true,groupId,status,q,page,size);}
    @GetMapping("/questions/{id}/messages") public Object messages(Authentication a,@PathVariable long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.messages(a,true,id,page,size);}
    @GetMapping("/tasks/{id}/submissions") public Object submissions(Authentication a,@PathVariable long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.submissions(a,id,page,size);}
    @GetMapping("/groups/{id}/students") public Object roster(Authentication a,@PathVariable long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.roster(a,id,page,size);}
    @GetMapping("/sessions") public Object sessions(Authentication a,@RequestParam(required=false) Long groupId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.sessions(a,groupId,page,size);}
    @GetMapping("/questions/{id}") public Object questionDetail(Authentication a,@PathVariable long id){return read.question(a,true,id);}
    private long context(Authentication a) { var access=(InstitutionAccessService.Access)a.getDetails(); if(access.institutionId()==null) throw new IllegalStateException("Selecciona una institución"); return access.institutionId(); }
    private long user(Authentication a) { return ((InstitutionAccessService.Access)a.getDetails()).user().getId(); }
}
