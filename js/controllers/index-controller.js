var app = angular.module("myApp", []);

app.controller("IndexCtrl", function($scope, $http) {
  $http.get('data.json').
    success(function(data, status, headers, config) {
      // console.log(data);
      $scope.budgets = _.rest(data)
    }).
    error(function(data, status, headers, config) {
      // log error
    });
});