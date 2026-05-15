package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.dto.AdminUserDtos;
import com.sinoe.authmfa.dto.StudentSuggestionDto;
import com.sinoe.authmfa.dto.TutorStudentAssignmentDto;
import com.sinoe.authmfa.validation.AgeValidator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final String USER_NOT_FOUND_PREFIX = "Usuario no encontrado: ";

    private final UserRepository users;
    private final StudentRepository students;
    private final TutorRepository tutors;
    private final UserService userService;
    private final TutorStudentRepository tutorStudents;
    private final TutorStudentAssignmentService tutorStudentAssignmentService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // Crear ESTUDIANTE + perfil

    @Transactional
    public Student createStudentUser(AdminUserDtos.CreateStudentUser dto) {

        String emailLower = dto.getEmail().toLowerCase();

        if (users.existsByEmail(emailLower)) {
            throw new IllegalStateException("El correo ya está registrado: " + emailLower);
        }

        if (!AgeValidator.between15and120(dto.getBirthDate())) {
            throw new IllegalArgumentException("La edad debe estar entre 15 y 120 años");
        }

        // 1) Crear usuario base
        User u = userService.createUser(
                dto.getName(),
                dto.getLastNamePaterno(),
                dto.getLastNameMaterno(),
                emailLower,
                dto.getPassword(),
                UserRole.ESTUDIANTE,
                dto.getCareer(),
                dto.getPlan(),
                dto.getSemester(),
                dto.getBirthDate(),
                dto.getPhone()
        );

        // 2) Marcado como creado por admin + token
        u.setStatus(UserStatus.CREATED_BY_ADMIN);
        initFirstLogin(u);
        u = users.save(u);

        // 3) Crear perfil académico
        Student s = Student.builder()
                .user(u)
                .matricula(dto.getMatricula())
                .career(dto.getCareer())
                .plan(dto.getPlan())
                .semester(dto.getSemester())
                .birthDate(dto.getBirthDate())
                .phone(dto.getPhone())
                .build();

        s = students.save(s);

        // 4) Enviar correo de primer login
        emailService.sendFirstLoginEmail(u.getEmail(), u.getFirstLoginToken());

        return s;
    }

    // Crear TUTOR

    @Transactional
    public Tutor createTutorUser(AdminUserDtos.CreateTutorUser dto) {

        String emailLower = dto.getEmail().toLowerCase();

        if (users.existsByEmail(emailLower)) {
            throw new IllegalStateException("El correo ya está registrado: " + emailLower);
        }

        // 1) Crear usuario base
        User u = userService.createUser(
                dto.getName(),
                dto.getLastNamePaterno(),
                dto.getLastNameMaterno(),
                emailLower,
                dto.getPassword(),
                UserRole.TUTOR,
                null,
                null,
                null,
                null,
                dto.getPhone()
        );

        // 2) Token de primer login
        u.setStatus(UserStatus.CREATED_BY_ADMIN);
        initFirstLogin(u);
        u = users.save(u);

        // 3) Perfil tutor
        Tutor t = Tutor.builder()
                .user(u)
                .tutorCode(dto.getTutorCode())
                .department(dto.getDepartment())
                .specialty(dto.getSpecialty())
                .phone(dto.getPhone())
                .build();

        t = tutors.save(t);

        // 4) Email de primer login
        emailService.sendFirstLoginEmail(u.getEmail(), u.getFirstLoginToken());

        return t;
    }

    //Crear ADMIN

    @Transactional
    public User createAdminUser(AdminUserDtos.CreateAdminUser dto) {

        String emailLower = dto.getEmail().toLowerCase().trim();

        if (users.existsByEmail(emailLower)) {
            throw new IllegalStateException("El correo ya está registrado: " + emailLower);
        }

        // Generar contraseña temporal (no se usa directamente, porque el admin define
        // su password en el primer login)
        String rawPassword = generateTempPassword();

        // Crear usuario base como ADMIN
        User u = userService.createUser(
                dto.getName(),
                dto.getLastNamePaterno(),
                dto.getLastNameMaterno(),
                emailLower,
                rawPassword,
                UserRole.ADMIN,
                null,
                null,
                null,
                null,
                null
        );

        // Marcar como creado por admin + configurar primer login
        u.setStatus(UserStatus.CREATED_BY_ADMIN);
        initFirstLogin(u);
        u = users.save(u);

        // Enviar correo de primer login (link para definir contraseña)
        emailService.sendFirstLoginEmail(u.getEmail(), u.getFirstLoginToken());

        return u;
    }

    // Cambiar estado
    
    @Transactional
    public User changeUserStatus(Long userId, String statusRaw) {
        User u = findUserByIdOrThrow(userId);
        UserStatus newStatus = parseUserStatus(statusRaw);

        u.setStatus(newStatus);
        return users.save(u);
    }

    // Importar ESTUDIANTES CSV

    @Transactional
    public AdminUserDtos.CsvImportResult importStudentsFromCsv(String csv) {
        CsvImportCounters counters = new CsvImportCounters();
        String[] lines = normalizeCsvLines(csv);

        for (int i = 0; i < lines.length; i++) {
            processStudentCsvLine(lines[i], i == 0, counters);
        }

        return counters.toCsvImportResult();
    }

    // Importar TUTORES CSV

    @Transactional
    public AdminUserDtos.CsvImportResult importTutorsFromCsv(String csv) {
        CsvImportCounters counters = new CsvImportCounters();
        String[] lines = normalizeCsvLines(csv);

        for (int i = 0; i < lines.length; i++) {
            processTutorCsvLine(lines[i], i == 0, counters);
        }

        return counters.toCsvImportResult();
    }

    // contraseña temporal
    private static String generateTempPassword() {
        String base = UUID.randomUUID().toString().replace("-", "");
        return "Tmp" + base.substring(0, 8) + "!";
    }

    private static String emptyToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    // Asignar estudiante a tutor

    public void assignStudentToTutor(AdminUserDtos.AssignStudentToTutor dto, Long adminUserId) {
        tutorStudentAssignmentService.assignStudentToTutor(dto, adminUserId);
    }

    // CSV asignación tutor-estudiante
    @Transactional
    public AdminUserDtos.AssignTutorStudentsCsvResult importTutorStudentAssignmentsFromCsv(
        String csv,
            Long adminUserId) {

        if (csv == null || csv.isBlank()) {
            return AdminUserDtos.AssignTutorStudentsCsvResult.builder()
                    .total(0)
                    .assigned(0)
                    .errors(0)
                    .build();
        }

        AssignmentImportCounters counters = new AssignmentImportCounters();
        String[] lines = csv.split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            processAssignmentCsvLine(lines[i], i == 0, adminUserId, counters);
        }

        return counters.toResult();
    }

    // Listar asignaciones
    @Transactional(readOnly = true)
    public java.util.List<TutorStudentAssignmentDto> listTutorStudentAssignments(
            String tutorCode,
            String matricula) {

        String tc = (tutorCode == null || tutorCode.isBlank()) ? null : tutorCode.trim();
        String mat = (matricula == null || matricula.isBlank()) ? null : matricula.trim();

        var list = tutorStudents.searchAssignments(tc, mat);

        return list.stream().map(ts -> {

            var t = ts.getTutor();
            var s = ts.getStudent();

            var tu = t.getUser();
            var su = s.getUser();

            String tutorName = Stream.of(
                    tu.getName(), tu.getLastNamePaterno(), tu.getLastNameMaterno()
            )
                    .filter(x -> x != null && !x.isBlank())
                    .collect(Collectors.joining(" "));

            String studentName = Stream.of(
                    su.getName(), su.getLastNamePaterno(), su.getLastNameMaterno()
            )
                    .filter(x -> x != null && !x.isBlank())
                    .collect(Collectors.joining(" "));

            return new TutorStudentAssignmentDto(
                    ts.getId(),
                    t.getId(),
                    t.getTutorCode(),
                    tutorName.trim(),
                    tu.getEmail(),
                    t.getDepartment(),
                    t.getSpecialty(),
                    s.getId(),
                    s.getMatricula(),
                    studentName.trim(),
                    su.getEmail(),
                    ts.getCreatedAt()
            );
        }).toList();
    }

    // Editar estudiante
    @Transactional
    public Student updateStudentUser(Long userId, AdminUserDtos.UpdateStudentUser dto) {
        User u = findUserByIdOrThrow(userId);

        if (u.getRole() != UserRole.ESTUDIANTE)
            throw new IllegalArgumentException("El usuario no es un ESTUDIANTE");

        if (!AgeValidator.between15and120(dto.getBirthDate()))
            throw new IllegalArgumentException("La edad debe estar entre 15 y 120 años");

        String newEmail = dto.getEmail().toLowerCase().trim();
        String currentEmail = u.getEmail() != null ? u.getEmail().toLowerCase().trim() : null;

        if (!newEmail.equals(currentEmail) && users.existsByEmail(newEmail)) {
            throw new IllegalStateException("El correo ya está registrado: " + newEmail);
        }

        u.setName(dto.getName().trim());
        u.setLastNamePaterno(dto.getLastNamePaterno().trim());
        u.setLastNameMaterno(dto.getLastNameMaterno() != null ? dto.getLastNameMaterno().trim() : null);
        u.setEmail(newEmail);

        users.save(u);

        Student s = students.findByUser_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException("Perfil de estudiante no encontrado"));

        s.setMatricula(dto.getMatricula().trim());
        s.setCareer(dto.getCareer().trim());
        s.setPlan(dto.getPlan().trim());
        s.setSemester(dto.getSemester());
        s.setBirthDate(dto.getBirthDate());
        s.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);

        return students.save(s);
    }

    // Listar estudiantes
    @Transactional(readOnly = true)
    public java.util.List<AdminUserDtos.StudentListItem> listStudentsWithProfile() {

        return students.findAll()
                .stream()
                .map(st -> {

                    User u = st.getUser();

                    return AdminUserDtos.StudentListItem.builder()
                            .id(u.getId())
                            .name(u.getName())
                            .lastNamePaterno(u.getLastNamePaterno())
                            .lastNameMaterno(u.getLastNameMaterno())
                            .email(u.getEmail())
                            .matricula(st.getMatricula())
                            .career(st.getCareer())
                            .plan(st.getPlan())
                            .semester(st.getSemester())
                            .phone(st.getPhone())
                            .birthDate(st.getBirthDate())
                            .status(u.getStatus() != null ? u.getStatus().name() : null)
                            .build();
                })
                .toList();
    }

    // Listar tutores
    @Transactional(readOnly = true)
    public java.util.List<AdminUserDtos.TutorListRow> listTutorsWithProfile() {

        return tutors.findAll()
                .stream()
                .map(t -> {

                    User u = t.getUser();

                    return AdminUserDtos.TutorListRow.builder()
                            .id(u.getId())
                            .name(u.getName())
                            .lastNamePaterno(u.getLastNamePaterno())
                            .lastNameMaterno(u.getLastNameMaterno())
                            .email(u.getEmail())
                            .tutorCode(t.getTutorCode())
                            .department(t.getDepartment())
                            .specialty(t.getSpecialty())
                            .phone(t.getPhone())
                            .status(u.getStatus() != null ? u.getStatus().name() : null)
                            .build();
                })
                .toList();
    }

    // Actualizar tutor
    @Transactional
    public Tutor updateTutorUser(Long userId, AdminUserDtos.UpdateTutorUser dto) {
        User u = findUserByIdOrThrow(userId);

        if (u.getRole() != UserRole.TUTOR)
            throw new IllegalStateException("El usuario con id=" + userId + " no es TUTOR");

        Tutor t = tutors.findByUser_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró perfil Tutor"));

        u.setName(dto.getName());
        u.setLastNamePaterno(dto.getLastNamePaterno());
        u.setLastNameMaterno(dto.getLastNameMaterno());
        u.setEmail(dto.getEmail());

        t.setTutorCode(dto.getTutorCode());
        t.setDepartment(dto.getDepartment());
        t.setSpecialty(dto.getSpecialty());
        t.setPhone(dto.getPhone());

        users.save(u);
        return tutors.save(t);
    }

    // Eliminar asignación
    @Transactional
    public void deleteTutorStudentAssignment(Long assignmentId) {

        var tsOpt = tutorStudents.findById(assignmentId);
        if (tsOpt.isEmpty())
            throw new EntityNotFoundException("No existe la asignación con id=" + assignmentId);

        tutorStudents.delete(tsOpt.get());
    }

    // Sugerir estudiantes no asignados
    @Transactional(readOnly = true)
    public java.util.List<StudentSuggestionDto> suggestUnassignedStudents(String term) {

        String normalized = (term == null || term.isBlank()) ? null : term.trim();

        var list = students.findUnassignedStudentsByTerm(normalized);

        return list.stream().map(s -> {

            var u = s.getUser();

            String fullName = Stream.of(
                    u.getName(), u.getLastNamePaterno(), u.getLastNameMaterno()
            )
                    .filter(x -> x != null && !x.isBlank())
                    .collect(Collectors.joining(" "));

            return new StudentSuggestionDto(
                    s.getId(),
                    s.getMatricula(),
                    fullName,
                    u.getEmail()
            );
        }).toList();
    }

    // Helpers
    private void initFirstLogin(User user) {
        String token = UUID.randomUUID().toString().replace("-", "");
        user.setFirstLoginToken(token);
        user.setFirstLoginExpiresAt(Instant.now().plus(3, ChronoUnit.DAYS));
    }

    private User findUserByIdOrThrow(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(USER_NOT_FOUND_PREFIX + userId));
    }

    private UserStatus parseUserStatus(String statusRaw) {
        try {
            return UserStatus.valueOf(statusRaw.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Estado inválido: " + statusRaw);
        }
    }

    private String[] normalizeCsvLines(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new IllegalArgumentException("CSV vacío");
        }
        return csv.replace("\r", "").split("\n");
    }

    private void processStudentCsvLine(String rawLine, boolean firstLine, CsvImportCounters counters) {
        String line = normalizeCsvLine(rawLine);
        if (line == null || isStudentHeader(line, firstLine)) {
            return;
        }

        counters.incrementTotal();
        StudentCsvRow row = parseStudentCsvRow(line);
        if (row == null || users.existsByEmail(row.emailLower())) {
            counters.incrementSkippedExisting();
            return;
        }

        createStudentFromCsvRow(row);
        counters.incrementCreated();
    }

    private void processTutorCsvLine(String rawLine, boolean firstLine, CsvImportCounters counters) {
        String line = normalizeCsvLine(rawLine);
        if (line == null || isTutorHeader(line, firstLine)) {
            return;
        }

        counters.incrementTotal();
        TutorCsvRow row = parseTutorCsvRow(line);
        if (row == null || users.existsByEmail(row.emailLower())) {
            counters.incrementSkippedExisting();
            return;
        }

        createTutorFromCsvRow(row);
        counters.incrementCreated();
    }

    private void processAssignmentCsvLine(
            String rawLine,
            boolean firstLine,
            Long adminUserId,
            AssignmentImportCounters counters) {
        String line = normalizeCsvLine(rawLine);
        if (line == null || isAssignmentHeader(line, firstLine)) {
            return;
        }

        counters.incrementTotal();
        AdminUserDtos.AssignStudentToTutor dto = parseAssignmentCsvRow(line);
        if (dto == null) {
            counters.incrementErrors();
            return;
        }

        try {
            tutorStudentAssignmentService.assignStudentToTutor(dto, adminUserId);
            counters.incrementAssigned();
        } catch (Exception ex) {
            counters.incrementErrors();
        }
    }

    private String normalizeCsvLine(String rawLine) {
        if (rawLine == null) {
            return null;
        }
        String line = rawLine.trim();
        return line.isEmpty() ? null : line;
    }

    private boolean isStudentHeader(String line, boolean firstLine) {
        return firstLine && line.toLowerCase().contains("matricula") && line.toLowerCase().contains("email");
    }

    private boolean isTutorHeader(String line, boolean firstLine) {
        return firstLine && line.toLowerCase().contains("tutorcode") && line.toLowerCase().contains("email");
    }

    private boolean isAssignmentHeader(String line, boolean firstLine) {
        if (!firstLine) {
            return false;
        }
        String lower = line.toLowerCase();
        return lower.contains("tutor") && lower.contains("matricula");
    }

    private StudentCsvRow parseStudentCsvRow(String line) {
        String[] cols = line.split(";");
        if (cols.length < 4) {
            return null;
        }

        return new StudentCsvRow(
                cols[0].trim(),
                cols[1].trim().toLowerCase(),
                cols[2].trim(),
                cols[3].trim(),
                cols.length > 4 ? emptyToNull(cols[4]) : null,
                cols.length > 5 ? emptyToNull(cols[5]) : null,
                cols.length > 6 ? emptyToNull(cols[6]) : null,
                parseSemester(cols, 7),
                cols.length > 8 ? emptyToNull(cols[8]) : null);
    }

    private TutorCsvRow parseTutorCsvRow(String line) {
        String[] cols = line.split(";");
        if (cols.length < 4) {
            return null;
        }

        return new TutorCsvRow(
                cols[0].trim(),
                cols[1].trim().toLowerCase(),
                cols[2].trim(),
                cols[3].trim(),
                cols.length > 4 ? emptyToNull(cols[4]) : null,
                cols.length > 5 ? emptyToNull(cols[5]) : null,
                cols.length > 6 ? emptyToNull(cols[6]) : null,
                cols.length > 7 ? emptyToNull(cols[7]) : null);
    }

    private AdminUserDtos.AssignStudentToTutor parseAssignmentCsvRow(String line) {
        String[] parts = line.split(";");
        if (parts.length < 2) {
            return null;
        }

        String tutorCode = parts[0].trim();
        String matricula = parts[1].trim();
        if (tutorCode.isEmpty() || matricula.isEmpty()) {
            return null;
        }

        return AdminUserDtos.AssignStudentToTutor.builder()
                .tutorCode(tutorCode)
                .matricula(matricula)
                .build();
    }

    private void createStudentFromCsvRow(StudentCsvRow row) {
        User user = buildCsvUser(
                row.name(),
                row.lastNamePaterno(),
                row.lastNameMaterno(),
                row.emailLower(),
                UserRole.ESTUDIANTE);
        user = saveUserWithFirstLogin(user);

        students.save(Student.builder()
                .user(user)
                .matricula(row.matricula())
                .career(row.career())
                .plan(row.plan())
                .semester(row.semester())
                .phone(row.phone())
                .build());

        emailService.sendFirstLoginEmail(user.getEmail(), user.getFirstLoginToken());
    }

    private void createTutorFromCsvRow(TutorCsvRow row) {
        User user = buildCsvUser(
                row.name(),
                row.lastNamePaterno(),
                row.lastNameMaterno(),
                row.emailLower(),
                UserRole.TUTOR);
        user = saveUserWithFirstLogin(user);

        tutors.save(Tutor.builder()
                .user(user)
                .tutorCode(row.tutorCode())
                .department(row.department())
                .specialty(row.specialty())
                .phone(row.phone())
                .build());

        emailService.sendFirstLoginEmail(user.getEmail(), user.getFirstLoginToken());
    }

    private User buildCsvUser(
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String emailLower,
            UserRole role) {
        return User.builder()
                .name(name)
                .lastNamePaterno(lastNamePaterno)
                .lastNameMaterno(lastNameMaterno)
                .email(emailLower)
                .passwordHash(passwordEncoder.encode(generateTempPassword()))
                .role(role)
                .status(UserStatus.CREATED_BY_ADMIN)
                .build();
    }

    private User saveUserWithFirstLogin(User user) {
        initFirstLogin(user);
        return users.save(user);
    }

    private Integer parseSemester(String[] cols, int index) {
        if (cols.length <= index || cols[index].trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(cols[index].trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private record StudentCsvRow(
            String matricula,
            String emailLower,
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String career,
            String plan,
            Integer semester,
            String phone) {
    }

    private record TutorCsvRow(
            String tutorCode,
            String emailLower,
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String department,
            String specialty,
            String phone) {
    }

    private static final class CsvImportCounters {
        private int total;
        private int created;
        private int skippedExisting;

        private void incrementTotal() {
            total++;
        }

        private void incrementCreated() {
            created++;
        }

        private void incrementSkippedExisting() {
            skippedExisting++;
        }

        private AdminUserDtos.CsvImportResult toCsvImportResult() {
            return AdminUserDtos.CsvImportResult.builder()
                    .total(total)
                    .created(created)
                    .skippedExisting(skippedExisting)
                    .build();
        }
    }

    private static final class AssignmentImportCounters {
        private int total;
        private int assigned;
        private int errors;

        private void incrementTotal() {
            total++;
        }

        private void incrementAssigned() {
            assigned++;
        }

        private void incrementErrors() {
            errors++;
        }

        private AdminUserDtos.AssignTutorStudentsCsvResult toResult() {
            return AdminUserDtos.AssignTutorStudentsCsvResult.builder()
                    .total(total)
                    .assigned(assigned)
                    .errors(errors)
                    .build();
        }
    }
}
