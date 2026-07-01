package rw.aauca.fyp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:465}")
    private int port;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);

        Properties props = sender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtps");
        props.put("mail.smtps.auth", "true");
        props.put("mail.smtps.ssl.enable", "true");
        props.put("mail.smtps.host", host);
        props.put("mail.smtps.port", port);
        props.put("mail.smtps.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtps.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtps.connectiontimeout", "10000");
        props.put("mail.smtps.timeout", "10000");
        props.put("mail.smtps.writetimeout", "10000");
        props.put("mail.debug", "false");
        // Force IPv6 — Gmail blocks IPv4 SMTPS from this host
        System.setProperty("java.net.preferIPv6Addresses", "true");

        return sender;
    }
}
