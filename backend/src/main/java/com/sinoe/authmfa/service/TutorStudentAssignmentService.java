package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.StudentRepository;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.TutorRepository;
import com.sinoe.authmfa.domain.user.TutorStudent;
import com.sinoe.authmfa.domain.user.TutorStudentRepository;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.dto.AdminUserDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TutorStudentAssignmentService {

    private final TutorRepository tutors;
    private final StudentRepository students;
    private final UserRepository users;
    private final TutorStudentRepository tutorStudents;

    @Transactional
    public void assignStudentToTutor(AdminUserDtos.AssignStudentToTutor dto, Long adminUserId) {
        Tutor tutor = tutors.findByTutorCode(dto.getTutorCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tutor no encontrado con código: " + dto.getTutorCode()));

        Student student = students.findByMatricula(dto.getMatricula())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Estudiante no encontrado con matrícula: " + dto.getMatricula()));

        tutorStudents.findByStudent_Id(student.getId()).ifPresent(tutorStudents::delete);

        TutorStudent assignment = TutorStudent.builder()
                .tutor(tutor)
                .student(student)
                .createdBy(resolveAdminUser(adminUserId))
                .build();

        tutorStudents.save(assignment);
    }

    private User resolveAdminUser(Long adminUserId) {
        if (adminUserId == null) {
            return null;
        }
        return users.findById(adminUserId).orElse(null);
    }
}
