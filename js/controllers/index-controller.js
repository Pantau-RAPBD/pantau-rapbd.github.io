var app = angular.module("myApp", []);

app.controller("IndexCtrl", function($scope, $http, $q) {
  $scope.pageSize = 20;
  $scope.currentPage = 0;
  $scope.pageCount = 0;
  $scope.displayedBudgets = [];
  $scope.budgets = [];
  $scope.authData = null;
  $scope.toBeReportedBudget = null;
  $scope.selectedReports = [];
  $scope.reportDescription = "";

  var ref = new Firebase("https://vivid-torch-9223.firebaseio.com/");

  $http.get('data.json').
    success(function(data, status, headers, config) {
      // console.log(data);
      $scope.budgets = _.rest(data);
      ref.child("reportsCount").once("value", function(rc) {
        var reportsCount = rc.val();
        $scope.budgets = _.each($scope.budgets, function(budget) {
          if (budget[0] in reportsCount) {
            $scope.$apply(function() {
              budget[17] = reportsCount[budget[0]];
            })
          } else {
            budget.reportsCount = 0;
          }
        });
      });

      $scope.pageCount = Math.ceil(($scope.budgets.length * 1.0)/ $scope.pageSize);
      $scope.refreshDisplayedBudgets();
    }).
    error(function(data, status, headers, config) {
      // log error
    });

  $scope.isAuthenticated = function() {
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
    return $q(function(resolve, reject){
      console.log("Authenticate...");

      if (!$scope.isAuthenticated()) {
        ref.authWithOAuthPopup("facebook", function authHandler(error, authData) {
          if (error) {
            reject("Login Failed!", error);
          } else {
            console.log("Authenticated successfully with payload:", authData);
            $scope.authData = authData;
            resolve(authData);
          }
        });
      } else {
        resolve($scope.authData);
      }
    });
  }

  $scope.unauthenticate = function() {
    ref.unauth();
    $scope.authData = null;
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
    $scope.authenticate().then(function() {
      console.log("Uplaoding data...");

      var myDataRef = ref.child("budgets/" + budget[0]);
      myDataRef.push({id: $scope.authData.uid, name: $scope.authData.facebook.displayName, content: $scope.reportDescription});

      var reportsCountRef = ref.child('reportsCount/' + budget[0]);
      reportsCountRef.transaction(function (current_value) {
        var res = (current_value || 0) + 1;
        return res;
      }, function(error, committed, snapshot) {
        if (committed) {
          $scope.$apply(function() {
            budget[17] = snapshot.val();
          });
        }
      });
    });
  };

  $scope.showReports = function(budget) {
    var myDataRef = ref.child('budgets/' + budget[0]);
    myDataRef.once("value", function(data) {
      console.log(data);
      $scope.$apply(function() {
        $scope.selectedReports = data.val(); 
        $("#displayReportsModal").modal('show');
      });
    })
  }

  $scope.updateToBeReportedBudget = function(budget) {
    $scope.toBeReportedBudget = budget;
  }
});