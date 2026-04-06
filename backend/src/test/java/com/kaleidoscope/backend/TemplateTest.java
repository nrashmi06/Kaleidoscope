package com.kaleidoscope.backend;
import org.junit.jupiter.api.Test;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
public class TemplateTest {
    @Test
    public void test() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        TemplateEngine engine = new TemplateEngine();
        engine.setTemplateResolver(resolver);
        Context ctx = new Context();
        ctx.setVariable("message", "msg");
        System.out.println(engine.process("emailVerified", ctx));
    }
}
