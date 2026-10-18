package com.sinoe.authmfa.service;

import com.sinoe.authmfa.dto.InstitutionAdminDtos.*;
import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.UserRepository;
import com.sinoe.authmfa.security.InstitutionAccessService;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InstitutionImportService {
    private final InstitutionAdminService admin;
    private final InstitutionInvitationService invitations;
    private final InstitutionAccessService access;
    private final UserRepository users;
    private final InstitutionMembershipRepository memberships;
    private final Validator validator;
    private final PlatformTransactionManager manager;
    private final AuditService audit;

    public ImportReport importCsv(long institutionId,long actor,long version,String role,String csv) {
        if(!Set.of("ESTUDIANTE","DOCENTE","TUTOR").contains(role)) throw new IllegalArgumentException("Rol de importación inválido");
        authorize(institutionId,actor,version);
        List<List<String>> rows=parse(csv);
        if(rows.size()>1001) throw new IllegalArgumentException("Importación limitada a 1000 filas");
        if(rows.isEmpty()) throw new IllegalArgumentException("CSV vacío");
        var header=rows.get(0).stream().map(s -> header(s)).toList();
        boolean named=header.contains("email") && (header.contains("code") || header.contains("matricula") || header.contains("tutorcode"));
        var tx=new TransactionTemplate(manager);tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        List<ImportRow> results=new ArrayList<>(); Set<String> emails=new HashSet<>(); Set<String> codes=new HashSet<>();
        for(int index=named ? 1 : 0;index<rows.size();index++) {
            int number=index+1; var row=rows.get(index);
            try {
                UserRequest request=request(role,row,named ? header : null);
                if(!validator.validate(request).isEmpty() || request.code()==null || request.code().isBlank()) throw new IllegalArgumentException();
                String email=request.email().toLowerCase(Locale.ROOT);
                if(!emails.add(email) || !codes.add(request.code())) { results.add(new ImportRow(number,"SKIPPED","Duplicado en el archivo",null));continue; }
                ImportRow result=tx.execute(status -> {
                    authorize(institutionId,actor,version);
                    var existing=users.findByEmail(email);
                    if(existing.isPresent() && memberships.findByInstitution_IdAndUser_IdAndRole(institutionId,existing.get().getId(),InstitutionRole.valueOf(role))
                            .filter(m -> m.getStatus()==MembershipStatus.ACTIVE).isPresent())
                        return new ImportRow(number,"SKIPPED","Membresía ya existente",existing.get().getId());
                    if(existing.isEmpty() || memberships.findByUser_IdAndInstitution_IdAndStatus(existing.get().getId(),institutionId,MembershipStatus.ACTIVE).isEmpty()) {
                        var invite=invitations.issue(institutionId,actor,version,role,request.email(),new ProfileUpdate(request.code(),request.department(),request.specialty(),request.career(),request.plan(),request.semester(),request.phone()));
                        return new ImportRow(number,"INVITED","Invitación verificada pendiente",null,invite.id());
                    }
                    UserResponse created=admin.addRole(institutionId,existing.get().getId(),new RoleRequest(role,request.code(),request.department(),request.specialty(),request.career(),request.plan(),request.semester(),request.phone()));
                    audit.logSystem(actor,"INSTITUTION_IMPORT_ROW",true,null,"institution="+institutionId+";role="+role+";row="+number+";user="+created.userId());
                    return new ImportRow(number,"CREATED","Perfil y membresía disponibles",created.userId());
                });
                results.add(result);
            } catch(RuntimeException ex) {
                if(ex instanceof org.springframework.security.access.AccessDeniedException) throw ex;
                results.add(new ImportRow(number,"FAILED",ex instanceof IllegalArgumentException ? "Datos de fila inválidos" : "Conflicto o error al registrar la fila",null));
            }
        }
        return new ImportReport(results.size(),count(results,"CREATED"),count(results,"INVITED"),count(results,"SKIPPED"),count(results,"FAILED"),results);
    }
    private static String header(String raw) {
        String key=java.text.Normalizer.normalize(raw.trim().toLowerCase(Locale.ROOT),java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}","").replace("_","").replace(" ","");
        return switch(key){case "nombre" -> "name";case "apellidopaterno" -> "lastnamepaterno";case "apellidomaterno" -> "lastnamematerno";
            case "matricula","tutorcode","teachercode","codigo" -> "code";case "correo" -> "email";case "carrera" -> "career";case "semestre" -> "semester";
            case "telefono" -> "phone";case "departamento" -> "department";case "especialidad" -> "specialty";default -> key;};
    }
    private int count(List<ImportRow> rows,String status) { return (int)rows.stream().filter(r -> r.outcome().equals(status)).count(); }
    private void authorize(long institution,long actor,long version) {
        var context=access.resolve(actor,institution,version);
        if(!context.roles().contains("ADMIN") && !context.roles().contains("SUPER_ADMIN")) throw new org.springframework.security.access.AccessDeniedException("Administración institucional requerida");
    }
    private UserRequest request(String role,List<String> row,List<String> header) {
        if(header==null) {
            if(row.size()<4) throw new IllegalArgumentException();
            // Preserve existing legacy student/tutor column order, without calling global import persistence.
            return new UserRequest(row.get(2),row.get(3),value(row,4),row.get(1),temporaryPassword(),role,row.get(0),
                    role.equals("ESTUDIANTE") ? null : value(row,5),role.equals("ESTUDIANTE") ? null : value(row,6),
                    role.equals("ESTUDIANTE") ? value(row,5) : null,role.equals("ESTUDIANTE") ? value(row,6) : null,
                    role.equals("ESTUDIANTE") ? integer(value(row,7)) : null,value(row,role.equals("ESTUDIANTE") ? 8 : 7));
        }
        if(row.size()>header.size()) throw new IllegalArgumentException();
        Map<String,String> m=new HashMap<>();for(int i=0;i<header.size();i++) m.put(header.get(i),value(row,i));
        String code=m.get("code");if(code==null) code=m.get(role.equals("ESTUDIANTE") ? "matricula" : "tutorcode");
        return new UserRequest(m.get("name"),m.get("lastnamepaterno"),m.get("lastnamematerno"),m.get("email"),
                temporaryPassword(),role,code,m.get("department"),m.get("specialty"),m.get("career"),m.get("plan"),integer(m.get("semester")),m.get("phone"));
    }
    private static String temporaryPassword() { return UUID.randomUUID()+"Aa!"; }
    private static Integer integer(String value) { return value==null ? null : Integer.valueOf(value); }
    private static String value(List<String> row,int index) { if(index>=row.size()) return null;String v=row.get(index).trim();return v.isEmpty() ? null : v; }
    /** Quoted fields, escaped quotes, BOM, CRLF and embedded newlines; comma or legacy semicolon. */
    static List<List<String>> parse(String csv) {
        if(csv==null||csv.isBlank()||csv.length()>1000000) throw new IllegalArgumentException("CSV vacío o demasiado grande");
        csv=csv.replaceFirst("^\\uFEFF","");
        char delimiter=',';boolean quote=false;
        for(int i=0;i<csv.length() && csv.charAt(i)!='\n';i++) { char c=csv.charAt(i);if(c=='"') quote=!quote;if(c==';'&&!quote) {delimiter=';';break;} }
        List<List<String>> rows=new ArrayList<>();List<String> row=new ArrayList<>();StringBuilder cell=new StringBuilder();
        boolean quoted=false,closed=false;
        for(int i=0;i<=csv.length();i++) {
            char c=i==csv.length() ? '\n' : csv.charAt(i);
            if(quoted) {
                if(c=='"') { if(i+1<csv.length()&&csv.charAt(i+1)=='"') {cell.append('"');i++;} else {quoted=false;closed=true;} }
                else cell.append(c);
            } else if(c=='"') { if(cell.length()!=0||closed) throw new IllegalArgumentException("Comillas CSV inválidas");quoted=true; }
            else if(c==delimiter || c=='\n' || c=='\r') {
                row.add(cell.toString());cell.setLength(0);closed=false;
                if(c!=delimiter) { if(row.stream().anyMatch(v -> !v.isBlank())) rows.add(List.copyOf(row));row.clear();if(c=='\r'&&i+1<csv.length()&&csv.charAt(i+1)=='\n') i++; }
            } else {if(closed&&!Character.isWhitespace(c)) throw new IllegalArgumentException("CSV inválido");if(!closed) cell.append(c);}
        }
        if(quoted) throw new IllegalArgumentException("CSV con comillas sin cerrar");return rows;
    }
}
