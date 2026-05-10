package com.jflow.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class DotenvLoader {

    private DotenvLoader() {
    }

    public static void load() {
        Map<String, String> values = new LinkedHashMap<>();
        for (Path dotenvPath : candidateDotenvPaths()) {
            values.putAll(readDotenvFile(dotenvPath));
        }

        values.forEach((key, value) -> {
            if (System.getenv(key) == null && System.getProperty(key) == null) {
                System.setProperty(key, value);
            }
        });
    }

    private static List<Path> candidateDotenvPaths() {
        Path workingDirectory = Path.of("").toAbsolutePath().normalize();
        List<Path> paths = new ArrayList<>();

        addIfMissing(paths, workingDirectory.getParent() == null ? null : workingDirectory.getParent().resolve(".env"));
        addIfMissing(paths, workingDirectory.resolve(".env"));
        addIfMissing(paths, workingDirectory.resolve("backend/.env"));

        return paths;
    }

    private static void addIfMissing(List<Path> paths, Path path) {
        if (path != null && !paths.contains(path)) {
            paths.add(path);
        }
    }

    private static Map<String, String> readDotenvFile(Path path) {
        Map<String, String> values = new LinkedHashMap<>();
        if (!Files.isRegularFile(path)) {
            return values;
        }

        try {
            for (String line : Files.readAllLines(path)) {
                parseLine(line).forEach(values::put);
            }
        } catch (IOException ex) {
            System.err.println("Could not read .env file at " + path + ": " + ex.getMessage());
        }
        return values;
    }

    private static Map<String, String> parseLine(String line) {
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return Map.of();
        }
        if (trimmed.startsWith("export ")) {
            trimmed = trimmed.substring("export ".length()).trim();
        }

        int equalsIndex = trimmed.indexOf('=');
        if (equalsIndex <= 0) {
            return Map.of();
        }

        String key = trimmed.substring(0, equalsIndex).trim();
        String value = stripInlineComment(trimmed.substring(equalsIndex + 1).trim());
        if (key.isEmpty()) {
            return Map.of();
        }
        return Map.of(key, unquote(value));
    }

    private static String stripInlineComment(String value) {
        if (value.startsWith("\"") || value.startsWith("'")) {
            return value;
        }

        int commentIndex = value.indexOf(" #");
        if (commentIndex >= 0) {
            return value.substring(0, commentIndex).trim();
        }
        return value;
    }

    private static String unquote(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
