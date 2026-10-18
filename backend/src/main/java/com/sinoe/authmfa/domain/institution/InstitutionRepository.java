package com.sinoe.authmfa.domain.institution;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InstitutionRepository extends JpaRepository<Institution, Long> { Optional<Institution> findByCode(String code); }
