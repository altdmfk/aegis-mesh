package com.aegis.gateway;

import io.netty.channel.ChannelOption;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.netty.NettyServerCustomizer;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class AegisGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(AegisGatewayApplication.class, args);
    }

    @Bean
    public NettyServerCustomizer nettyServerCustomizer() {
        return httpServer -> httpServer.option(ChannelOption.SO_REUSEADDR, true);
    }
}
