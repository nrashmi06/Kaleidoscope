package com.kaleidoscope.backend.users.service.impl;

import com.kaleidoscope.backend.users.service.UserInterestService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class UserInterestServiceTest {

    @Autowired
    private UserInterestService userInterestService;

    @Test
    public void contextLoads() {
        // This test will fail if Spring can't find the UserInterestService bean
        assert userInterestService != null;
    }
}
