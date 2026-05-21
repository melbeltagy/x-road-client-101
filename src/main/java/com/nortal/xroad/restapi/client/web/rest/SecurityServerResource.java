package com.nortal.xroad.restapi.client.web.rest;

import com.nortal.xroad.restapi.client.service.SecurityServerService;
import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import jakarta.validation.constraints.NotBlank;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.validator.constraints.URL;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/security-server")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SecurityServerResource {

    private final SecurityServerService securityServerService;

    @GetMapping("/clients")
    public ResponseEntity<List<SubsystemIdDto>> getRegisteredClients(
        @RequestParam @NotBlank @URL String securityServerUrl
    ) throws IOException, InterruptedException {
        log.debug("REST request to get registered clients from security server: {}", securityServerUrl);
        List<SubsystemIdDto> clients = securityServerService.getRegisteredClients(securityServerUrl);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/services")
    public ResponseEntity<List<ServiceInfoDto>> getServices(
        @RequestParam @NotBlank @URL String securityServerUrl,
        @RequestParam @NotBlank String clientInstanceId,
        @RequestParam @NotBlank String clientMemberClass,
        @RequestParam @NotBlank String clientMemberCode,
        @RequestParam @NotBlank String clientSubsystemCode,
        @RequestParam @NotBlank String serviceInstanceId,
        @RequestParam @NotBlank String serviceMemberClass,
        @RequestParam @NotBlank String serviceMemberCode,
        @RequestParam @NotBlank String serviceSubsystemCode
    ) throws IOException, InterruptedException {
        log.debug("REST request to get services for {}/{}/{}/{}",
            serviceInstanceId, serviceMemberClass, serviceMemberCode, serviceSubsystemCode);

        SubsystemIdDto clientSubsystem = new SubsystemIdDto(
            clientInstanceId, clientMemberClass, clientMemberCode, clientSubsystemCode);
        SubsystemIdDto serviceSubsystem = new SubsystemIdDto(
            serviceInstanceId, serviceMemberClass, serviceMemberCode, serviceSubsystemCode);

        List<ServiceInfoDto> services = securityServerService.getServices(
            securityServerUrl, clientSubsystem, serviceSubsystem);
        return ResponseEntity.ok(services);
    }
}
