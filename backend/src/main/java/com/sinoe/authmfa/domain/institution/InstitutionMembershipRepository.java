package com.sinoe.authmfa.domain.institution;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface InstitutionMembershipRepository extends JpaRepository<InstitutionMembership, Long> {
    List<InstitutionMembership> findByUser_IdAndStatus(Long userId, MembershipStatus status);
    List<InstitutionMembership> findByUser_IdAndInstitution_IdAndStatus(Long userId, Long institutionId, MembershipStatus status);
    Optional<InstitutionMembership> findByInstitution_IdAndUser_IdAndRole(Long institutionId, Long userId, InstitutionRole role);
}
