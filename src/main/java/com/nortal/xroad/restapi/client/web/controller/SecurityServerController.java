package com.nortal.xroad.restapi.client.web.controller;

import com.nortal.xroad.restapi.client.service.SecurityServerService;
import com.nortal.xroad.restapi.client.service.dto.ServiceInfoDto;
import com.nortal.xroad.restapi.client.service.dto.ServicesRequestDto;
import com.nortal.xroad.restapi.client.service.dto.SubsystemIdDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.validator.constraints.URL;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/security-server")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SecurityServerController {

    private final SecurityServerService securityServerService;

    @GetMapping("/clients")
    public ResponseEntity<List<SubsystemIdDto>> getRegisteredClients(
        @RequestParam @NotBlank @URL String securityServerUrl
    ) {
        log.debug("REST request to get registered clients from security server: {}", securityServerUrl);
        List<SubsystemIdDto> clients = securityServerService.getRegisteredClients(securityServerUrl);
        return ResponseEntity.ok(clients);
    }

    @PostMapping("/services")
    public ResponseEntity<List<ServiceInfoDto>> getServices(@Valid @RequestBody ServicesRequestDto request) {
        log.debug("REST request to get services for {}/{}/{}/{}",
            request.serviceSubsystem().instanceId(),
            request.serviceSubsystem().memberClass(),
            request.serviceSubsystem().memberCode(),
            request.serviceSubsystem().subsystemCode());

        List<ServiceInfoDto> services = securityServerService.getServices(
            request.securityServerUrl(),
            request.clientSubsystem(),
            request.serviceSubsystem());
        return ResponseEntity.ok(services);
    }
}
