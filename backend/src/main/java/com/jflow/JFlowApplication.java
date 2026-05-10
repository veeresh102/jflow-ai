package com.jflow;

import com.jflow.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JFlowApplication {
    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(JFlowApplication.class, args);
        System.out.println("\n╔══════════════════════════════════════╗");
        System.out.println("║   J-Flow AI Backend Running! 🚀       ║");
        System.out.println("║   API: http://localhost:8080/api       ║");
        System.out.println("║   H2 Console: /h2-console              ║");
        System.out.println("╚══════════════════════════════════════╝\n");
    }
}
