package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TutorService {

    private final TutorRepository tutors;
    private final UserRepository users;

    public Tutor createProfile(
            Long userId,
            String tutorCode,
            String department,
            String specialty,
            String phone
    ) {
        User u = users.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Tutor t = Tutor.builder()
                .user(u)
                .tutorCode(tutorCode)
                .department(department)
                .specialty(specialty)
                .phone(phone)
                .build();

        return tutors.save(t);
    }

    public Tutor findByUserId(Long id) {
        return tutors.findByUser_Id(id).orElse(null);
    }
}
