package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.otp.OtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpRepository otpRepository;

    private OtpService service;

    @BeforeEach
    void setUp() {
        service = new OtpService(otpRepository);
        setField("expMinutes", 5L);
        setField("maxAttempts", 3);
        setField("resendCooldown", 60L);
    }

    @Test
    void shouldGenerateAndSaveOtpWithExpectedDefaults() {
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String code = service.generateAndSave(7L, "LOGIN");

        ArgumentCaptor<OtpCode> captor = ArgumentCaptor.forClass(OtpCode.class);
        verify(otpRepository).save(captor.capture());
        OtpCode saved = captor.getValue();

        assertEquals(code, saved.getCode());
        assertTrue(code.matches("\\d{6}"));
        assertEquals(7L, saved.getUserId());
        assertEquals("LOGIN", saved.getPurpose());
        assertEquals(0, saved.getAttempts());
        assertFalse(saved.isConsumed());
        assertNotNull(saved.getPublicId());
        assertFalse(saved.getPublicId().isBlank());
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getLastSentAt());
        assertNotNull(saved.getExpiresAt());
        assertTrue(saved.getExpiresAt().isAfter(saved.getCreatedAt()));
    }

    @Test
    void shouldValidateAndConsumeMatchingOtp() {
        OtpCode otp = otp("123456", "LOGIN");
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean valid = service.validateAndConsume(7L, "LOGIN", "123456");

        assertTrue(valid);
        assertTrue(otp.isConsumed());
        assertEquals(1, otp.getAttempts());
        verify(otpRepository).save(otp);
    }

    @Test
    void shouldReturnFalseWhenOtpDoesNotExist() {
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.empty());

        boolean valid = service.validateAndConsume(7L, "LOGIN", "123456");

        assertFalse(valid);
        verify(otpRepository, never()).save(any(OtpCode.class));
    }

    @Test
    void shouldReturnFalseWhenOtpIsExpired() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setExpiresAt(Instant.now().minusSeconds(5));
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        boolean valid = service.validateAndConsume(7L, "LOGIN", "123456");

        assertFalse(valid);
        verify(otpRepository, never()).save(any(OtpCode.class));
    }

    @Test
    void shouldReturnFalseWhenOtpWasAlreadyConsumed() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setConsumed(true);
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        boolean valid = service.validateAndConsume(7L, "LOGIN", "123456");

        assertFalse(valid);
        verify(otpRepository, never()).save(any(OtpCode.class));
    }

    @Test
    void shouldReturnFalseWhenOtpReachedMaxAttempts() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setAttempts(3);
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        boolean valid = service.validateAndConsume(7L, "LOGIN", "123456");

        assertFalse(valid);
        verify(otpRepository, never()).save(any(OtpCode.class));
    }

    @Test
    void shouldIncreaseAttemptsWhenOtpCodeIsIncorrect() {
        OtpCode otp = otp("123456", "LOGIN");
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean valid = service.validateAndConsume(7L, "LOGIN", "000000");

        assertFalse(valid);
        assertFalse(otp.isConsumed());
        assertEquals(1, otp.getAttempts());
        verify(otpRepository).save(otp);
    }

    @Test
    void shouldGenerateLoginOtpWithLoginPurpose() {
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OtpCode created = service.generateLoginOtpForUser(11L);

        assertEquals(11L, created.getUserId());
        assertEquals("LOGIN", created.getPurpose());
        assertTrue(created.getCode().matches("\\d{6}"));
        assertFalse(created.isConsumed());
    }

    @Test
    void shouldValidateLoginOtpAndReturnOtpCode() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setPublicId("pub-1");
        when(otpRepository.findByPublicIdAndPurpose("pub-1", "LOGIN"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OtpCode validated = service.validateForLogin("pub-1", "123456");

        assertNotNull(validated);
        assertTrue(validated.isConsumed());
        assertEquals(1, validated.getAttempts());
    }

    @Test
    void shouldReturnNullForInvalidLoginOtp() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setPublicId("pub-2");
        when(otpRepository.findByPublicIdAndPurpose("pub-2", "LOGIN"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OtpCode validated = service.validateForLogin("pub-2", "000000");

        assertNull(validated);
        assertFalse(otp.isConsumed());
        assertEquals(1, otp.getAttempts());
        verify(otpRepository).save(otp);
    }

    @Test
    void shouldReturnNullForExpiredConsumedOrExceededLoginOtp() {
        OtpCode expired = otp("123456", "LOGIN");
        expired.setPublicId("expired");
        expired.setExpiresAt(Instant.now().minusSeconds(1));

        OtpCode consumed = otp("123456", "LOGIN");
        consumed.setPublicId("consumed");
        consumed.setConsumed(true);

        OtpCode exceeded = otp("123456", "LOGIN");
        exceeded.setPublicId("exceeded");
        exceeded.setAttempts(3);

        when(otpRepository.findByPublicIdAndPurpose("expired", "LOGIN")).thenReturn(Optional.of(expired));
        when(otpRepository.findByPublicIdAndPurpose("consumed", "LOGIN")).thenReturn(Optional.of(consumed));
        when(otpRepository.findByPublicIdAndPurpose("exceeded", "LOGIN")).thenReturn(Optional.of(exceeded));

        assertNull(service.validateForLogin("expired", "123456"));
        assertNull(service.validateForLogin("consumed", "123456"));
        assertNull(service.validateForLogin("exceeded", "123456"));
        verify(otpRepository, never()).save(expired);
        verify(otpRepository, never()).save(consumed);
        verify(otpRepository, never()).save(exceeded);
    }

    @Test
    void shouldAllowResendWhenThereIsNoPreviousOtpOrLastSentAt() {
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(9L, "LOGIN"))
                .thenReturn(Optional.empty());

        assertTrue(service.canResend(9L, "LOGIN"));

        OtpCode otp = otp("123456", "LOGIN");
        otp.setLastSentAt(null);
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(10L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        assertTrue(service.canResend(10L, "LOGIN"));
    }

    @Test
    void shouldRespectResendCooldown() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setLastSentAt(Instant.now().minusSeconds(30));
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        assertFalse(service.canResend(7L, "LOGIN"));
    }

    @Test
    void shouldCalculateRemainingCooldownSeconds() {
        OtpCode otp = otp("123456", "LOGIN");
        otp.setLastSentAt(Instant.now().minusSeconds(20));
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        long remaining = service.getRemainingResendCooldownSeconds(7L, "LOGIN");

        assertTrue(remaining > 0);
        assertTrue(remaining <= 60);
    }

    @Test
    void shouldReturnZeroRemainingCooldownWhenNoOtpOrCooldownExpired() {
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(7L, "LOGIN"))
                .thenReturn(Optional.empty());
        assertEquals(0, service.getRemainingResendCooldownSeconds(7L, "LOGIN"));

        OtpCode otp = otp("123456", "LOGIN");
        otp.setLastSentAt(Instant.now().minusSeconds(120));
        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(8L, "LOGIN"))
                .thenReturn(Optional.of(otp));

        assertEquals(0, service.getRemainingResendCooldownSeconds(8L, "LOGIN"));
    }

    @Test
    void shouldUsePasswordChangePurposeHelpers() {
        when(otpRepository.save(any(OtpCode.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String code = service.generatePasswordChangeOtpForUser(15L);

        ArgumentCaptor<OtpCode> captor = ArgumentCaptor.forClass(OtpCode.class);
        verify(otpRepository).save(captor.capture());
        OtpCode created = captor.getValue();
        assertEquals("PASSWORD_CHANGE", created.getPurpose());
        assertEquals(code, created.getCode());

        when(otpRepository.findTopByUserIdAndPurposeOrderByCreatedAtDesc(15L, "PASSWORD_CHANGE"))
                .thenReturn(Optional.of(created));

        assertTrue(service.validatePasswordChangeOtp(15L, code));
    }

    private OtpCode otp(String code, String purpose) {
        Instant now = Instant.now();
        return OtpCode.builder()
                .id(1L)
                .userId(7L)
                .code(code)
                .purpose(purpose)
                .publicId("public-id")
                .attempts(0)
                .createdAt(now)
                .lastSentAt(now)
                .expiresAt(now.plusSeconds(300))
                .consumed(false)
                .build();
    }

    private void setField(String fieldName, Object value) {
        try {
            Field field = OtpService.class.getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(service, value);
        } catch (ReflectiveOperationException ex) {
            throw new IllegalStateException("No se pudo configurar el campo " + fieldName, ex);
        }
    }
}
