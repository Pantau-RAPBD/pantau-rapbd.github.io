var app = angular.module("myApp", []);

app.controller("IndexCtrl", function($scope, $http, $q, $filter) {
  $scope.pageSize = 50;
  $scope.currentPage = 0;
  $scope.pageCount = 0;
  $scope.displayedBudgets = [];
  $scope.budgets = [];
  $scope.authData = null;
  $scope.toBeReportedBudget = null;
  $scope.selectedReports = null;
  $scope.reportDescription = "";
  $scope.sortCriteria = [17, 'desc'];
  $scope.headers = ["No", "Kode SKPD", "Nama SKPD", "Komisi", "Kode Kegiatan", "Nama Kegiatan", "Pagu", "Tambah", "Kurang", "Hasil Pembahasan", "Hasil", "Selisih dengan versi DPRD", "Flag", "Nama Kegiatan", "% kemiripan", "Hasil", "Selisih dengan versi DPRD"];
  $scope.headers_width = ['50px', null, '200px', '60px', null, '400px', null, null, null, null, null, null, '250px', '400px', '80px', null, null]
  $scope.filters = [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]

  var ref = new Firebase("https://vivid-torch-9223.firebaseio.com/");
  $http.get('data.json').
    success(function(data, status, headers, config) {
      // console.log(data);
      $scope.budgets = _.rest(data);
      ref.child("reportsCount").once("value", function(rc) {
        var reportsCount = rc.val();

        $scope.$apply(function() {
          $scope.budgets = _.each($scope.budgets, function(budget) {
            if (budget[0] in reportsCount) {
              budget[17] = reportsCount[budget[0]];
            } else {
              budget.reportsCount = 0;
            }

            if (budget[15]) budget[15] = budget[15].replace(/\//g," / ");
            if (budget[10]) budget[10] = budget[10].replace(/\//g," / ");
            budget[14] = $filter('number')(budget[14],4);
          });
          $scope.refreshDisplayedBudgets(false);
        })
      });
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

      // HACK!
      if ($scope.sortCriteria[1] == 'desc') {
        $scope.budgets = $scope.budgets.reverse();
      }

      var sortIndex = $scope.sortCriteria[0]
      $scope.budgets = _.sortBy($scope.budgets, function(b) { 
        if (needToConvertToInt) {
          if (b[sortIndex] == null) return 0;
          var converted = parseFloat(b[sortIndex].replace(/,/g,""));
          if (isNaN(converted)) {
             return 0;
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
    $scope.filteredBudgets = _.filter($scope.budgets, function(data) {
      var res = true;
      for (var i = 16; i >= 0; i--) {
        if ($scope.filters[i]) {
          if (data[i]) {
            res = res & (data[i].toLowerCase().indexOf($scope.filters[i].toLowerCase()) != -1);
          } else {
            res = false;
          }
        }
      }
      return res;
    });

    $scope.pageCount = Math.ceil(($scope.filteredBudgets.length * 1.0)/ $scope.pageSize);
    if ($scope.currentPage >= $scope.pageCount) {
      if ($scope.pageCount > 0) {
        $scope.currentPage = $scope.pageCount - 1;
      }
    }
    $scope.displayedBudgets = $scope.filteredBudgets.slice($scope.currentPage * $scope.pageSize, $scope.currentPage * $scope.pageSize + $scope.pageSize);
  }

  $scope.report = function(budget) {
    $scope.authenticate().then(function() {
      console.log("Uplaoding data...");

      var myDataRef = ref.child("budgets/" + budget[0]);
      myDataRef.push({user_id: $scope.authData.uid, name: $scope.authData.facebook.displayName, content: $scope.reportDescription});
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
      console.log(data.val());
      $scope.$apply(function() {
        $scope.selectedReports = data.val(); 
        $scope.selectedReportsBudgetId = budget[0];

        console.log($scope.selectedReports);
        console.log($scope.selectedReportsBudgetId);
        // $("#displayReportsModal").modal('show');
      });
    })
  };

  $scope.hideReports = function() {
    $scope.selectedReports = null;
    $scope.selectedReportsBudgetId = null;
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