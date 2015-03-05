var app = angular.module("myApp", []);

app.controller("IndexCtrl", function($scope, $http) {
  $scope.pageSize = 20;
  $scope.currentPage = 0;
  $scope.pageCount = 0;
  $scope.displayedBudgets = [];
  $scope.budgets = [];
  $scope.authData = null;

  $http.get('data.json').
    success(function(data, status, headers, config) {
      // console.log(data);
      $scope.budgets = _.rest(data);
      $scope.pageCount = Math.ceil(($scope.budgets.length * 1.0)/ $scope.pageSize);
      $scope.refreshDisplayedBudgets();
    }).
    error(function(data, status, headers, config) {
      // log error
    });

  $scope.isAuthenticated = function() {
    var ref = new Firebase("https://vivid-torch-9223.firebaseio.com");
    if ($scope.authData) return true;

    var authData = ref.getAuth();
    if (authData) {
      $scope.authData = authData;
      return true;
    } else {
      $scope.authData = authData;
      return false;
    }     
  }

  $scope.authenticate = function() {
    console.log("authenticate");
    var ref = new Firebase("https://vivid-torch-9223.firebaseio.com");
    if (!$scope.isAuthenticated()) {
      ref.authWithOAuthPopup("facebook", function authHandler(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          console.log("Authenticated successfully with payload:", authData);
          $scope.authData = authData;
        }
      });
    }
  }

  $scope.unauthenticate = function() {
    var ref = new Firebase("https://vivid-torch-9223.firebaseio.com");
    ref.unauth();
  }

  $scope.goToPrevPage = function() {
    if ($scope.currentPage > 0) {
      $scope.currentPage--;      
      $scope.refreshDisplayedBudgets();
    }
  }

  $scope.goToNextPage = function() {
    if ($scope.currentPage < $scope.pageCount) {
      $scope.currentPage++;
      $scope.refreshDisplayedBudgets();
    }
  }

  $scope.goToPage = function() {
    console.log($scope.currentPage);
    $scope.currentPage = $scope.goToPageNo - 1;
    $scope.refreshDisplayedBudgets();
  }

  $scope.refreshDisplayedBudgets = function() {
    $scope.displayedBudgets = $scope.budgets.slice($scope.currentPage * $scope.pageSize, $scope.currentPage * $scope.pageSize + $scope.pageSize);
  }

  $scope.report = function(budget) {
    $scope.authenticate();
    var myDataRef = new Firebase('https://vivid-torch-9223.firebaseio.com/budgets/' + budget[0]);
    console.log($scope.authData);
    // var summaryDataRef = new Firebase('https://vivid-torch-9223.firebaseio.com/summaries/' + budget[0]);
    myDataRef.push({id: $scope.authData.uid, name: $scope.authData.facebook.displayName});
    // var curCount = summaryDataRef.get(0]})
    // summaryDataRef.set({'id': budget[0]})
  }
});