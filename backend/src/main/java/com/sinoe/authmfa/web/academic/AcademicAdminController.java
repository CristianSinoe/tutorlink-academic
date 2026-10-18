package com.sinoe.authmfa.web.academic;

import com.sinoe.authmfa.dto.academic.AcademicDtos.*;
import com.sinoe.authmfa.security.InstitutionAccessService;
import com.sinoe.authmfa.service.AcademicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import com.sinoe.authmfa.dto.PagedResponse;

@RestController @RequestMapping("/api/admin/academic") @RequiredArgsConstructor
public class AcademicAdminController {
    private final AcademicService academic;
    private final com.sinoe.authmfa.service.AcademicReadService read;
    @PutMapping("/periods/{id}") public ResponseEntity<Void> updatePeriod(Authentication a,@PathVariable long id,@Valid @RequestBody PeriodUpdate r) {
        academic.updatePeriod(context(a),id,r); return ResponseEntity.noContent().build();
    }
    @PutMapping("/courses/{id}") public ResponseEntity<Void> updateCourse(Authentication a,@PathVariable long id,@Valid @RequestBody CourseUpdate r) {
        academic.updateCourse(context(a),id,r); return ResponseEntity.noContent().build();
    }
    @PostMapping("/periods") public ResponseEntity<Map<String,Long>> period(Authentication a,@Valid @RequestBody PeriodRequest r) { return created(academic.createPeriod(context(a),r.code(),r.name(),r.startsOn(),r.endsOn())); }
    @PostMapping("/courses") public ResponseEntity<Map<String,Long>> course(Authentication a,@Valid @RequestBody CourseRequest r) { return created(academic.createCourse(context(a),r.code(),r.name(),r.description())); }
    @PostMapping("/groups") public ResponseEntity<Map<String,Long>> group(Authentication a,@Valid @RequestBody GroupRequest r) { return created(academic.createGroup(context(a),r.courseId(),r.periodId(),r.code(),r.name())); }
    @PostMapping("/groups/{groupId}/teachers") public ResponseEntity<Void> assignTeacher(Authentication a,@PathVariable long groupId,@Valid @RequestBody TeacherAssignmentRequest r) { academic.assignTeacher(context(a),groupId,r.teacherId()); return ResponseEntity.noContent().build(); }
    @PostMapping("/groups/{groupId}/enrollments") public ResponseEntity<Void> enroll(Authentication a,@PathVariable long groupId,@Valid @RequestBody EnrollmentRequest r) { academic.enroll(context(a),groupId,r.studentId()); return ResponseEntity.noContent().build(); }
    @DeleteMapping("/groups/{groupId}/enrollments/{studentId}") public ResponseEntity<Void> withdraw(Authentication a,@PathVariable long groupId,@PathVariable long studentId) { academic.withdraw(context(a),groupId,studentId); return ResponseEntity.noContent().build(); }
    @GetMapping("/groups/{groupId}/teachers")
    public PagedResponse<TeacherAssignmentView> teachers(Authentication a,@PathVariable long groupId,
            @RequestParam(required=false) String q,@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size) {
        return read.groupTeachers(a,groupId,q,page,size);
    }
    @GetMapping("/groups/{groupId}/enrollments")
    public PagedResponse<EnrollmentView> enrollments(Authentication a,@PathVariable long groupId,
            @RequestParam(required=false) String q,@RequestParam(defaultValue="ACTIVE") String status,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return read.groupEnrollments(a,groupId,q,status,page,size);
    }
    @GetMapping("/{kind:periods|courses|groups}") public Object list(Authentication a,@PathVariable String kind,@RequestParam(required=false) String q,@RequestParam(required=false) Long courseId,@RequestParam(required=false) Long periodId,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return read.admin(a,kind,q,courseId,periodId,page,size);}
    private ResponseEntity<Map<String,Long>> created(long id) { return ResponseEntity.status(201).body(Map.of("id",id)); }
    private long context(Authentication a) { var access=(InstitutionAccessService.Access)a.getDetails(); if(access.institutionId()==null) throw new IllegalStateException("Selecciona una institución"); return access.institutionId(); }
}
