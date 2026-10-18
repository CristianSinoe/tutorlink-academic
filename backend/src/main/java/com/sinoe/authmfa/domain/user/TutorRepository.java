package com.sinoe.authmfa.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {

    java.util.List<Tutor> findAllByUser_Id(Long userId);
    Optional<Tutor> findByInstitution_IdAndUser_Id(Long institutionId,Long userId);
    java.util.List<Tutor> findByInstitution_Id(Long institutionId);
    default Optional<Tutor> findByUser_Id(Long userId) {
        Long institution=com.sinoe.authmfa.security.ScopedProfiles.institutionId();
        return institution==null ? com.sinoe.authmfa.security.ScopedProfiles.unique(findAllByUser_Id(userId)) : findByInstitution_IdAndUser_Id(institution,userId);
    }

    java.util.List<Tutor> findAllByTutorCode(String tutorCode);
    Optional<Tutor> findByInstitution_IdAndTutorCode(Long institutionId,String tutorCode);
    default Optional<Tutor> findByTutorCode(String tutorCode) {
        Long institution=com.sinoe.authmfa.security.ScopedProfiles.institutionId();
        return institution==null ? com.sinoe.authmfa.security.ScopedProfiles.unique(findAllByTutorCode(tutorCode)) : findByInstitution_IdAndTutorCode(institution,tutorCode);
    }
    
}
