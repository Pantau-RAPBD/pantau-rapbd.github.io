var app = angular.module("myApp", []);

app.controller("IndexCtrl", function($scope, $http) {
  $scope.pageSize = 20;
  $scope.currentPage = 0;
  $scope.pageCount = 0;
  $scope.displayedBudgets = [];
  $scope.budgets = [];

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
    var myDataRef = new Firebase('https://vivid-torch-9223.firebaseio.com/budgets/' + budget[0]);
    // var summaryDataRef = new Firebase('https://vivid-torch-9223.firebaseio.com/summaries/' + budget[0]);
    myDataRef.set({'id': budget[0]});
    // var curCount = summaryDataRef.get(0]})
    // summaryDataRef.set({'id': budget[0]})
  }
});