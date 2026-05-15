package com.sinoe.authmfa.domain.otp;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpCode, Long> {

  Optional<OtpCode> findTopByUserIdAndPurposeOrderByCreatedAtDesc(Long userId, String purpose);

    Optional<OtpCode> findByPublicIdAndPurpose(String publicId, String purpose);
}
