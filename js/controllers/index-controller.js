var app = angular.module("myApp", []);

app.controller("IndexCtrl", function($scope, $http, $q) {
  $scope.pageSize = 50;
  $scope.currentPage = 0;
  $scope.pageCount = 0;
  $scope.displayedBudgets = [];
  $scope.budgets = [];
  $scope.authData = null;
  $scope.toBeReportedBudget = null;
  $scope.selectedReports = [];
  $scope.reportDescription = "";
  $scope.sortCriteria = [17, 'asc'];
  $scope.headers = ["No", "Kode SKPD", "Nama SKPD", "Komisi", "Kode Kegiatan", "Nama Kegiatan", "Pagu", "Tambah", "Kurang", "Hasil Pembahasan", "Hasil", "Selisih dengan versi DPRD", "Flag", "Nama Kegiatan", "% kemiripan", "Hasil", "Selisih dengan versi DPRD"];

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
      $scope.refreshDisplayedBudgets(false);
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
      $scope.refreshDisplayedBudgets(false);
    }
  }

  $scope.goToNextPage = function() {
    if ($scope.currentPage < $scope.pageCount) {
      $scope.currentPage++;
      $scope.refreshDisplayedBudgets(false);
    }
  }

  $scope.goToPage = function() {
    console.log($scope.currentPage);
    $scope.currentPage = $scope.goToPageNo - 1;
    $scope.refreshDisplayedBudgets(false);
  }

  $scope.refreshDisplayedBudgets = function(reverseOnly) {
    if (reverseOnly) {
      $scope.budgets = $scope.budgets.reverse();
    } else {
      var numTypeColumns = [0, 6, 7, 8, 9, 10, 11, 14, 15, 16];
      var needToConvertToInt = _.contains(numTypeColumns, $scope.sortCriteria[0])

      var sortIndex = $scope.sortCriteria[0]
      $scope.budgets = _.sortBy($scope.budgets, function(b) { 
        if (needToConvertToInt) {
          if (b[sortIndex] == null) return -b[0];
          var converted = parseFloat(b[sortIndex].replace(/,/g,""));
          if (isNaN(converted)) {
             console.log("isNaN");
             return -b[0];
          }
          return converted;
        } else {
          if (b[sortIndex] == null) return "";
          return b[sortIndex];
        }
      });

      if ($scope.sortCriteria[1] == 'desc') {
        $scope.budgets = $scope.budgets.reverse();
      }
    }
    $scope.displayedBudgets = $scope.budgets.slice($scope.currentPage * $scope.pageSize, $scope.currentPage * $scope.pageSize + $scope.pageSize);
  }

  $scope.report = function(budget) {
    $scope.authenticate().then(function() {
      console.log("Uplaoding data...");

      var myDataRef = ref.child("budgets/" + budget[0]);
      myDataRef.push({id: $scope.authData.uid, name: $scope.authData.facebook.displayName, content: $scope.reportDescription});
      $scope.reportDescription = "";

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

  $scope.toggleSort = function(index) {
    var nextStates = {'asc': 'desc', 'desc': 'asc'};
    var reverseOnly = false;
    if ($scope.sortCriteria[0] == index) {
      $scope.sortCriteria[1] = nextStates[$scope.sortCriteria[1]];
      reverseOnly = true;
    } else {
      $scope.sortCriteria[0] = index;
      $scope.sortCriteria[1] = 'asc';
    }
    $scope.refreshDisplayedBudgets(reverseOnly);
  }
});