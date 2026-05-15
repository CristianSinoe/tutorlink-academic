package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.StudentRepository;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.domain.user.TutorRepository;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.dto.MeResponseDto;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {

        if (auth == null || auth.getName() == null) {
            return ResponseEntity.status(401).body(new ApiMessage("Usuario no autenticado"));
        }

        String email = auth.getName();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(new ApiMessage("Usuario no encontrado"));
        }

        // lastName legacy
        String legacyLastName = Stream.of(user.getLastNamePaterno(), user.getLastNameMaterno())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));

        // ============================
        // ROLE: ESTUDIANTE
        // ============================
        if (user.getRole().name().equals("ESTUDIANTE")) {

            Student st = studentRepository.findByUser_Id(user.getId()).orElse(null);

            if (st == null) {
                return ResponseEntity.ok(
                        new MeResponseDto(
                                user.getId(),
                                user.getName(),
                                user.getLastNamePaterno(),
                                user.getLastNameMaterno(),
                                legacyLastName,
                                user.getEmail(),
                                user.getRole().name(),

                                null, null, null, null, null, null,
                                null, null, null, null
                        )
                );
            }

            return ResponseEntity.ok(
                    new MeResponseDto(
                            user.getId(),
                            user.getName(),
                            user.getLastNamePaterno(),
                            user.getLastNameMaterno(),
                            legacyLastName,
                            user.getEmail(),
                            user.getRole().name(),

                            st.getMatricula(),
                            st.getCareer(),
                            st.getPlan(),
                            st.getSemester() != null ? st.getSemester().toString() : null,
                            st.getPhone(),
                            st.getBirthDate(),

                            null, null, null, null
                    )
            );
        }

        // ROLE: TUTOR

        if (user.getRole().name().equals("TUTOR")) {

            Tutor t = tutorRepository.findByUser_Id(user.getId()).orElse(null);

            if (t == null) {
                return ResponseEntity.ok(
                        new MeResponseDto(
                                user.getId(),
                                user.getName(),
                                user.getLastNamePaterno(),
                                user.getLastNameMaterno(),
                                legacyLastName,
                                user.getEmail(),
                                user.getRole().name(),

                                null, null, null, null, null, null,
                                null, null, null, null
                        )
                );
            }

            return ResponseEntity.ok(
                    new MeResponseDto(
                            user.getId(),
                            user.getName(),
                            user.getLastNamePaterno(),
                            user.getLastNameMaterno(),
                            legacyLastName,
                            user.getEmail(),
                            user.getRole().name(),

                            null, null, null, null, null, null,

                            t.getTutorCode(),
                            t.getDepartment(),
                            t.getSpecialty(),
                            t.getPhone()
                    )
            );
        }


        // ROLE: ADMIN

        return ResponseEntity.ok(
                new MeResponseDto(
                        user.getId(),
                        user.getName(),
                        user.getLastNamePaterno(),
                        user.getLastNameMaterno(),
                        legacyLastName,
                        user.getEmail(),
                        user.getRole().name(),

                        null, null, null, null, null, null,
                        null, null, null, null
                )
        );
    }

    record ApiMessage(String message) {}
}
