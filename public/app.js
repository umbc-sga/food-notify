var app = angular.module("food-notify", ["ngRoute"]);

/**
 * Routing for SPA functionality.
 */
app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');

    $routeProvider
    .when("/", {
        templateUrl: "templates/home.html",
        controller: 'HomeCtrl'
    })
    .when("/register", {
        templateUrl: "templates/register.html",
        controller: 'RegisterCtrl'
    })
    .when("/login", {
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl'
    })
    .otherwise({
        redirectTo: "/"
    });
}]);

/**
 * Allow for the User object to be updated live and be passed through controllers.
 */
app.service("CurrentUserService", function() {
    // Create everything as local variables
    var currentUser = null, setUser, getUser, updateFavorites;

    /**
     * Set the current user.
     */
    setUser = function(user) {
        currentUser = user;
    };

    /**
     * Get the current user.
     */
    getUser = function() {
        return currentUser;
    }

    updateFavorites = function(favorites) {
        currentUser.favorites = favorites;
    }

    // Export the functions
    return {
        setUser: setUser,
        getUser: getUser,
        updateFavorites: updateFavorites
    };
});

/**
 * Allow user to favorite and unfavorite things.
 */
app.factory("UserActionService", ["$http", function($http) {
    return {
        favorite: function(email, item){
            return $http.post("/favorite", {
                email: email,
                item: item
            });
        },
        unfavorite: function(email, item){
            return $http.post("/unfavorite", {
                email: email,
                item: item
            });
        }
    };
}]);

/**
 * Define functionality for getting the menu.
 */
app.factory("MenuService", ["$http", function($http) {
    return {
        getMenu: function(date){
            return $http.post("/menu", {
                date: date
            });
        },
    };
}]);

/**
 * Manage User logins and registrations.
 */
app.factory("AuthService", ["$http", function($http) {
    return {
        createUser: function(email, password) {
            return $http.post("/create-user", {
                email: email,
                password: password
            });
        },
        login: function(email, password) {
            return $http.post("/login", {
                email: email,
                password: password
            });
        }
    };
}]);

/**
 * Give functionality to the homepage.
 */
app.controller("HomeCtrl", function($scope, MenuService, UserActionService, CurrentUserService) {
    $scope.user = CurrentUserService.getUser();
    $scope.menu = null;
    
    // Set the default menu date to be today
    $scope.menuDate = new Date();

    // Automatically display the current meal period menu item
    $('[href="#' + getMealPeriod() + '"]').tab('show');

    /**
     * Add the item to the user's favorites.
     */
    $scope.favorite = function(item) {
        UserActionService
            .favorite($scope.user.email, item)
            .then(function(data) {
                CurrentUserService.updateFavorites(data.data);

                $scope.user = CurrentUserService.getUser();
            });
    };

    /**
     * Remove the item from the user's favorites.
     */
    $scope.unfavorite = function(item) {
        UserActionService
            .unfavorite($scope.user.email, item)
            .then(function(data) {
                CurrentUserService.updateFavorites(data.data);

                $scope.user = CurrentUserService.getUser();
            });
    };

    // Listen for when the date is changed
    $scope.$watch('menuDate', function() {
        // If the date is defined
        if ($scope.menuDate) {
            // Get the Menu at the date
            MenuService
                .getMenu($scope.menuDate)
                .then(function(data) {
                    $scope.menu = {};
                    
                    // Go through every meal period in menu
                    var menuRaw = data.data.menu;
                    for (var period of menuRaw.periods) {
                        $scope.menu[period.name] = {};

                        // For each DHall subsection
                        for (var category of period.categories)  
                            if (category.name != "EVERYDAY")
                                $scope.menu[period.name][category.name] = category.items;  
                    }
                });
        }
    }, true);

    /**
     * Logout of the application.
     */
    $scope.logout = function() {
        CurrentUserService.setUser(null);
    }

    /**
     * Get the current meal period.
     */
    function getMealPeriod() {
        var currentHour = new Date().getHours();
                
        // Get the current meal period
        var currentMealPeriod;
        // Breakfast 6am - 10am
        if ([6, 7, 8, 9, 10].includes(currentHour))
            currentMealPeriod = "breakfast";
        // Lunch 11am - 2pm
        else if ([11, 12, 13, 14].includes(currentHour))
            currentMealPeriod = "lunch";
        // Dinner 4pm - 8pm
        else if ([16, 17, 18, 19, 20].includes(currentHour))
            currentMealPeriod = "dinner";
        // Late Night 9pm - 2am
        else if ([21, 22, 23, 24, 1, 2].includes(currentHour))
            currentMealPeriod = "latenight";
        else
            currentMealPeriod = "N/A";

        return currentMealPeriod;
    }
});

/**
 * Handle Registration logic.
 */
app.controller("RegisterCtrl", function($scope, AuthService) {
    $scope.erorr = "";

    $scope.register = function() {
        // If the confirm password field doesn't match the inputted password
        if ($scope.password != $scope.confirmPassword)
            $scope.error = "Passwords do not match.";
        else {
            // Add user to the database
            AuthService
                .createUser($scope.email, $scope.password)
                .then(function(user) {
                    CurrentUserService.setUser(user);
                });
        }
    };
});

/**
 * Handle Login logic.
 */
app.controller("LoginCtrl", function($scope, $location, AuthService, CurrentUserService) {
    $scope.login = function() {
        // Log the user in
        AuthService
            .login($scope.email, $scope.password)
            .then(function(data) {
                var user = data.data;

                // If the login is successful
                if (user.email) {
                    CurrentUserService.setUser(user);
                    $location.path("/");
                }
                // If the login is unsucessful
                else {
                    $scope.error = user;
                }
            });
    };
});