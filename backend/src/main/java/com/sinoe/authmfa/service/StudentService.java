package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository students;
    private final UserRepository users;

    public Student createProfile(
            Long userId,
            String matricula,
            String career,
            String plan,
            Integer semester,
            java.time.LocalDate birthDate,
            String phone
    ) {
        User u = users.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Student s = Student.builder()
                .user(u)
                .matricula(matricula)
                .career(career)
                .plan(plan)
                .semester(semester)
                .birthDate(birthDate)
                .phone(phone)
                .build();

        return students.save(s);
    }

    public Student findByUserId(Long id) {
        return students.findByUser_Id(id).orElse(null);
    }
}
