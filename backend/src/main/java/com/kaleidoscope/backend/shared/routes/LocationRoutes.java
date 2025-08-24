package com.kaleidoscope.backend.shared.routes;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class LocationRoutes {
    private static final String API_VERSION = "/api";

    // Base routes
    public static final String LOCATIONS = API_VERSION + "/locations";

    // Path variable segments
    public static final String LOCATION_ID = "/{locationId}";

    // Full path patterns
    public static final String CREATE_LOCATION = LOCATIONS;
    public static final String SEARCH_LOCATIONS = LOCATIONS + "/search";
    public static final String NEARBY_LOCATIONS = LOCATIONS + "/nearby";
    public static final String GET_LOCATION_BY_ID = LOCATIONS + LOCATION_ID;
    public static final String DELETE_LOCATION = LOCATIONS + LOCATION_ID;
}
